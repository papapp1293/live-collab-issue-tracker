// server/src/sockets/issueSocket.js

const authenticateSocket = (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }

  const { verifyToken } = require('../utils/jwt');
  const payload = verifyToken(token);

  if (!payload) {
    return next(new Error('Invalid token'));
  }

  socket.userId = payload.id;
  socket.userEmail = payload.email;
  next();
};

function setupSocket(io) {
  // Authenticate socket connections
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.userEmail} (ID: ${socket.userId})`);

    // Join user to their personal room for targeted notifications
    socket.join(`user-${socket.userId}`);

    // Join general issues room for broadcasting issue updates
    socket.join('issues');

    // Handle issue creation
    socket.on('issue:created', (issueData) => {
      console.log('📝 New issue created:', issueData.title);
      // Broadcast to all users in issues room
      socket.to('issues').emit('issue:created', {
        ...issueData,
        createdBy: socket.userEmail
      });
    });

    // Handle issue updates
    socket.on('issue:updated', (issueData) => {
      console.log('📝 Issue updated:', issueData.id);
      // Broadcast to all users in issues room
      socket.to('issues').emit('issue:updated', {
        ...issueData,
        updatedBy: socket.userEmail
      });
    });

    // Handle issue deletion
    socket.on('issue:deleted', (issueId) => {
      console.log('🗑️ Issue deleted:', issueId);
      // Broadcast to all users in issues room
      socket.to('issues').emit('issue:deleted', {
        id: issueId,
        deletedBy: socket.userEmail
      });
    });

    // Handle user typing indicators for issue editing
    socket.on('issue:typing', ({ issueId, isTyping }) => {
      socket.to('issues').emit('issue:typing', {
        issueId,
        userId: socket.userId,
        userEmail: socket.userEmail,
        isTyping
      });
    });

    // Handle user presence
    socket.on('user:online', () => {
      socket.to('issues').emit('user:online', {
        userId: socket.userId,
        userEmail: socket.userEmail
      });
    });

    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.userEmail}`);
      // Notify others that user went offline
      socket.to('issues').emit('user:offline', {
        userId: socket.userId,
        userEmail: socket.userEmail
      });
    });
  });
}

module.exports = { setupSocket };
