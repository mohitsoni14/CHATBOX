import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Users, Sparkles } from 'lucide-react';
import { saveSessionData } from '../firebase/firebase';

interface AuthScreenProps {
  onSessionJoin: (sessionId: string, username: string) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onSessionJoin }) => {
  const [sessionId, setSessionId] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Entrance animation
    gsap.fromTo(cardRef.current, 
      { opacity: 0, scale: 0.8, y: 50 },
      { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: 'back.out(1.7)' }
    );
  }, []);

  const generateRandomCode = () => {
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const randomName = `User${Math.floor(1000 + Math.random() * 9000)}`;
    setSessionId(randomId);
    setUsername(randomName);
    
    // Animate the generation
    gsap.fromTo('.generated-code',
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.7)' }
    );
  };

  const handleJoinSession = async () => {
    if (!sessionId.trim() || !username.trim()) {
      alert('Please enter both session ID and username');
      return;
    }

    setIsLoading(true);

    try {
      // Save session data to Firebase
      await saveSessionData(sessionId, username);
      
      // Exit animation
      const tl = gsap.timeline();
      tl.to(cardRef.current, {
        scale: 0.8,
        opacity: 0,
        y: -50,
        duration: 0.5,
        ease: 'power2.inOut'
      });
      tl.to(containerRef.current, {
        opacity: 0,
        duration: 0.3,
        onComplete: () => onSessionJoin(sessionId, username)
      });
    } catch (error) {
      console.error('Error joining session:', error);
      setIsLoading(false);
      
      // More specific error messages
      if (error.message.includes('permission-denied')) {
        alert('Permission denied. Please check your internet connection and try again.');
      } else if (error.message.includes('unavailable')) {
        alert('Network error. Please check your internet connection.');
      } else {
        alert('Failed to join session. Please try again.');
      }
    }
  };

  return (
    <div ref={containerRef} className="auth-screen">
      <div ref={cardRef} className="auth-card glass-effect">
        <div className="auth-header">
          <div className="auth-icon">
            <Users size={32} />
          </div>
          <h1 className="auth-title">Join Chat Session</h1>
          <p className="auth-subtitle">Enter your session details to continue</p>
        </div>

        <div className="auth-form">
          <div className="input-group">
            <label htmlFor="sessionId">Session ID</label>
            <input
              id="sessionId"
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value.toUpperCase())}
              placeholder="Enter session ID"
              className="auth-input glass-input"
            />
          </div>

          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              className="auth-input glass-input"
            />
          </div>

          <button
            onClick={generateRandomCode}
            className="generate-btn glass-btn"
          >
            <Sparkles size={18} />
            Generate Random
          </button>

          <button
            onClick={handleJoinSession}
            disabled={!sessionId.trim() || !username.trim() || isLoading}
            className="join-btn primary-btn"
          >
            {isLoading ? (
              <div className="loading-spinner" />
            ) : (
              'Join Session'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;