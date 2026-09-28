import React, { useEffect, useState, useMemo, useRef } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import confetti from 'canvas-confetti';
import { auth, testFirestoreConnection } from './firebase/config';
import {
  GameDoc,
  GameEvent,
  GameMode,
  AIDifficulty,
  PlayerMark,
  ProjectedState,
} from './types/game';
import { replayGameState } from './engine/eventReplayer';
import { getBestAIMove } from './engine/ticTacToe';
import {
  createGame,
  findGameByCode,
  getGameById,
  joinGame,
  recordMoveEvent,
  recordRollbackEvent,
  subscribeToGame,
  subscribeToEvents,
  syncUserProfile,
} from './services/gameService';
import { sound } from './services/soundService';
import { Header } from './components/Header';
import { Lobby } from './components/Lobby';
import { GameBoard } from './components/GameBoard';
import { GameStatus } from './components/GameStatus';
import { EventTimeline } from './components/EventTimeline';
import { ShareModal } from './components/ShareModal';
import { RollbackConfirmModal } from './components/RollbackConfirmModal';
import { AlertCircle, ArrowLeft, RefreshCw, Share2, Sparkles } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(sound.enabled);

  // Active game state
  const [game, setGame] = useState<GameDoc | null>(null);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Time travel / Event inspection state
  const [inspectedIndex, setInspectedIndex] = useState<number | null>(null);

  // Modals
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [rollbackModal, setRollbackModal] = useState<{
    isOpen: boolean;
    targetSequence: number;
    targetTurnNumber: number;
  }>({
    isOpen: false,
    targetSequence: 0,
    targetTurnNumber: 0,
  });

  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [initialCodeParam, setInitialCodeParam] = useState<string>('');

  // 1. Initial connection test and auth listener
  useEffect(() => {
    testFirestoreConnection();

    // Check URL search params for room code or game id
    const urlParams = new URLSearchParams(window.location.search);
    const codeParam = urlParams.get('code');
    const gameParam = urlParams.get('game');
    if (codeParam) {
      setInitialCodeParam(codeParam.toUpperCase());
    } else if (gameParam) {
      setInitialCodeParam(gameParam);
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        syncUserProfile(currentUser).catch(console.error);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. Real-time subscription to active game document and events subcollection
  useEffect(() => {
    if (!game?.id) {
      setEvents([]);
      return;
    }

    const unsubGame = subscribeToGame(game.id, (updatedGame) => {
      if (!updatedGame) {
        setErrorMessage('This match was removed or could not be found.');
        setGame(null);
        return;
      }
      setGame(updatedGame);
    });

    const unsubEvents = subscribeToEvents(game.id, (newEvents) => {
      setEvents(newEvents);
    });

    return () => {
      unsubGame();
      unsubEvents();
    };
  }, [game?.id]);

  // 3. Event Sourcing Projection: Derive the current and historical game states
  const projectedState: ProjectedState = useMemo(() => {
    return replayGameState(events);
  }, [events]);

  // Determine current active display board (either live or historical preview)
  const isHistoricalPreview = inspectedIndex !== null && inspectedIndex < projectedState.snapshots.length - 1;
  const activeSnapshot = inspectedIndex !== null
    ? projectedState.snapshots[inspectedIndex] || projectedState.snapshots[projectedState.snapshots.length - 1]
    : projectedState.snapshots[projectedState.snapshots.length - 1];

  const displayBoard = activeSnapshot.board;
  const displayTurn = activeSnapshot.currentTurn;
  const displayWinner = activeSnapshot.winner;
  const displayWinningLine = activeSnapshot.winningLine;

  // Determine the user's mark in the match
  const userMark: PlayerMark | null = useMemo(() => {
    if (!game || !user) return null;
    if (game.playerXUid === user.uid) return 'X';
    if (game.playerOUid === user.uid) return 'O';
    return null;
  }, [game, user]);

  const aiMark: PlayerMark | null = useMemo(() => {
    if (!game || game.mode !== 'ai') return null;
    return game.playerXUid === 'ai' ? 'X' : 'O';
  }, [game]);

  // Trigger confetti on win
  const prevWinnerRef = useRef<string | null>(null);
  useEffect(() => {
    if (projectedState.winner && projectedState.winner !== 'draw' && prevWinnerRef.current !== projectedState.winner) {
      sound.playWin();
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
    prevWinnerRef.current = projectedState.winner;
  }, [projectedState.winner]);

  // Track the last sequence number for which AI move was executed
  const executedAiSeqRef = useRef<number | null>(null);

  // 4. AI Opponent Move Trigger (Pure Minimax, completely client-side, zero LLM)
  useEffect(() => {
    if (
      !game ||
      game.mode !== 'ai' ||
      game.status !== 'in_progress' ||
      !aiMark ||
      isHistoricalPreview ||
      projectedState.winner !== null ||
      !user
    ) {
      setIsAiThinking(false);
      return;
    }

    // Is it AI's turn?
    if (projectedState.currentTurn !== aiMark) {
      setIsAiThinking(false);
      return;
    }

    const currentSeq = projectedState.lastSequence;
    if (executedAiSeqRef.current === currentSeq) {
      return; // Already executed for this turn
    }

    setIsAiThinking(true);

    const currentBoard = [...projectedState.board];
    const difficulty = game.aiDifficulty || 'impossible';
    const gameId = game.id;
    const userId = user.uid;

    let isDisposed = false;

    // Fast, crisp 100ms response so AI moves immediately without blocking UI
    const timer = setTimeout(async () => {
      if (isDisposed) return;
      try {
        executedAiSeqRef.current = currentSeq;
        const aiMove = getBestAIMove(currentBoard, aiMark, difficulty);

        if (aiMove >= 0 && !isDisposed) {
          sound.playMove(aiMark);
          await recordMoveEvent({
            gameId,
            sequence: currentSeq + 1,
            player: aiMark,
            position: aiMove,
            byUid: userId,
            byName: 'Minimax AI',
            currentEvents: events,
          });
        }
      } catch (err) {
        console.error('AI move execution failed', err);
        // Allow retry on error
        executedAiSeqRef.current = null;
      } finally {
        if (!isDisposed) {
          setIsAiThinking(false);
        }
      }
    }, 100);

    return () => {
      isDisposed = true;
      clearTimeout(timer);
      if (executedAiSeqRef.current === currentSeq) {
        executedAiSeqRef.current = null;
      }
    };
  }, [
    game?.id,
    game?.mode,
    game?.status,
    game?.aiDifficulty,
    aiMark,
    projectedState.currentTurn,
    projectedState.winner,
    projectedState.lastSequence,
    isHistoricalPreview,
    user?.uid,
    events,
  ]);

  // Manual trigger in case user wants immediate AI move
  const handleForceAiMove = async () => {
    if (
      !game ||
      game.mode !== 'ai' ||
      game.status !== 'in_progress' ||
      !aiMark ||
      isHistoricalPreview ||
      projectedState.winner !== null ||
      !user ||
      projectedState.currentTurn !== aiMark
    ) {
      return;
    }

    try {
      setIsAiThinking(true);
      const currentBoard = [...projectedState.board];
      const aiMove = getBestAIMove(currentBoard, aiMark, game.aiDifficulty || 'impossible');
      if (aiMove >= 0) {
        sound.playMove(aiMark);
        await recordMoveEvent({
          gameId: game.id,
          sequence: projectedState.lastSequence + 1,
          player: aiMark,
          position: aiMove,
          byUid: user.uid,
          byName: 'Minimax AI',
          currentEvents: events,
        });
      }
    } catch (err) {
      console.error('Forced AI move failed', err);
    } finally {
      setIsAiThinking(false);
    }
  };

  // Handlers
  const handleToggleSound = () => {
    const updated = sound.toggle();
    setSoundEnabled(updated);
  };

  const handleCreateMatch = async ({
    mode,
    aiDifficulty,
    creatorMark,
  }: {
    mode: GameMode;
    aiDifficulty?: AIDifficulty;
    creatorMark: PlayerMark;
  }) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const newGame = await createGame({ mode, aiDifficulty, creatorMark });
      setGame(newGame);
      setInspectedIndex(null);

      // Auto-open share modal if creating PvP
      if (mode === 'pvp') {
        setIsShareModalOpen(true);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to create match.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinMatch = async (codeOrId: string) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      let targetGame = await findGameByCode(codeOrId);
      if (!targetGame) {
        targetGame = await getGameById(codeOrId);
      }
      if (!targetGame) {
        setErrorMessage(`No match found with code "${codeOrId}".`);
        return;
      }
      await joinGame(targetGame.id);
      setGame(targetGame);
      setInspectedIndex(null);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to join match.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCellClick = async (cellIndex: number) => {
    if (!game || !user || !userMark) return;
    if (isHistoricalPreview) return;
    if (game.status !== 'in_progress') return;
    if (projectedState.winner !== null) return;
    if (projectedState.currentTurn !== userMark) return;
    if (projectedState.board[cellIndex] !== null) return;

    sound.playMove(userMark);

    try {
      await recordMoveEvent({
        gameId: game.id,
        sequence: projectedState.lastSequence + 1,
        player: userMark,
        position: cellIndex,
        byUid: user.uid,
        byName: user.displayName || `Player ${userMark}`,
        currentEvents: events,
      });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to commit move.');
    }
  };

  const handleRequestRollback = (targetSequence: number, targetTurnNumber: number) => {
    setRollbackModal({
      isOpen: true,
      targetSequence,
      targetTurnNumber,
    });
  };

  const handleConfirmRollback = async () => {
    if (!game || !user) return;
    setIsLoading(true);
    try {
      sound.playRollback();
      await recordRollbackEvent({
        gameId: game.id,
        sequence: projectedState.lastSequence + 1,
        targetSequence: rollbackModal.targetSequence,
        byUid: user.uid,
        byName: user.displayName || 'Player',
        currentEvents: events,
      });

      // Close modal and restore view to live (which is now rewound!)
      setRollbackModal({ isOpen: false, targetSequence: 0, targetTurnNumber: 0 });
      setInspectedIndex(null);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to roll back turn.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRematch = async () => {
    if (!game) return;
    // For rematch, create a new game with identical settings
    if (game.mode === 'ai') {
      handleCreateMatch({
        mode: 'ai',
        aiDifficulty: game.aiDifficulty,
        creatorMark: userMark || 'X',
      });
    } else {
      handleCreateMatch({
        mode: 'pvp',
        creatorMark: userMark || 'X',
      });
    }
  };

  const handleLeaveGame = () => {
    setGame(null);
    setEvents([]);
    setInspectedIndex(null);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Navbar Header */}
      <Header
        user={user}
        authLoading={authLoading}
        activeGameCode={game?.code}
        onOpenShare={game ? () => setIsShareModalOpen(true) : undefined}
        onLeaveGame={game ? handleLeaveGame : undefined}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 max-w-6xl w-full mx-auto">
        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="w-full max-w-2xl mb-4 bg-rose-950 border-2 border-rose-600 rounded-2xl p-4 flex items-center justify-between gap-3 text-white text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="px-3 py-1 bg-rose-900 hover:bg-rose-800 rounded-lg text-white font-bold text-xs transition"
            >
              Dismiss
            </button>
          </div>
        )}

        {!game ? (
          /* Lobby view when no active game */
          <Lobby
            user={user}
            onCreateMatch={handleCreateMatch}
            onJoinMatch={handleJoinMatch}
            isLoading={isLoading}
            initialCode={initialCodeParam}
          />
        ) : (
          /* Active Match View */
          <div className="w-full max-w-5xl flex flex-col gap-6">
            {/* Top Match Bar: Exit & Share */}
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={handleLeaveGame}
                className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-300 hover:text-white transition px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border-2 border-slate-800"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Exit to Lobby</span>
              </button>

              <div className="flex items-center gap-2">
                {game.mode === 'pvp' && (
                  <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="flex items-center gap-1.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 px-3.5 py-2 rounded-xl transition"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Invite Friend</span>
                  </button>
                )}
              </div>
            </div>

            {/* Match HUD / Status */}
            <GameStatus
              game={game}
              currentTurn={displayTurn}
              winner={displayWinner}
              userMark={userMark}
              onRematch={handleRematch}
              isAiThinking={isAiThinking}
              onForceAiMove={game.mode === 'ai' ? handleForceAiMove : undefined}
            />

            {/* Board and Event Timeline Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Interactive Game Board */}
              <div className="lg:col-span-6 xl:col-span-5 flex flex-col items-center justify-center">
                <GameBoard
                  board={displayBoard}
                  onCellClick={handleCellClick}
                  disabled={
                    isLoading ||
                    isAiThinking ||
                    projectedState.winner !== null ||
                    projectedState.currentTurn !== userMark ||
                    game.status !== 'in_progress'
                  }
                  userMark={userMark}
                  winningLine={displayWinningLine}
                  isHistoricalPreview={isHistoricalPreview}
                />
              </div>

              {/* Right Column: Event Sourcing & Turn Timeline */}
              <div className="lg:col-span-6 xl:col-span-7 flex flex-col gap-4">
                <EventTimeline
                  projectedState={projectedState}
                  inspectedIndex={inspectedIndex}
                  onInspectIndex={(idx) => setInspectedIndex(idx)}
                  onRequestRollback={handleRequestRollback}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Share Modal */}
      {game && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          gameCode={game.code}
          gameId={game.id}
        />
      )}

      {/* Rollback Confirm Modal */}
      <RollbackConfirmModal
        isOpen={rollbackModal.isOpen}
        onClose={() =>
          setRollbackModal({ isOpen: false, targetSequence: 0, targetTurnNumber: 0 })
        }
        onConfirm={handleConfirmRollback}
        targetTurnNumber={rollbackModal.targetTurnNumber}
        targetSequence={rollbackModal.targetSequence}
        isLoading={isLoading}
      />
    </div>
  );
}
