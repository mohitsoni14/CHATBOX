import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import InputArea from './InputArea';
import GamesPanel from './GamesPanel';
import MenuDropdown from './MenuDropdown';

interface ChatInterfaceProps {
  sessionData: { sessionId: string; userCode: string };
  onLogout: () => void;
}

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file';
}

interface Participant {
  id: string;
  name: string;
  status: 'online' | 'idle' | 'offline';
  avatar: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ sessionData, onLogout }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGamesOpen, setIsGamesOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Entrance animation
    gsap.fromTo(containerRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }
    );

    // Initialize demo data
    setParticipants([
      { id: '1', name: 'Alice', status: 'online', avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?w=100&h=100&fit=crop&crop=face' },
      { id: '2', name: 'Bob', status: 'idle', avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?w=100&h=100&fit=crop&crop=face' },
      { id: '3', name: 'Charlie', status: 'online', avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?w=100&h=100&fit=crop&crop=face' },
    ]);

    setMessages([
      { id: '1', text: 'Welcome to the session!', sender: 'Alice', timestamp: new Date(Date.now() - 300000), type: 'text' },
      { id: '2', text: 'Great to have everyone here', sender: 'Bob', timestamp: new Date(Date.now() - 180000), type: 'text' },
    ]);

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
      sender: sessionData.userCode,
      timestamp: new Date(),
      type
    };
    setMessages(prev => [...prev, newMessage]);
  };

  return (
    <div ref={containerRef} className={`chat-interface ${isDarkMode ? 'dark' : 'light'}`}>
      <Navbar
        sessionData={sessionData}
        onLogout={onLogout}
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
        onGamesToggle={() => setIsGamesOpen(!isGamesOpen)}
        isDarkMode={isDarkMode}
        onThemeToggle={handleThemeToggle}
      />
      
      <MenuDropdown
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <div className="chat-body">
        <Sidebar participants={participants} />
        
        <div className="chat-main">
          <ChatArea messages={messages} currentUser={sessionData.userCode} />
          <InputArea onSendMessage={handleSendMessage} />
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