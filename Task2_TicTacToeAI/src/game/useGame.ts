/**
 * Custom React Hook managing Tic-Tac-Toe Game State & AI Turn
 * CodSoft AI Internship - Task 2
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Board, Player, StartingPlayer, GameScore } from './types';
import { createEmptyBoard, checkWinner, isBoardFull } from './rules';
import { findBestMove, BestMoveResult } from '../ai/minimax';

const SCORE_STORAGE_KEY = 'codsoft_ttt_score_v1';

export function useGame() {
  const [board, setBoard] = useState<Board>(createEmptyBoard());
  const [startingPlayer, setStartingPlayerState] = useState<StartingPlayer>('human');
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [winningLine, setWinningLine] = useState<[number, number, number] | null>(null);
  const [isDraw, setIsDraw] = useState<boolean>(false);
  const [useAlphaBeta, setUseAlphaBeta] = useState<boolean>(true);
  const [lastAiAnalysis, setLastAiAnalysis] = useState<BestMoveResult | null>(null);

  // Score persistence in localStorage
  const [scores, setScores] = useState<GameScore>(() => {
    try {
      const saved = localStorage.getItem(SCORE_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore storage errors
    }
    return { human: 0, ai: 0, draws: 0 };
  });

  const isGameOver = winner !== null || isDraw;
  const aiPlayer: Player = 'O';
  const humanPlayer: Player = 'X';

  // Keep a ref to track current board in asynchronous timeouts
  const boardRef = useRef<Board>(board);
  boardRef.current = board;

  const isGameOverRef = useRef<boolean>(isGameOver);
  isGameOverRef.current = isGameOver;

  const isAiThinkingRef = useRef<boolean>(isAiThinking);
  isAiThinkingRef.current = isAiThinking;

  // Save scores to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(SCORE_STORAGE_KEY, JSON.stringify(scores));
    } catch {
      // Ignore storage errors
    }
  }, [scores]);

  /**
   * Resets the board and initiates the game with the selected starting player
   */
  const restartGame = useCallback((newStarter?: StartingPlayer) => {
    const starter = newStarter || startingPlayer;
    const freshBoard = createEmptyBoard();
    setBoard(freshBoard);
    setWinner(null);
    setWinningLine(null);
    setIsDraw(false);
    setIsAiThinking(false);

    if (starter === 'human') {
      setCurrentPlayer(humanPlayer);
    } else {
      // AI starts: Make first move with a slight natural delay
      setCurrentPlayer(aiPlayer);
      setIsAiThinking(true);
      setTimeout(() => {
        const analysis = findBestMove(freshBoard, aiPlayer, humanPlayer, useAlphaBeta);
        setLastAiAnalysis(analysis);
        const updatedBoard = [...freshBoard];
        updatedBoard[analysis.bestMove] = aiPlayer;
        setBoard(updatedBoard);
        setCurrentPlayer(humanPlayer);
        setIsAiThinking(false);
      }, 350);
    }
  }, [startingPlayer, humanPlayer, aiPlayer, useAlphaBeta]);

  /**
   * Change starting player setting
   */
  const setStartingPlayer = useCallback((player: StartingPlayer) => {
    setStartingPlayerState(player);
    restartGame(player);
  }, [restartGame]);

  /**
   * Reset all accumulated scores
   */
  const resetScores = useCallback(() => {
    const emptyScore = { human: 0, ai: 0, draws: 0 };
    setScores(emptyScore);
    try {
      localStorage.setItem(SCORE_STORAGE_KEY, JSON.stringify(emptyScore));
    } catch {
      // Ignore storage errors
    }
  }, []);

  /**
   * Handles human click on a cell
   */
  const handleCellClick = useCallback((index: number) => {
    // Ignore click if cell occupied, game over, or AI is currently computing
    if (board[index] !== null || isGameOver || isAiThinking || currentPlayer !== humanPlayer) {
      return;
    }

    // Apply human move
    const newBoard = [...board];
    newBoard[index] = humanPlayer;
    setBoard(newBoard);

    // Check terminal condition after human move
    const winInfo = checkWinner(newBoard);
    if (winInfo) {
      setWinner(winInfo.winner);
      setWinningLine(winInfo.line);
      setScores((prev) => ({ ...prev, human: prev.human + 1 }));
      return;
    }

    if (isBoardFull(newBoard)) {
      setIsDraw(true);
      setScores((prev) => ({ ...prev, draws: prev.draws + 1 }));
      return;
    }

    // Switch to AI turn
    setCurrentPlayer(aiPlayer);
    setIsAiThinking(true);

    // AI computes response with a realistic 300ms visual delay for smooth UX
    setTimeout(() => {
      // Double-check game hasn't been reset while waiting
      if (isGameOverRef.current) return;

      const analysis = findBestMove(newBoard, aiPlayer, humanPlayer, useAlphaBeta);
      setLastAiAnalysis(analysis);

      if (analysis.bestMove >= 0 && analysis.bestMove < 9 && newBoard[analysis.bestMove] === null) {
        const aiBoard = [...newBoard];
        aiBoard[analysis.bestMove] = aiPlayer;
        setBoard(aiBoard);

        const aiWinInfo = checkWinner(aiBoard);
        if (aiWinInfo) {
          setWinner(aiWinInfo.winner);
          setWinningLine(aiWinInfo.line);
          setScores((prev) => ({ ...prev, ai: prev.ai + 1 }));
        } else if (isBoardFull(aiBoard)) {
          setIsDraw(true);
          setScores((prev) => ({ ...prev, draws: prev.draws + 1 }));
        } else {
          setCurrentPlayer(humanPlayer);
        }
      }

      setIsAiThinking(false);
    }, 280);
  }, [board, isGameOver, isAiThinking, currentPlayer, humanPlayer, aiPlayer, useAlphaBeta]);

  return {
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
  };
}
