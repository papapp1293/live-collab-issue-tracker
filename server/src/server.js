// server/src/server.js
// Main entry point for the Node.js backend. Starts the server and WebSocket layer.

const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const dotenv = require('dotenv');
const { setupSocket } = require('./sockets/issueSocket');
const setupDatabase = require('./utils/setUpDb');

dotenv.config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  await setupDatabase();

  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  setupSocket(io);

  server.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
}

startServer();
