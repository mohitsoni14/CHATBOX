import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import InputArea from './InputArea';
import GamesPanel from './GamesPanel';
import MenuDropdown from './MenuDropdown';
import ChatbotOverlay from './ChatbotOverlay';
import { useNavigate, useParams } from 'react-router-dom';

interface ChatInterfaceProps {
  onLogout: () => void;
}

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file';
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onLogout }) => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [userCode] = React.useState(() => 
    Math.random().toString(36).substring(2, 12).toUpperCase()
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isGamesOpen, setIsGamesOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [username, setUsername] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Entrance animation
    gsap.fromTo(containerRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }
    );

    // Get username from localStorage or generate a random one
    const storedUsername = localStorage.getItem('chat_username');
    if (storedUsername) {
      setUsername(storedUsername);
    } else {
      const randomUsername = `User${Math.floor(1000 + Math.random() * 9000)}`;
      setUsername(randomUsername);
      localStorage.setItem('chat_username', randomUsername);
    }

    // Initial welcome message
    const welcomeMessage: Message = {
      id: '1',
      text: 'Welcome to the chat!',
      sender: 'system',
      timestamp: new Date(),
      type: 'text'
    };
    setMessages([welcomeMessage]);

    // Apply theme to document
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleSendMessage = (text: string, type: 'text' | 'image' | 'file' = 'text') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: userCode,
      timestamp: new Date(),
      type
    };
    setMessages(prev => [...prev, newMessage]);
  };

  return (
    <div ref={containerRef} className={`chat-interface ${isDarkMode ? 'dark' : 'light'}`}>
      <Navbar
        onLogout={onLogout}
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
        onGamesToggle={() => setIsGamesOpen(!isGamesOpen)}
        isDarkMode={isDarkMode}
        onThemeToggle={handleThemeToggle}
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
          <ChatArea 
            messages={messages} 
            currentUser={userCode} 
            username={username} 
          />
          <InputArea 
            onSendMessage={handleSendMessage} 
            onOpenChatbot={() => setIsChatbotOpen(true)}
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