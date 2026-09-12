import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import type {
  GameState,
  JoinRoomPayload,
  CreateRoomResponse,
  JoinRoomResponse,
  StartGameResponse,
  Player
} from '../types/game';

const DEFAULT_SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export type UserRoleMode = 'host' | 'player' | null;

interface GameStore {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  gameState: GameState | null;
  myPlayerName: string | null;
  lastActionError: string | null;
  activeRoleMode: UserRoleMode;

  // Selectors
  getMyPlayer: () => Player | undefined;

  // Actions
  initSocket: (serverUrl?: string) => void;
  setActiveRoleMode: (mode: UserRoleMode) => void;
  createRoom: () => Promise<CreateRoomResponse>;
  joinRoom: (payload: JoinRoomPayload) => Promise<JoinRoomResponse>;
  startGame: () => Promise<StartGameResponse>;
  submitNightAction: (targetSocketId: string) => void;
  advanceNightPriority: (priority?: number) => void;
  resolveNightToDay: () => void;
  submitVote: (targetSocketId: string) => void;
  tallyDayVotes: () => void;
  leaveRoom: () => void;
  clearErrors: () => void;
  disconnectSocket: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  socket: null,
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  gameState: null,
  myPlayerName: null,
  lastActionError: null,
  activeRoleMode: null,

  getMyPlayer: () => {
    const { gameState, socket, myPlayerName } = get();
    if (!gameState) return undefined;
    return gameState.players.find(
      (p) => (socket && p.socket_id === socket.id) || (myPlayerName && p.name === myPlayerName)
    );
  },

  setActiveRoleMode: (mode: UserRoleMode) => set({ activeRoleMode: mode }),

  initSocket: (serverUrl = DEFAULT_SERVER_URL) => {
    const currentSocket = get().socket;
    if (currentSocket && currentSocket.connected) {
      return;
    }

    if (currentSocket) {
      currentSocket.removeAllListeners();
      currentSocket.disconnect();
    }

    set({ isConnecting: true, connectionError: null });

    const newSocket: Socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      autoConnect: true
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Connected:', newSocket.id);
      set({
        isConnected: true,
        isConnecting: false,
        connectionError: null
      });
    });

    newSocket.on('disconnect', (reason) => {
      console.warn('[Socket] Disconnected:', reason);
      set({
        isConnected: false,
        isConnecting: false
      });
    });

    newSocket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
      set({
        isConnected: false,
        isConnecting: false,
        connectionError: `Connection error: ${error.message || 'Server unreachable'}`
      });
    });

    newSocket.on('error', (err: { message?: string }) => {
      console.error('[Socket] General error:', err);
      set({
        lastActionError: err?.message || 'Server error'
      });
    });

    newSocket.on('game_state_update', (newState: GameState) => {
      console.log('[Socket] game_state_update received:', newState);
      set({
        gameState: newState,
        lastActionError: null
      });
    });

    set({ socket: newSocket });
  },

  createRoom: async (): Promise<CreateRoomResponse> => {
    const { socket, isConnected } = get();

    if (!socket || !isConnected) {
      const errorMsg = 'Socket is disconnected. Please wait or retry.';
      set({ lastActionError: errorMsg });
      return { success: false, error: errorMsg };
    }

    return new Promise((resolve) => {
      socket.emit('create_room', (response: CreateRoomResponse) => {
        if (response && response.success && response.state) {
          set({
            gameState: response.state,
            activeRoleMode: 'host',
            lastActionError: null
          });
          resolve(response);
        } else {
          const error = response?.error || 'Failed to create room';
          set({ lastActionError: error });
          resolve({ success: false, error });
        }
      });
    });
  },

  joinRoom: async (payload: JoinRoomPayload): Promise<JoinRoomResponse> => {
    const { socket, isConnected } = get();

    if (!socket || !isConnected) {
      const errorMsg = 'Socket is disconnected. Please wait or retry.';
      set({ lastActionError: errorMsg });
      return { success: false, error: errorMsg };
    }

    return new Promise((resolve) => {
      socket.emit('join_room', payload, (response: JoinRoomResponse) => {
        if (response && response.success && response.state) {
          set({
            gameState: response.state,
            myPlayerName: payload.name.trim(),
            activeRoleMode: 'player',
            lastActionError: null
          });
          resolve(response);
        } else {
          const error = response?.error || 'Failed to join room';
          set({ lastActionError: error });
          resolve({ success: false, error });
        }
      });
    });
  },

  startGame: async (): Promise<StartGameResponse> => {
    const { socket, isConnected, gameState } = get();

    if (!socket || !isConnected || !gameState) {
      const errorMsg = 'Cannot start game: Socket is disconnected';
      set({ lastActionError: errorMsg });
      return { success: false, error: errorMsg };
    }

    return new Promise((resolve) => {
      socket.emit('start_game', { room_code: gameState.room_code }, (response: StartGameResponse) => {
        if (response && response.success && response.state) {
          set({
            gameState: response.state,
            lastActionError: null
          });
          resolve(response);
        } else {
          const error = response?.error || 'Failed to start game';
          set({ lastActionError: error });
          resolve({ success: false, error });
        }
      });
    });
  },

  submitNightAction: (targetSocketId: string) => {
    const { socket, gameState } = get();
    if (socket && gameState) {
      socket.emit('night_action', {
        room_code: gameState.room_code,
        target_socket_id: targetSocketId
      });
    }
  },

  advanceNightPriority: (priority?: number) => {
    const { socket, gameState } = get();
    if (socket && gameState) {
      socket.emit('advance_night_priority', { room_code: gameState.room_code, priority });
    }
  },

  resolveNightToDay: () => {
    const { socket, gameState } = get();
    if (socket && gameState) {
      socket.emit('resolve_night_to_day', { room_code: gameState.room_code });
    }
  },

  submitVote: (targetSocketId: string) => {
    const { socket, gameState } = get();
    if (socket && gameState) {
      socket.emit('submit_vote', {
        room_code: gameState.room_code,
        target_socket_id: targetSocketId
      });
    }
  },

  tallyDayVotes: () => {
    const { socket, gameState } = get();
    if (socket && gameState) {
      socket.emit('tally_day_votes', { room_code: gameState.room_code });
    }
  },

  leaveRoom: () => {
    set({
      gameState: null,
      myPlayerName: null,
      activeRoleMode: null,
      lastActionError: null
    });
  },

  clearErrors: () => {
    set({ connectionError: null, lastActionError: null });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      set({
        socket: null,
        isConnected: false,
        isConnecting: false,
        gameState: null,
        activeRoleMode: null
      });
    }
  }
}));
