const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('./config/env');

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('Missing token'));
      const payload = jwt.verify(token, jwtSecret);
      socket.user = { id: payload.sub };
      socket.join(`user:${payload.sub}`);
      return next();
    } catch (e) {
      return next(new Error('Auth failed'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('disconnect', () => {});
  });
}

function emitToUser(userId, event, payload) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
}

module.exports = { initSocket, emitToUser };

