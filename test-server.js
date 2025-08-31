// Simple test server
console.log('🚀 Starting test WebSocket server...');

const http = require('http');
const WebSocket = require('ws');

const PORT = 4000;
const server = http.createServer();
const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws) {
  console.log('✅ Client connected');
  
  ws.on('message', function incoming(message) {
    console.log('📨 Received:', message);
    ws.send(`Echo: ${message}`);
  });

  ws.on('close', () => {
    console.log('❌ Client disconnected');
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Test WebSocket server running on port ${PORT}`);
  console.log(`📡 WebSocket URL: ws://localhost:${PORT}`);
}).on('error', (error) => {
  console.error('❌ Failed to start test server:', {
    error: error.message,
    code: error.code,
    port: PORT
  });  
  process.exit(1);
});

console.log('👂 Listening for WebSocket connections...');
