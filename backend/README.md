# FunFriday - Social Deduction Engine Backend

This is the real-time game backend powered by Node.js, Express, Socket.io, TypeScript, and Redis.

## Features
- **Jackbox Model State Authority**: Server manages ephemeral room state via Redis (`ioredis`).
- **Room Lifecycle**:
  - `create_room`: Generates a unique 4-letter room code, initializes Redis game state with a 2-hour TTL (`7200s`), and assigns `host_socket_id`.
  - `join_room`: Validates room code, registers the player with `{ socket_id, name, role: '', is_alive: true }`, joins the socket channel `lobby:<CODE>`, and updates Redis.
  - `game_state_update`: Emitted to all socket clients in the room whenever state changes.

## Scripts
- `npm run dev`: Start local development server with hot-reload (`ts-node-dev`).
- `npm run build`: Compile TypeScript into `dist/`.
- `npm start`: Run compiled production server.

## Environment Variables
Create `.env` based on `.env.example`:
```env
PORT=3001
REDIS_URL=redis://127.0.0.1:6379
CLIENT_URL=*
```
