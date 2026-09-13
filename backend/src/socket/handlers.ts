import { Server, Socket } from 'socket.io';
import { GameState, JoinRoomPayload, Player, RoleType, NightActionPayload } from '../types/game';
import {
  createUniqueRoomCode,
  getGameState,
  saveGameState,
  ROOM_TTL_SECONDS
} from '../services/redis';
import {
  initializeNightPhase,
  handleNightAction,
  resolveDaybreak,
  evaluateWinConditions,
  getSocketRoomName,
  broadcastGameState
} from '../game/engine';

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
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
          active_role: null,
          night_queue: [],
          night_actions: {},
          role_states: {
            witch: {
              has_heal: true,
              has_poison: true
            }
          },
          players: [],
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
        broadcastGameState(io, initialState);

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
        broadcastGameState(io, state);

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
     * Assigns roles according to party size, shifts to night, and initializes night queue & role states
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
        
        // Distribution of roles based on player count
        const availableRoles: RoleType[] = ['wolf', 'seer', 'doctor', 'witch', 'cupid'];
        const rolesToAssign: RoleType[] = availableRoles.slice(0, Math.min(availableRoles.length, state.players.length - 1));
        
        state.players.forEach((p) => {
          p.role = 'villager';
          p.is_alive = true;
          p.is_lover = false;
        });

        rolesToAssign.forEach((role, idx) => {
          if (idx < playerIndices.length) {
            const targetPlayerIdx = playerIndices[idx];
            state.players[targetPlayerIdx].role = role;
          }
        });

        // Initialize role states (Witch starts with heal and poison potions)
        state.role_states = {
          witch: {
            has_heal: true,
            has_poison: true
          }
        };

        // Initialize Night phase via game engine
        initializeNightPhase(state);

        await saveGameState(state, ROOM_TTL_SECONDS);

        const socketRoom = getSocketRoomName(roomCode);
        console.log(`[Game Started] Room ${roomCode} -> Roles:`, state.players.map(p => `${p.name}: ${p.role}`));
        broadcastGameState(io, state);

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
     * Handler for 'submit_action' & 'night_action'
     * Handled by game engine handleNightAction
     */
    const onNightAction = async (payload: { room_code?: string; target_socket_id?: string; heal_target?: string; poison_target?: string; [key: string]: any }, callback?: (response: any) => void) => {
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
        if (!player || !player.is_alive) throw new Error('Player not eligible or alive');

        const playerRole = player.role || 'villager';
        const actionPayload: NightActionPayload = {
          target_socket_id: payload.target_socket_id,
          target_socket_ids: payload.target_socket_ids,
          action_type: payload.action_type,
          heal_target: payload.heal_target,
          poison_target: payload.poison_target,
          ...payload
        };

        const updatedState = await handleNightAction(state, playerRole, actionPayload, io);

        if (typeof callback === 'function') callback({ success: true, state: updatedState });
      } catch (error: any) {
        console.error('[NightAction error]:', error.message);
        if (typeof callback === 'function') callback({ success: false, error: error.message });
      }
    };

    socket.on('submit_action', onNightAction);
    socket.on('night_action', onNightAction);

    /**
     * Handler for 'resolve_night_to_day'
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

        resolveDaybreak(state);

        await saveGameState(state, ROOM_TTL_SECONDS);
        broadcastGameState(io, state);

        if (typeof callback === 'function') callback({ success: true, state });
      } catch (error: any) {
        if (typeof callback === 'function') callback({ success: false, error: error.message });
      }
    });

    /**
     * Helper to tally votes and transition to game_over or next night
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

          // Check if eliminated player was a Cupid lover
          if (victim.is_lover) {
            const partner = state.players.find((p) => p.is_lover && p.is_alive && p.socket_id !== victim.socket_id);
            if (partner) {
              partner.is_alive = false;
              eliminatedPlayerName = `${victim.name} & ${partner.name} (Lover)`;
            }
          }
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
        // Shift back to Night phase with fresh night_queue
        initializeNightPhase(state);
      }

      await saveGameState(state, ROOM_TTL_SECONDS);
      broadcastGameState(io, state);
    };

    /**
     * Handler for 'submit_vote'
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

        if (livingVoterCount >= livingPlayers.length) {
          console.log(`[Voting Complete] All ${livingPlayers.length} players voted in room ${roomCode}`);
          await tallyAndAdvance(state, roomCode);
        } else {
          await saveGameState(state, ROOM_TTL_SECONDS);
          broadcastGameState(io, state);
        }

        if (typeof callback === 'function') callback({ success: true, state });
      } catch (error: any) {
        console.error(`[submit_vote error]:`, error);
        if (typeof callback === 'function') callback({ success: false, error: error.message });
      }
    });

    /**
     * Handler for 'tally_day_votes'
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
