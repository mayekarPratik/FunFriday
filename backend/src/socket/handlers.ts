import { Server, Socket } from 'socket.io';
import { GameState, JoinRoomPayload, Player, RoleType, ROLE_PRIORITIES } from '../types/game';
import {
  createUniqueRoomCode,
  getGameState,
  saveGameState,
  ROOM_TTL_SECONDS
} from '../services/redis';

export const getSocketRoomName = (roomCode: string): string => `lobby:${roomCode.toUpperCase()}`;

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Check win conditions
 * Wolves win: living wolves >= living non-wolves
 * Villagers win: living wolves === 0
 */
export function evaluateWinConditions(state: GameState): 'wolves' | 'villagers' | null {
  const alivePlayers = state.players.filter((p) => p.is_alive);
  const aliveWolves = alivePlayers.filter((p) => p.role === 'wolf').length;
  const aliveNonWolves = alivePlayers.length - aliveWolves;

  if (aliveWolves === 0) {
    return 'villagers';
  }
  if (aliveWolves >= aliveNonWolves) {
    return 'wolves';
  }
  return null;
}

export function registerSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    /**
     * Handler for 'create_room'
     */
    socket.on('create_room', async (callback?: (response: any) => void) => {
      try {
        const roomCode = await createUniqueRoomCode();
        const initialState: GameState = {
          room_code: roomCode,
          phase: 'lobby',
          host_socket_id: socket.id,
          active_role_priority: 0,
          players: [],
          night_targets: {},
          votes: {},
          last_night_killed: null,
          last_day_eliminated: null,
          timer_ends_at: null,
          winner: null
        };

        await saveGameState(initialState, ROOM_TTL_SECONDS);

        const socketRoom = getSocketRoomName(roomCode);
        await socket.join(socketRoom);

        console.log(`[Room Created] Code: ${roomCode} by Host: ${socket.id}`);
        io.to(socketRoom).emit('game_state_update', initialState);

        if (typeof callback === 'function') {
          callback({
            success: true,
            room_code: roomCode,
            state: initialState
          });
        }
      } catch (error: any) {
        console.error(`[create_room error]:`, error);
        if (typeof callback === 'function') {
          callback({
            success: false,
            error: error.message || 'Failed to create room'
          });
        } else {
          socket.emit('error', { message: error.message || 'Failed to create room' });
        }
      }
    });

    /**
     * Handler for 'join_room'
     */
    socket.on('join_room', async (payload: JoinRoomPayload, callback?: (response: any) => void) => {
      try {
        const { room_code, name } = payload || {};

        if (!room_code || typeof room_code !== 'string') {
          throw new Error('Valid room code is required');
        }

        if (!name || typeof name !== 'string' || !name.trim()) {
          throw new Error('Player name is required');
        }

        const normalizedCode = room_code.trim().toUpperCase();
        const state = await getGameState(normalizedCode);

        if (!state) {
          throw new Error(`Room '${normalizedCode}' not found`);
        }

        if (state.phase !== 'lobby') {
          throw new Error('Cannot join game that is already in progress');
        }

        const existingPlayerIndex = state.players.findIndex(
          (p) => p.socket_id === socket.id
        );

        if (existingPlayerIndex !== -1) {
          state.players[existingPlayerIndex].name = name.trim();
        } else {
          const newPlayer: Player = {
            socket_id: socket.id,
            name: name.trim(),
            role: 'villager',
            is_alive: true
          };
          state.players.push(newPlayer);
        }

        await saveGameState(state, ROOM_TTL_SECONDS);

        const socketRoom = getSocketRoomName(normalizedCode);
        await socket.join(socketRoom);

        console.log(`[Player Joined] ${name} (${socket.id}) -> Room: ${normalizedCode}`);
        io.to(socketRoom).emit('game_state_update', state);

        if (typeof callback === 'function') {
          callback({
            success: true,
            state
          });
        }
      } catch (error: any) {
        console.error(`[join_room error]:`, error);
        if (typeof callback === 'function') {
          callback({
            success: false,
            error: error.message || 'Failed to join room'
          });
        } else {
          socket.emit('error', { message: error.message || 'Failed to join room' });
        }
      }
    });

    /**
     * Handler for 'start_game'
     */
    socket.on('start_game', async (payload: { room_code?: string }, callback?: (response: any) => void) => {
      try {
        let roomCode = payload?.room_code?.toUpperCase();

        if (!roomCode) {
          for (const room of socket.rooms) {
            if (room.startsWith('lobby:')) {
              roomCode = room.replace('lobby:', '');
              break;
            }
          }
        }

        if (!roomCode) {
          throw new Error('Room code not found');
        }

        const state = await getGameState(roomCode);
        if (!state) throw new Error(`Room '${roomCode}' not found`);

        if (state.host_socket_id !== socket.id) {
          throw new Error('Only the host can start the game');
        }

        if (state.players.length < 3) {
          throw new Error('At least 3 players are required to start the game');
        }

        const playerIndices = shuffleArray(state.players.map((_, i) => i));
        const rolesToAssign: RoleType[] = ['wolf', 'seer', 'doctor'];
        
        state.players.forEach((p) => {
          p.role = 'villager';
          p.is_alive = true;
        });

        rolesToAssign.forEach((role, idx) => {
          if (idx < playerIndices.length) {
            const targetPlayerIdx = playerIndices[idx];
            state.players[targetPlayerIdx].role = role;
          }
        });

        state.phase = 'night';
        state.active_role_priority = 1; // 1 = Wolf
        state.night_targets = {};
        state.votes = {};
        state.last_night_killed = null;
        state.last_day_eliminated = null;
        state.timer_ends_at = null;
        state.winner = null;

        await saveGameState(state, ROOM_TTL_SECONDS);

        const socketRoom = getSocketRoomName(roomCode);
        console.log(`[Game Started] Room ${roomCode} -> Roles:`, state.players.map(p => `${p.name}: ${p.role}`));
        io.to(socketRoom).emit('game_state_update', state);

        if (typeof callback === 'function') {
          callback({ success: true, state });
        }
      } catch (error: any) {
        console.error(`[start_game error]:`, error);
        if (typeof callback === 'function') {
          callback({ success: false, error: error.message || 'Failed to start game' });
        } else {
          socket.emit('error', { message: error.message || 'Failed to start game' });
        }
      }
    });

    /**
     * Handler for 'night_action'
     * Submits a role's target during the Night phase
     */
    socket.on('night_action', async (payload: { room_code?: string; target_socket_id: string }, callback?: (response: any) => void) => {
      try {
        let roomCode = payload?.room_code?.toUpperCase();
        if (!roomCode) {
          for (const room of socket.rooms) {
            if (room.startsWith('lobby:')) {
              roomCode = room.replace('lobby:', '');
              break;
            }
          }
        }
        if (!roomCode) throw new Error('Room code not found');

        const state = await getGameState(roomCode);
        if (!state) throw new Error('Room not found');

        const player = state.players.find((p) => p.socket_id === socket.id);
        if (!player || !player.is_alive) throw new Error('Player not eligible');

        if (!state.night_targets) state.night_targets = {};

        if (player.role === 'wolf') {
          state.night_targets.wolf_target = payload.target_socket_id;
        } else if (player.role === 'doctor') {
          state.night_targets.doctor_target = payload.target_socket_id;
        } else if (player.role === 'seer') {
          state.night_targets.seer_target = payload.target_socket_id;
        }

        await saveGameState(state, ROOM_TTL_SECONDS);
        const socketRoom = getSocketRoomName(roomCode);
        io.to(socketRoom).emit('game_state_update', state);

        if (typeof callback === 'function') callback({ success: true, state });
      } catch (error: any) {
        if (typeof callback === 'function') callback({ success: false, error: error.message });
      }
    });

    /**
     * Handler for 'advance_night_priority'
     */
    socket.on('advance_night_priority', async (payload: { room_code?: string; priority?: number }, callback?: (response: any) => void) => {
      try {
        let roomCode = payload?.room_code?.toUpperCase();
        if (!roomCode) {
          for (const room of socket.rooms) {
            if (room.startsWith('lobby:')) {
              roomCode = room.replace('lobby:', '');
              break;
            }
          }
        }
        if (!roomCode) throw new Error('Room code required');
        const state = await getGameState(roomCode);
        if (!state) throw new Error('Room not found');

        if (payload?.priority !== undefined) {
          state.active_role_priority = payload.priority;
        } else {
          state.active_role_priority = (state.active_role_priority % 3) + 1;
        }

        await saveGameState(state, ROOM_TTL_SECONDS);
        const socketRoom = getSocketRoomName(roomCode);
        io.to(socketRoom).emit('game_state_update', state);

        if (typeof callback === 'function') callback({ success: true, state });
      } catch (error: any) {
        if (typeof callback === 'function') callback({ success: false, error: error.message });
      }
    });

    /**
     * Handler for 'resolve_night_to_day'
     * Resolves night actions, marks casualties, starts 5-minute Day phase
     */
    socket.on('resolve_night_to_day', async (payload: { room_code?: string }, callback?: (response: any) => void) => {
      try {
        let roomCode = payload?.room_code?.toUpperCase();
        if (!roomCode) {
          for (const room of socket.rooms) {
            if (room.startsWith('lobby:')) {
              roomCode = room.replace('lobby:', '');
              break;
            }
          }
        }
        if (!roomCode) throw new Error('Room code required');
        const state = await getGameState(roomCode);
        if (!state) throw new Error('Room not found');

        const wolfTarget = state.night_targets?.wolf_target;
        const doctorTarget = state.night_targets?.doctor_target;

        let killedPlayerName: string | null = null;

        // If wolf picked a target and doctor didn't save them
        if (wolfTarget && wolfTarget !== doctorTarget) {
          const victim = state.players.find((p) => p.socket_id === wolfTarget);
          if (victim && victim.is_alive) {
            victim.is_alive = false;
            killedPlayerName = victim.name;
          }
        }

        state.last_night_killed = killedPlayerName;
        state.night_targets = {};
        state.votes = {};

        // Evaluate win conditions after night death
        const winner = evaluateWinConditions(state);
        if (winner) {
          state.phase = 'game_over';
          state.winner = winner;
          state.timer_ends_at = null;
        } else {
          // Transition to Day Phase with a 5-minute timer (300,000 ms)
          state.phase = 'day';
          state.timer_ends_at = Date.now() + 5 * 60 * 1000;
        }

        await saveGameState(state, ROOM_TTL_SECONDS);
        const socketRoom = getSocketRoomName(roomCode);
        io.to(socketRoom).emit('game_state_update', state);

        if (typeof callback === 'function') callback({ success: true, state });
      } catch (error: any) {
        if (typeof callback === 'function') callback({ success: false, error: error.message });
      }
    });

    /**
     * Helper to tally votes and transition to game_over or night
     */
    const tallyAndAdvance = async (state: GameState, roomCode: string) => {
      const votes = state.votes || {};
      const voteCounts: Record<string, number> = {};

      Object.values(votes).forEach((targetId) => {
        if (targetId && targetId !== 'skip') {
          voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
        }
      });

      let highestVoteCount = 0;
      let eliminatedSocketId: string | null = null;

      for (const [targetId, count] of Object.entries(voteCounts)) {
        if (count > highestVoteCount) {
          highestVoteCount = count;
          eliminatedSocketId = targetId;
        }
      }

      let eliminatedPlayerName: string | null = null;
      if (eliminatedSocketId) {
        const victim = state.players.find((p) => p.socket_id === eliminatedSocketId);
        if (victim && victim.is_alive) {
          victim.is_alive = false;
          eliminatedPlayerName = victim.name;
        }
      }

      state.last_day_eliminated = eliminatedPlayerName;
      state.votes = {};
      state.timer_ends_at = null;

      const winner = evaluateWinConditions(state);
      if (winner) {
        state.phase = 'game_over';
        state.winner = winner;
      } else {
        // Back to Night phase!
        state.phase = 'night';
        state.active_role_priority = 1; // Wolves wake up first
        state.night_targets = {};
      }

      await saveGameState(state, ROOM_TTL_SECONDS);
      const socketRoom = getSocketRoomName(roomCode);
      io.to(socketRoom).emit('game_state_update', state);
    };

    /**
     * Handler for 'submit_vote'
     * Submits a player's vote during the Day phase
     */
    socket.on('submit_vote', async (payload: { room_code?: string; target_socket_id: string }, callback?: (response: any) => void) => {
      try {
        let roomCode = payload?.room_code?.toUpperCase();
        if (!roomCode) {
          for (const room of socket.rooms) {
            if (room.startsWith('lobby:')) {
              roomCode = room.replace('lobby:', '');
              break;
            }
          }
        }
        if (!roomCode) throw new Error('Room code not found');

        const state = await getGameState(roomCode);
        if (!state) throw new Error('Room not found');

        if (state.phase !== 'day') {
          throw new Error('Voting is only active during the Day phase');
        }

        const voter = state.players.find((p) => p.socket_id === socket.id);
        if (!voter || !voter.is_alive) {
          throw new Error('Dead players cannot vote');
        }

        if (!state.votes) state.votes = {};
        state.votes[socket.id] = payload.target_socket_id;

        const livingPlayers = state.players.filter((p) => p.is_alive);
        const livingVoterCount = Object.keys(state.votes).filter((voterId) =>
          livingPlayers.some((p) => p.socket_id === voterId)
        ).length;

        // Check if all living players have voted
        if (livingVoterCount >= livingPlayers.length) {
          console.log(`[Voting Complete] All ${livingPlayers.length} players voted in room ${roomCode}`);
          await tallyAndAdvance(state, roomCode);
        } else {
          await saveGameState(state, ROOM_TTL_SECONDS);
          const socketRoom = getSocketRoomName(roomCode);
          io.to(socketRoom).emit('game_state_update', state);
        }

        if (typeof callback === 'function') callback({ success: true, state });
      } catch (error: any) {
        console.error(`[submit_vote error]:`, error);
        if (typeof callback === 'function') callback({ success: false, error: error.message });
      }
    });

    /**
     * Handler for 'tally_day_votes'
     * Triggered by host or when day timer expires
     */
    socket.on('tally_day_votes', async (payload: { room_code?: string }, callback?: (response: any) => void) => {
      try {
        let roomCode = payload?.room_code?.toUpperCase();
        if (!roomCode) {
          for (const room of socket.rooms) {
            if (room.startsWith('lobby:')) {
              roomCode = room.replace('lobby:', '');
              break;
            }
          }
        }
        if (!roomCode) throw new Error('Room code required');
        const state = await getGameState(roomCode);
        if (!state) throw new Error('Room not found');

        await tallyAndAdvance(state, roomCode);
        if (typeof callback === 'function') callback({ success: true, state });
      } catch (error: any) {
        if (typeof callback === 'function') callback({ success: false, error: error.message });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
}
