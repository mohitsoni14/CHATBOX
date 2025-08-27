import React from 'react';
import { createBrowserRouter, Navigate, useNavigate, useParams } from 'react-router-dom';
import App from './App';
import AuthScreen from './components/AuthScreen';
import ChatInterface from './components/ChatInterface';
import Preloader from './components/Preloader';

// Wrapper components to handle props
const PreloaderWrapper = () => {
  const navigate = useNavigate();
  return <Preloader onComplete={() => navigate('/auth')} />;
};

const AuthScreenWrapper = () => {
  const navigate = useNavigate();
  const handleSessionJoin = (sessionId: string) => {
    navigate(`/chat/${sessionId}`);
  };
  return <AuthScreen onSessionJoin={handleSessionJoin} />;
};

const ChatInterfaceWrapper = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    navigate('/auth');
  };

  if (!sessionId) {
    return <Navigate to="/auth" replace />;
  }

  return <ChatInterface onLogout={handleLogout} />;
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: <PreloaderWrapper />,
        index: true
      },
      {
        path: "/auth",
        element: <AuthScreenWrapper />
      },
      {
        path: "/chat/:sessionId",
        element: <ChatInterfaceWrapper />
      },
      {
        path: "*",
        element: <Navigate to="/" replace />
      }
    ]
  }
]);
