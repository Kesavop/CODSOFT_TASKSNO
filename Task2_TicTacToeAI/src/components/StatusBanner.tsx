import React from 'react';
import { Player } from '../game/types';

interface StatusBannerProps {
  winner: Player | null;
  isDraw: boolean;
  currentPlayer: Player;
  isAiThinking: boolean;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({
  winner,
  isDraw,
  currentPlayer,
  isAiThinking,
}) => {
  if (winner) {
    if (winner === 'O') {
      return (
        <div className="game-status-line" role="alert" style={{ color: 'var(--accent)' }}>
          <span>AI wins</span>
        </div>
      );
    }
    return (
      <div className="game-status-line" role="alert">
        <span>You win</span>
      </div>
    );
  }

  if (isDraw) {
    return (
      <div className="game-status-line" role="alert" style={{ color: 'var(--text-muted)' }}>
        <span>Draw</span>
      </div>
    );
  }

  if (isAiThinking) {
    return (
      <div className="game-status-line" aria-live="polite">
        <span className="status-indicator-dot pulse" />
        <span>AI is thinking…</span>
      </div>
    );
  }

  if (currentPlayer === 'X') {
    return (
      <div className="game-status-line" aria-live="polite">
        <span>Your turn</span>
      </div>
    );
  }

  return (
    <div className="game-status-line" aria-live="polite">
      <span className="status-indicator-dot" />
      <span>AI turn</span>
    </div>
  );
};
