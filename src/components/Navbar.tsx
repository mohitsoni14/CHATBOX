import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Home, MessageCircle, Gamepad2, Settings, Bell, Bot, User, LogOut, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  sessionData: { sessionId: string; userCode: string };
  onLogout: () => void;
  onMenuToggle: () => void;
  onGamesToggle: () => void;
  isDarkMode: boolean;
  onThemeToggle: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ sessionData, onLogout, onMenuToggle, onGamesToggle, isDarkMode, onThemeToggle }) => {
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
        backgroundColor: scrolled 
          ? (isDarkMode ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)')
          : (isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)'),
        duration: 0.3
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav ref={navRef} className="navbar glass-effect">
      <div className="navbar-content">
        <div className="navbar-left">
          <div className="navbar-logo">
            <MessageCircle size={24} />
            <span>ChatFlow</span>
          </div>
          <div className="navbar-links">
            <button className="nav-link active">
              <Home size={18} />
              <span>Home</span>
            </button>
            <button className="nav-link">
              <MessageCircle size={18} />
              <span>Chat</span>
            </button>
            <button className="nav-link" onClick={onGamesToggle}>
              <Gamepad2 size={18} />
              <span>Games</span>
            </button>
          </div>
        </div>

        <div className="navbar-center">
          <h1 className="session-title">Session: {sessionData.sessionId}</h1>
        </div>

        <div className="navbar-right">
          <button className="nav-icon">
            <Bell size={20} />
          </button>
          <button className="nav-icon theme-toggle" onClick={onThemeToggle}>
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button className="nav-icon">
            <Bot size={20} />
          </button>
          <div className="navbar-profile">
            <button className="profile-btn" onClick={onMenuToggle}>
              <User size={20} />
              <span>{sessionData.userCode}</span>
            </button>
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