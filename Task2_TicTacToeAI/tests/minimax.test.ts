import { describe, it, expect } from 'vitest';
import { Board } from '../src/game/types';
import {
  checkWinner,
  isBoardFull,
  getAvailableMoves,
  isTerminal,
  createEmptyBoard,
} from '../src/game/rules';
import { minimax, findBestMove } from '../src/ai/minimax';

describe('Game Rules & Board Utilities', () => {
  it('correctly creates an empty board', () => {
    const board = createEmptyBoard();
    expect(board).toHaveLength(9);
    expect(board.every((cell) => cell === null)).toBe(true);
  });

  it('detects row, column, and diagonal wins', () => {
    // Row win
    const rowWin: Board = ['X', 'X', 'X', null, 'O', null, 'O', null, null];
    expect(checkWinner(rowWin)).toEqual({ winner: 'X', line: [0, 1, 2] });

    // Column win
    const colWin: Board = ['O', 'X', null, 'O', 'X', null, 'O', null, null];
    expect(checkWinner(colWin)).toEqual({ winner: 'O', line: [0, 3, 6] });

    // Diagonal win
    const diagWin: Board = ['X', 'O', 'O', null, 'X', null, null, null, 'X'];
    expect(checkWinner(diagWin)).toEqual({ winner: 'X', line: [0, 4, 8] });

    // Incomplete game
    const incomplete: Board = ['X', 'O', null, null, null, null, null, null, null];
    expect(checkWinner(incomplete)).toBeNull();
  });

  it('detects a full board and draw condition', () => {
    const drawBoard: Board = [
      'X', 'O', 'X',
      'X', 'O', 'O',
      'O', 'X', 'X',
    ];
    expect(isBoardFull(drawBoard)).toBe(true);
    expect(checkWinner(drawBoard)).toBeNull();
    expect(isTerminal(drawBoard)).toBe(true);
  });
});

describe('Minimax AI - Core Requirements', () => {
  it('Scenario 1: AI takes an immediate winning move', () => {
    // Board state where AI (O) has 2 in a row and can win on position 2:
    // O | O | .
    // X | X | .
    // . | . | .
    const board: Board = [
      'O', 'O', null,
      'X', 'X', null,
      null, null, null,
    ];

    const result = findBestMove(board, 'O', 'X');
    expect(result.bestMove).toBe(2);
  });

  it('Scenario 2: AI blocks an immediate human winning move', () => {
    // Board state where Human (X) has 2 in a row and AI (O) must block position 2:
    // X | X | .
    // O | . | .
    // . | . | .
    const board: Board = [
      'X', 'X', null,
      'O', null, null,
      null, null, null,
    ];

    const result = findBestMove(board, 'O', 'X');
    expect(result.bestMove).toBe(2);
  });

  it('Scenario 2b: AI blocks human winning along columns and diagonals', () => {
    // Column block:
    // X | O | .
    // X | . | .
    // . | . | .
    const boardCol: Board = [
      'X', 'O', null,
      'X', null, null,
      null, null, null,
    ];
    const resultCol = findBestMove(boardCol, 'O', 'X');
    expect(resultCol.bestMove).toBe(6);

    // Diagonal block:
    // X | O | .
    // . | X | .
    // . | . | .
    const boardDiag: Board = [
      'X', 'O', null,
      null, 'X', null,
      null, null, null,
    ];
    const resultDiag = findBestMove(boardDiag, 'O', 'X');
    expect(resultDiag.bestMove).toBe(8);
  });

  it('Scenario 3: AI chooses immediate win over blocking when both exist', () => {
    // AI has winning move at 2, Human has winning move at 8:
    // O | O | . (cell 2 wins for O)
    // X | X | .
    // X | . | . (cell 6, 8 etc)
    const board: Board = [
      'O', 'O', null, // 0, 1, 2
      'X', 'X', null, // 3, 4, 5
      null, null, null,
    ];
    // If Human plays 5, human wins. But AI moves NOW, so AI should immediately take 2 and win!
    const result = findBestMove(board, 'O', 'X');
    expect(result.bestMove).toBe(2);
  });

  it('Scenario 4: AI correctly identifies a forced draw', () => {
    // Perfectly played state leading to draw:
    // X | O | X
    // X | O | O
    // O | X | .
    const board: Board = [
      'X', 'O', 'X',
      'X', 'O', 'O',
      'O', 'X', null,
    ];

    const result = findBestMove(board, 'O', 'X');
    expect(result.bestMove).toBe(8);
    expect(result.score).toBe(0); // Draw has score 0
  });

  it('Scenario 5 & 6: AI never chooses an occupied cell or makes an illegal move', () => {
    const board: Board = [
      'X', 'O', 'X',
      'O', 'X', 'O',
      'O', null, null,
    ];

    const available = getAvailableMoves(board);
    const result = findBestMove(board, 'O', 'X');

    expect(available).toContain(result.bestMove);
    expect(board[result.bestMove]).toBeNull();
  });

  it('Alpha-Beta Pruning optimizes performance while finding identical optimal outcome', () => {
    const board: Board = [
      'X', null, null,
      null, 'O', null,
      null, null, null,
    ];

    // Evaluate with Alpha-Beta
    const statsAB = { nodesEvaluated: 0, prunedBranches: 0 };
    const scoreAB = minimax(board, 0, false, -Infinity, Infinity, 'O', 'X', true, statsAB);

    // Evaluate without Alpha-Beta (pure minimax)
    const statsPure = { nodesEvaluated: 0, prunedBranches: 0 };
    const scorePure = minimax(board, 0, false, -Infinity, Infinity, 'O', 'X', false, statsPure);

    // Must yield the exact same minimax value
    expect(scoreAB).toBe(scorePure);

    // Alpha-beta must evaluate significantly fewer nodes and have pruned branches
    expect(statsAB.nodesEvaluated).toBeLessThan(statsPure.nodesEvaluated);
    expect(statsAB.prunedBranches).toBeGreaterThan(0);
  });

  it('Depth weighting: AI prefers faster win (depth 1 over depth 3)', () => {
    // Board where AI can win in 1 move vs 3 moves
    const board: Board = [
      'O', 'O', null, // move 2 wins immediately
      'X', 'X', null,
      null, null, null,
    ];

    const result = findBestMove(board, 'O', 'X');
    expect(result.bestMove).toBe(2);
    // Score should be positive
    expect(result.score).toBeGreaterThan(0);
  });
});

