import React, { useState, useEffect } from 'react';
import { gsap } from 'gsap';
import Preloader from './components/Preloader';
import AuthScreen from './components/AuthScreen';
import ChatInterface from './components/ChatInterface';
import './sytle/globals.css';

type AppState = 'loading' | 'auth' | 'chat';

function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [sessionData, setSessionData] = useState<{ sessionId: string; userCode: string } | null>(null);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setAppState('auth');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleSessionJoin = (sessionId: string, userCode: string) => {
    setSessionData({ sessionId, userCode });
    setAppState('chat');
  };

  const handleLogout = () => {
    setSessionData(null);
    setAppState('auth');
  };

  return (
    <div className="app">
      {appState === 'loading' && (
        <Preloader onComplete={() => setAppState('auth')} />
      )}
      {appState === 'auth' && (
        <AuthScreen onSessionJoin={handleSessionJoin} />
      )}
      {appState === 'chat' && sessionData && (
        <ChatInterface
          sessionData={sessionData}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;