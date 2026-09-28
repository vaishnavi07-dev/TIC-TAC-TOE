export type PlayerMark = 'X' | 'O';
export type CellState = PlayerMark | null;
export type Board = CellState[];

export type GameMode = 'ai' | 'pvp';
export type AIDifficulty = 'easy' | 'medium' | 'impossible';
export type GameStatus = 'waiting' | 'in_progress' | 'completed' | 'abandoned';
export type GameWinner = 'X' | 'O' | 'draw' | null;

export interface PlayerInfo {
  uid: string;
  displayName: string;
  photoURL?: string;
}

export interface GameDoc {
  id: string;
  code: string;
  mode: GameMode;
  status: GameStatus;
  playerXUid: string;
  playerXName: string;
  playerXPhotoUrl?: string;
  playerOUid: string;
  playerOName: string;
  playerOPhotoUrl?: string;
  currentTurn: PlayerMark;
  winner: GameWinner;
  winningLine?: number[] | null;
  aiDifficulty?: AIDifficulty;
  eventCount: number;
  createdAt: any;
  updatedAt: any;
}

export interface GameEvent {
  id: string;
  gameId: string;
  sequence: number;
  type: 'MOVE' | 'ROLLBACK';
  player?: PlayerMark;
  position?: number;
  targetSequence?: number;
  byUid: string;
  byName: string;
  timestamp: any;
}

export interface SnapshotState {
  sequence: number;
  turnNumber: number;
  board: Board;
  currentTurn: PlayerMark;
  winner: GameWinner;
  winningLine: number[] | null;
  lastEvent: GameEvent;
}

export interface ProjectedState {
  board: Board;
  currentTurn: PlayerMark;
  winner: GameWinner;
  winningLine: number[] | null;
  isFinished: boolean;
  totalMoves: number;
  snapshots: SnapshotState[];
  events: GameEvent[];
  lastSequence: number;
}
