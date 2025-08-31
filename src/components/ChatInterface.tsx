import React, { useState, useEffect, useRef, useCallback } from 'react';
import { pusherClient, subscribeToChannel, sendSignal } from '../lib/pusher';
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

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onLogout, initialUsername = '' }) => {
  // ===================================================================================
  // MOVED: All WebRTC and socket logic is now correctly placed inside the component.
  // ===================================================================================

  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const roomId = "global-room";
  const [localPeerId] = useState(`peer-${Math.random().toString(36).substr(2, 9)}`);
  const [remotePeerId, setRemotePeerId] = useState<string | null>(null);

  const ensurePeerConnection = useCallback(async (targetPeerId: string, isInitiator: boolean = true): Promise<RTCPeerConnection> => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        // Add TURN servers here if needed
      ],
    });
    pcRef.current = pc;
    setPeerConnection(pc);
    setRemotePeerId(targetPeerId);

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // Send the ICE candidate to the other peer through Pusher
        const signal = {
          type: 'candidate',
          candidate: event.candidate,
          from: localPeerId,
          to: targetPeerId
        };
        sendSignal(`private-${targetPeerId}`, 'signal', signal);
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

    pcRef.current = pc;
    setPeerConnection(pc);
    
    return pc;
  }, [roomId, localPeerId]);

  // Handle peer disconnection
  const handlePeerLeft = useCallback((data: { peerId: string }) => {
    console.log('Peer left:', data.peerId);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Initialize Pusher connection
    console.log('Initializing Pusher connection with ID:', localPeerId);
    
    // Set up Pusher subscription for signaling
    const unsubscribeSignal = subscribeToChannel(
      `private-${localPeerId}`, 
      'signal', 
      async (data: any) => {
        console.log('Signal received', data);
        
        if (data.to !== localPeerId) return; // Not for us
        
        const pc = pcRef.current;
        if (!pc) return;

        try {
          if (data.type === 'offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            // Send answer back to the caller
            await sendSignal(`private-${data.from}`, 'signal', {
              type: 'answer',
              answer: answer,
              from: localPeerId,
              to: data.from
            });
          } else if (data.type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          } else if (data.type === 'candidate' && data.candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          }
        } catch (error) {
          console.error('Error handling signal:', error);
        }
      }
    );

    // Subscribe to peer left events
    const unsubscribePeerLeft = subscribeToChannel(
      `presence-${roomId}`, 
      'peer-left', 
      handlePeerLeft
    );

    // Announce presence
    sendSignal(`presence-${roomId}`, 'peer-joined', { 
      peerId: localPeerId 
    });

    // Cleanup function
    return () => {
      unsubscribeSignal();
      unsubscribePeerLeft();
      
      // Notify others that we're leaving
      sendSignal(`presence-${roomId}`, 'peer-left', { 
        peerId: localPeerId 
      });
      
      // Clean up peer connection
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      setPeerConnection(null);
    };
    sendSignal(`presence-${roomId}`, 'peer-joined', { 
      peerId: localPeerId 
    });

    // Cleanup function
    return () => {
      unsubscribePeerLeft();
      sendSignal(`presence-${roomId}`, 'peer-left', { 
        peerId: localPeerId 
      });
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, [roomId, ensurePeerConnection]); // useEffect depends on roomId and ensurePeerConnection

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
  const [isConnected, setIsConnected] = useState(false);
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

    const joinChat = async () => {
      try {
        await joinSession(sessionId, userCode, username);

        const unsubscribeFn = subscribeToMessages(sessionId, (newMessages) => {
          setMessages(prevMessages => {
            const uniqueMessages = newMessages.filter(
              newMsg => !prevMessages.some(msg => msg.id === newMsg.id)
            );
            return [...prevMessages, ...uniqueMessages];
          });
        });

        unsubscribe = unsubscribeFn;
        setIsConnected(true);
      } catch (error) {
        console.error('Error joining session:', error);
        setIsConnected(false);
      }
    };

    joinChat();

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

  const handleSendMessage = useCallback(async (message: Message) => {
    if (!sessionId || !userCode || !username) return;

    const messageToSend = {
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