export type GamePhase = 'lobby' | 'night' | 'day' | 'game_over';

export type RoleType =
  | 'cupid'
  | 'doctor'
  | 'wolf'
  | 'witch'
  | 'seer'
  | 'hunter'
  | 'bear_tamer'
  | 'villager'
  | '';

export const MASTER_NIGHT_ORDER: RoleType[] = ['cupid', 'doctor', 'wolf', 'witch', 'seer'];

export const ROLE_PRIORITIES: Record<string, number> = {
  cupid: 1,
  doctor: 2,
  wolf: 3,
  witch: 4,
  seer: 5,
  hunter: 0,
  bear_tamer: 0,
  villager: 0,
  '': 0
};

export interface Player {
  socket_id: string;
  name: string;
  role: RoleType;
  is_alive: boolean;
  is_lover?: boolean;
}

export interface NightActionPayload {
  target_socket_id?: string;
  target_socket_ids?: string[]; // for cupid lovers
  action_type?: 'kill' | 'heal' | 'poison' | 'inspect' | 'link';
  [key: string]: any;
}

export interface GameState {
  room_code: string;
  phase: GamePhase;
  host_socket_id: string;
  active_role_priority: number;
  active_role?: RoleType | null;
  night_queue?: RoleType[];
  night_actions?: Record<string, NightActionPayload>; // keyed by role e.g. "wolf", "doctor", "witch", "seer", "cupid"
  players: Player[];
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
