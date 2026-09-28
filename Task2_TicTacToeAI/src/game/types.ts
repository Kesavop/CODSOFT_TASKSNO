/**
 * Core type definitions for Tic-Tac-Toe AI
 * CodSoft AI Internship - Task 2
 */

export type Player = 'X' | 'O';
export type Cell = Player | null;
export type Board = Cell[];

export type GameStatus = 'in_progress' | 'won' | 'draw';

export interface WinInfo {
  winner: Player;
  line: [number, number, number];
}

export type StartingPlayer = 'human' | 'ai';

export interface GameScore {
  human: number;
  ai: number;
  draws: number;
}

export interface MoveAnalysis {
  move: number;
  score: number;
  depth: number;
  nodesEvaluated: number;
  prunedBranches: number;
  durationMs: number;
}
