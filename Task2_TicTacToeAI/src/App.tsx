import React from 'react';
import { useGame } from './game/useGame';
import { Header } from './components/Header';
import { ScoreBoard } from './components/ScoreBoard';
import { StatusBanner } from './components/StatusBanner';
import { GameBoard } from './components/GameBoard';
import { GameControls } from './components/GameControls';
import { AiInfoSection } from './components/AiInfoSection';

export const App: React.FC = () => {
  const {
    board,
    currentPlayer,
    isAiThinking,
    winner,
    winningLine,
    isDraw,
    isGameOver,
    scores,
    startingPlayer,
    lastAiAnalysis,
    useAlphaBeta,
    setUseAlphaBeta,
    handleCellClick,
    restartGame,
    setStartingPlayer,
    resetScores,
  } = useGame();

  return (
    <main className="game-container">
      <Header />
      <ScoreBoard scores={scores} onResetScores={resetScores} />

      <StatusBanner
        winner={winner}
        isDraw={isDraw}
        currentPlayer={currentPlayer}
        isAiThinking={isAiThinking}
      />

      <GameBoard
        board={board}
        winningLine={winningLine}
        isGameOver={isGameOver}
        isAiThinking={isAiThinking}
        onCellClick={handleCellClick}
      />

      <GameControls
        startingPlayer={startingPlayer}
        onRestart={() => restartGame()}
        onSelectStarter={setStartingPlayer}
      />

      <AiInfoSection
        analysis={lastAiAnalysis}
        useAlphaBeta={useAlphaBeta}
        onToggleAlphaBeta={() => setUseAlphaBeta(!useAlphaBeta)}
      />

      <footer className="app-footer">
        CodSoft Artificial Intelligence Internship · Task 2
      </footer>
    </main>
  );
};

export default App;
