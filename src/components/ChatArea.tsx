import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface Message {
  id: string;
  text: string;
  sender: string;
  senderName?: string;
  timestamp: Date | number;
  type: 'text' | 'image' | 'file';
}

interface ChatAreaProps {
  messages: Message[];
  currentUser: string;
  username: string;
}

const ChatArea: React.FC<ChatAreaProps> = ({ messages, currentUser, username }) => {
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

  const formatTime = (timestamp: Date | number) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-2">
      {messages.map((message) => {
        const isOwnMessage = message.sender === currentUser;
        return (
          <div
            key={message.id}
            className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-2 mb-1">
              {!isOwnMessage && (
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  {message.senderName || 'User'}
                </span>
              )}
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatTime(message.timestamp)}
              </span>
            </div>
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                isOwnMessage
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-gray-200 dark:bg-gray-700 rounded-bl-none'
              }`}
            >
              <div className="message-text">{message.text}</div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatArea;