import { Server, Socket } from 'socket.io';
import { getGameState, saveGameState, ROOM_TTL_SECONDS } from '../services/redis';
import { getSocketRoomName, broadcastGameState } from '../game/engine';

export type MafiaPhase =
  | 'LOBBY'
  | 'ROLE_REVEAL'
  | 'NIGHT'
  | 'DAY'
  | 'VOTING'
  | 'VOTING_REVEAL'
  | 'GAME_OVER';

export type MafiaRole = 'mafia' | 'doctor' | 'detective' | 'citizen';

export interface MafiaPlayerData {
  socket_id: string;
  name: string;
  role: MafiaRole;
  is_alive: boolean;
}

export interface MafiaSettings {
  nightDuration: number;
  dayDuration: number;
}

export interface MafiaGameRoomState {
  room_code: string;
  phase: MafiaPhase;
  players: MafiaPlayerData[];
  timeLeft: number;
  timer_ends_at: number | null;
  settings: MafiaSettings;
  night_events: string[];
  recent_elimination: {
    name: string;
    role?: MafiaRole;
    socket_id?: string;
    reason?: 'vote' | 'mafia' | 'disconnected';
  } | null;
  winner: 'town' | 'mafia' | null;
  votes: Record<string, string>; // voter_socket_id -> target_socket_id
  night_actions: {
    mafia?: string; // target_socket_id
    doctor?: string; // target_socket_id
    detective?: string; // target_socket_id
  };
}

// In-memory timer references per room
const roomTimers: Map<string, NodeJS.Timeout> = new Map();

