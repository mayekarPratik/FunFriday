import Redis from 'ioredis';
import { GameState } from '../types/game';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
export const ROOM_TTL_SECONDS = 7200; // 2 hours

let isRedisConnected = false;
const inMemoryStore = new Map<string, { state: string; expiresAt: number }>();

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 1,
  retryStrategy(times) {
    if (times > 3) {
      // Stop retrying aggressively if Redis isn't installed locally
      return null;
    }
    return 1000;
  },
  lazyConnect: true,
  enableOfflineQueue: false
});

redis.on('connect', () => {
  isRedisConnected = true;
  console.log('[Redis] Connected to Redis instance successfully.');
});

redis.on('error', (err) => {
  if (isRedisConnected) {
    console.warn('[Redis] Connection lost:', err.message);
  }
  isRedisConnected = false;
});

export const getRoomKey = (roomCode: string): string => `lobby:${roomCode.toUpperCase()}`;

export const generateRoomCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export async function createUniqueRoomCode(): Promise<string> {
  let attempts = 0;
  while (attempts < 15) {
    const code = generateRoomCode();
    const key = getRoomKey(code);
    
    if (isRedisConnected) {
      try {
        const exists = await redis.exists(key);
        if (!exists) return code;
      } catch {
        // Fallback to in-memory check
        if (!inMemoryStore.has(key)) return code;
      }
    } else {
      if (!inMemoryStore.has(key)) return code;
    }
    attempts++;
  }
  throw new Error('Unable to generate unique room code. Please try again.');
}

export async function saveGameState(state: GameState, ttlSeconds: number = ROOM_TTL_SECONDS): Promise<void> {
  const key = getRoomKey(state.room_code);
  const serialized = JSON.stringify(state);

  // Save to in-memory fallback
  inMemoryStore.set(key, {
    state: serialized,
    expiresAt: Date.now() + ttlSeconds * 1000
  });

  // Also save to Redis if connected
  if (isRedisConnected) {
    try {
      await redis.set(key, serialized, 'EX', ttlSeconds);
    } catch (err: any) {
      console.warn('[Redis] Failed to save state to Redis, using in-memory store:', err.message);
    }
  }
}

export async function getGameState(roomCode: string): Promise<GameState | null> {
  const key = getRoomKey(roomCode);

  // Try Redis first if connected
  if (isRedisConnected) {
    try {
      const data = await redis.get(key);
      if (data) {
        return JSON.parse(data) as GameState;
      }
    } catch (err: any) {
      console.warn('[Redis] Read failed, checking in-memory store:', err.message);
    }
  }

  // Check in-memory store
  const cached = inMemoryStore.get(key);
  if (cached) {
    if (Date.now() > cached.expiresAt) {
      inMemoryStore.delete(key);
      return null;
    }
    try {
      return JSON.parse(cached.state) as GameState;
    } catch {
      return null;
    }
  }

  return null;
}

export async function deleteGameState(roomCode: string): Promise<void> {
  const key = getRoomKey(roomCode);
  inMemoryStore.delete(key);

  if (isRedisConnected) {
    try {
      await redis.del(key);
    } catch (err: any) {
      console.warn('[Redis] Failed to delete key:', err.message);
    }
  }
}
