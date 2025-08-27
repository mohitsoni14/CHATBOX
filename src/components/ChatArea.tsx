import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file';
}

interface ChatAreaProps {
  messages: Message[];
  currentUser: string;
}

const ChatArea: React.FC<ChatAreaProps> = ({ messages, currentUser }) => {
  const chatRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Animate new messages
    if (messages.length > 0) {
      gsap.fromTo('.message-bubble:last-child',
        { opacity: 0, y: 20, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.7)' }
      );
    }
  }, [messages]);

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div ref={chatRef} className="chat-area">
      <div className="messages-container">
        {messages.map((message) => {
          const isOwnMessage = message.sender === currentUser;
          return (
            <div
              key={message.id}
              className={`message-bubble ${isOwnMessage ? 'own-message' : 'other-message'}`}
            >
              <div className="message-content">
                <div className="message-text">{message.text}</div>
                <div className="message-meta">
                  <span className="message-sender">{message.sender}</span>
                  <span className="message-time">{formatTime(message.timestamp)}</span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatArea;