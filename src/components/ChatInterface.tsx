import React, { useState, useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import InputArea from './InputArea';
import GamesPanel from './GamesPanel';
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

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !sessionId || !userCode || !username) return;

    const message = {
      id: Date.now().toString(),
      text,
      sender: userCode,
      senderName: username,
      timestamp: Date.now(),
      type: 'text' as const,
    };

    try {
      await sendMessage(sessionId, message);
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
          
          <ChatArea 
            messages={messages} 
            currentUser={userCode} 
            username={username} 
          />
          
          <InputArea 
            onSendMessage={handleSendMessage} 
            onOpenChatbot={() => setIsChatbotOpen(true)}
            isConnected={isConnected}
          />
        </div>

        <GamesPanel
          isOpen={isGamesOpen}
          onClose={() => setIsGamesOpen(false)}
        />
      </div>
    </div>
  );
};

export default ChatInterface;