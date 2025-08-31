// signaling-server.js
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
const PORT = process.env.PORT || 4000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // during dev; restrict to your front-end origin in production
  },
});

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // Join a room
  socket.on('join-room', (roomId) => {
    console.log(`${socket.id} joining ${roomId}`);
    socket.join(roomId);
    // inform others
    socket.to(roomId).emit('peer-joined', { socketId: socket.id });
  });

  // Relay offers/answers/candidates
  socket.on('signal', ({ roomId, to, type, payload }) => {
    // to: socketId of intended peer (optional). If not supplied, broadcast to all in room
    if (to) {
      io.to(to).emit('signal', { from: socket.id, type, payload });
    } else {
      socket.to(roomId).emit('signal', { from: socket.id, type, payload });
    }
  });

  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    socket.to(roomId).emit('peer-left', { socketId: socket.id });
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
    // optionally inform rooms — clients should handle disconnect from their side
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Signaling server running on port ${PORT}`);
});

server.on('error', (error) => {
  console.error('Server error:', error);
});
