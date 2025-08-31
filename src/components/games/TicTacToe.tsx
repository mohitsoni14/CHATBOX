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

  const [winningCombination, setWinningCombination] = useState<number[] | null>(null);

  const checkWinner = (board: Cell[]): Player | 'tie' | null => {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6] // Diagonals
    ];

    for (const pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        setWinningCombination(pattern);
        return board[a];
      }
    }

    if (board.every(cell => cell !== null)) {
      return 'tie';
    }

    return null;
  };

  const makeMove = (index: number, player: Player) => {
    // Create a new board with the current state
    const newBoard = [...board];
    
    // If the cell is already taken, don't make the move
    if (newBoard[index] !== null || winner) return false;
    
    // Make the move
    newBoard[index] = player;
    
    // Update the board state
    setBoard(newBoard);

    // Animate the move
    gsap.fromTo(`.tic-cell:nth-child(${index + 1}) .cell-content`,
      { scale: 0, rotation: -180 },
      { scale: 1, rotation: 0, duration: 0.3, ease: 'back.out(1.7)' }
    );

    // Check for winner after the move
    const gameWinner = checkWinner(newBoard);
    if (gameWinner) {
      setWinner(gameWinner);
      return true;
    }
    
    // If it was X's move, let the AI make a move
    if (player === 'X' && !gameWinner) {
      setCurrentPlayer('O');
      // Let the AI make a move after a short delay
      setTimeout(() => {
        makeAIMove(newBoard);
      }, 500);
    } else if (player === 'O') {
      setCurrentPlayer('X');
    }
    
    return true;
  };

  // Find the best move for the AI using a simple strategy
  const findBestMove = (board: Cell[], player: Player): number => {
    // Check for a winning move
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        const newBoard = [...board];
        newBoard[i] = player;
        if (checkWinner(newBoard) === player) {
          return i; // Take the winning move
        }
      }
    }

    // Check if opponent can win in the next move, block them
    const opponent = player === 'X' ? 'O' : 'X';
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        const newBoard = [...board];
        newBoard[i] = opponent;
        if (checkWinner(newBoard) === opponent) {
          return i; // Block the opponent
        }
      }
    }

    // Try to take the center if available
    if (board[4] === null) return 4;

    // Try to take a corner if available
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(i => board[i] === null);
    if (availableCorners.length > 0) {
      return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }

    // Take any available edge
    const edges = [1, 3, 5, 7];
    const availableEdges = edges.filter(i => board[i] === null);
    if (availableEdges.length > 0) {
      return availableEdges[Math.floor(Math.random() * availableEdges.length)];
    }

    // Fallback to random move (shouldn't reach here in a standard game)
    const emptyCells = board.map((cell, index) => (cell === null ? index : -1)).filter(i => i !== -1);
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  };

  // AI to make a smart move for 'O'
  const makeAIMove = (currentBoard: Cell[]) => {
    // Find the best move using our strategy
    const moveIndex = findBestMove(currentBoard, 'O');
    
    // Make the AI move with the current board state
    const newBoard = [...currentBoard];
    newBoard[moveIndex] = 'O';
    
    // Update the board state
    setBoard(newBoard);
    
    // Animate the AI's move
    gsap.fromTo(`.tic-cell:nth-child(${moveIndex + 1}) .cell-content`,
      { scale: 0, rotation: -180 },
      { scale: 1, rotation: 0, duration: 0.3, ease: 'back.out(1.7)' }
    );
    
    // Check for winner after AI's move
    const gameWinner = checkWinner(newBoard);
    if (gameWinner) {
      setWinner(gameWinner);
    } else {
      setCurrentPlayer('X');
    }
  };

  const handleCellClick = (index: number) => {
    // Only allow human (X) to make moves when it's their turn
    if (currentPlayer === 'X' && board[index] === null && !winner) {
      makeMove(index, 'X');
    }
  };

  const resetGame = () => {
    // Reset winning combination highlight
    setWinningCombination(null);
    
    // Reset game state
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
    
    // Animate reset
    gsap.fromTo('.tic-cell',
      { scale: 1.1 },
      { 
        scale: 1, 
        duration: 0.3, 
        ease: 'power2.out',
        clearProps: 'all' // Clear any existing animations
      }
    );
    
    // Reset any winning cell animations
    gsap.set('.winning-cell', { 
      boxShadow: 'none',
      scale: 1,
      zIndex: 1
    });
  };

  // Add winning animation when there's a winner
  useEffect(() => {
    if (winningCombination && winner) {
      // Animate each winning cell
      winningCombination.forEach((cellIndex, i) => {
        gsap.to(`.tic-cell:nth-child(${cellIndex + 1})`, {
          scale: 1.1,
          boxShadow: '0 0 15px rgba(59, 130, 246, 0.8)',
          zIndex: 10,
          duration: 0.3,
          delay: i * 0.1,
          yoyo: true,
          repeat: 3,
          ease: 'power1.inOut'
        });
      });
    }
  }, [winningCombination, winner]);

  return (
    <div className="tic-tac-toe">
      <div className="game-status">
        {winner ? (
          <div className="game-result animate-bounce text-2xl font-bold">
            {winner === 'tie' ? (
              <span className="text-yellow-500">It's a tie! 🤝</span>
            ) : (
              <span className={winner === 'X' ? 'text-blue-500' : 'text-red-500'}>
                {winner === 'X' ? 'You win! 🎉' : 'AI wins! 🤖'}
              </span>
            )}
          </div>
        ) : (
          <div className="current-turn text-lg font-medium">
            {currentPlayer === 'X' ? 'Your turn (X)' : 'AI is thinking...'}
          </div>
        )}
      </div>

      <div ref={boardRef} className="tic-board">
        {board.map((cell, index) => (
          <div
            key={index}
            className={`tic-cell ${winningCombination?.includes(index) ? 'winning-cell' : ''}`}
            onClick={() => handleCellClick(index)}
          >
            <div className={`cell-content ${cell === 'X' ? 'text-blue-500' : 'text-red-500'}`}>
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