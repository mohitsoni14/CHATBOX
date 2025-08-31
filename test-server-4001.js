// Test server on port 4001
console.log('🚀 Starting test WebSocket server on port 4001...');

const http = require('http');
const WebSocket = require('ws');

const PORT = 4001;
const server = http.createServer();
const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws) {
  console.log('✅ Client connected');
  ws.send('Connected to test server on port 4001');
  
  ws.on('message', function incoming(message) {
    console.log('📨 Received:', message.toString());
    ws.send(`Echo: ${message}`);
  });

  ws.on('close', () => {
    console.log('❌ Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ Test WebSocket server running on ws://127.0.0.1:${PORT}`);
}).on('error', (error) => {
  console.error('❌ Failed to start test server:', error.message);
  console.error('Error details:', {
    code: error.code,
    port: PORT,
    address: '127.0.0.1'
  });
  process.exit(1);
});

console.log('👂 Listening for WebSocket connections...');
