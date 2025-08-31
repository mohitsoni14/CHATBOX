// signaling-server.js - Using CommonJS
console.log('🚀 Starting signaling server...');

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Log environment variables for debugging
console.log('🔧 Environment Variables:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT
});

const app = express();
app.use(cors());
const PORT = process.env.PORT || 4000;

// Create HTTP server
const server = http.createServer(app);

// Configure CORS for Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*', // during dev; restrict to your front-end origin in production
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Basic route for health check
app.get('/', (req, res) => {
  res.send('Signaling server is running');
});

io.on('connection', (socket) => {
  console.log('🔌 New connection:', socket.id);

  // Join a room
  socket.on('join-room', (roomId) => {
    console.log(`👥 ${socket.id} joining room: ${roomId}`);
    socket.join(roomId);
    // Inform others in the room
    socket.to(roomId).emit('peer-joined', { socketId: socket.id });
  });

  // Relay offers/answers/candidates
  socket.on('signal', ({ roomId, to, type, payload }) => {
    console.log(`📡 Signal from ${socket.id} to ${to || 'all in room ' + roomId}:`, { type });
    
    // to: socketId of intended peer (optional). If not supplied, broadcast to all in room
    if (to) {
      io.to(to).emit('signal', { from: socket.id, type, payload });
    } else {
      socket.to(roomId).emit('signal', { from: socket.id, type, payload });
    }
  });

  socket.on('leave-room', (roomId) => {
    console.log(`🚪 ${socket.id} leaving room: ${roomId}`);
    socket.leave(roomId);
    socket.to(roomId).emit('peer-left', { socketId: socket.id });
  });

  socket.on('disconnect', (reason) => {
    console.log(`❌ ${socket.id} disconnected:`, reason);
  });

  // Error handling
  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });
});

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Signaling server running on port ${PORT}`);  
  console.log(`📡 WebSocket URL: ws://localhost:${PORT}`);
  console.log(`🌐 HTTP URL: http://localhost:${PORT}`);
}).on('error', (error) => {
  console.error('❌ Failed to start signaling server:', {
    error: error.message,
    code: error.code,
    port: PORT,
    address: error.address || '0.0.0.0'
  });
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('⚠️ Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
});

console.log('👂 Listening for connections...');