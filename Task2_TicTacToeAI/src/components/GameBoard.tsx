import React from 'react';
import { Board } from '../game/types';

interface GameBoardProps {
  board: Board;
  winningLine: [number, number, number] | null;
  isGameOver: boolean;
  isAiThinking: boolean;
  onCellClick: (index: number) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  board,
  winningLine,
  isGameOver,
  isAiThinking,
  onCellClick,
}) => {
  return (
    <div className="board-frame" role="grid" aria-label="Tic-Tac-Toe Board">
      {board.map((cell, index) => {
        const isWinningCell = winningLine?.includes(index) ?? false;
        const isDisabled = cell !== null || isGameOver || isAiThinking;

        return (
          <button
            key={index}
            className={`board-cell ${isWinningCell ? 'winning-cell' : ''}`}
            onClick={() => onCellClick(index)}
            disabled={isDisabled}
            aria-label={`Cell ${index + 1}, ${cell ? `Marked ${cell}` : 'Empty'}`}
            type="button"
          >
            {cell === 'X' && (
              <span className="symbol-wrap symbol-x" aria-hidden="true">
                <svg
                  viewBox="0 0 32 32"
                  width="100%"
                  height="100%"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                >
                  <line x1="8" y1="8" x2="24" y2="24" />
                  <line x1="24" y1="8" x2="8" y2="24" />
                </svg>
              </span>
            )}

            {cell === 'O' && (
              <span className="symbol-wrap symbol-o" aria-hidden="true">
                <svg
                  viewBox="0 0 32 32"
                  width="100%"
                  height="100%"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.2"
                >
                  <circle cx="16" cy="16" r="8.8" />
                </svg>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
