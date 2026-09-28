import React, { useState } from 'react';
import { BestMoveResult } from '../ai/minimax';

interface AiInfoSectionProps {
  analysis: BestMoveResult | null;
  useAlphaBeta: boolean;
  onToggleAlphaBeta: () => void;
}

export const AiInfoSection: React.FC<AiInfoSectionProps> = ({
  analysis,
  useAlphaBeta,
  onToggleAlphaBeta,
}) => {
  const [showTelemetry, setShowTelemetry] = useState(false);

  return (
    <section className="ai-info-section" aria-label="About the AI">
      <div className="ai-info-header">
        <h2 className="ai-info-title">About the AI</h2>
        <button
          type="button"
          className="ai-details-toggle"
          onClick={() => setShowTelemetry(!showTelemetry)}
        >
          {showTelemetry ? 'hide details' : 'search details'}
        </button>
      </div>

      <p className="ai-info-desc">
        Powered by the <strong>Minimax algorithm with Alpha-Beta pruning</strong>. The AI evaluates every possible future move to guarantee mathematically optimal play. Against an optimal opponent, human can at best achieve a draw.
      </p>

      {showTelemetry && (
        <div className="telemetry-box">
          <div className="telemetry-items">
            <span><strong>{analysis ? analysis.nodesEvaluated : '—'}</strong> nodes evaluated</span>
            <span>·</span>
            <span><strong>{analysis ? analysis.prunedBranches : '—'}</strong> branches cut</span>
            <span>·</span>
            <span><strong>{analysis ? `${analysis.durationMs}ms` : '—'}</strong> latency</span>
          </div>

          <button
            type="button"
            className="pruning-toggle-btn"
            onClick={onToggleAlphaBeta}
          >
            Alpha-Beta Pruning: {useAlphaBeta ? 'ON' : 'OFF'}
          </button>
        </div>
      )}
    </section>
  );
};
