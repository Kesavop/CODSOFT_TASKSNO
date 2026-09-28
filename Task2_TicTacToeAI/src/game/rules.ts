/**
 * Game rules and board evaluation functions
 * CodSoft AI Internship - Task 2
 */

import { Board, Cell, WinInfo } from './types';

/**
 * 8 winning lines in a 3x3 Tic-Tac-Toe grid:
 * 3 horizontal rows, 3 vertical columns, 2 diagonals
 */
export const WINNING_LINES: readonly [number, number, number][] = [
  // Rows
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  // Columns
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  // Diagonals
  [0, 4, 8],
  [2, 4, 6],
];

/**
 * Creates a fresh, empty 3x3 board (9 null cells)
 */
export function createEmptyBoard(): Board {
  return Array<Cell>(9).fill(null);
}

/**
 * Deep clones a board to prevent unintended mutation
 */
export function cloneBoard(board: Board): Board {
  return [...board];
}

/**
 * Returns winning information if there is a winner, or null otherwise
 */
export function checkWinner(board: Board): WinInfo | null {
  for (let i = 0; i < WINNING_LINES.length; i++) {
    const [a, b, c] = WINNING_LINES[i];
    const cellA = board[a];
    if (cellA !== null && cellA === board[b] && cellA === board[c]) {
      return {
        winner: cellA,
        line: [a, b, c],
      };
    }
  }
  return null;
}

/**
 * Returns true if all cells on the board are occupied
 */
export function isBoardFull(board: Board): boolean {
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) return false;
  }
  return true;
}

/**
 * Returns an array of indices of all currently unoccupied cells
 */
export function getAvailableMoves(board: Board): number[] {
  const moves: number[] = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) {
      moves.push(i);
    }
  }
  return moves;
}

/**
 * Checks whether the current state is terminal (someone won or board is full)
 */
export function isTerminal(board: Board): boolean {
  return checkWinner(board) !== null || isBoardFull(board);
}
