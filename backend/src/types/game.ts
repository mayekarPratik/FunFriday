export type GamePhase = 'lobby' | 'night' | 'day' | 'game_over';

export type RoleType = 'wolf' | 'seer' | 'doctor' | 'villager' | '';

export const ROLE_PRIORITIES: Record<string, number> = {
  wolf: 1,
  doctor: 2,
  seer: 3,
  villager: 0,
  '': 0
};

export interface Player {
  socket_id: string;
  name: string;
  role: RoleType;
  is_alive: boolean;
}

export interface NightTargets {
  wolf_target?: string;
  doctor_target?: string;
  seer_target?: string;
}

export interface GameState {
  room_code: string;
  phase: GamePhase;
  host_socket_id: string;
  active_role_priority: number;
  players: Player[];
  night_targets?: NightTargets;
  last_night_killed?: string | null;
  last_day_eliminated?: string | null;
  votes?: Record<string, string>; // voter_socket_id -> target_socket_id
  timer_ends_at?: number | null;
  winner?: 'wolves' | 'villagers' | null;
}

export interface CreateRoomResponse {
  success: boolean;
  room_code?: string;
  error?: string;
  state?: GameState;
}

export interface JoinRoomPayload {
  room_code: string;
  name: string;
}

export interface JoinRoomResponse {
  success: boolean;
  error?: string;
  state?: GameState;
}

export interface StartGameResponse {
  success: boolean;
  error?: string;
  state?: GameState;
}
