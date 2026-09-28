import { describe, it, expect } from 'vitest';
import { Board } from '../src/game/types';
import {
  createEmptyBoard,
  cloneBoard,
  checkWinner,
  isBoardFull,
  getAvailableMoves,
  isTerminal,
  WINNING_LINES,
} from '../src/game/rules';
import { findBestMove } from '../src/ai/minimax';

describe('Gameplay Rules & State Management', () => {
  it('has exactly 8 winning lines in 3x3 grid', () => {
    expect(WINNING_LINES).toHaveLength(8);
  });

  it('cloneBoard creates an independent shallow copy', () => {
    const original: Board = ['X', null, 'O', null, null, null, null, null, null];
    const cloned = cloneBoard(original);
    expect(cloned).toEqual(original);
    cloned[1] = 'X';
    expect(original[1]).toBeNull();
  });

  it('correctly tracks available moves as board fills up', () => {
    const board = createEmptyBoard();
    expect(getAvailableMoves(board)).toHaveLength(9);

    board[4] = 'X';
    expect(getAvailableMoves(board)).toEqual([0, 1, 2, 3, 5, 6, 7, 8]);

    board[0] = 'O';
    expect(getAvailableMoves(board)).toEqual([1, 2, 3, 5, 6, 7, 8]);
  });

  it('returns terminal state correctly for incomplete, win, and draw boards', () => {
    const incomplete = createEmptyBoard();
    expect(isTerminal(incomplete)).toBe(false);

    const winBoard: Board = [
      'X', 'X', 'X',
      null, 'O', null,
      'O', null, null,
    ];
    expect(isTerminal(winBoard)).toBe(true);
    expect(checkWinner(winBoard)?.winner).toBe('X');

    const drawBoard: Board = [
      'X', 'O', 'X',
      'X', 'O', 'O',
      'O', 'X', 'X',
    ];
    expect(isTerminal(drawBoard)).toBe(true);
    expect(isBoardFull(drawBoard)).toBe(true);
    expect(checkWinner(drawBoard)).toBeNull();
  });

  it('AI never picks an occupied cell across arbitrary random game states', () => {
    // Generate various partially filled valid boards
    const sampleBoards: Board[] = [
      ['X', null, null, null, 'O', null, null, null, null],
      ['X', 'O', 'X', null, null, null, null, null, null],
      ['X', null, 'O', null, 'X', null, null, null, 'O'],
      ['O', 'X', 'O', 'X', 'X', null, null, null, null],
    ];

    for (const b of sampleBoards) {
      const { bestMove } = findBestMove(b, 'O', 'X', true);
      expect(b[bestMove]).toBeNull();
    }
  });

  it('AI returns bestMove = -1 on terminal or fully filled board', () => {
    const fullBoard: Board = [
      'X', 'O', 'X',
      'X', 'O', 'O',
      'O', 'X', 'X',
    ];
    const result = findBestMove(fullBoard, 'O', 'X');
    expect(result.bestMove).toBe(-1);
  });
});
