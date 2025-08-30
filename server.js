// File: server.js

import express from 'express';
import cors from 'cors';
import 'dotenv/config'; // Loads .env.local variables
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const port = 3001; // We'll run the backend on a different port

// Middleware
app.use(cors()); // Allow requests from your frontend
app.use(express.json()); // Allow the server to read JSON from requests

// --- Gemini API Setup ---
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

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
    console.error('Error in /api/chat:', error.message);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

app.listen(port, () => {
  console.log(`✅ Backend server running at http://localhost:${port}`);
  console.log('API Key Loaded:', process.env.GOOGLE_API_KEY ? 'Yes' : 'No');
});