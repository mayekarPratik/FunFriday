import { Server } from 'socket.io';
import {
  GameState,
  RoleType,
  MASTER_NIGHT_ORDER,
  NightActionPayload,
  ROLE_PRIORITIES,
  Player,
  WinnerType
} from '../types/game';
import { saveGameState, ROOM_TTL_SECONDS } from '../services/redis';

export const getSocketRoomName = (roomCode: string): string => `lobby:${roomCode.toUpperCase()}`;

export interface WinConditionResult {
  game_over: boolean;
  winner?: WinnerType;
}

/**
 * Checks win conditions across game phases:
 * 1. Neutral Wins (Highest Priority, evaluated if called from a day vote):
 *    - Executed player is 'jester' -> { game_over: true, winner: 'jester' }
 *    - Executed player matches Executioner's target_id -> { game_over: true, winner: 'executioner' }
 * 2. Lover Wins:
 *    - Exactly 2 living players and their IDs match state.lovers array -> { game_over: true, winner: 'lovers' }
 * 3. Wolf Wins:
 *    - aliveWolves >= (totalAlive - aliveWolves) -> { game_over: true, winner: 'wolves' }
 * 4. Town Wins:
 *    - aliveWolves === 0 -> { game_over: true, winner: 'town' }
 * 5. Continue Game:
 *    - Otherwise -> { game_over: false }
 */
export function checkWinCondition(
  state: GameState,
  context?: { isDayVote?: boolean; executedPlayer?: Player | null }
): WinConditionResult {
  // 1. Neutral Wins (Highest Priority): If called from a day vote
  if (context?.isDayVote && context.executedPlayer) {
    const executed = context.executedPlayer;

    // If executed player's role is 'jester'
    if (executed.role === 'jester') {
      return { game_over: true, winner: 'jester' };
    }

    // If executed player matches Executioner's target_id
    const executionerTargetId = state.role_states?.executioner?.target_id;
    if (executionerTargetId && executed.socket_id === executionerTargetId) {
      return { game_over: true, winner: 'executioner' };
    }
  }

  const alivePlayers = state.players.filter((p) => p.is_alive);
  const totalAlive = alivePlayers.length;

  // 2. Lover Wins: If only 2 players are alive, and their IDs match state.lovers array
  if (totalAlive === 2 && state.lovers && state.lovers.length === 2) {
    const aliveSocketIds = alivePlayers.map((p) => p.socket_id);
    const isLoversWin =
      aliveSocketIds.includes(state.lovers[0]) && aliveSocketIds.includes(state.lovers[1]);
    if (isLoversWin) {
      return { game_over: true, winner: 'lovers' };
    }
  }

  const aliveWolves = alivePlayers.filter((p) => p.role === 'wolf').length;
  const aliveNonWolves = totalAlive - aliveWolves;

  // 3. Wolf Wins: If aliveWolves >= (totalAlive - aliveWolves)
  if (aliveWolves >= aliveNonWolves) {
    return { game_over: true, winner: 'wolves' };
  }

  // 4. Town Wins: If aliveWolves === 0
  if (aliveWolves === 0) {
    return { game_over: true, winner: 'town' };
  }

  // 5. Continue Game: If none of these are met
  return { game_over: false };
}

/**
 * Initializes and shifts state to the 'night' phase.
 * Maps over living players to get active roles, deduplicates them,
 * and filters MASTER_NIGHT_ORDER to generate the dynamic night_queue.
 * Sets the first role as active_role and removes it from the queue.
 */
