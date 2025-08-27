import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';

type Player = 'X' | 'O';
type Cell = Player | null;

const TicTacToe: React.FC = () => {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [winner, setWinner] = useState<Player | 'tie' | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate board entrance
    gsap.fromTo('.tic-cell',
      { scale: 0, rotation: 180 },
      { scale: 1, rotation: 0, duration: 0.5, stagger: 0.05, ease: 'back.out(1.7)' }
    );
  }, []);

  const checkWinner = (board: Cell[]): Player | 'tie' | null => {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6] // Diagonals
    ];

    for (const pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }

    if (board.every(cell => cell !== null)) {
      return 'tie';
    }

    return null;
  };

  const handleCellClick = (index: number) => {
    if (board[index] || winner) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    // Animate cell fill
    gsap.fromTo(`.tic-cell:nth-child(${index + 1}) .cell-content`,
      { scale: 0, rotation: 360 },
      { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(1.7)' }
    );

    const gameWinner = checkWinner(newBoard);
    if (gameWinner) {
      setWinner(gameWinner);
      // Animate winning celebration
      gsap.to('.game-result', {
        scale: 1.1,
        duration: 0.5,
        yoyo: true,
        repeat: 1,
        ease: 'power2.inOut'
      });
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
    
    // Animate reset
    gsap.fromTo('.tic-cell',
      { scale: 1.1 },
      { scale: 1, duration: 0.3, ease: 'power2.out' }
    );
  };

  return (
    <div className="tic-tac-toe">
      <div className="game-status">
        {winner ? (
          <div className="game-result">
            {winner === 'tie' ? "It's a tie!" : `Player ${winner} wins!`}
          </div>
        ) : (
          <div className="current-turn">Player {currentPlayer}'s turn</div>
        )}
      </div>

      <div ref={boardRef} className="tic-board">
        {board.map((cell, index) => (
          <div
            key={index}
            className="tic-cell"
            onClick={() => handleCellClick(index)}
          >
            <div className="cell-content">
              {cell}
            </div>
          </div>
        ))}
      </div>

      {winner && (
        <button onClick={resetGame} className="reset-btn primary-btn">
          Play Again
        </button>
      )}
    </div>
  );
};

export default TicTacToe;