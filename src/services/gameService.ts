import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import {
  GameDoc,
  GameEvent,
  GameMode,
  AIDifficulty,
  PlayerMark,
  GameWinner,
} from '../types/game';
import { replayGameState } from '../engine/eventReplayer';

function generateGameCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Creates a new Game match in Firestore
 */
export async function createGame({
  mode,
  aiDifficulty = 'impossible',
  creatorMark = 'X',
}: {
  mode: GameMode;
  aiDifficulty?: AIDifficulty;
  creatorMark?: PlayerMark;
}): Promise<GameDoc> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Must be signed in to create a game match.');
  }

  const gameId = doc(collection(db, 'games')).id;
  const code = generateGameCode();
  const path = `games/${gameId}`;

  const isPlayerX = creatorMark === 'X';

  const newGame: GameDoc = {
    id: gameId,
    code,
    mode,
    status: mode === 'ai' ? 'in_progress' : 'waiting',
    playerXUid: isPlayerX ? currentUser.uid : (mode === 'ai' ? 'ai' : ''),
    playerXName: isPlayerX ? (currentUser.displayName || 'Player X') : (mode === 'ai' ? 'Minimax AI' : 'Waiting...'),
    playerXPhotoUrl: isPlayerX ? (currentUser.photoURL || '') : '',
    playerOUid: isPlayerX ? (mode === 'ai' ? 'ai' : '') : currentUser.uid,
    playerOName: isPlayerX ? (mode === 'ai' ? 'Minimax AI' : 'Waiting...') : (currentUser.displayName || 'Player O'),
    playerOPhotoUrl: isPlayerX ? '' : (currentUser.photoURL || ''),
    currentTurn: 'X',
    winner: null,
    winningLine: null,
    aiDifficulty: mode === 'ai' ? aiDifficulty : undefined,
    eventCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'games', gameId), newGame);
    return newGame;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Finds a game by room code
 */
export async function findGameByCode(code: string): Promise<GameDoc | null> {
  const cleanCode = code.trim().toUpperCase();
  const path = 'games';
  try {
    const q = query(collection(db, 'games'), where('code', '==', cleanCode));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }
    const docData = snapshot.docs[0].data() as GameDoc;
    return { ...docData, id: snapshot.docs[0].id };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Gets a game by its ID
 */
export async function getGameById(gameId: string): Promise<GameDoc | null> {
  const path = `games/${gameId}`;
  try {
    const docSnap = await getDoc(doc(db, 'games', gameId));
    if (!docSnap.exists()) {
      return null;
    }
    return { ...(docSnap.data() as GameDoc), id: docSnap.id };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Joins an existing game as Player O (or current player)
 */
export async function joinGame(gameId: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Must be signed in to join a game.');
  }

  const path = `games/${gameId}`;
  try {
    const gameSnap = await getDoc(doc(db, 'games', gameId));
    if (!gameSnap.exists()) {
      throw new Error('Game not found.');
    }
    const game = gameSnap.data() as GameDoc;

    // If user is already Player X or Player O, they're already in
    if (game.playerXUid === currentUser.uid || game.playerOUid === currentUser.uid) {
      return;
    }

    if (game.status !== 'waiting' && game.playerOUid) {
      throw new Error('Game room is already full.');
    }

    // Join as player O
    await updateDoc(doc(db, 'games', gameId), {
      playerOUid: currentUser.uid,
      playerOName: currentUser.displayName || 'Player O',
      playerOPhotoUrl: currentUser.photoURL || '',
      status: 'in_progress',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Appends a MOVE event into the subcollection:
 * /games/{gameId}/events/{eventId}
 */
export async function recordMoveEvent({
  gameId,
  sequence,
  player,
  position,
  byUid,
  byName,
  currentEvents,
}: {
  gameId: string;
  sequence: number;
  player: PlayerMark;
  position: number;
  byUid: string;
  byName: string;
  currentEvents: GameEvent[];
}): Promise<void> {
  const eventId = doc(collection(db, 'games', gameId, 'events')).id;
  const path = `games/${gameId}/events/${eventId}`;

  const newEvent: GameEvent = {
    id: eventId,
    gameId,
    sequence,
    type: 'MOVE',
    player,
    position,
    byUid,
    byName,
    timestamp: serverTimestamp(),
  };

  // Pre-calculate new projected state from event stream
  const projected = replayGameState([...currentEvents, newEvent]);

  try {
    // 1. Append immutable event to event-sourcing subcollection
    await setDoc(doc(db, 'games', gameId, 'events', eventId), newEvent);

    // 2. Update game document summary
    await updateDoc(doc(db, 'games', gameId), {
      eventCount: sequence,
      currentTurn: projected.currentTurn,
      winner: projected.winner,
      winningLine: projected.winningLine ? projected.winningLine.join(',') : null,
      status: projected.isFinished ? 'completed' : 'in_progress',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Appends a ROLLBACK event into the subcollection:
 * /games/{gameId}/events/{eventId}
 * This restores the game to a prior turn's state!
 */
export async function recordRollbackEvent({
  gameId,
  sequence,
  targetSequence,
  byUid,
  byName,
  currentEvents,
}: {
  gameId: string;
  sequence: number;
  targetSequence: number;
  byUid: string;
  byName: string;
  currentEvents: GameEvent[];
}): Promise<void> {
  const eventId = doc(collection(db, 'games', gameId, 'events')).id;
  const path = `games/${gameId}/events/${eventId}`;

  const rollbackEvent: GameEvent = {
    id: eventId,
    gameId,
    sequence,
    type: 'ROLLBACK',
    targetSequence,
    byUid,
    byName,
    timestamp: serverTimestamp(),
  };

  const projected = replayGameState([...currentEvents, rollbackEvent]);

  try {
    // Append the ROLLBACK event
    await setDoc(doc(db, 'games', gameId, 'events', eventId), rollbackEvent);

    // Update parent game doc to reflect state rolled back
    await updateDoc(doc(db, 'games', gameId), {
      eventCount: sequence,
      currentTurn: projected.currentTurn,
      winner: projected.winner,
      winningLine: projected.winningLine ? projected.winningLine.join(',') : null,
      status: 'in_progress',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Subscribes to live changes on the game document
 */
export function subscribeToGame(
  gameId: string,
  onUpdate: (game: GameDoc | null) => void
): Unsubscribe {
  const path = `games/${gameId}`;
  return onSnapshot(
    doc(db, 'games', gameId),
    (snapshot) => {
      if (!snapshot.exists()) {
        onUpdate(null);
        return;
      }
      onUpdate({ ...(snapshot.data() as GameDoc), id: snapshot.id });
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Subscribes to the live event log under /games/{gameId}/events
 * Ordered chronologically by sequence
 */
export function subscribeToEvents(
  gameId: string,
  onEvents: (events: GameEvent[]) => void
): Unsubscribe {
  const path = `games/${gameId}/events`;
  const q = query(collection(db, 'games', gameId, 'events'), orderBy('sequence', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const events: GameEvent[] = snapshot.docs.map((docSnap) => ({
        ...(docSnap.data() as GameEvent),
        id: docSnap.id,
      }));
      onEvents(events);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Save user profile in Firestore
 */
export async function syncUserProfile(user: {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
}) {
  const path = `users/${user.uid}`;
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) {
      await setDoc(userDocRef, {
        uid: user.uid,
        displayName: user.displayName || 'Player',
        photoURL: user.photoURL || '',
        wins: 0,
        losses: 0,
        draws: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(userDocRef, {
        displayName: user.displayName || 'Player',
        photoURL: user.photoURL || '',
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