export function initializeNightPhase(state: GameState): void {
  state.phase = 'night';
  state.night_actions = {};
  state.votes = {};

  // Map over living players to get a list of active roles in the game
  const livingPlayerRoles = state.players
    .filter((p) => p.is_alive && p.role)
    .map((p) => p.role as RoleType);

  // Deduplicate this list (so if there are multiple wolves, 'wolf' only appears once)
  const deduplicatedActiveRoles = Array.from(new Set(livingPlayerRoles));

  // Filter MASTER_NIGHT_ORDER to only include roles that exist in the deduplicated active roles list
  const queue = MASTER_NIGHT_ORDER.filter((role) => deduplicatedActiveRoles.includes(role));

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
 * Resolves wolf kills (unanimous or random selection for split votes).
 * Converts Executioner to Jester if their target was killed at night.
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

  // 1. Resolve wolf kill target from wolf_kills array (unanimous or random choice for split votes)
  let wolfKillVictimId: string | undefined = undefined;
  const wolfKills: string[] = actions.wolf_kills || [];

  if (wolfKills.length > 0) {
    const isUnanimous = wolfKills.every((target) => target === wolfKills[0]);
    if (isUnanimous) {
      wolfKillVictimId = wolfKills[0];
    } else {
      // Split vote: randomly select the final victim
      const randomIndex = Math.floor(Math.random() * wolfKills.length);
      wolfKillVictimId = wolfKills[randomIndex];
    }
  } else {
    wolfKillVictimId =
      actions.wolf_kill ||
      wolfAction?.target_socket_id ||
      (typeof wolfAction === 'string' ? wolfAction : undefined);
  }

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

  // Queue the wolf_kill victim
  let queuedWolfVictim: string | null = wolfKillVictimId || null;

  // If doctor_save matches the victim, cancel the kill
  if (queuedWolfVictim && doctorSaveTargetId && queuedWolfVictim === doctorSaveTargetId) {
    queuedWolfVictim = null;
  }

  // If witch_heal matches the victim, cancel the kill
  if (queuedWolfVictim && witchHealTargetId && queuedWolfVictim === witchHealTargetId) {
    queuedWolfVictim = null;
  }

  // If witch_poison exists, add that target to the final kill list
  const finalKillList: string[] = [];
  if (queuedWolfVictim) {
    finalKillList.push(queuedWolfVictim);
  }
  if (witchPoisonTargetId && !finalKillList.includes(witchPoisonTargetId)) {
    finalKillList.push(witchPoisonTargetId);
  }

  // Finally, mark all final victims as is_alive: false
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

  // Check if Executioner's target was killed at night -> Executioner becomes Jester
  const executionerTargetId = state.role_states?.executioner?.target_id;
  if (executionerTargetId) {
    const targetPlayer = state.players.find((p) => p.socket_id === executionerTargetId);
    if (targetPlayer && !targetPlayer.is_alive) {
      state.players.forEach((p) => {
        if (p.role === 'executioner' && p.is_alive) {
          p.role = 'jester';
        }
      });
      if (state.role_states?.executioner) {
        state.role_states.executioner.target_id = null;
      }
    }
  }

  // Resolve Cupid Lovers (if one lover died, the other dies too)
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

  // Check win conditions at end of resolveDaybreak
  const winResult = checkWinCondition(state);
  if (winResult.game_over) {
    state.phase = 'game_over';
    state.winner = winResult.winner;
    state.timer_ends_at = null;
  } else {
    // 5-minute countdown for Day phase
    state.phase = 'day';
    state.timer_ends_at = Date.now() + 5 * 60 * 1000;
  }
}

/**
 * Resolves day voting trial and checks neutral win conditions:
 * - If Jester is eliminated by vote -> Jester wins.
 * - If Executioner's target is eliminated by vote -> Executioner wins.
 * - Otherwise evaluates standard win conditions.
 */
export function resolveDayVote(state: GameState): GameState {
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

  let eliminatedPlayer: Player | undefined = undefined;
  let eliminatedPlayerName: string | null = null;

  if (eliminatedSocketId) {
    eliminatedPlayer = state.players.find((p) => p.socket_id === eliminatedSocketId);
    if (eliminatedPlayer && eliminatedPlayer.is_alive) {
      eliminatedPlayer.is_alive = false;
      eliminatedPlayerName = eliminatedPlayer.name;

      // Cupid lovers resolution
      if (eliminatedPlayer.is_lover) {
        const partner = state.players.find(
          (p) => p.is_lover && p.is_alive && p.socket_id !== eliminatedPlayer!.socket_id
        );
        if (partner) {
          partner.is_alive = false;
          eliminatedPlayerName = `${eliminatedPlayer.name} & ${partner.name} (Lover)`;
        }
      }
    }
  }

  state.last_day_eliminated = eliminatedPlayerName;
  state.votes = {};
  state.timer_ends_at = null;

  // Check win conditions at end of resolveDayVote
  const winResult = checkWinCondition(state, {
    isDayVote: true,
    executedPlayer: eliminatedPlayer || null
  });

  if (winResult.game_over) {
    state.phase = 'game_over';
    state.winner = winResult.winner;
  } else {
    // Shift back to Night phase with fresh dynamic night_queue
    initializeNightPhase(state);
  }

  return state;
}

