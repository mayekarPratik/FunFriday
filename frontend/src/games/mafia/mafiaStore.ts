import { create } from 'zustand';
import { useCoreStore } from '../../store/coreStore';

export type MafiaPhase =
  | 'LOBBY'
  | 'ROLE_REVEAL'
  | 'NIGHT'
  | 'DAY'
  | 'VOTING'
  | 'VOTING_REVEAL'
  | 'GAME_OVER';

export type MafiaRole = 'mafia' | 'doctor' | 'detective' | 'citizen';

export interface MafiaPlayer {
  socket_id: string;
  name: string;
  role: MafiaRole;
  is_alive: boolean;
  avatar?: string;
}

export interface RecentElimination {
  name: string;
  role?: MafiaRole;
  socket_id?: string;
  reason?: 'vote' | 'mafia' | 'disconnected';
}

export interface InvestigationResult {
  target_socket_id: string;
  target_name: string;
  targetName?: string;
  alignment?: 'Mafia' | 'Citizen';
  is_mafia: boolean;
}

export interface MafiaSettings {
  nightDuration: number;
  dayDuration: number;
}

export interface MafiaState {
  room_code: string;
  phase: MafiaPhase;
  players: MafiaPlayer[];
  timeLeft: number;
  timerEndsAt: number | null;
  settings: MafiaSettings;
  nightEvents: string[];
  recentElimination: RecentElimination | null;
  winner: 'town' | 'mafia' | null;
  votes: Record<string, string>; // voter_socket_id -> target_socket_id
  myInvestigation: InvestigationResult | null;
  selectedActionTarget: string | null;
  allActionsLocked: boolean;
  lastActionError: string | null;

  // Actions
  setMafiaState: (state: Partial<MafiaState>) => void;
  updateSettings: (settings: Partial<MafiaSettings>) => void;
  syncFromBackend: (data: any) => void;
  getMyPlayer: () => MafiaPlayer | undefined;
  startMafiaGame: (customSettings?: Partial<MafiaSettings>) => Promise<{ success: boolean; error?: string }>;
  submitNightAction: (targetSocketId: string) => void;
  investigatePlayer: (targetSocketId: string) => Promise<{ success: boolean; is_mafia?: boolean; error?: string }>;
  submitVote: (targetSocketId: string) => void;
  forceEndPhase: () => void;
  hostAdvancePhase: () => void;
  hostRestartGame: () => void;
  clearErrors: () => void;
  resetGame: () => void;
}

const DEFAULT_STATE = {
  room_code: '',
  phase: 'LOBBY' as MafiaPhase,
  players: [] as MafiaPlayer[],
  timeLeft: 0,
  timerEndsAt: null as number | null,
  settings: {
    nightDuration: 75,
    dayDuration: 300
  },
  nightEvents: [] as string[],
  recentElimination: null as RecentElimination | null,
  winner: null as 'town' | 'mafia' | null,
  votes: {} as Record<string, string>,
  myInvestigation: null as InvestigationResult | null,
  selectedActionTarget: null as string | null,
  allActionsLocked: false,
  lastActionError: null as string | null
};

