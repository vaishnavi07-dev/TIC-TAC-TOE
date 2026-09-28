import { Board, CellState, GameWinner, PlayerMark, AIDifficulty } from '../types/game';

export const WINNING_COMBINATIONS: readonly [number, number, number][] = [
  [0, 1, 2], // row 1
  [3, 4, 5], // row 2
  [6, 7, 8], // row 3
  [0, 3, 6], // col 1
  [1, 4, 7], // col 2
  [2, 5, 8], // col 3
  [0, 4, 8], // diagonal 1
  [2, 4, 6], // diagonal 2
];

/**
 * Checks the current board for a winner, draw, or ongoing game.
 */
export function evaluateBoard(board: Board): {
  winner: GameWinner;
  winningLine: number[] | null;
} {
  for (const [a, b, c] of WINNING_COMBINATIONS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return {
        winner: board[a] as PlayerMark,
        winningLine: [a, b, c],
      };
    }
  }

  const isFull = board.every((cell) => cell !== null);
  if (isFull) {
    return {
      winner: 'draw',
      winningLine: null,
    };
  }

  return {
    winner: null,
    winningLine: null,
  };
}

/**
 * Returns all unoccupied indices on the board.
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
 * Minimax algorithm with full alpha-beta pruning.
 * Maximizes AI's score, minimizes Human's score.
 */
function minimax(
  board: Board,
  depth: number,
  isMaximizing: boolean,
  aiMark: PlayerMark,
  humanMark: PlayerMark,
  alpha: number,
  beta: number
): number {
  const { winner } = evaluateBoard(board);

  if (winner === aiMark) {
    return 10 - depth;
  }
  if (winner === humanMark) {
    return depth - 10;
  }
  if (winner === 'draw') {
    return 0;
  }

  const availableMoves = getAvailableMoves(board);

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of availableMoves) {
      board[move] = aiMark;
      const evaluation = minimax(board, depth + 1, false, aiMark, humanMark, alpha, beta);
      board[move] = null;
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) {
        break; // Alpha-beta cutoff
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of availableMoves) {
      board[move] = humanMark;
      const evaluation = minimax(board, depth + 1, true, aiMark, humanMark, alpha, beta);
      board[move] = null;
      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) {
        break; // Alpha-beta cutoff
      }
    }
    return minEval;
  }
}

/**
 * Calculates best move for Minimax AI instantly given current board and difficulty.
 * Pure Minimax - No external LLM or API calls.
 */
export function getBestAIMove(
  board: Board,
  aiMark: PlayerMark,
  difficulty: AIDifficulty = 'impossible'
): number {
  const availableMoves = getAvailableMoves(board);
  if (availableMoves.length === 0) {
    return -1;
  }

  const humanMark: PlayerMark = aiMark === 'X' ? 'O' : 'X';

  // 1. Easy difficulty: 75% random move, 25% smart move
  if (difficulty === 'easy') {
    const shouldPlayRandom = Math.random() < 0.75;
    if (shouldPlayRandom) {
      const randomIndex = Math.floor(Math.random() * availableMoves.length);
      return availableMoves[randomIndex];
    }
  }

  // 2. Medium difficulty: 35% random move, 65% smart move
  if (difficulty === 'medium') {
    const shouldPlayRandom = Math.random() < 0.35;
    if (shouldPlayRandom) {
      const randomIndex = Math.floor(Math.random() * availableMoves.length);
      return availableMoves[randomIndex];
    }
  }

  // 3. Fast-path: Check for immediate winning move (0ms)
  for (const move of availableMoves) {
    board[move] = aiMark;
    const { winner } = evaluateBoard(board);
    board[move] = null;
    if (winner === aiMark) {
      return move;
    }
  }

  // 4. Fast-path: Check for immediate blocking move (0ms)
  for (const move of availableMoves) {
    board[move] = humanMark;
    const { winner } = evaluateBoard(board);
    board[move] = null;
    if (winner === humanMark) {
      return move;
    }
  }

  // 5. Fast-path: If center is available on opening (move 1 or 2), center is always optimal
  if (availableMoves.length >= 7 && board[4] === null) {
    return 4;
  }

  // 6. Impossible difficulty: Minimax with full Alpha-Beta pruning across all branches
  let bestScore = -Infinity;
  let bestMoves: number[] = [];
  let alpha = -Infinity;
  const beta = Infinity;

  for (const move of availableMoves) {
    board[move] = aiMark;
    const score = minimax(board, 0, false, aiMark, humanMark, alpha, beta);
    board[move] = null;

    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
    alpha = Math.max(alpha, bestScore);
  }

  // Pick randomly among moves tied for best score for variety
  const chosenIndex = Math.floor(Math.random() * bestMoves.length);
  return bestMoves[chosenIndex];
}
