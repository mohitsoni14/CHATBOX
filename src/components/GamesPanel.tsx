import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { X, Play, Users, Clock } from 'lucide-react';
import TicTacToe from './games/TicTacToe';

interface GamesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const GamesPanel: React.FC<GamesPanelProps> = ({ isOpen, onClose }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [activeGame, setActiveGame] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      gsap.fromTo(panelRef.current,
        { x: 300, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
      );
    } else {
      gsap.to(panelRef.current,
        { x: 300, opacity: 0, duration: 0.3, ease: 'power2.in' }
      );
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const games = [
    {
      id: 'tictactoe',
      name: 'Tic Tac Toe',
      description: 'Classic 3x3 strategy game',
      players: '2 Players',
      duration: '5 min',
      icon: '⚡'
    },
    {
      id: 'chess',
      name: 'Chess',
      description: 'Strategic board game',
      players: '2 Players',
      duration: '30+ min',
      icon: '♕'
    },
    {
      id: 'ludo',
      name: 'Ludo',
      description: 'Roll dice and race to finish',
      players: '2-4 Players',
      duration: '20 min',
      icon: '🎲'
    }
  ];

  const handleGameSelect = (gameId: string) => {
    setActiveGame(gameId);
  };

  return (
    <div ref={panelRef} className="games-panel glass-effect">
      <div className="games-header">
        <h3>Quick Games</h3>
        <button onClick={onClose} className="close-btn">
          <X size={20} />
        </button>
      </div>

      {!activeGame ? (
        <div className="games-grid">
          {games.map((game) => (
            <div
              key={game.id}
              className="game-card glass-effect"
              onClick={() => handleGameSelect(game.id)}
            >
              <div className="game-icon">{game.icon}</div>
              <div className="game-info">
                <h4>{game.name}</h4>
                <p>{game.description}</p>
                <div className="game-meta">
                  <span><Users size={14} /> {game.players}</span>
                  <span><Clock size={14} /> {game.duration}</span>
                </div>
              </div>
              <button className="play-btn">
                <Play size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="game-container">
          <div className="game-header">
            <button
              onClick={() => setActiveGame(null)}
              className="back-btn"
            >
              ← Back to Games
            </button>
          </div>
          {activeGame === 'tictactoe' && <TicTacToe />}
          {activeGame === 'chess' && <div className="coming-soon">Chess - Coming Soon!</div>}
          {activeGame === 'ludo' && <div className="coming-soon">Ludo - Coming Soon!</div>}
        </div>
      )}
    </div>
  );
};

export default GamesPanel;