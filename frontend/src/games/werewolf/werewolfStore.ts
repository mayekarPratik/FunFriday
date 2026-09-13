import { create } from 'zustand';
import type {
  GameState,
  RoleSettings,
  GameSettings,
  Player,
  StartGameResponse
} from '../../types/game';
import { DEFAULT_ROLE_SETTINGS, DEFAULT_GAME_SETTINGS } from '../../types/game';
import { useCoreStore } from '../../store/coreStore';

export interface WerewolfStore {
  gameState: GameState | null;
  role_settings: RoleSettings;
  settings: GameSettings;
  lastActionError: string | null;

  // Selectors
  getMyPlayer: () => Player | undefined;

  // Actions
  setGameState: (state: GameState | null) => void;
  syncFromGameState: (state: GameState) => void;
  startGame: () => Promise<StartGameResponse>;
  updateRoleSettings: (settings: RoleSettings) => void;
  updateRoomSettings: (settings: GameSettings) => void;
  submitNightAction: (payloadOrTarget: string | { target_socket_id?: string; heal_target?: string | null; poison_target?: string | null; [key: string]: any }) => void;
  investigatePlayer: (targetSocketId: string) => Promise<{ success: boolean; is_wolf?: boolean; error?: string }>;
  advanceNightPriority: (priority?: number) => void;
  resolveNightToDay: () => void;
  submitVote: (targetSocketId: string) => void;
  tallyDayVotes: () => void;
  hostAdvancePhase: () => void;
  hostRestartGame: () => void;
  returnToLobby: () => void;
  leaveGame: () => void;
  resetGame: () => void;
  clearErrors: () => void;
}

