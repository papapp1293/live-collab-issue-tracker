// server/src/sockets/issueSocket.js

function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log('A user connected');

    // socket event handlers here

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });
}

module.exports = { setupSocket };
