// File: server.js

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables from .env file
dotenv.config({ path: '.env' });

// Debug log for environment variables
console.log('Environment Variables:', {
  VITE_GOOGLE_API_KEY: process.env.VITE_GOOGLE_API_KEY ? '***' + process.env.VITE_GOOGLE_API_KEY.slice(-4) : 'Not set',
  NODE_ENV: process.env.NODE_ENV || 'development'
});

const app = express();
const port = 3001; // We'll run the backend on a different port

// Middleware
app.use(cors()); // Allow requests from your frontend
app.use(express.json()); // Allow the server to read JSON from requests

// --- Gemini API Setup ---
// Initialize Gemini API with the API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.VITE_GOOGLE_API_KEY);

// Log environment configuration
console.log('Server Environment:', {
  node_env: process.env.NODE_ENV || 'development',
  api_key_configured: process.env.VITE_GOOGLE_API_KEY ? 'Yes' : 'No',
  api_key_ending: process.env.VITE_GOOGLE_API_KEY ? '***' + process.env.VITE_GOOGLE_API_KEY.slice(-4) : 'Not set'
});

// --- API Endpoint ---
app.post('/api/chat', async (req, res) => {
  try {
    const { prompt } = req.body;
    console.log('Received prompt:', prompt); // We can still log!

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
      requestBody: req.body
    });
    res.status(500).json({ 
      error: 'Failed to generate content',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.listen(port, () => {
  console.log(`✅ Backend server running at http://localhost:${port}`);
});