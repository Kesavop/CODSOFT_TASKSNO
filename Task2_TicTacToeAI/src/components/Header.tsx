import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="game-header">
      <h1 className="game-title">Tic-Tac-Toe</h1>
      <p className="game-subtitle">An unbeatable game against Minimax AI</p>
    </header>
  );
};
