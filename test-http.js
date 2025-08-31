// Simple HTTP server test
const http = require('http');

const PORT = 3002;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Test HTTP server is running!');});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ Test HTTP server running on http://127.0.0.1:${PORT}`);
}).on('error', (error) => {
  console.error('❌ Failed to start HTTP server:', error.message);
  process.exit(1);
});
