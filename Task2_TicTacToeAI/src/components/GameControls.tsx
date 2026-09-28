import React from 'react';
import { StartingPlayer } from '../game/types';

interface GameControlsProps {
  startingPlayer: StartingPlayer;
  onRestart: () => void;
  onSelectStarter: (starter: StartingPlayer) => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  startingPlayer,
  onRestart,
  onSelectStarter,
}) => {
  return (
    <div className="controls-group">
      <button
        type="button"
        className="btn-new-game"
        onClick={onRestart}
        aria-label="New Game"
      >
        New Game
      </button>

      <div className="starter-row">
        <span className="starter-label">First move:</span>
        <div className="starter-segmented" role="group" aria-label="First Move Choice">
          <button
            type="button"
            className={`starter-opt ${startingPlayer === 'human' ? 'active' : ''}`}
            onClick={() => onSelectStarter('human')}
          >
            You (X)
          </button>
          <button
            type="button"
            className={`starter-opt ${startingPlayer === 'ai' ? 'active' : ''}`}
            onClick={() => onSelectStarter('ai')}
          >
            AI (O)
          </button>
        </div>
      </div>
    </div>
  );
};
