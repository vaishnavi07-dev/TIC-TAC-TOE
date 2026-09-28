import { GameEvent, ProjectedState, SnapshotState, Board, PlayerMark, GameWinner } from '../types/game';
import { evaluateBoard } from './ticTacToe';

/**
 * Creates a fresh empty 3x3 board
 */
export function createEmptyBoard(): Board {
  return Array(9).fill(null);
}

/**
 * Pure Event Sourcing Projection:
 * Reconstructs the complete game state and intermediate historical snapshots
 * by sequentially replaying an append-only stream of game events.
 */
export function replayGameState(rawEvents: GameEvent[]): ProjectedState {
  // Sort events chronologically by sequence number
  const sortedEvents = [...rawEvents].sort((a, b) => a.sequence - b.sequence);

  let currentBoard: Board = createEmptyBoard();
  let currentTurn: PlayerMark = 'X';
  let winner: GameWinner = null;
  let winningLine: number[] | null = null;
  let turnNumber = 0;

  const snapshots: SnapshotState[] = [];

  // Snapshot 0 represents the pristine starting state
  const initialSnapshot: SnapshotState = {
    sequence: 0,
    turnNumber: 0,
    board: [...currentBoard],
    currentTurn: 'X',
    winner: null,
    winningLine: null,
    lastEvent: {
      id: 'init',
      gameId: '',
      sequence: 0,
      type: 'MOVE',
      byUid: 'system',
      byName: 'System',
      timestamp: null,
    },
  };

  for (const event of sortedEvents) {
    if (event.type === 'MOVE') {
      const { position, player } = event;
      if (
        position !== undefined &&
        position >= 0 &&
        position < 9 &&
        player &&
        currentBoard[position] === null &&
        winner === null
      ) {
        currentBoard[position] = player;
        turnNumber += 1;

        const evalResult = evaluateBoard(currentBoard);
        winner = evalResult.winner;
        winningLine = evalResult.winningLine;

        if (winner === null) {
          currentTurn = player === 'X' ? 'O' : 'X';
        }

        snapshots.push({
          sequence: event.sequence,
          turnNumber,
          board: [...currentBoard],
          currentTurn,
          winner,
          winningLine,
          lastEvent: event,
        });
      }
    } else if (event.type === 'ROLLBACK') {
      const targetSeq = event.targetSequence ?? 0;
      
      if (targetSeq === 0) {
        currentBoard = createEmptyBoard();
        currentTurn = 'X';
        winner = null;
        winningLine = null;
        turnNumber = 0;
      } else {
        const targetSnapshot = snapshots.find((s) => s.sequence === targetSeq);
        if (targetSnapshot) {
          currentBoard = [...targetSnapshot.board];
          currentTurn = targetSnapshot.currentTurn;
          winner = targetSnapshot.winner;
          winningLine = targetSnapshot.winningLine;
          turnNumber = targetSnapshot.turnNumber;
        }
      }

      snapshots.push({
        sequence: event.sequence,
        turnNumber,
        board: [...currentBoard],
        currentTurn,
        winner,
        winningLine,
        lastEvent: event,
      });
    }
  }

  const isFinished = winner !== null;
  const lastSequence = sortedEvents.length > 0 ? sortedEvents[sortedEvents.length - 1].sequence : 0;

  return {
    board: currentBoard,
    currentTurn,
    winner,
    winningLine,
    isFinished,
    totalMoves: turnNumber,
    snapshots: [initialSnapshot, ...snapshots],
    events: sortedEvents,
    lastSequence,
  };
}
