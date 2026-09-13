export type GamePhase = 'lobby' | 'night' | 'day' | 'game_over' | 'morning_recap' | 'dusk_recap';

export type RoleType =
  | 'cupid'
  | 'doctor'
  | 'wolf'
  | 'witch'
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
  seer: 5,
  serial_killer: 6,
  executioner: 7,
  jester: 8,
  villager: 9,
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

export interface NightActionPayload {
  target_socket_id?: string;
  target_socket_ids?: string[];
  action_type?: 'kill' | 'heal' | 'poison' | 'inspect' | 'link';
  heal_target?: string | null;
  poison_target?: string | null;
  sender_socket_id?: string;
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

export type WinnerType = 'wolves' | 'villagers' | 'town' | 'jester' | 'executioner' | 'lovers' | null;

export interface GameSettings {
  discussion_time_seconds: number;
  action_time_seconds: number;
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  discussion_time_seconds: 300,
  action_time_seconds: 6
};

export interface GameState {
  room_code: string;
  phase: GamePhase;
  host_socket_id: string;
  active_role_priority: number;
  active_role?: RoleType | null;
  night_queue?: RoleType[];
  night_actions?: Record<string, any>;
  role_states?: RoleStates;
  role_settings?: RoleSettings;
  settings?: GameSettings;
  players: Player[];
  lovers?: string[];
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
