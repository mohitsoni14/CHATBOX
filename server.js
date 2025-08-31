// File: server.js

const express = require('express');
const cors = require('cors');
const Pusher = require('pusher');
const path = require('path');
require('dotenv').config(); // Loads .env.local variables
const { GoogleGenerativeAI } = require('@google/generative-ai');

// No need to set __dirname as it's already available in CommonJS

const app = express();
const port = process.env.PORT || 4000;

// Initialize Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.VITE_PUSHER_APP_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.VITE_PUSHER_CLUSTER || 'mt1',
  useTLS: true,
});

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Pusher authentication endpoint
app.post('/api/pusher/auth', (req, res) => {
  const socketId = req.body.socket_id;
  const channel = req.body.channel_name;

  if (!socketId || !channel) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const authResponse = pusher.authenticateUser(socketId, {
      id: `user-${socketId}`,
      user_info: {
        name: 'Anonymous User'
      }
    });
    res.status(200).json(authResponse);
  } catch (error) {
    console.error('Pusher auth error:', error);
    res.status(403).json({ error: 'Authentication failed' });
  }
});

// WebRTC signaling endpoint
app.post('/api/pusher/send', (req, res) => {
  const { channel, event, data } = req.body;

  if (!channel || !event || !data) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    pusher.trigger(channel, event, data);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sending Pusher message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Chat API endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { prompt } = req.body;
    console.log('Received prompt:', prompt);

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({ text });
  } catch (error) {
    console.error('Error in /api/chat:', {
      message: error.message,
      stack: error.stack,
      requestBody: req.body,
      env: {
        hasApiKey: !!process.env.GOOGLE_API_KEY,
        apiKeyLength: process.env.GOOGLE_API_KEY ? process.env.GOOGLE_API_KEY.length : 0
      }
    });
    res.status(500).json({ 
      error: 'Failed to generate content',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Serve the frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});