export const useWerewolfStore = create<WerewolfStore>((set, get) => ({
  gameState: null,
  role_settings: { ...DEFAULT_ROLE_SETTINGS },
  settings: { ...DEFAULT_GAME_SETTINGS },
  lastActionError: null,

  getMyPlayer: () => {
    const { gameState } = get();
    const core = useCoreStore.getState();
    if (!gameState) return undefined;
    return gameState.players.find(
      (p) => (core.socket && p.socket_id === core.socket.id) || (core.myPlayerName && p.name === core.myPlayerName)
    );
  },

  setGameState: (state: GameState | null) => set({ gameState: state }),

  syncFromGameState: (state: GameState) => {
    if (!state) return;
    set({
      gameState: state,
      role_settings: state.role_settings || get().role_settings,
      settings: state.settings || get().settings,
      lastActionError: null
    });
  },

  startGame: async (): Promise<StartGameResponse> => {
    const core = useCoreStore.getState();
    const { gameState } = get();
    const socket = core.socket;
    const roomCode = core.roomCode || gameState?.room_code;

    if (!socket || !core.isConnected || !roomCode) {
      const errorMsg = 'Cannot start game: Socket is disconnected';
      set({ lastActionError: errorMsg });
      return { success: false, error: errorMsg };
    }

    return new Promise((resolve) => {
      socket.emit('start_game', { room_code: roomCode, gameId: 'werewolf' }, (response: StartGameResponse) => {
        if (response && response.success && response.state) {
          set({
            gameState: response.state,
            lastActionError: null
          });
          core.syncFromGameState(response.state);
          resolve(response);
        } else {
          const error = response?.error || 'Failed to start game';
          set({ lastActionError: error });
          resolve({ success: false, error });
        }
      });
    });
  },

  updateRoleSettings: (settings: RoleSettings) => {
    const core = useCoreStore.getState();
    const { gameState } = get();
    set({ role_settings: settings });
    if (gameState) {
      set({
        gameState: {
          ...gameState,
          role_settings: settings
        }
      });
    }
    const roomCode = core.roomCode || gameState?.room_code;
    if (core.socket && roomCode) {
      core.socket.emit('update_settings', {
        room_code: roomCode,
        role_settings: settings
      });
    }
  },

  updateRoomSettings: (settings: GameSettings) => {
    const core = useCoreStore.getState();
    const { gameState } = get();
    set({ settings });
    if (gameState) {
      set({
        gameState: {
          ...gameState,
          settings
        }
      });
    }
    const roomCode = core.roomCode || gameState?.room_code;
    if (core.socket && roomCode) {
      core.socket.emit('update_room_settings', {
        room_code: roomCode,
        settings
      });
    }
  },

  submitNightAction: (payloadOrTarget: string | { target_socket_id?: string; heal_target?: string | null; poison_target?: string | null; [key: string]: any }) => {
    const core = useCoreStore.getState();
    const { gameState } = get();
    const roomCode = core.roomCode || gameState?.room_code;
    if (core.socket && roomCode) {
      const payload = typeof payloadOrTarget === 'string'
        ? { room_code: roomCode, target_socket_id: payloadOrTarget }
        : { room_code: roomCode, ...payloadOrTarget };
      core.socket.emit('submit_action', payload);
      core.socket.emit('night_action', payload);
    }
  },

  investigatePlayer: async (targetSocketId: string): Promise<{ success: boolean; is_wolf?: boolean; error?: string }> => {
    const core = useCoreStore.getState();
    const { gameState } = get();
    const roomCode = core.roomCode || gameState?.room_code;
    if (!core.socket || !roomCode) {
      return { success: false, error: 'Socket not connected' };
    }
    return new Promise((resolve) => {
      core.socket!.emit(
        'investigate_player',
        { room_code: roomCode, target_socket_id: targetSocketId },
        (response: { success: boolean; is_wolf?: boolean; error?: string }) => {
          if (response?.success) {
            resolve(response);
          } else {
            resolve({ success: false, error: response?.error || 'Investigation failed' });
          }
        }
      );
    });
  },

  advanceNightPriority: (priority?: number) => {
    const core = useCoreStore.getState();
    const { gameState } = get();
    const roomCode = core.roomCode || gameState?.room_code;
    if (core.socket && roomCode) {
      core.socket.emit('advance_night_priority', { room_code: roomCode, priority });
    }
  },

  resolveNightToDay: () => {
    const core = useCoreStore.getState();
    const { gameState } = get();
    const roomCode = core.roomCode || gameState?.room_code;
    if (core.socket && roomCode) {
      core.socket.emit('resolve_night_to_day', { room_code: roomCode });
    }
  },

  submitVote: (targetSocketId: string) => {
    const core = useCoreStore.getState();
    const { gameState } = get();
    const roomCode = core.roomCode || gameState?.room_code;
    if (core.socket && roomCode) {
      core.socket.emit('submit_vote', {
        room_code: roomCode,
        target_socket_id: targetSocketId
      });
    }
  },

  tallyDayVotes: () => {
    const core = useCoreStore.getState();
    const { gameState } = get();
    const roomCode = core.roomCode || gameState?.room_code;
    if (core.socket && roomCode) {
      core.socket.emit('tally_day_votes', { room_code: roomCode });
    }
  },

  hostAdvancePhase: () => {
    const core = useCoreStore.getState();
    const { gameState } = get();
    const roomCode = core.roomCode || gameState?.room_code;
    if (core.socket && roomCode) {
      core.socket.emit('host_advance_phase', { room_code: roomCode });
    }
  },

  hostRestartGame: () => {
    const core = useCoreStore.getState();
    const { gameState } = get();
    const roomCode = core.roomCode || gameState?.room_code;
    if (core.socket && roomCode) {
      core.socket.emit('host_restart_game', { room_code: roomCode, roomCode });
    }
  },

  returnToLobby: () => {
    const core = useCoreStore.getState();
    const { gameState } = get();
    const roomCode = core.roomCode || gameState?.room_code;
    if (core.socket && roomCode) {
      core.socket.emit('return_to_lobby', { room_code: roomCode, roomCode });
    }
  },

  leaveGame: () => {
    set({
      gameState: null,
      lastActionError: null
    });
  },

  resetGame: () => {
    set({
      gameState: null,
      role_settings: { ...DEFAULT_ROLE_SETTINGS },
      settings: { ...DEFAULT_GAME_SETTINGS },
      lastActionError: null
    });
  },

  clearErrors: () => {
    set({ lastActionError: null });
  }
}));
