import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { redis } from './services/redis';
import { registerSocketHandlers } from './socket/handlers';

dotenv.config();

const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || '*';

const app = express();
app.use(cors());
app.use(express.json());

// Health & status endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST']
  }
});

// Register Socket.io events
registerSocketHandlers(io);

async function startServer() {
  try {
    // Attempt Redis connection
    await redis.connect().catch((err) => {
      console.warn('[Redis] Note: Redis not reachable yet or background connecting:', err.message);
    });

    server.listen(PORT, () => {
      console.log(`🚀 Social Deduction Engine Backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export { app, server, io };
