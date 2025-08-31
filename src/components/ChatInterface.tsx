import React, { useState, useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import InputArea from './InputArea';
import GamesPanel from './GamesPanel';
import TicTacToe from './games/TicTacToe';
import MenuDropdown from './MenuDropdown';
import ChatbotOverlay from './ChatbotOverlay';
import { useParams } from 'react-router-dom';
import { sendMessage, subscribeToMessages, joinSession } from '../services/chatService';

interface ChatInterfaceProps {
  onLogout: () => void;
  initialUsername?: string;
}

interface Message {
  id: string;
  text: string;
  sender: string;
  senderName?: string;
  timestamp: number | Date;
  type: 'text' | 'image' | 'file';
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onLogout, initialUsername = '' }) => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [userCode] = React.useState(() => 
    Math.random().toString(36).substring(2, 12).toUpperCase()
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isGamesOpen, setIsGamesOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [username, setUsername] = useState(initialUsername);
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Set up entrance animation and initial state
  useEffect(() => {
    // Entrance animation
    gsap.fromTo(containerRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }
    );

    // Set the username from initialUsername prop if available
    console.log('ChatInterface - initialUsername:', initialUsername);
    if (initialUsername) {
      console.log('Setting username from initialUsername prop:', initialUsername);
      setUsername(initialUsername);
      localStorage.setItem('chat_username', initialUsername);
      return;
    }

    // Otherwise, try to get from localStorage
    const storedUsername = localStorage.getItem('chat_username');
    console.log('Stored username from localStorage:', storedUsername);
    if (storedUsername) {
      console.log('Setting username from localStorage:', storedUsername);
      setUsername(storedUsername);
    } else {
      // If no username is found, generate a random one
      const randomUsername = `User${Math.floor(1000 + Math.random() * 9000)}`;
      console.log('No username found, generating random one:', randomUsername);
      setUsername(randomUsername);
      localStorage.setItem('chat_username', randomUsername);
    }
  }, []);

  // Handle theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Join session and subscribe to messages
  useEffect(() => {
    if (!sessionId || !userCode || !username) return;

    let unsubscribe: (() => void) | undefined;

    const joinChat = async () => {
      try {
        await joinSession(sessionId, userCode, username);
        
        // Subscribe to messages
        const unsubscribeFn = subscribeToMessages(sessionId, (newMessages) => {
          setMessages(prevMessages => {
            // Filter out any duplicate messages
            const uniqueMessages = newMessages.filter(
              newMsg => !prevMessages.some(msg => msg.id === newMsg.id)
            );
            return [...prevMessages, ...uniqueMessages];
          });
        });
        
        // Store the unsubscribe function
        unsubscribe = unsubscribeFn;
        setIsConnected(true);
      } catch (error) {
        console.error('Error joining session:', error);
        setIsConnected(false);
      }
    };

    joinChat();

    // Cleanup function to unsubscribe when component unmounts or session changes
    return () => {
      if (unsubscribe) {
        unsubscribe();
        setIsConnected(false);
      }
    };
  }, [sessionId, userCode, username]);

  const handleThemeToggle = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  const handleSendMessage = useCallback(async (message: Message) => {
    if (!sessionId || !userCode || !username) return;

    const messageToSend = {
      ...message,
      id: message.id || Date.now().toString(),
      sender: userCode,
      senderName: username,
      timestamp: message.timestamp || Date.now(),
      type: message.type || 'text',
    };

    try {
      await sendMessage(sessionId, messageToSend);
    } catch (error) {
      console.error('Error sending message:', error);
      // TODO: Show error toast to user
    }
  }, [sessionId, userCode, username]);

  return (
    <div ref={containerRef} className={`chat-interface ${isDarkMode ? 'dark' : 'light'}`}>
      <Navbar
        onLogout={onLogout}
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
        onGamesToggle={() => setIsGamesOpen(!isGamesOpen)}
        isDarkMode={isDarkMode}
        onThemeToggle={handleThemeToggle}
        onOpenChatbot={() => setIsChatbotOpen(true)}
        setIsGamesOpen={setIsGamesOpen}
        setIsMenuOpen={setIsMenuOpen}
        username={username}
      />
      
      <MenuDropdown
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <div className="chat-body relative">
        <ChatbotOverlay 
          isOpen={isChatbotOpen}
          onClose={() => setIsChatbotOpen(false)}
        />
        
        {sessionId && <Sidebar sessionId={sessionId} />}
        
        <div className="chat-main">
          {!isConnected && (
            <div className="connection-status">
              Connecting to chat...
            </div>
          )}
          
          <div className={`flex-1 flex flex-col h-full relative ${activeGame ? 'blur-sm' : ''}`}>
            <ChatArea 
              messages={messages} 
              currentUser={userCode} 
              username={username} 
            />
          </div>

          {activeGame === 'tictactoe' && (
            <div className="fixed inset-0 flex items-center justify-center z-50">
              <div 
                className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
                onClick={() => setActiveGame(null)}
              />
              <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-md mx-4 border-2 border-blue-400">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">Tic Tac Toe</h3>
                  <button 
                    onClick={() => setActiveGame(null)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
                    aria-label="Close game"
                  >
                    &times;
                  </button>
                </div>
                <TicTacToe />
              </div>
            </div>
          )}
          
          <InputArea 
            onSendMessage={handleSendMessage} 
            onOpenChatbot={() => setIsChatbotOpen(true)}
            isConnected={isConnected}
          />
        </div>

        <GamesPanel 
          isOpen={isGamesOpen} 
          onClose={() => setIsGamesOpen(false)}
          onGameSelect={setActiveGame}
        />
      </div>
    </div>
  );
};

export default ChatInterface;