function clearRoomTimer(roomCode: string) {
  const existing = roomTimers.get(roomCode);
  if (existing) {
    clearTimeout(existing);
    roomTimers.delete(roomCode);
  }
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function broadcastMafiaState(io: Server, state: MafiaGameRoomState) {
  const socketRoom = getSocketRoomName(state.room_code);
  io.to(socketRoom).emit('mafia_state_update', state);
  // Also emit game_state_update format for core compatibility
  io.to(socketRoom).emit('game_state_update', {
    room_code: state.room_code,
    game_id: 'mafia',
    phase: state.phase.toLowerCase(),
    players: state.players,
    timer_ends_at: state.timer_ends_at,
    winner: state.winner,
    votes: state.votes,
    mafiaState: state
  });
}

function checkMafiaWin(players: MafiaPlayerData[]): 'town' | 'mafia' | null {
  const living = players.filter((p) => p.is_alive);
  const mafiaCount = living.filter((p) => p.role === 'mafia').length;
  const townCount = living.length - mafiaCount;

  if (mafiaCount === 0) {
    return 'town';
  }
  if (mafiaCount >= townCount) {
    return 'mafia';
  }
  return null;
}

/**
 * Check if all active night roles have submitted their night actions
 */
function checkAllNightActionsLocked(mState: MafiaGameRoomState): boolean {
  if (mState.phase !== 'NIGHT') return false;

  const livingMafia = mState.players.some((p) => p.is_alive && p.role === 'mafia');
  const livingDoctor = mState.players.some((p) => p.is_alive && p.role === 'doctor');
  const livingDetective = mState.players.some((p) => p.is_alive && p.role === 'detective');

  const actions = mState.night_actions || {};

  if (livingMafia && !actions.mafia) return false;
  if (livingDoctor && !actions.doctor) return false;
  if (livingDetective && !actions.detective) return false;

  return true;
}

/**
 * Transition into DAY phase after resolving night kills
 */
export async function transitionToMafiaDay(io: Server, roomCode: string) {
  clearRoomTimer(roomCode);
  const rawState = await getGameState(roomCode);
  if (!rawState || !rawState.mafia_state) return;

  const mState: MafiaGameRoomState = rawState.mafia_state;

  const mafiaTarget = mState.night_actions?.mafia;
  const doctorTarget = mState.night_actions?.doctor;

  let killedPlayerName: string | null = null;
  const nightEvents: string[] = [];

  if (mafiaTarget) {
    if (doctorTarget && mafiaTarget === doctorTarget) {
      nightEvents.push('The Doctor successfully protected the Mafia target last night! Nobody died.');
    } else {
      const targetPlayer = mState.players.find((p) => p.socket_id === mafiaTarget && p.is_alive);
      if (targetPlayer) {
        targetPlayer.is_alive = false;
        killedPlayerName = targetPlayer.name;
        nightEvents.push(`${targetPlayer.name} was assassinated in the shadows.`);
      }
    }
  } else {
    nightEvents.push('The night passed quietly with no attacks.');
  }

  mState.night_events = nightEvents;
  mState.night_actions = {};
  mState.votes = {};

  // Check win condition
  const win = checkMafiaWin(mState.players);
  if (win) {
    mState.phase = 'GAME_OVER';
    mState.winner = win;
    mState.timer_ends_at = null;
    rawState.mafia_state = mState;
    await saveGameState(rawState, ROOM_TTL_SECONDS);
    broadcastMafiaState(io, mState);
    return;
  }

  // Set phase to DAY with configured duration (default 120s)
  mState.phase = 'DAY';
  const daySeconds = mState.settings?.dayDuration || 120;
  mState.timeLeft = daySeconds;
  mState.timer_ends_at = Date.now() + daySeconds * 1000;

  rawState.mafia_state = mState;
  await saveGameState(rawState, ROOM_TTL_SECONDS);

  io.to(getSocketRoomName(roomCode)).emit('mafia_day_started', {
    nightEvents,
    killedPlayer: killedPlayerName,
    state: mState
  });
  broadcastMafiaState(io, mState);

  // Set timer to automatically transition from DAY to VOTING_REVEAL
  const timer = setTimeout(async () => {
    await resolveMafiaDayVoting(io, roomCode);
  }, daySeconds * 1000);
  roomTimers.set(roomCode, timer);
}

/**
 * Transition into NIGHT phase
 */
export async function transitionToMafiaNight(io: Server, roomCode: string) {
  clearRoomTimer(roomCode);
  const rawState = await getGameState(roomCode);
  if (!rawState || !rawState.mafia_state) return;

  const mState: MafiaGameRoomState = rawState.mafia_state;

  const win = checkMafiaWin(mState.players);
  if (win) {
    mState.phase = 'GAME_OVER';
    mState.winner = win;
    mState.timer_ends_at = null;
    rawState.mafia_state = mState;
    await saveGameState(rawState, ROOM_TTL_SECONDS);
    broadcastMafiaState(io, mState);
    return;
  }

  mState.phase = 'NIGHT';
  mState.votes = {};
  mState.night_actions = {};
  const nightSeconds = mState.settings?.nightDuration || 45;
  mState.timeLeft = nightSeconds;
  mState.timer_ends_at = Date.now() + nightSeconds * 1000;

  rawState.mafia_state = mState;
  await saveGameState(rawState, ROOM_TTL_SECONDS);
  broadcastMafiaState(io, mState);

  // Set timer to resolve night
  const timer = setTimeout(async () => {
    await transitionToMafiaDay(io, roomCode);
  }, nightSeconds * 1000);
  roomTimers.set(roomCode, timer);
}

/**
 * Resolve daytime voting and trigger 8s VOTING_REVEAL
 */
export async function resolveMafiaDayVoting(io: Server, roomCode: string) {
  clearRoomTimer(roomCode);
  const rawState = await getGameState(roomCode);
  if (!rawState || !rawState.mafia_state) return;

  const mState: MafiaGameRoomState = rawState.mafia_state;
  if (mState.phase === 'VOTING_REVEAL' || mState.phase === 'GAME_OVER') return;

  // Calculate vote tallies
  const voteCounts: Record<string, number> = {};
  Object.values(mState.votes).forEach((targetId) => {
    if (targetId && targetId !== 'skip') {
      voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
    }
  });

  let maxVotes = 0;
  let votedOutId: string | null = null;
  let isTie = false;

  Object.entries(voteCounts).forEach(([targetId, count]) => {
    if (count > maxVotes) {
      maxVotes = count;
      votedOutId = targetId;
      isTie = false;
    } else if (count === maxVotes) {
      isTie = true;
    }
  });

  let eliminatedPlayer: MafiaPlayerData | null = null;
  if (votedOutId && !isTie && maxVotes > 0) {
    const p = mState.players.find((pl) => pl.socket_id === votedOutId && pl.is_alive);
    if (p) {
      p.is_alive = false;
      eliminatedPlayer = p;
    }
  }

  mState.recent_elimination = eliminatedPlayer
    ? {
        name: eliminatedPlayer.name,
        role: eliminatedPlayer.role,
        socket_id: eliminatedPlayer.socket_id,
        reason: 'vote'
      }
    : null;

  mState.phase = 'VOTING_REVEAL';
  const revealDuration = 8;
  mState.timeLeft = revealDuration;
  mState.timer_ends_at = Date.now() + revealDuration * 1000;

  rawState.mafia_state = mState;
  await saveGameState(rawState, ROOM_TTL_SECONDS);

  broadcastMafiaState(io, mState);

  // After 8s, transition to NIGHT or GAME_OVER
  const timer = setTimeout(async () => {
    await transitionToMafiaNight(io, roomCode);
  }, revealDuration * 1000);
  roomTimers.set(roomCode, timer);
}

/**
 * Register all Mafia socket handlers
 */
export function registerMafiaHandlers(io: Server, socket: Socket) {
  /**
   * Start Mafia Game with custom settings
   */
  socket.on(
    'start_mafia_game',
    async (
      payload: {
        room_code?: string;
        nightDuration?: number;
        dayDuration?: number;
        settings?: { nightDuration?: number; dayDuration?: number };
      },
      callback?: (res: any) => void
    ) => {
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
          throw new Error('Only the host can start the game');
        }

        const playerCount = state.players.length;
        if (playerCount < 3) {
          throw new Error('At least 3 players are required to start Mafia');
        }

        const nightDuration = Math.max(10, Math.min(180, Number(payload.nightDuration || payload.settings?.nightDuration || 45)));
        const dayDuration = Math.max(15, Math.min(600, Number(payload.dayDuration || payload.settings?.dayDuration || 120)));

        // Assign Roles:
        // 3-4 players: 1 Mafia, 1 Doctor, rest Citizens (or 1 Detective if >= 4)
        // 5-6 players: 1 Mafia, 1 Doctor, 1 Detective, rest Citizens
        // 7+ players: 2 Mafia, 1 Doctor, 1 Detective, rest Citizens
        const roles: MafiaRole[] = [];
        const mafiaCount = playerCount >= 7 ? 2 : 1;
        for (let i = 0; i < mafiaCount; i++) roles.push('mafia');
        roles.push('doctor');
        if (playerCount >= 4) {
          roles.push('detective');
        }
        while (roles.length < playerCount) {
          roles.push('citizen');
        }

        const shuffledRoles = shuffle(roles);

        const mafiaPlayers: MafiaPlayerData[] = state.players.map((p, idx) => ({
          socket_id: p.socket_id,
          name: p.name,
          role: shuffledRoles[idx],
          is_alive: true
        }));

        const revealDuration = 6;
        const initialMafiaState: MafiaGameRoomState = {
          room_code: roomCode,
          phase: 'ROLE_REVEAL',
          players: mafiaPlayers,
          timeLeft: revealDuration,
          timer_ends_at: Date.now() + revealDuration * 1000,
          settings: {
            nightDuration,
            dayDuration
          },
          night_events: [],
          recent_elimination: null,
          winner: null,
          votes: {},
          night_actions: {}
        };

        state.game_id = 'mafia';
        state.mafia_state = initialMafiaState;
        await saveGameState(state, ROOM_TTL_SECONDS);

        broadcastMafiaState(io, initialMafiaState);

        if (typeof callback === 'function') {
          callback({ success: true, state: initialMafiaState });
        }

        // Transition from ROLE_REVEAL to NIGHT after 6 seconds
        clearRoomTimer(roomCode);
        const timer = setTimeout(async () => {
          await transitionToMafiaNight(io, roomCode!);
        }, revealDuration * 1000);
        roomTimers.set(roomCode, timer);
      } catch (error: any) {
        console.error('[start_mafia_game error]:', error.message);
        if (typeof callback === 'function') callback({ success: false, error: error.message });
      }
    }
  );

  /**
   * Submit Night Action (Mafia Kill or Doctor Save)
   */
  socket.on('mafia_night_action', async (payload: { room_code?: string; target_socket_id: string }, callback?: (res: any) => void) => {
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
      if (!state || !state.mafia_state) throw new Error('Game not found');

      const mState: MafiaGameRoomState = state.mafia_state;
      if (mState.phase !== 'NIGHT') throw new Error('Night actions only valid during NIGHT phase');

      const player = mState.players.find((p) => p.socket_id === socket.id);
      if (!player || !player.is_alive) throw new Error('Eliminated players cannot perform actions');

      if (!mState.night_actions) mState.night_actions = {};

      if (player.role === 'mafia') {
        mState.night_actions.mafia = payload.target_socket_id;
      } else if (player.role === 'doctor') {
        mState.night_actions.doctor = payload.target_socket_id;
      }

      state.mafia_state = mState;
      await saveGameState(state, ROOM_TTL_SECONDS);

      // Check if all actions locked
      if (checkAllNightActionsLocked(mState)) {
        io.to(state.host_socket_id).emit('all_actions_locked', { phase: 'NIGHT' });
      }

      if (typeof callback === 'function') callback({ success: true });
    } catch (error: any) {
      console.error('[mafia_night_action error]:', error.message);
      if (typeof callback === 'function') callback({ success: false, error: error.message });
    }
  });

  /**
   * Detective Investigate
   */
  socket.on('mafia_investigate', async (payload: { room_code?: string; target_socket_id: string }, callback?: (res: any) => void) => {
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
      if (!state || !state.mafia_state) throw new Error('Game not found');

      const mState: MafiaGameRoomState = state.mafia_state;
      const detective = mState.players.find((p) => p.socket_id === socket.id);
      if (!detective || !detective.is_alive || detective.role !== 'detective') {
        throw new Error('Only the living Detective can investigate');
      }

      const target = mState.players.find((p) => p.socket_id === payload.target_socket_id);
      if (!target) throw new Error('Target player not found');

      const isMafia = target.role === 'mafia';
      const result = {
        success: true,
        target_socket_id: target.socket_id,
        target_name: target.name,
        is_mafia: isMafia
      };

      if (!mState.night_actions) mState.night_actions = {};
      mState.night_actions.detective = target.socket_id;
      state.mafia_state = mState;
      await saveGameState(state, ROOM_TTL_SECONDS);

      socket.emit('mafia_investigation_result', result);

      if (checkAllNightActionsLocked(mState)) {
        io.to(state.host_socket_id).emit('all_actions_locked', { phase: 'NIGHT' });
      }

      if (typeof callback === 'function') callback(result);
    } catch (error: any) {
      console.error('[mafia_investigate error]:', error.message);
      if (typeof callback === 'function') callback({ success: false, error: error.message });
    }
  });

  /**
   * Day Voting
   */
  socket.on('mafia_submit_vote', async (payload: { room_code?: string; target_socket_id: string }, callback?: (res: any) => void) => {
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
      if (!state || !state.mafia_state) throw new Error('Game not found');

      const mState: MafiaGameRoomState = state.mafia_state;
      if (mState.phase !== 'DAY' && mState.phase !== 'VOTING') {
        throw new Error('Voting is only available during the DAY phase');
      }

      const voter = mState.players.find((p) => p.socket_id === socket.id);
      if (!voter || !voter.is_alive) throw new Error('Eliminated players cannot vote');

      if (!mState.votes) mState.votes = {};
      mState.votes[socket.id] = payload.target_socket_id;

      state.mafia_state = mState;
      await saveGameState(state, ROOM_TTL_SECONDS);

      broadcastMafiaState(io, mState);

      // If all living players have voted, resolve immediately
      const livingCount = mState.players.filter((p) => p.is_alive).length;
      const votesReceived = Object.keys(mState.votes).filter((id) =>
        mState.players.some((p) => p.socket_id === id && p.is_alive)
      ).length;

      if (votesReceived >= livingCount) {
        io.to(state.host_socket_id).emit('all_actions_locked', { phase: 'DAY' });
        await resolveMafiaDayVoting(io, roomCode);
      }

      if (typeof callback === 'function') callback({ success: true });
    } catch (error: any) {
      console.error('[mafia_submit_vote error]:', error.message);
      if (typeof callback === 'function') callback({ success: false, error: error.message });
    }
  });

  /**
   * Host Force End Phase Early / Skip Timer
   */
  socket.on('force_mafia_phase_end', async (payload: { room_code?: string }, callback?: (res: any) => void) => {
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
      if (!state || !state.mafia_state) throw new Error('Game not found');

      if (state.host_socket_id !== socket.id) throw new Error('Only the Host can force phase end');

      clearRoomTimer(roomCode);
      const mState: MafiaGameRoomState = state.mafia_state;

      console.log(`[Host Override] Room ${roomCode}: Ending phase ${mState.phase} early`);

      if (mState.phase === 'NIGHT') {
        await transitionToMafiaDay(io, roomCode);
      } else if (mState.phase === 'DAY' || mState.phase === 'VOTING') {
        await resolveMafiaDayVoting(io, roomCode);
      } else if (mState.phase === 'VOTING_REVEAL') {
        await transitionToMafiaNight(io, roomCode);
      } else if (mState.phase === 'ROLE_REVEAL') {
        await transitionToMafiaNight(io, roomCode);
      }

      if (typeof callback === 'function') callback({ success: true });
    } catch (error: any) {
      console.error('[force_mafia_phase_end error]:', error.message);
      if (typeof callback === 'function') callback({ success: false, error: error.message });
    }
  });

  /**
   * Host Skip/Advance Phase (compatibility alias)
   */
  socket.on('mafia_advance_phase', async (payload: { room_code?: string }, callback?: (res: any) => void) => {
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
      if (!state || !state.mafia_state) throw new Error('Game not found');

      if (state.host_socket_id !== socket.id) throw new Error('Only the Host can advance phases');

      clearRoomTimer(roomCode);
      const mState: MafiaGameRoomState = state.mafia_state;

      if (mState.phase === 'NIGHT') {
        await transitionToMafiaDay(io, roomCode);
      } else if (mState.phase === 'DAY' || mState.phase === 'VOTING') {
        await resolveMafiaDayVoting(io, roomCode);
      } else if (mState.phase === 'VOTING_REVEAL') {
        await transitionToMafiaNight(io, roomCode);
      } else if (mState.phase === 'ROLE_REVEAL') {
        await transitionToMafiaNight(io, roomCode);
      }

      if (typeof callback === 'function') callback({ success: true });
    } catch (error: any) {
      console.error('[mafia_advance_phase error]:', error.message);
      if (typeof callback === 'function') callback({ success: false, error: error.message });
    }
  });

  /**
   * Host Restart Mafia Game
   */
  socket.on('mafia_restart_game', async (payload: { room_code?: string }, callback?: (res: any) => void) => {
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

      if (state.host_socket_id !== socket.id) throw new Error('Only Host can restart game');

      clearRoomTimer(roomCode);

      state.phase = 'lobby';
      state.game_id = null;
      delete state.mafia_state;

      state.players = state.players.map((p) => ({
        ...p,
        role: 'villager',
        is_alive: true
      }));

      await saveGameState(state, ROOM_TTL_SECONDS);
      broadcastGameState(io, state);

      io.to(getSocketRoomName(roomCode)).emit('game_selected', { gameId: null });

      if (typeof callback === 'function') callback({ success: true });
    } catch (error: any) {
      console.error('[mafia_restart_game error]:', error.message);
      if (typeof callback === 'function') callback({ success: false, error: error.message });
    }
  });
}
