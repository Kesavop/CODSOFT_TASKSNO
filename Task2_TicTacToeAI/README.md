# Tic-Tac-Toe AI

> **CodSoft Artificial Intelligence Internship · Task 2**  
> An unbeatable, game-theoretic Tic-Tac-Toe AI agent powered by the **Minimax Algorithm** with **Alpha-Beta Pruning**.

---

## Overview

This project was developed as part of the **CodSoft Artificial Intelligence Internship (Task 2)**. The objective was to design, implement, and validate an AI agent that plays the classic game of Tic-Tac-Toe against a human opponent. 

Using game theory and adversarial search algorithms, the agent exhaustively explores future game states and plays optimally at every turn. As mathematically proven by zero-sum game theory, an optimal agent in Tic-Tac-Toe can never be defeated; the human player can at best achieve a draw.

---

## Features

- **Human vs AI Gameplay**: Interactive 3x3 board where the human plays as **X** and the AI plays as **O**.
- **Minimax Algorithm**: Evaluates complete decision trees to choose the mathematically optimal move.
- **Alpha-Beta Pruning**: Drastically optimizes search tree traversal by pruning irrelevant branches without sacrificing optimality.
- **Guaranteed Unbeatable**: Verified via exhaustive simulation across every legal human move sequence (**0 Human Wins**).
- **Depth-Weighted Scoring**: Prioritizes fast wins and delays losses as long as possible.
- **Turn & Outcome Detection**: Instant detection of row, column, and diagonal wins, as well as forced draws.
- **Dynamic Diagnostics**: Live telemetry tracking nodes explored, pruned branches, board evaluation score, and search latency.
- **First-Mover Flexibility**: Option to start as Human First (default) or AI First.
- **Alpha-Beta Toggle**: Allows real-time comparison between raw Minimax and Alpha-Beta pruned search.
- **Restrained, Human-Crafted UI**: Clean indie game design with warm paper tones, crisp typography, and mobile-friendly touch targets.

---

## How the AI Works

### 1. Game States
The game of Tic-Tac-Toe has a finite state space:
- An empty 3x3 board starts with $3^9 = 19,683$ theoretical arrangements, but only **5,478** legal game states can actually be reached.
- Every state represents a node in the game tree.

### 2. Minimax Algorithm
Minimax is a recursive backtracking algorithm used in two-player zero-sum games with perfect information. It operates under the assumption that both participants play optimally:
- **Maximizing Player (AI / 'O')**: Selects the child node with the highest possible score.
- **Minimizing Player (Human / 'X')**: Assumed to select the child node with the lowest possible score.

### 3. Depth Weighting (Heuristic Function)
To prevent the AI from playing lazily when a win is inevitable, depth weighting is incorporated:
- **AI Wins**: $+10 - \text{depth}$  
  *(A win in 1 move earns $+9$, whereas a win in 3 moves earns $+7$. The AI prefers faster victories).*
- **Human Wins**: $-10 + \text{depth}$  
  *(If defeat were possible, the AI would maximize depth to delay the loss).*
- **Draw**: $0$

### 4. Alpha-Beta Pruning
While Tic-Tac-Toe has a relatively small search tree, computing full minimax trees can be computationally redundant. Alpha-Beta pruning introduces two bounds:
- **$\alpha$ (Alpha)**: The best value the maximizing player is guaranteed so far (initialized to $-\infty$).
- **$\beta$ (Beta)**: The best value the minimizing player is guaranteed so far (initialized to $+\infty$).

When exploring a node, if $\beta \le \alpha$, the opponent already has an alternative that guarantees a better outcome elsewhere in the tree. The remaining sibling branches are **pruned** (skipped), yielding the exact same move with a fraction of the node evaluations.

---

## Algorithm

### Minimax with Alpha-Beta Pruning Pseudocode