export const useMafiaStore = create<MafiaState>((set, get) => ({
  ...DEFAULT_STATE,

  setMafiaState: (updates) => set((state) => ({ ...state, ...updates })),

  updateSettings: (newSettings) =>
    set((state) => ({
      settings: {
        ...state.settings,
        ...newSettings
      }
    })),

  syncFromBackend: (data: any) => {
    if (!data) return;

    set((state) => {
      const core = useCoreStore.getState();
      const updatedPlayers = data.players && data.players.length > 0
        ? data.players
        : (state.players.length > 0 ? state.players : (core.players as any[]));

      return {
        room_code: data.room_code || data.roomCode || core.roomCode || state.room_code,
        phase: data.phase || (data.mafia_state?.phase) || state.phase,
        players: updatedPlayers,
        timeLeft: data.timeLeft !== undefined ? data.timeLeft : (data.time_left !== undefined ? data.time_left : state.timeLeft),
        timerEndsAt: data.timer_ends_at !== undefined ? data.timer_ends_at : (data.timerEndsAt !== undefined ? data.timerEndsAt : state.timerEndsAt),
        settings: {
          nightDuration: data.settings?.nightDuration || state.settings.nightDuration,
          dayDuration: data.settings?.dayDuration || state.settings.dayDuration
        },
        nightEvents: data.night_events || data.nightEvents || state.nightEvents,
        recentElimination: data.recent_elimination !== undefined ? data.recent_elimination : (data.recentElimination !== undefined ? data.recentElimination : state.recentElimination),
        winner: data.winner !== undefined ? data.winner : state.winner,
        votes: data.votes || state.votes,
        allActionsLocked: false, // Reset on new phase sync
        lastActionError: null
      };
    });
  },

  getMyPlayer: () => {
    const { players } = get();
    const core = useCoreStore.getState();
    const allPlayers = players.length > 0 ? players : (core.players as any[]);
    return allPlayers.find(
      (p) => (core.socket && p.socket_id === core.socket.id) || (core.myPlayerName && p.name === core.myPlayerName)
    );
  },

  startMafiaGame: async (customSettings) => {
    const core = useCoreStore.getState();
    const roomCode = core.roomCode || get().room_code;
    const socket = core.socket;
    const currentSettings = { ...get().settings, ...customSettings };

    if (!socket || !roomCode) {
      const error = 'Cannot start game: Socket disconnected or missing room code';
      set({ lastActionError: error });
      return { success: false, error };
    }

    set({ lastActionError: null });

    return new Promise((resolve) => {
      socket.emit(
        'start_mafia_game',
        {
          room_code: roomCode,
          gameId: 'mafia',
          nightDuration: currentSettings.nightDuration,
          dayDuration: currentSettings.dayDuration,
          settings: currentSettings
        },
        (res: any) => {
          if (res && res.success) {
            if (res.state) get().syncFromBackend(res.state);
            set({ lastActionError: null });
            resolve({ success: true });
          } else {
            const error = res?.error || 'Failed to start Mafia game';
            set({ lastActionError: error });
            resolve({ success: false, error });
          }
        }
      );
    });
  },

  submitNightAction: (targetSocketId: string) => {
    const core = useCoreStore.getState();
    const socket = core.socket;
    const roomCode = core.roomCode || get().room_code;

    if (!socket || !roomCode) return;

    set({ selectedActionTarget: targetSocketId });

    socket.emit('mafia_night_action', {
      room_code: roomCode,
      target_socket_id: targetSocketId
    }, (res: any) => {
      if (!res?.success) {
        set({ lastActionError: res?.error || 'Night action failed' });
      }
    });
  },

  investigatePlayer: async (targetSocketId: string) => {
    const core = useCoreStore.getState();
    const socket = core.socket;
    const roomCode = core.roomCode || get().room_code;

    if (!socket || !roomCode) {
      return { success: false, error: 'Socket not connected' };
    }

    return new Promise((resolve) => {
      socket.emit('mafia_investigate', {
        room_code: roomCode,
        target_socket_id: targetSocketId
      }, (res: any) => {
        if (res && res.success) {
          const invResult: InvestigationResult = {
            target_socket_id: res.target_socket_id || targetSocketId,
            target_name: res.targetName || res.target_name,
            targetName: res.targetName || res.target_name,
            alignment: res.alignment || (res.is_mafia ? 'Mafia' : 'Citizen'),
            is_mafia: res.is_mafia ?? (res.alignment === 'Mafia')
          };
          set({ myInvestigation: invResult, selectedActionTarget: targetSocketId });
          resolve({ success: true, is_mafia: invResult.is_mafia });
        } else {
          const error = res?.error || 'Failed to investigate';
          set({ lastActionError: error });
          resolve({ success: false, error });
        }
      });
    });
  },

  submitVote: (targetSocketId: string) => {
    const core = useCoreStore.getState();
    const socket = core.socket;
    const roomCode = core.roomCode || get().room_code;

    if (!socket || !roomCode) return;

    set({ selectedActionTarget: targetSocketId });

    socket.emit('mafia_submit_vote', {
      room_code: roomCode,
      target_socket_id: targetSocketId
    }, (res: any) => {
      if (!res?.success) {
        set({ lastActionError: res?.error || 'Vote failed' });
      }
    });
  },

  forceEndPhase: () => {
    const core = useCoreStore.getState();
    const socket = core.socket;
    const roomCode = core.roomCode || get().room_code;
    if (!socket || !roomCode) return;

    socket.emit('force_mafia_phase_end', { room_code: roomCode });
  },

  hostAdvancePhase: () => {
    const core = useCoreStore.getState();
    const socket = core.socket;
    const roomCode = core.roomCode || get().room_code;
    if (!socket || !roomCode) return;

    socket.emit('force_mafia_phase_end', { room_code: roomCode });
  },

  hostRestartGame: () => {
    const core = useCoreStore.getState();
    const socket = core.socket;
    const roomCode = core.roomCode || get().room_code;
    if (!socket || !roomCode) return;

    socket.emit('return_to_lobby', { room_code: roomCode, roomCode });
  },

  clearErrors: () => set({ lastActionError: null }),

  resetGame: () => set({ ...DEFAULT_STATE })
}));
