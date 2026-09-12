# Social Deduction Engine - Architecture Blueprint

## Tech Stack
*   **Frontend:** React (Vite), TypeScript, Tailwind CSS, Zustand (State Management).
*   **Backend:** Node.js, Express, Socket.io (WebSockets).
*   **Database:** Redis (via `ioredis`) for ephemeral game state.

## System Design (The "Jackbox" Model)
*   **Host Client:** One device (usually a laptop/TV) creates the room. It acts as the public scoreboard, narrator, and timer. It does NOT hold secret information.
*   **Player Clients:** Mobile browsers. They act purely as secret controllers. 
*   **State Authority:** The Node backend is the absolute source of truth. Frontends merely render the JSON state broadcasted by Socket.io.

## Game State JSON Structure (Redis)
`Key: lobby:<4-letter-code> | TTL: 7200s`
```json
{
  "room_code": "ABCD",
  "phase": "lobby", // lobby, night, day, game_over
  "host_socket_id": "xyz123",
  "active_role_priority": 0,
  "players": [
    { "socket_id": "abc", "name": "Sarah", "role": "wolf", "is_alive": true }
  ]
}