```text
function minimax(board, depth, isMaximizing, alpha, beta):
    if terminal state reached (win or draw):
        if AI won:
            return +10 - depth
        else if Human won:
            return -10 + depth
        else:
            return 0

    if isMaximizing:
        maxEval = -Infinity
        for each available move in board:
            make move for AI on board
            eval = minimax(board, depth + 1, false, alpha, beta)
            undo move on board
            maxEval = max(maxEval, eval)
            alpha = max(alpha, eval)
            if beta <= alpha:
                break // Alpha-Beta Cutoff
        return maxEval
    else:
        minEval = +Infinity
        for each available move in board:
            make move for Human on board
            eval = minimax(board, depth + 1, true, alpha, beta)
            undo move on board
            minEval = min(minEval, eval)
            beta = min(beta, eval)
            if beta <= alpha:
                break // Alpha-Beta Cutoff
        return minEval
```

---

## Project Structure

```text
task2/
├── index.html               # Main HTML entry point
├── package.json             # Scripts & dependencies
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite & Vitest configuration
├── src/
│   ├── main.tsx             # Application bootstrap
│   ├── App.tsx              # Main UI component layout
│   ├── ai/
│   │   └── minimax.ts       # Minimax search & Alpha-Beta pruning engine
│   ├── game/
│   │   ├── types.ts         # TypeScript models (Board, WinInfo, Player)
│   │   ├── rules.ts         # Winning lines, draw detection, board helpers
│   │   └── useGame.ts       # Custom React hook managing game state & turns
│   ├── components/
│   │   ├── Header.tsx       # Clean game heading & subtitle
│   │   ├── ScoreBoard.tsx   # Typographic inline score counter
│   │   ├── StatusBanner.tsx # Dynamic integrated turn & outcome announcements
│   │   ├── GameBoard.tsx    # 3x3 physical-feel game grid with tactile cells
│   │   ├── GameControls.tsx # New Game button, starter selector & score reset
│   │   └── AiInfoSection.tsx# Secondary AI algorithm note & search telemetry drawer
│   └── styles/
│       └── index.css        # Restrained, warm editorial design & responsive grid
└── tests/
    ├── minimax.test.ts      # Unit tests & exhaustive game-tree simulation
    └── gameplay.test.ts     # Rules, board state invariants, and edge cases
```

---

## Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended, tested on Node v24)
- npm (v9 or higher)

### 1. Clone or Navigate to Directory
```bash
cd /Users/kesavkrishnan/CODSOFT_TASKSNO/task2
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open the local URL (usually `http://localhost:5173`) in your browser to play against the AI.

### 4. Build for Production
```bash
npm run build
```
Creates an optimized static bundle in the `dist/` directory.

---

## Testing

Run the automated test suite powered by **Vitest**:

```bash
npm test
```

### AI Validation (Exhaustive Proof)
To mathematically verify that the AI is unbeatable, the test suite executes an **exhaustive game-tree exploration**:

1. **Human-First Exhaustive Simulation**:
   - The test recursively plays every legal move the human could possibly make across all turns.
   - For every state, the AI responds with `findBestMove`.
   - Result: **521 unique completed game paths explored**.
   - Outcomes: **368 AI Wins**, **153 Draws**, **0 Human Wins**.

2. **AI-First Exhaustive Simulation**:
   - AI starts by taking the optimal strategic cell.
   - Every legal human counter-move is recursively explored.
   - Result: **92 unique completed game paths explored**.
   - Outcomes: **82 AI Wins**, **10 Draws**, **0 Human Wins**.

3. **Core Scenario Unit Tests**:
   - Immediate winning moves detected and taken.
   - Immediate human threats blocked across rows, columns, and diagonals.
   - Immediate win prioritized over blocking.
   - Forced draw recognized.
   - Occupied cells and illegal moves strictly rejected.
   - Alpha-Beta pruning produces identical scores with significantly fewer node expansions.

---

## Technologies Used

- **React 18**: Component-based user interface.
- **TypeScript**: Type safety for game rules, board representations, and AI search results.
- **Vite 5**: Fast build tooling and local development server.
- **Vitest**: Unit testing framework with native TypeScript support.
- **Lucide React**: Modern, accessible UI icons.
- **Vanilla CSS3**: Custom modern dark theme with glassmorphism, responsive CSS grid, and animations.

---

## CodSoft Internship

This project was developed by **Kesavkrishnan** for the **CodSoft Artificial Intelligence Internship - Task 2 (Tic-Tac-Toe AI)**.
