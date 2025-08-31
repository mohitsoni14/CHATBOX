import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Home, MessageCircle, Gamepad2, Settings, Bot, User, LogOut } from 'lucide-react';
import { useParams } from 'react-router-dom';

interface NavbarProps {
  onLogout: () => void;
  onMenuToggle: () => void;
  onGamesToggle: () => void;
  onOpenChatbot?: () => void;
  onThemeToggle?: () => void;
  setIsGamesOpen?: (isOpen: boolean) => void;
  setIsMenuOpen?: (isOpen: boolean) => void;
  username?: string;
  isDarkMode?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({
  onLogout,
  onMenuToggle,
  onGamesToggle,
  onOpenChatbot,
  setIsGamesOpen,
  setIsMenuOpen,
  username
}) => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [userCode] = React.useState(() => 
    Math.random().toString(36).substring(2, 12).toUpperCase()
  );
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Navbar entrance animation
    gsap.fromTo(navRef.current,
      { y: -80, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' }
    );

    // Setup scroll behavior
    const handleScroll = () => {
      const scrolled = window.scrollY > 10;
      gsap.to(navRef.current, {
        backgroundColor: scrolled ? 'rgba(0, 0, 0, 0.95)' : 'rgba(0, 0, 0, 0.8)',
        duration: 0.3
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  console.log('Navbar - username:', username);
  console.log('Navbar - userCode:', userCode);
  
  return (
    <nav ref={navRef} className="navbar glass-effect mt-2">
      <div className="navbar-content">
        <div className="navbar-left">
          <div className="navbar-logo">
            <MessageCircle size={24} />
            <span>PlayBit</span>
          </div>
          <div className="navbar-links">
            <button 
              className="nav-link active"
              onClick={() => {
                // Close any open sections when Home is clicked
                if (typeof onGamesToggle === 'function') {
                  setIsGamesOpen?.(false);
                }
                if (typeof onMenuToggle === 'function') {
                  setIsMenuOpen?.(false);
                }
              }}
            >
              <Home size={18} />
              <span>Home</span>
            </button>
            
            <button 
              className="nav-link" 
              onClick={onGamesToggle}
            >
              <Gamepad2 size={18} />
              <span>Games</span>
            </button>
          </div>
        </div>

        <div className="navbar-center w-full flex justify-center">
          <span className="text-sm font-mono text-gray-700 dark:text-gray-300">Session: {sessionId}</span>
        </div>

        <div className="navbar-right">
<button 
            className="nav-icon" 
            onClick={onOpenChatbot}
            title="Open AI Chatbot"
          >
            <Bot size={20} />
          </button>
          <div className="navbar-profile">
            <div className="flex items-center gap-2">
              <User size={20} />
              <span className="text-sm font-medium">
                {username || `User${userCode.substring(0, 4)}`}
              </span>
            </div>
          </div>
          <button className="nav-icon logout-btn" onClick={onLogout}>
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;