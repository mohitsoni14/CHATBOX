import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { X, Send, Loader2 } from 'lucide-react';
const GEMINI_API_KEY = 'AIzaSyAeKc2DFrtbi7I07BsA2RlPZTaKMGCbIm8';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_MODEL = 'gemini-pro';
const GEMINI_API_URL = `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// Function to list available models
async function listAvailableModels() {
  try {
    const response = await fetch(`${GEMINI_API_BASE}/models?key=${GEMINI_API_KEY}`);
    const data = await response.json();
    console.log('Available models:', data);
    return data;
  } catch (error) {
    console.error('Error listing models:', error);
    throw error;
  }
}

// Call this when the component mounts to check available models
// listAvailableModels().catch(console.error);

// Simple function to call Gemini API
async function generateContent(prompt: string) {
  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini API Error:', error);
      throw new Error('Failed to generate content. Please check your API key and try again.');
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}
interface ChatbotOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const ChatbotOverlay: React.FC<ChatbotOverlayProps> = ({ isOpen, onClose }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with a welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: '1',
        text: "Hello! I'm your AI assistant. How can I help you today?",
        sender: 'ai',
        timestamp: new Date()
      }]);
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      console.log('Sending message to Gemini...');
      const aiResponse = await generateContent(input);

      const aiMessage: Message = {
        id: Date.now().toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error('Error generating response:', err);
      setError('Failed to get response. Please try again.');
    } finally {
      setIsLoading(false);
      // Scroll to bottom after message is added
      setTimeout(() => {
        contentRef.current?.scrollTo(0, contentRef.current.scrollHeight);
      }, 100);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Show overlay with animation
      gsap.to(overlayRef.current, {
        opacity: 1,
        duration: 0.3,
        display: 'flex',
        ease: 'power2.out'
      });

      // Animate content in
      gsap.fromTo(
        contentRef.current,
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.2, delay: 0.1, ease: 'power2.out' }
      );
    } else {
      // Hide overlay with animation
      gsap.to(overlayRef.current, {
        opacity: 0,
        backdropFilter: 'blur(0px)',
        duration: 0.2,
        display: 'none',
        ease: 'power2.in'
      });
    }
  }, [isOpen]);

  const handleOverlayClick = () => {
    if (overlayRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] transition-opacity duration-300"
      onClick={handleOverlayClick}
    >
      {/* Semi-transparent overlay background */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90]" />
      
      {/* Main overlay container */}
      <div 
        ref={overlayRef}
        className="fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-6xl h-[calc(100vh-2rem)] bg-white dark:bg-gray-900 rounded-xl shadow-xl overflow-hidden flex flex-col z-[100] border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxHeight: 'calc(100vh - 2rem)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">AI Assistant</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        {/* Chat content */}
        <div ref={contentRef} className="flex-1 p-4 overflow-y-auto bg-gray-50/50 dark:bg-gray-900/50">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex items-start ${message.sender === 'user' ? 'justify-end' : ''}`}>
                {message.sender === 'ai' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                    </svg>
                  </div>
                )}
                <div 
                  className={`rounded-lg p-3 max-w-[80%] shadow-sm ${
                    message.sender === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700'
                  }`}
                >
                  <p className="text-sm break-words">
                    {message.text}
                  </p>
                  <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                  </svg>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 max-w-[80%] shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                    <span className="text-sm text-gray-500">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="text-red-500 text-sm p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                {error}
              </div>
            )}
          </div>
        </div>
        
        {/* Input area */}
        <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 px-4 py-3 focus:outline-none bg-transparent text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
              disabled={isLoading}
            />
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              className={`px-4 h-full transition-colors ${
                isLoading || !input.trim()
                  ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  : 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatbotOverlay;
