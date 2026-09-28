import React from 'react';
import { GameScore } from '../game/types';

interface ScoreBoardProps {
  scores: GameScore;
  onResetScores: () => void;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({ scores, onResetScores }) => {
  const hasScores = scores.human > 0 || scores.ai > 0 || scores.draws > 0;

  return (
    <div className="score-row" aria-label="Game Scores">
      <div className="score-items">
        <span className="score-pill">
          <span className="score-label">You (X)</span>
          <span className="score-num">{scores.human}</span>
        </span>
        <span className="score-dot">·</span>
        <span className="score-pill">
          <span className="score-label">AI (O)</span>
          <span className="score-num">{scores.ai}</span>
        </span>
        <span className="score-dot">·</span>
        <span className="score-pill">
          <span className="score-label">Draws</span>
          <span className="score-num">{scores.draws}</span>
        </span>
      </div>

      {hasScores && (
        <button
          type="button"
          className="score-reset-btn"
          onClick={onResetScores}
          title="Reset score counters"
        >
          reset
        </button>
      )}
    </div>
  );
};
