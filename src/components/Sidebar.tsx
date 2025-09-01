import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ref, onValue, off, DataSnapshot, DatabaseReference } from 'firebase/database';
import { database } from '../firebase/firebase';

interface Participant {
  id: string;
  username: string;
  status: 'online' | 'idle' | 'offline';
  avatar: string;
  joinedAt: string;
  lastActive: string;
}

interface SidebarProps {
  sessionId: string;
}

interface FirebaseUserData {
  username: string;
  status?: 'online' | 'idle' | 'offline';
  avatar?: string;
  joinedAt: string;
  lastActive: string;
}

const Sidebar: React.FC<SidebarProps> = ({ sessionId }) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const participantsRef = useRef<HTMLDivElement>(null);

  // Animate participants when they are updated
  useEffect(() => {
    if (participants.length === 0) return;
    
    // Use GSAP to animate the participant items
    const tl = gsap.timeline();
    
    // Target only the newly added participants
    const newParticipants = document.querySelectorAll('.participant-item:not(.animated)');
    
    if (newParticipants.length > 0) {
      tl.fromTo(newParticipants,
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power2.out',
          onComplete: () => {
            // Add a class to mark as animated
            newParticipants.forEach(el => el.classList.add('animated'));
          }
        }
      );
    }
    
    return () => {
      tl.kill();
    };
  }, [participants]);
  
  useEffect(() => {
    if (!sessionId) return;

    const participantsRef = ref(database, `sessions/${sessionId}/users`);
    
    const handleValueChange = (snapshot: DataSnapshot) => {
      const participantsData = snapshot.val() || {};
      const participantsList = Object.entries(participantsData).map(([id, data]) => {
        const userData = data as FirebaseUserData;
        return {
          id,
          username: userData.username,
          status: userData.status || 'online',
          avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.username)}&background=random`,
          joinedAt: userData.joinedAt,
          lastActive: userData.lastActive
        };
      });
      
      setParticipants(participantsList);
    };

    // Set up the listener
    onValue(participantsRef, handleValueChange);

    // Clean up the listener when component unmounts
    return () => {
      off(participantsRef, 'value', handleValueChange);
    };
  }, [sessionId]);

  return (
    <div ref={sidebarRef} className="sidebar glass-effect">
      <div className="sidebar-header">
        <h3>Participants ({participants.length})</h3>
      </div>
      
      <div ref={participantsRef} className="participants-list">
        {participants.map((participant) => (
          <div key={participant.id} className="participant-item">
            <div className="participant-avatar">
              <img src={participant.avatar} alt={participant.username} />
              <div className={`status-indicator ${participant.status}`} />
            </div>
            <div className="participant-info">
              <span className="participant-name">{participant.username}</span>
              <span className={`participant-status ${participant.status}`}>
                {participant.status.charAt(0).toUpperCase() + participant.status.slice(1)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;