describe('Exhaustive AI Validation: Unbeatable Verification', () => {
  /**
   * Scenario 7: Exhaustively simulate EVERY possible legal human move sequence.
   *
   * In this test, we recursively explore every possible decision tree branch that
   * a human player could choose from the start of the game until termination.
   *
   * At every step where it is the AI's turn, the AI uses `findBestMove`.
   * At every step where it is the Human's turn, we branch across ALL available moves.
   *
   * We count:
   * - Total games completed
   * - AI wins
   * - Draws
   * - Human wins
   *
   * We assert:
   * - Human wins === 0
   * - All completed games are either AI win or Draw
   */
  it('Guarantees 0 Human Wins across ALL legal game trees when Human plays first (X)', () => {
    let gamesSimulated = 0;
    let aiWins = 0;
    let draws = 0;
    let humanWins = 0;

    function simulateGame(currentBoard: Board, isHumanTurn: boolean, path: number[] = []) {
      const winnerInfo = checkWinner(currentBoard);
      if (winnerInfo) {
        gamesSimulated++;
        if (winnerInfo.winner === 'X') {
          humanWins++;
          if (humanWins <= 3) {
            console.log('Human won with path:', path, 'board:', currentBoard);
          }
        } else {
          aiWins++;
        }
        return;
      }

      if (isBoardFull(currentBoard)) {
        gamesSimulated++;
        draws++;
        return;
      }

      if (isHumanTurn) {
        // Explore EVERY possible move the human can make
        const legalHumanMoves = getAvailableMoves(currentBoard);
        for (const move of legalHumanMoves) {
          currentBoard[move] = 'X';
          simulateGame(currentBoard, false, [...path, move]);
          currentBoard[move] = null; // Backtrack
        }
      } else {
        // AI makes its optimal move
        const { bestMove } = findBestMove(currentBoard, 'O', 'X', true);
        currentBoard[bestMove] = 'O';
        simulateGame(currentBoard, true, [...path, bestMove]);
        currentBoard[bestMove] = null; // Backtrack
      }
    }

    const emptyBoard = createEmptyBoard();
    simulateGame(emptyBoard, true); // Human starts

    // Crucial Assertions:
    expect(humanWins).toBe(0);
    expect(gamesSimulated).toBeGreaterThan(0);
    expect(aiWins + draws).toBe(gamesSimulated);

    console.log(
      `[Exhaustive Human-First Test Passed] Total simulated game paths: ${gamesSimulated} | AI Wins: ${aiWins} | Draws: ${draws} | Human Wins: ${humanWins}`
    );
  });

  it('Guarantees 0 Human Wins across ALL legal game trees when AI plays first (O)', () => {
    let gamesSimulated = 0;
    let aiWins = 0;
    let draws = 0;
    let humanWins = 0;

    function simulateGame(currentBoard: Board, isAiTurn: boolean) {
      const winnerInfo = checkWinner(currentBoard);
      if (winnerInfo) {
        gamesSimulated++;
        if (winnerInfo.winner === 'X') {
          humanWins++;
        } else {
          aiWins++;
        }
        return;
      }

      if (isBoardFull(currentBoard)) {
        gamesSimulated++;
        draws++;
        return;
      }

      if (isAiTurn) {
        const { bestMove } = findBestMove(currentBoard, 'O', 'X', true);
        expect(bestMove).toBeGreaterThanOrEqual(0);
        expect(bestMove).toBeLessThan(9);
        expect(currentBoard[bestMove]).toBeNull();

        currentBoard[bestMove] = 'O';
        simulateGame(currentBoard, false);
        currentBoard[bestMove] = null;
      } else {
        const legalHumanMoves = getAvailableMoves(currentBoard);
        for (const move of legalHumanMoves) {
          currentBoard[move] = 'X';
          simulateGame(currentBoard, true);
          currentBoard[move] = null;
        }
      }
    }

    const emptyBoard = createEmptyBoard();
    simulateGame(emptyBoard, true); // AI starts

    // Crucial Assertions:
    expect(humanWins).toBe(0);
    expect(gamesSimulated).toBeGreaterThan(0);
    expect(aiWins + draws).toBe(gamesSimulated);

    console.log(
      `[Exhaustive AI-First Test Passed] Total simulated game paths: ${gamesSimulated} | AI Wins: ${aiWins} | Draws: ${draws} | Human Wins: ${humanWins}`
    );
  });
});
