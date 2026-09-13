export type GamePhase = 'lobby' | 'night' | 'day' | 'game_over';

export type RoleType =
  | 'cupid'
  | 'doctor'
  | 'wolf'
  | 'witch'
  | 'seer'
  | 'villager'
  | 'jester'
  | 'executioner'
  | '';

export const MASTER_NIGHT_ORDER: RoleType[] = ['cupid', 'doctor', 'wolf', 'witch', 'seer'];

export const ROLE_PRIORITIES: Record<string, number> = {
  cupid: 1,
  doctor: 2,
  wolf: 3,
  witch: 4,
  seer: 5,
  villager: 0,
  jester: 0,
  executioner: 0,
  '': 0
};

export interface Player {
  socket_id: string;
  name: string;
  role: RoleType;
  is_alive: boolean;
  is_lover?: boolean;
}

export interface WitchRoleState {
  has_heal: boolean;
  has_poison: boolean;
}

export interface ExecutionerRoleState {
  target_id: string | null;
}

export interface RoleStates {
  witch?: WitchRoleState;
  executioner?: ExecutionerRoleState;
  [key: string]: any;
}

export interface RoleSettings {
  wolf: number;
  seer: number;
  doctor: number;
  witch: number;
  cupid: number;
  villager: number;
  jester: number;
  executioner: number;
  [key: string]: number;
}

export const DEFAULT_ROLE_SETTINGS: RoleSettings = {
  wolf: 1,
  seer: 1,
  doctor: 1,
  witch: 1,
  cupid: 1,
  villager: 1,
  jester: 1,
  executioner: 1
};

export interface NightActionPayload {
  target_socket_id?: string;
  target_socket_ids?: string[]; // for cupid lovers
  action_type?: 'kill' | 'heal' | 'poison' | 'inspect' | 'link';
  heal_target?: string | null;
  poison_target?: string | null;
  sender_socket_id?: string;
  [key: string]: any;
}

export type WinnerType = 'wolves' | 'villagers' | 'town' | 'jester' | 'executioner' | 'lovers' | null;

export interface GameState {
  room_code: string;
  phase: GamePhase;
  host_socket_id: string;
  active_role_priority: number;
  active_role?: RoleType | null;
  night_queue?: RoleType[];
  night_actions?: Record<string, any>; // keyed by role e.g. "wolf", "doctor", "witch", "seer", "cupid" or action keys like "wolf_kill"
  role_states?: RoleStates;
  role_settings?: RoleSettings;
  players: Player[];
  lovers?: string[]; // socket IDs of linked lovers
  last_night_killed?: string | null;
  last_day_eliminated?: string | null;
  votes?: Record<string, string>; // voter_socket_id -> target_socket_id
  timer_ends_at?: number | null;
  winner?: WinnerType;
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
