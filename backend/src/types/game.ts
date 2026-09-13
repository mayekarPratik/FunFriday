export type GamePhase = 'lobby' | 'night' | 'day' | 'game_over' | 'morning_recap' | 'dusk_recap';

export type RoleType =
  | 'cupid'
  | 'doctor'
  | 'wolf'
  | 'werewolf'
  | 'witch'
  | 'sheriff'
  | 'seer'
  | 'villager'
  | 'jester'
  | 'executioner'
  | 'serial_killer'
  | '';

export const MASTER_NIGHT_ORDER: RoleType[] = [
  'cupid',
  'wolf',
  'doctor',
  'witch',
  'sheriff',
  'seer',
  'serial_killer',
  'executioner',
  'jester',
  'villager'
];

export const ROLE_PRIORITIES: Record<string, number> = {
  cupid: 1,
  wolf: 2,
  doctor: 3,
  witch: 4,
  sheriff: 5,
  seer: 6,
  serial_killer: 7,
  executioner: 8,
  jester: 9,
  villager: 10,
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

export interface SheriffRoleState {
  has_bullet?: boolean;
  bullet_count: number;
}

export interface RoleStates {
  witch?: WitchRoleState;
  executioner?: ExecutionerRoleState;
  sheriff?: SheriffRoleState;
  [key: string]: any;
}

export interface RoleSettings {
  werewolf?: number;
  wolf?: number;
  seer: number;
  doctor: number;
  villager: number;
  sheriff?: number;
  jester: number;
  witch: number;
  executioner: number;
  cupid: number;
  [key: string]: number | undefined;
}

export const DEFAULT_ROLE_SETTINGS: RoleSettings = {
  werewolf: 1,
  seer: 1,
  doctor: 1,
  villager: 2,
  sheriff: 0,
  jester: 0,
  witch: 0,
  executioner: 0,
  cupid: 0
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

export interface GameSettings {
  discussion_time_seconds: number;
  action_time_seconds: number;
  sheriff_bullets: number;
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  discussion_time_seconds: 300,
  action_time_seconds: 6,
  sheriff_bullets: 1
};

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
  settings?: GameSettings;
  players: Player[];
  lovers?: string[]; // socket IDs of linked lovers
  turn_number?: number;
  recent_deaths?: string[];
  last_night_killed?: string | null;
  last_day_eliminated?: string | null;
  votes?: Record<string, string>; // voter_socket_id -> target_socket_id
  timer_ends_at?: number | null;
  day_ends_at?: number | null; // Absolute UTC timestamp for Day phase sync
  winner?: WinnerType;
  seer_result?: { target_socket_id: string; is_wolf: boolean; target_name?: string } | null;
  executioner_target?: string | null;
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
