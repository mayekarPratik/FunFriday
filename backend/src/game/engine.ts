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
 * Implements strict resolution order:
 * 1. Queue wolf_kill victim.
 * 2. If doctor_save matches victim, cancel kill.
 * 3. If witch_heal matches victim, cancel kill.
 * 4. If witch_poison exists, add to final kill list.
 * 5. Mark all final victims as is_alive: false.
 */
export function resolveDaybreak(state: GameState): void {
  const actions = state.night_actions || {};
  const wolfAction = actions['wolf'];
  const doctorAction = actions['doctor'];
  const witchAction = actions['witch'];

  const wolfKillVictimId: string | undefined =
    actions.wolf_kill ||
    wolfAction?.target_socket_id ||
    (typeof wolfAction === 'string' ? wolfAction : undefined);

  const doctorSaveTargetId: string | undefined =
    actions.doctor_save ||
    doctorAction?.target_socket_id ||
    (typeof doctorAction === 'string' ? doctorAction : undefined);

  const witchHealTargetId: string | undefined =
    actions.witch_heal ||
    witchAction?.heal_target ||
    (witchAction?.action_type === 'heal' ? witchAction?.target_socket_id : undefined);

  const witchPoisonTargetId: string | undefined =
    actions.witch_poison ||
    witchAction?.poison_target ||
    (witchAction?.action_type === 'poison' ? witchAction?.target_socket_id : undefined);

  // 1. First, queue the wolf_kill victim.
  let queuedWolfVictim: string | null = wolfKillVictimId || null;

  // 2. Second, if doctor_save matches the victim, cancel the kill.
  if (queuedWolfVictim && doctorSaveTargetId && queuedWolfVictim === doctorSaveTargetId) {
    queuedWolfVictim = null;
  }

  // 3. Third, if witch_heal matches the victim, cancel the kill.
  if (queuedWolfVictim && witchHealTargetId && queuedWolfVictim === witchHealTargetId) {
    queuedWolfVictim = null;
  }

  // 4. Fourth, if witch_poison exists, add that target to the final kill list.
  const finalKillList: string[] = [];
  if (queuedWolfVictim) {
    finalKillList.push(queuedWolfVictim);
  }
  if (witchPoisonTargetId && !finalKillList.includes(witchPoisonTargetId)) {
    finalKillList.push(witchPoisonTargetId);
  }

  // Finally, mark all final victims as is_alive: false.
  const killedNames: string[] = [];
  finalKillList.forEach((targetSocketId) => {
    const victim = state.players.find((p) => p.socket_id === targetSocketId);
    if (victim && victim.is_alive) {
      victim.is_alive = false;
      if (!killedNames.includes(victim.name)) {
        killedNames.push(victim.name);
      }
    }
  });

  // 5. Resolve Cupid Lovers (if one lover died, the other dies too)
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
 * Broadcasts game state to room and ensures Witch receives night_actions.wolf_kill
 */
export function broadcastGameState(io: Server, state: GameState): void {
  const socketRoom = getSocketRoomName(state.room_code);
  const wolfKill = state.night_actions?.wolf_kill || state.night_actions?.['wolf']?.target_socket_id;

  if (wolfKill && (!state.night_actions || !state.night_actions.wolf_kill)) {
    state.night_actions = state.night_actions || {};
    state.night_actions.wolf_kill = wolfKill;
  }

  io.to(socketRoom).emit('game_state_update', state);

  // Ensure any connected Witch socket receives a payload with wolf_kill included
  state.players.forEach((player) => {
    if (player.role === 'witch') {
      const witchSocket = io.sockets?.sockets?.get(player.socket_id);
      if (witchSocket) {
        const witchState: GameState = {
          ...state,
          night_actions: {
            ...(state.night_actions || {}),
            ...(wolfKill ? { wolf_kill: wolfKill } : {})
          }
        };
        witchSocket.emit('game_state_update', witchState);
      }
    }
  });
}

/**
 * Handles a single night action submission from a player.
 * Validates Witch payload against persistent role_states inventory,
 * records actions into state.night_actions, pops next role from night_queue,
 * and advances game.
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

  // Handle Witch role action & inventory validation
  if (role === 'witch') {
    if (!state.role_states) {
      state.role_states = {};
    }
    if (!state.role_states.witch) {
      state.role_states.witch = { has_heal: true, has_poison: true };
    }

    const healTarget = payload.heal_target || (payload.action_type === 'heal' ? payload.target_socket_id : undefined);
    const poisonTarget = payload.poison_target || (payload.action_type === 'poison' ? payload.target_socket_id : undefined);

    let validHealTarget: string | undefined = undefined;
    let validPoisonTarget: string | undefined = undefined;

    if (healTarget) {
      if (state.role_states.witch.has_heal) {
        validHealTarget = healTarget;
        state.role_states.witch.has_heal = false;
      }
    }

    if (poisonTarget) {
      if (state.role_states.witch.has_poison) {
        validPoisonTarget = poisonTarget;
        state.role_states.witch.has_poison = false;
      }
    }

    state.night_actions['witch'] = {
      ...payload,
      heal_target: validHealTarget || null,
      poison_target: validPoisonTarget || null
    };

    if (validHealTarget) {
      state.night_actions.witch_heal = validHealTarget;
    }
    if (validPoisonTarget) {
      state.night_actions.witch_poison = validPoisonTarget;
    }
  } else if (role === 'wolf') {
    state.night_actions['wolf'] = payload;
    const wolfTarget = payload.target_socket_id || payload.target_socket_ids?.[0] || payload.wolf_kill;
    if (wolfTarget) {
      state.night_actions.wolf_kill = wolfTarget;
    }
  } else if (role === 'doctor') {
    state.night_actions['doctor'] = payload;
    const doctorTarget = payload.target_socket_id || payload.doctor_save;
    if (doctorTarget) {
      state.night_actions.doctor_save = doctorTarget;
    }
  } else {
    state.night_actions[role] = payload;
  }

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

  // Broadcast state to room (with custom witch payload if applicable)
  broadcastGameState(io, state);

  return state;
}
