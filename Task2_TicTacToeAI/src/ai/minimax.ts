/**
 * Minimax Algorithm with Alpha-Beta Pruning
 * CodSoft AI Internship - Task 2: Tic-Tac-Toe AI
 *
 * Game Theory Overview:
 * Tic-Tac-Toe is a zero-sum, perfect information game. The Minimax algorithm
 * searches the game tree to determine the optimal move by assuming both
 * players make optimal choices:
 * - Maximizing Player (AI): Seeks to maximize the terminal score.
 * - Minimizing Player (Human): Seeks to minimize the terminal score.
 *
 * Alpha-Beta Pruning:
 * An optimization that maintains two bounds:
 * - Alpha: Best score guaranteed for the maximizing player so far.
 * - Beta: Best score guaranteed for the minimizing player so far.
 * When Beta <= Alpha, the current branch is guaranteed not to affect the
 * final decision, allowing us to prune (skip) evaluating remaining sub-trees.
 */

import { Board, Player } from '../game/types';
import { checkWinner, getAvailableMoves, isBoardFull } from '../game/rules';

export interface SearchStats {
  nodesEvaluated: number;
  prunedBranches: number;
}

export interface BestMoveResult {
  bestMove: number;
  score: number;
  nodesEvaluated: number;
  prunedBranches: number;
  durationMs: number;
}

/**
 * Standard Minimax with optional Alpha-Beta Pruning.
 *
 * @param board Current board state
 * @param depth Current search depth (used for path-length optimization)
 * @param isMaximizing True if it is the AI's turn (maximizing score)
 * @param alpha Highest value found along the path for maximizer (-Infinity initially)
 * @param beta Lowest value found along the path for minimizer (+Infinity initially)
 * @param aiPlayer Symbol used by AI ('O')
 * @param humanPlayer Symbol used by Human ('X')
 * @param useAlphaBeta Whether to prune branches using alpha-beta cutoffs
 * @param stats Counter tracking evaluation metrics for analysis
 * @returns Heuristic / terminal score of the game state
 */
export function minimax(
  board: Board,
  depth: number,
  isMaximizing: boolean,
  alpha: number = -Infinity,
  beta: number = Infinity,
  aiPlayer: Player = 'O',
  humanPlayer: Player = 'X',
  useAlphaBeta: boolean = true,
  stats?: SearchStats
): number {
  if (stats) {
    stats.nodesEvaluated++;
  }

  // --- Base Cases: Check for terminal states ---
  const winInfo = checkWinner(board);
  if (winInfo !== null) {
    if (winInfo.winner === aiPlayer) {
      // AI win: prefer faster wins (smaller depth)
      return 10 - depth;
    } else {
      // Human win: prefer delaying loss as long as possible (larger depth)
      return -10 + depth;
    }
  }

  if (isBoardFull(board)) {
    // Draw state
    return 0;
  }

  const availableMoves = getAvailableMoves(board);

  if (isMaximizing) {
    // Maximizing Player (AI)
    let maxEval = -Infinity;

    for (const move of availableMoves) {
      board[move] = aiPlayer;
      const evaluation = minimax(
        board,
        depth + 1,
        false,
        alpha,
        beta,
        aiPlayer,
        humanPlayer,
        useAlphaBeta,
        stats
      );
      board[move] = null; // Backtrack

      maxEval = Math.max(maxEval, evaluation);

      if (useAlphaBeta) {
        alpha = Math.max(alpha, evaluation);
        // Alpha-Beta Cutoff: Minimizer will not allow this path if beta <= alpha
        if (beta <= alpha) {
          if (stats) stats.prunedBranches++;
          break;
        }
      }
    }

    return maxEval;
  } else {
    // Minimizing Player (Human)
    let minEval = Infinity;

    for (const move of availableMoves) {
      board[move] = humanPlayer;
      const evaluation = minimax(
        board,
        depth + 1,
        true,
        alpha,
        beta,
        aiPlayer,
        humanPlayer,
        useAlphaBeta,
        stats
      );
      board[move] = null; // Backtrack

      minEval = Math.min(minEval, evaluation);

      if (useAlphaBeta) {
        beta = Math.min(beta, evaluation);
        // Alpha-Beta Cutoff: Maximizer will not allow this path if beta <= alpha
        if (beta <= alpha) {
          if (stats) stats.prunedBranches++;
          break;
        }
      }
    }

    return minEval;
  }
}

/**
 * Finds the optimal move for the AI using Minimax with Alpha-Beta Pruning.
 *
 * @param board Current board state
 * @param aiPlayer AI player symbol (default 'O')
 * @param humanPlayer Human player symbol (default 'X')
 * @param useAlphaBeta Whether alpha-beta pruning is enabled
 * @returns BestMoveResult containing the optimal move index and search diagnostics
 */
export function findBestMove(
  board: Board,
  aiPlayer: Player = 'O',
  humanPlayer: Player = 'X',
  useAlphaBeta: boolean = true
): BestMoveResult {
  const startTime = performance.now();
  const availableMoves = getAvailableMoves(board);

  if (availableMoves.length === 0) {
    return {
      bestMove: -1,
      score: 0,
      nodesEvaluated: 0,
      prunedBranches: 0,
      durationMs: 0,
    };
  }

  // Strategic opening shortcut for first move if the board is completely empty:
  // Playing the center (4) is optimal for 3x3 Tic-Tac-Toe.
  // We can let Minimax calculate it or verify it, but let's let Minimax evaluate
  // with strategic preference to break ties cleanly.
  const stats: SearchStats = {
    nodesEvaluated: 0,
    prunedBranches: 0,
  };

  let bestScore = -Infinity;
  let bestMove = availableMoves[0];

  // Strategic tie-breaker priority: Center (4) > Corners (0, 2, 6, 8) > Edges (1, 3, 5, 7)
  const getPositionPriority = (pos: number): number => {
    if (pos === 4) return 3; // Center
    if ([0, 2, 6, 8].includes(pos)) return 2; // Corners
    return 1; // Edges
  };

  for (const move of availableMoves) {
    board[move] = aiPlayer;
    const score = minimax(
      board,
      0,
      false, // Next turn is Minimizing player (Human)
      -Infinity,
      Infinity,
      aiPlayer,
      humanPlayer,
      useAlphaBeta,
      stats
    );
    board[move] = null; // Backtrack

    // If strictly better score, choose it
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    } else if (score === bestScore) {
      // Tie-breaker: choose better strategic position
      if (getPositionPriority(move) > getPositionPriority(bestMove)) {
        bestMove = move;
      }
    }
  }

  const durationMs = Math.round((performance.now() - startTime) * 100) / 100;

  return {
    bestMove,
    score: bestScore,
    nodesEvaluated: stats.nodesEvaluated,
    prunedBranches: stats.prunedBranches,
    durationMs,
  };
}