/**
 * Broadcasts game state to room and delivers role-specific private payloads:
 * - Witch receives night_actions.wolf_kill
 * - Executioner receives role_states.executioner.target_id
 */
export function broadcastGameState(io: Server, state: GameState): void {
  const socketRoom = getSocketRoomName(state.room_code);
  const wolfKill =
    state.night_actions?.wolf_kill ||
    (state.night_actions?.wolf_kills && state.night_actions.wolf_kills.length > 0
      ? state.night_actions.wolf_kills[0]
      : state.night_actions?.['wolf']?.target_socket_id);

  if (wolfKill && (!state.night_actions || !state.night_actions.wolf_kill)) {
    state.night_actions = state.night_actions || {};
    state.night_actions.wolf_kill = wolfKill;
  }

  // Broadcast base state to room
  io.to(socketRoom).emit('game_state_update', state);

  // Send private targeted payload to Witch and Executioner
  state.players.forEach((player) => {
    const playerSocket = io.sockets?.sockets?.get(player.socket_id);
    if (playerSocket) {
      const isWitch = player.role === 'witch';
      const isExecutioner = player.role === 'executioner';
      const executionerTargetId = state.role_states?.executioner?.target_id;

      if (isWitch || isExecutioner) {
        const customizedState: GameState = {
          ...state,
          night_actions: {
            ...(state.night_actions || {}),
            ...(isWitch && wolfKill ? { wolf_kill: wolfKill } : {})
          },
          role_states: {
            ...(state.role_states || {}),
            ...(isExecutioner && executionerTargetId
              ? { executioner: { target_id: executionerTargetId } }
              : {})
          }
        };
        playerSocket.emit('game_state_update', customizedState);
      }
    }
  });
}

/**
 * Handles a single night action submission from a player.
 * For multiple wolves, collects votes in night_actions.wolf_kills = [target_1, target_2]
 * and waits until all living wolves have submitted before advancing night_queue.
 * Validates Witch payload against persistent role_states inventory,
 * records actions into state.night_actions, pops next role from night_queue, and advances game.
 */
export async function handleNightAction(
  state: GameState,
  role: RoleType,
  payload: NightActionPayload,
  io: Server,
  senderSocketId?: string
): Promise<GameState> {
  if (!state.night_actions) {
    state.night_actions = {};
  }

  const senderId = senderSocketId || payload.sender_socket_id || payload.socket_id;

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
    state.night_actions.wolf_votes = state.night_actions.wolf_votes || {};
    const wolfTarget = payload.target_socket_id || payload.target_socket_ids?.[0] || payload.wolf_kill;

    if (senderId && wolfTarget) {
      state.night_actions.wolf_votes[senderId] = wolfTarget;
    } else if (wolfTarget) {
      const fallbackKey = `wolf_${Object.keys(state.night_actions.wolf_votes).length}`;
      state.night_actions.wolf_votes[fallbackKey] = wolfTarget;
    }

    // Store their actions in an array night_actions.wolf_kills = [target_1, target_2]
    state.night_actions.wolf_kills = Object.values(state.night_actions.wolf_votes);
    state.night_actions['wolf'] = payload;

    // Check if all living wolves have submitted their action
    const livingWolves = state.players.filter((p) => p.role === 'wolf' && p.is_alive);
    const submittedCount = Object.keys(state.night_actions.wolf_votes).filter((voterId) =>
      livingWolves.some((w) => w.socket_id === voterId)
    ).length;

    // If there are multiple living wolves and not all have submitted yet, wait
    if (livingWolves.length > 1 && submittedCount < livingWolves.length) {
      await saveGameState(state, ROOM_TTL_SECONDS);
      broadcastGameState(io, state);
      return state;
    }

    // If all living wolves voted, populate wolf_kill
    if (state.night_actions.wolf_kills.length > 0) {
      state.night_actions.wolf_kill = state.night_actions.wolf_kills[0];
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
    state.lovers = [p1, p2];
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
