import { Server } from 'socket.io';
import { GameState, RoleType, MASTER_NIGHT_ORDER, NightActionPayload, ROLE_PRIORITIES } from '../types/game';
import { saveGameState, ROOM_TTL_SECONDS } from '../services/redis';

export const getSocketRoomName = (roomCode: string): string => `lobby:${roomCode.toUpperCase()}`;

/**
 * Checks win conditions:
 * - Wolves win: alive wolves >= alive non-wolves
 * - Villagers win: alive wolves === 0
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

/**
 * Initializes and shifts state to the 'night' phase.
 * Populates night_queue by filtering MASTER_NIGHT_ORDER to living assigned roles in the room.
 * Sets the first role as active_role and removes it from the queue.
 */
export function initializeNightPhase(state: GameState): void {
  state.phase = 'night';
  state.night_actions = {};
  state.votes = {};

  const livingRoles = new Set(
    state.players.filter((p) => p.is_alive).map((p) => p.role)
  );

  // Filter MASTER_NIGHT_ORDER to only include roles currently assigned to living players
  const queue = MASTER_NIGHT_ORDER.filter((role) => livingRoles.has(role));

  if (queue.length > 0) {
    const firstRole = queue.shift()!;
    state.active_role = firstRole;
    state.active_role_priority = ROLE_PRIORITIES[firstRole] || 0;
    state.night_queue = queue;
  } else {
    // If no active night roles exist, resolve directly to day
    state.active_role = null;
    state.active_role_priority = 0;
    state.night_queue = [];
    resolveDaybreak(state);
  }
}

/**
 * Evaluates night_actions when night_queue is empty.
 * Cancels wolf kill if doctor saved the target, applies witch poison/heal, updates player deaths,
 * changes phase to 'day' (or 'game_over' if win conditions met), and clears actions object.
 */
export function resolveDaybreak(state: GameState): void {
  const actions = state.night_actions || {};
  const wolfAction = actions['wolf'];
  const doctorAction = actions['doctor'];
  const witchAction = actions['witch'];

  const wolfTargetId = wolfAction?.target_socket_id;
  const doctorTargetId = doctorAction?.target_socket_id;
  const witchHealTargetId = witchAction?.action_type === 'heal' ? witchAction?.target_socket_id : undefined;
  const witchPoisonTargetId = witchAction?.action_type === 'poison' ? witchAction?.target_socket_id : undefined;

  const killedNames: string[] = [];

  // 1. Resolve Wolf Attack
  if (wolfTargetId) {
    // Attack negated if protected by doctor or healed by witch
    const isSaved = wolfTargetId === doctorTargetId || wolfTargetId === witchHealTargetId;
    if (!isSaved) {
      const victim = state.players.find((p) => p.socket_id === wolfTargetId);
      if (victim && victim.is_alive) {
        victim.is_alive = false;
        killedNames.push(victim.name);
      }
    }
  }

  // 2. Resolve Witch Poison
  if (witchPoisonTargetId) {
    const poisonedVictim = state.players.find((p) => p.socket_id === witchPoisonTargetId);
    if (poisonedVictim && poisonedVictim.is_alive) {
      poisonedVictim.is_alive = false;
      if (!killedNames.includes(poisonedVictim.name)) {
        killedNames.push(poisonedVictim.name);
      }
    }
  }

  // 3. Resolve Cupid Lovers (if one lover died, the other dies too)
  const deadLovers = state.players.filter((p) => !p.is_alive && p.is_lover);
  if (deadLovers.length > 0) {
    state.players.forEach((p) => {
      if (p.is_lover && p.is_alive) {
        p.is_alive = false;
        if (!killedNames.includes(p.name)) {
          killedNames.push(`${p.name} (Heartbroken Lover)`);
        }
      }
    });
  }

  // Update casualty report
  state.last_night_killed = killedNames.length > 0 ? killedNames.join(', ') : null;
  state.night_actions = {};
  state.active_role = null;
  state.active_role_priority = 0;
  state.night_queue = [];
  state.votes = {};

  // Check win conditions
  const winner = evaluateWinConditions(state);
  if (winner) {
    state.phase = 'game_over';
    state.winner = winner;
    state.timer_ends_at = null;
  } else {
    // 5-minute countdown for Day phase
    state.phase = 'day';
    state.timer_ends_at = Date.now() + 5 * 60 * 1000;
  }
}

/**
 * Handles a single night action submission from a player.
 * Records payload into state.night_actions, pops the next role from night_queue,
 * and sets it as active_role. If queue is empty, calls resolveDaybreak.
 * Finally saves to Redis and broadcasts to room.
 */
export async function handleNightAction(
  state: GameState,
  role: RoleType,
  payload: NightActionPayload,
  io: Server
): Promise<GameState> {
  if (!state.night_actions) {
    state.night_actions = {};
  }

  // Record action payload
  state.night_actions[role] = payload;

  // If Cupid, link lovers
  if (role === 'cupid' && payload.target_socket_ids && payload.target_socket_ids.length === 2) {
    const [p1, p2] = payload.target_socket_ids;
    state.players.forEach((player) => {
      if (player.socket_id === p1 || player.socket_id === p2) {
        player.is_lover = true;
      }
    });
  }

  // Advance queue
  const queue = state.night_queue || [];
  if (queue.length > 0) {
    const nextRole = queue.shift()!;
    state.active_role = nextRole;
    state.active_role_priority = ROLE_PRIORITIES[nextRole] || 0;
    state.night_queue = queue;
  } else {
    // Queue is empty: Night is complete -> Resolve to Day
    resolveDaybreak(state);
  }

  // Save mutated state back to Redis
  await saveGameState(state, ROOM_TTL_SECONDS);

  // Broadcast state to room
  const socketRoom = getSocketRoomName(state.room_code);
  io.to(socketRoom).emit('game_state_update', state);

  return state;
}
