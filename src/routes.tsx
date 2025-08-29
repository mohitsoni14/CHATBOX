import React from 'react';
import { createBrowserRouter, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import App from './App';
import AuthScreen from './components/AuthScreen';
import ChatInterface from './components/ChatInterface';
import Preloader from './components/Preloader';
import Login from './pages/Login';

// Wrapper components to handle props
const PreloaderWrapper = () => {
  const navigate = useNavigate();
  return <Preloader onComplete={() => navigate('/auth')} />;
};

const AuthScreenWrapper = () => {
  const navigate = useNavigate();
  const handleSessionJoin = (sessionId: string, username: string) => {
    navigate(`/chat/${sessionId}`, { state: { username } });
  };
  return <AuthScreen onSessionJoin={handleSessionJoin} />;
};

const ChatInterfaceWrapper = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = React.useState('');
  
  React.useEffect(() => {
    // Get username from location state or fallback to localStorage
    const stateUsername = location.state?.username;
    const storedUsername = localStorage.getItem('chat_username');
    
    console.log('Location state:', location.state);
    console.log('State username:', stateUsername);
    console.log('Stored username:', storedUsername);
    
    if (stateUsername) {
      console.log('Setting username from state:', stateUsername);
      setUsername(stateUsername);
      localStorage.setItem('chat_username', stateUsername);
    } else if (storedUsername) {
      console.log('Setting username from localStorage:', storedUsername);
      setUsername(storedUsername);
    } else {
      // If no username is found, redirect to auth
      console.log('No username found, redirecting to auth');
      navigate('/auth');
    }
  }, [location.state, navigate]);
  
  const handleLogout = () => {
    navigate('/auth');
  };

  if (!sessionId) {
    return <Navigate to="/auth" replace />;
  }

  // Only render ChatInterface when we have a username
  if (!username) {
    return null; // or a loading spinner
  }

  return <ChatInterface onLogout={handleLogout} initialUsername={username} />;
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
        path: "/login",
        element: <Login />
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
