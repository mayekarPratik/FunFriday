import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import type {
  Player,
  GameState,
  JoinRoomPayload,
  CreateRoomResponse,
  JoinRoomResponse
} from '../types/game';

const DEFAULT_SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export type UserRoleMode = 'host' | 'player' | null;

export interface CoreStore {
  // Global Socket & Connection
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;

  // Global Session State
  roomCode: string | null;
  players: Player[];
  myPlayerName: string | null;
  activeRoleMode: UserRoleMode;
  currentGameId: string | null;
  lastActionError: string | null;

  // Selectors
  getMyPlayer: () => Player | undefined;

  // Actions
  initSocket: (serverUrl?: string) => void;
  setConnected: (connected: boolean) => void;
  setActiveRoleMode: (mode: UserRoleMode) => void;
  setCurrentGameId: (gameId: string | null) => void;
  createRoom: () => Promise<CreateRoomResponse>;
  joinRoom: (payload: JoinRoomPayload) => Promise<JoinRoomResponse>;
  selectGame: (gameId: string) => Promise<{ success: boolean; error?: string }>;
  leaveRoom: () => void;
  clearErrors: () => void;
  disconnectSocket: () => void;
  syncFromGameState: (state: GameState) => void;
}

export const useCoreStore = create<CoreStore>((set, get) => ({
  socket: null,
  isConnected: false,
  isConnecting: false,
  connectionError: null,

  roomCode: null,
  players: [],
  myPlayerName: null,
  activeRoleMode: null,
  currentGameId: null,
  lastActionError: null,

  getMyPlayer: () => {
    const { players, socket, myPlayerName } = get();
    return players.find(
      (p) => (socket && p.socket_id === socket.id) || (myPlayerName && p.name === myPlayerName)
    );
  },

  setConnected: (connected: boolean) => set({ isConnected: connected }),
  setActiveRoleMode: (mode: UserRoleMode) => set({ activeRoleMode: mode }),
  setCurrentGameId: (gameId: string | null) => set({ currentGameId: gameId }),

  syncFromGameState: (state: GameState) => {
    if (!state) return;
    set((prev) => ({
      roomCode: state.room_code || prev.roomCode,
      players: state.players || prev.players,
      currentGameId: state.game_id !== undefined ? state.game_id : prev.currentGameId
    }));
  },

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
      get().setConnected(true);
      set({
        isConnecting: false,
        connectionError: null
      });
    });

    newSocket.on('disconnect', (reason) => {
      console.warn('[Socket] Disconnected:', reason);
      get().setConnected(false);
      set({
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

    newSocket.on('room_created', (data: { room_code: string; state: GameState }) => {
      console.log('[Socket] room_created received:', data);
      if (data?.state) {
        set({
          roomCode: data.state.room_code,
          players: data.state.players || [],
          activeRoleMode: 'host',
          currentGameId: data.state.game_id || null,
          lastActionError: null
        });
      }
    });

    newSocket.on('game_state_update', (newState: GameState) => {
      console.log('[Socket] game_state_update received in coreStore:', newState);
      if (newState) {
        set((prev) => ({
          roomCode: newState.room_code || prev.roomCode,
          players: newState.players || prev.players,
          currentGameId: newState.game_id !== undefined ? (newState.game_id || null) : prev.currentGameId,
          lastActionError: null
        }));
      }
    });

    newSocket.on('game_selected', (data: { gameId: string }) => {
      console.log('[Socket] game_selected received:', data);
      if (data?.gameId) {
        set({ currentGameId: data.gameId });
      }
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
            roomCode: response.state.room_code,
            players: response.state.players || [],
            activeRoleMode: 'host',
            currentGameId: response.state.game_id || null,
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
            roomCode: response.state.room_code,
            players: response.state.players || [],
            myPlayerName: payload.name.trim(),
            activeRoleMode: 'player',
            currentGameId: response.state.game_id || null,
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

  selectGame: async (gameId: string): Promise<{ success: boolean; error?: string }> => {
    const { socket, isConnected, roomCode } = get();

    if (!socket || !isConnected || !roomCode) {
      const errorMsg = 'Socket is disconnected or no active room';
      set({ lastActionError: errorMsg });
      return { success: false, error: errorMsg };
    }

    return new Promise((resolve) => {
      // Emit select_game with gameId payload
      socket.emit('select_game', { room_code: roomCode, gameId }, (response: any) => {
        if (response && response.error) {
          set({ lastActionError: response.error });
          resolve({ success: false, error: response.error });
        } else {
          resolve({ success: true });
        }
      });
    });
  },

  leaveRoom: () => {
    set({
      roomCode: null,
      players: [],
      myPlayerName: null,
      activeRoleMode: null,
      currentGameId: null,
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
        roomCode: null,
        players: [],
        activeRoleMode: null,
        currentGameId: null
      });
    }
  }
}));
