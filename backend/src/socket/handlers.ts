import { Server, Socket } from 'socket.io';
import {
  GameState,
  JoinRoomPayload,
  Player,
  RoleType,
  NightActionPayload,
  RoleSettings,
  DEFAULT_ROLE_SETTINGS
} from '../types/game';
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
  resolveDayVote,
  checkWinCondition,
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
            },
            executioner: {
              target_id: null
            }
          },
          role_settings: { ...DEFAULT_ROLE_SETTINGS },
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
     * Handler for 'update_settings'
     * Updates customizable deck role counts in GameState
     */
    socket.on('update_settings', async (payload: { room_code?: string; role_settings: RoleSettings }, callback?: (response: any) => void) => {
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
        if (!state) throw new Error(`Room '${roomCode}' not found`);

        if (state.host_socket_id !== socket.id) {
          throw new Error('Only the host can update room settings');
        }

        state.role_settings = payload.role_settings;
        await saveGameState(state, ROOM_TTL_SECONDS);
        broadcastGameState(io, state);

        if (typeof callback === 'function') callback({ success: true, state });
      } catch (error: any) {
        console.error('[update_settings error]:', error.message);
        if (typeof callback === 'function') callback({ success: false, error: error.message });
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
     * Reads custom role_settings from Redis, generates flat deck, randomizes with Fisher-Yates shuffle,
     * assigns roles to players, assigns Executioner target, shifts to night phase, saves to Redis, and broadcasts state.
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

        // 1. Read custom role_settings from Redis state (or fallback to defaults)
        const roleSettings: RoleSettings = state.role_settings || { ...DEFAULT_ROLE_SETTINGS };

        // 2. Generate flat array of roles based on counts (e.g. { wolf: 2, villager: 3 } -> ['wolf', 'wolf', 'villager', 'villager', 'villager'])
        const deck: RoleType[] = [];
        Object.entries(roleSettings).forEach(([role, count]) => {
          const roleCount = Math.max(0, Number(count) || 0);
          for (let i = 0; i < roleCount; i++) {
            deck.push(role as RoleType);
          }
        });

        // Validate that roles in deck match the number of players joined
        if (deck.length !== state.players.length) {
          throw new Error(`Roles in deck (${deck.length}) must match players joined (${state.players.length})`);
        }

        // 3. Use Fisher-Yates shuffle to randomize the deck
        const shuffledDeck = shuffleArray(deck);

        // 4. Iterate through state.players array and assign one role from shuffled deck to each player
        state.players.forEach((player, idx) => {
          player.role = shuffledDeck[idx];
          player.is_alive = true;
          player.is_lover = false;
        });

        // If Executioner is assigned to a player, randomly select one Good player (Villager, Seer, Doctor, or Cupid)
        const executionerPlayer = state.players.find((p) => p.role === 'executioner');
        let executionerTargetId: string | null = null;
        if (executionerPlayer) {
          const goodRoles: RoleType[] = ['villager', 'seer', 'doctor', 'cupid'];
          const eligibleTargets = state.players.filter(
            (p) => goodRoles.includes(p.role) && p.socket_id !== executionerPlayer.socket_id
          );
          if (eligibleTargets.length > 0) {
            const selectedTarget = eligibleTargets[Math.floor(Math.random() * eligibleTargets.length)];
            executionerTargetId = selectedTarget.socket_id;
          }
        }

        // Initialize role states (Witch potions & Executioner target)
        state.role_states = {
          witch: {
            has_heal: true,
            has_poison: true
          },
          executioner: {
            target_id: executionerTargetId
          }
        };

        // 5. Change phase to 'night' and populate night queue
        initializeNightPhase(state);

        // 6. Save updated players & state to Redis
        await saveGameState(state, ROOM_TTL_SECONDS);

        // 7. Broadcast state update to room and players
        const socketRoom = getSocketRoomName(roomCode);
        console.log(`[Game Started] Room ${roomCode} -> Roles assigned:`, state.players.map(p => `${p.name}: ${p.role}`));
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
        if (!player || !player.is_alive) {
          console.warn(`[NightAction Ignored] Dead or non-existent player ${socket.id} attempted action`);
          if (typeof callback === 'function') callback({ success: false, error: 'Eliminated players cannot perform night actions' });
          return;
        }

        const playerRole = player.role || 'villager';
        const actionPayload: NightActionPayload = {
          target_socket_id: payload.target_socket_id,
          target_socket_ids: payload.target_socket_ids,
          action_type: payload.action_type,
          heal_target: payload.heal_target,
          poison_target: payload.poison_target,
          sender_socket_id: socket.id,
          ...payload
        };

        const updatedState = await handleNightAction(state, playerRole, actionPayload, io, socket.id);

        if (typeof callback === 'function') callback({ success: true, state: updatedState });
      } catch (error: any) {
        console.error('[NightAction error]:', error.message);
        if (typeof callback === 'function') callback({ success: false, error: error.message });
      }
    };

    socket.on('submit_action', onNightAction);
    socket.on('night_action', onNightAction);

    /**
     * Handler for 'investigate_player' (Seer)
     * Verifies that the sender is the living Seer, and returns the investigation result
     * ONLY to this specific socket via callback or socket.emit('seer_result').
     */
    socket.on('investigate_player', async (payload: { room_code?: string; target_socket_id: string }, callback?: (response: any) => void) => {
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

        const seer = state.players.find((p) => p.socket_id === socket.id);
        if (!seer || !seer.is_alive || seer.role !== 'seer') {
          throw new Error('Only the living Seer can investigate players');
        }

        const target = state.players.find((p) => p.socket_id === payload.target_socket_id);
        if (!target) {
          throw new Error('Target player not found');
        }

        const isWolf = target.role === 'wolf';
        const result = {
          success: true,
          target_socket_id: target.socket_id,
          target_name: target.name,
          is_wolf: isWolf
        };

        // Send private result only to this Seer socket
        socket.emit('seer_result', result);

        if (typeof callback === 'function') {
          callback(result);
        }
      } catch (error: any) {
        console.error('[investigate_player error]:', error.message);
        if (typeof callback === 'function') {
          callback({ success: false, error: error.message });
        }
      }
    });

    /**
     * Handler for 'host_advance_phase'
     * When triggered by the Host:
     * - If current phase is 'morning_recap', shift to 'day' (and start the 5-min timer).
     * - If current phase is 'dusk_recap', shift to 'night' (and generate the night queue).
     */
    socket.on('host_advance_phase', async (payload: { room_code?: string }, callback?: (response: any) => void) => {
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

        if (state.host_socket_id !== socket.id) {
          throw new Error('Only the Host can advance recap phases');
        }

        if (state.phase === 'morning_recap') {
          const dayEndsAt = Date.now() + 5 * 60 * 1000;
          state.phase = 'day';
          state.timer_ends_at = dayEndsAt;
          state.day_ends_at = dayEndsAt;
          state.recent_deaths = [];
        } else if (state.phase === 'dusk_recap') {
          initializeNightPhase(state);
          state.recent_deaths = [];
        } else {
          throw new Error(`Cannot advance phase from '${state.phase}' with host_advance_phase`);
        }

        await saveGameState(state, ROOM_TTL_SECONDS);
        broadcastGameState(io, state);

        if (typeof callback === 'function') callback({ success: true, state });
      } catch (error: any) {
        console.error('[host_advance_phase error]:', error.message);
        if (typeof callback === 'function') callback({ success: false, error: error.message });
      }
    });

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
      resolveDayVote(state);
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
          console.warn(`[Vote Ignored] Dead or non-existent player ${socket.id} attempted to vote`);
          if (typeof callback === 'function') callback({ success: false, error: 'Eliminated players cannot vote' });
          return;
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
