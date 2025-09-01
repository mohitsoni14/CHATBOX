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
import { getDatabase, ref, push, onValue, Database, DatabaseReference } from 'firebase/database';
import { initializeApp, FirebaseApp, getApp, getApps } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';

interface MessageData {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
  type: "text" | "image" | "file";
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  fileData?: any;
  duration?: number;
  isAudio?: boolean;
}

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

// Initialize Firebase only if it hasn't been initialized already
let app: FirebaseApp;
let database: Database;
let auth: Auth;

// Initialize Firebase
try {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  };

  // Check if Firebase app is already initialized
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  
  database = getDatabase(app);
  auth = getAuth(app);
  
  console.log('Firebase initialized successfully');
} catch (error) {
  const firebaseError = error as FirebaseError;
  console.error('Firebase initialization error:', {
    code: firebaseError.code,
    message: firebaseError.message,
    stack: firebaseError.stack
  });
  throw new Error('Failed to initialize Firebase. Please check your configuration.');
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onLogout, initialUsername = '' }) => {
  // ===================================================================================
  // MOVED: All WebRTC and socket logic is now correctly placed inside the component.
  // ===================================================================================

  const [isConnected, setIsConnected] = useState(false);
  const [isSocketReady, setIsSocketReady] = useState(false);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const roomId = "global-room"; // or generate dynamically

  const ensurePeerConnection = useCallback(async (
    s: any,
    targetSocketId?: string,
    isOfferer = true
  ): Promise<RTCPeerConnection> => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    pcRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        push(ref(database, 'signals'), { roomId, to: targetSocketId, type: "candidate", payload: event.candidate });
      }
    };

    pc.ontrack = (ev) => {
      if (remoteVideoRef.current) {
        const [stream] = ev.streams;
        remoteVideoRef.current.srcObject = stream;
      }
    };

    if (!localStreamRef.current) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    }

    localStreamRef.current.getTracks().forEach((track) =>
      pc.addTrack(track, localStreamRef.current!)
    );

    return pc;
  }, [roomId]); // useCallback depends on roomId

  useEffect(() => {
    setIsConnected(true);
    
    return () => {
      // Cleanup function if needed
      setIsConnected(false);
    };
  }, []);

  useEffect(() => {
    const signalsRef = ref(database, 'signals');
    onValue(signalsRef, (snapshot) => {
      const signals = snapshot.val();
      if (signals) {
        Object.keys(signals).forEach((key) => {
          const signal = signals[key];
          if (signal.type === 'offer') {
            ensurePeerConnection(null, signal.from, false).then((pc) => {
              pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
              pc.createAnswer().then((answer) => {
                pc.setLocalDescription(answer);
                push(ref(database, 'signals'), { roomId, to: signal.from, type: 'answer', payload: pc.localDescription });
              });
            });
          } else if (signal.type === 'answer') {
            pcRef.current?.setRemoteDescription(new RTCSessionDescription(signal.payload));
          } else if (signal.type === 'candidate') {
            try {
              pcRef.current?.addIceCandidate(new RTCIceCandidate(signal.payload));
            } catch (e) { console.warn('addIceCandidate failed', e); }
          }
        });
      }
    });
  }, [roomId, ensurePeerConnection]);

  // ===================================================================================
  // Original component state and logic continues here...
  // ===================================================================================
  
  const { sessionId } = useParams<{ sessionId: string }>();
  const [userCode, setUserCode] = useState(() => localStorage.getItem('chat_user_code'));

  useEffect(() => {
    if (!userCode) {
      const newCode = Math.random().toString(36).substring(2, 12).toUpperCase();
      localStorage.setItem('chat_user_code', newCode);
      setUserCode(newCode);
    }
  }, [userCode]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isGamesOpen, setIsGamesOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [username, setUsername] = useState(initialUsername);
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.fromTo(containerRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }
    );

    console.log('ChatInterface - initialUsername:', initialUsername);
    if (initialUsername) {
      console.log('Setting username from initialUsername prop:', initialUsername);
      setUsername(initialUsername);
      localStorage.setItem('chat_username', initialUsername);
      return;
    }

    const storedUsername = localStorage.getItem('chat_username');
    console.log('Stored username from localStorage:', storedUsername);
    if (storedUsername) {
      console.log('Setting username from localStorage:', storedUsername);
      setUsername(storedUsername);
    } else {
      const randomUsername = `User${Math.floor(1000 + Math.random() * 9000)}`;
      console.log('No username found, generating random one:', randomUsername);
      setUsername(randomUsername);
      localStorage.setItem('chat_username', randomUsername);
    }
  }, [initialUsername]); // Added initialUsername to dependency array for correctness

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    if (!sessionId || !userCode || !username) return;

    let unsubscribe: (() => void) | undefined;

    const setupChat = async () => {
      try {
        await joinSession(sessionId, userCode, username);
        
        // Subscribe to messages using the chatService
        return subscribeToMessages(sessionId, (messages) => {
          // Convert messages to array and sort by timestamp
          const sortedMessages = Object.values(messages || {})
            .sort((a: any, b: any) => (a.timestamp || 0) - (b.timestamp || 0));
          setMessages(sortedMessages as Message[]);
        });
      } catch (error) {
        console.error('Error setting up chat:', error);
      }
    };

    // Set up the chat and store the unsubscribe function
    setupChat().then(unsub => {
      unsubscribe = unsub;
    });

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [sessionId, userCode, username]);

  const handleThemeToggle = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  const handleSendMessage = useCallback(async (message: Message) => {
    if (!sessionId || !userCode || !username) return;

    const messageToSend: Message = {
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
      // Consider showing an error message to the user
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

          {userCode && (
            <ChatArea
              messages={messages}
              currentUser={userCode}
              username={username}
            />
          )}

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