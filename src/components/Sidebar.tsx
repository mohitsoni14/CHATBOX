import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface Participant {
  id: string;
  name: string;
  status: 'online' | 'idle' | 'offline';
  avatar: string;
}

interface SidebarProps {
  participants: Participant[];
}

const Sidebar: React.FC<SidebarProps> = ({ participants }) => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const participantsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Staggered entrance animation for participants
    gsap.fromTo('.participant-item',
      { opacity: 0, x: -30 },
      { opacity: 1, x: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
    );
  }, [participants]);

  return (
    <div ref={sidebarRef} className="sidebar glass-effect">
      <div className="sidebar-header">
        <h3>Participants ({participants.length})</h3>
      </div>
      
      <div ref={participantsRef} className="participants-list">
        {participants.map((participant) => (
          <div key={participant.id} className="participant-item">
            <div className="participant-avatar">
              <img src={participant.avatar} alt={participant.name} />
              <div className={`status-indicator ${participant.status}`} />
            </div>
            <div className="participant-info">
              <span className="participant-name">{participant.name}</span>
              <span className={`participant-status ${participant.status}`}>
                {participant.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;