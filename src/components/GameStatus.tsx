import React from 'react';
import { GameDoc, PlayerMark, GameWinner } from '../types/game';
import { Bot, User as UserIcon, Sparkles, RefreshCw } from 'lucide-react';

interface GameStatusProps {
  game: GameDoc;
  currentTurn: PlayerMark;
  winner: GameWinner;
  userMark: PlayerMark | null;
  onRematch?: () => void;
  isAiThinking?: boolean;
  onForceAiMove?: () => void;
}

export const GameStatus: React.FC<GameStatusProps> = ({
  game,
  currentTurn,
  winner,
  userMark,
  onRematch,
  isAiThinking = false,
  onForceAiMove,
}) => {
  const isXTurn = currentTurn === 'X' && !winner && game.status === 'in_progress';
  const isOTurn = currentTurn === 'O' && !winner && game.status === 'in_progress';
  const isUserTurn = userMark !== null && userMark === currentTurn && !winner && game.status === 'in_progress';

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-3">
      {/* Player Cards HUD */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 relative">
        {/* Player X Card */}
        <div
          className={`
            relative p-3 sm:p-4 rounded-2xl transition-colors duration-150
            ${
              winner === 'X'
                ? 'bg-slate-900 border-2 border-emerald-500'
                : isXTurn
                ? 'bg-slate-900 border-2 border-cyan-500'
                : 'bg-slate-900 border-2 border-slate-800'
            }
          `}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              {game.playerXPhotoUrl ? (
                <img
                  src={game.playerXPhotoUrl}
                  alt={game.playerXName}
                  className="w-10 h-10 rounded-xl object-cover border-2 border-cyan-500"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-slate-800 border-2 border-cyan-500 flex items-center justify-center text-cyan-400">
                  <UserIcon className="w-5 h-5" />
                </div>
              )}
              {/* Solid mark badge */}
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-md bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center">
                X
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm sm:text-base text-white truncate">
                  {game.playerXName}
                </span>
                {userMark === 'X' && (
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-bold border border-slate-700">
                    You
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {isXTurn ? (
                  <span className="text-cyan-400 font-bold inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    Thinking...
                  </span>
                ) : (
                  'Waiting'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Player O Card */}
        <div
          className={`
            relative p-3 sm:p-4 rounded-2xl transition-colors duration-150
            ${
              winner === 'O'
                ? 'bg-slate-900 border-2 border-emerald-500'
                : isOTurn
                ? 'bg-slate-900 border-2 border-rose-500'
                : 'bg-slate-900 border-2 border-slate-800'
            }
          `}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              {game.mode === 'ai' ? (
                <div className="w-10 h-10 rounded-xl bg-purple-900 border-2 border-purple-500 flex items-center justify-center text-purple-200">
                  <Bot className="w-5 h-5" />
                </div>
              ) : game.playerOPhotoUrl ? (
                <img
                  src={game.playerOPhotoUrl}
                  alt={game.playerOName}
                  className="w-10 h-10 rounded-xl object-cover border-2 border-rose-500"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-slate-800 border-2 border-rose-500 flex items-center justify-center text-rose-400">
                  <UserIcon className="w-5 h-5" />
                </div>
              )}
              {/* Solid mark badge */}
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-md bg-rose-500 text-white font-black text-xs flex items-center justify-center">
                O
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm sm:text-base text-white truncate">
                  {game.playerOName}
                </span>
                {userMark === 'O' && (
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-bold border border-slate-700">
                    You
                  </span>
                )}
                {game.mode === 'ai' && game.aiDifficulty && (
                  <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-purple-900 text-purple-200 border border-purple-700">
                    {game.aiDifficulty}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {isAiThinking ? (
                  <span className="text-purple-400 font-bold inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    Calculating Minimax...
                  </span>
                ) : isOTurn ? (
                  <span className="text-rose-400 font-bold inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    Thinking...
                  </span>
                ) : (
                  'Waiting'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Status Banner */}
      <div className="text-center py-2.5 px-4 rounded-xl bg-slate-900 border-2 border-slate-800 flex items-center justify-between gap-3">
        <div className="text-left">
          {game.status === 'waiting' ? (
            <div className="flex items-center gap-2 text-amber-400 text-xs sm:text-sm font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              Waiting for an opponent to join the match...
            </div>
          ) : winner ? (
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-xs sm:text-sm font-bold text-emerald-300">
                {winner === 'draw'
                  ? "It's a Draw! Well played by both sides."
                  : winner === userMark
                  ? 'Victory! You won the match!'
                  : `${winner === 'X' ? game.playerXName : game.playerOName} won the match!`}
              </span>
            </div>
          ) : isAiThinking ? (
            <div className="flex items-center gap-2 text-purple-300 text-xs sm:text-sm font-medium">
              <Bot className="w-4 h-4 text-purple-400" />
              <span>Minimax evaluating move...</span>
              {onForceAiMove && (
                <button
                  onClick={onForceAiMove}
                  className="ml-2 text-[10px] font-bold bg-purple-700 hover:bg-purple-600 text-white px-2.5 py-0.5 rounded-md border border-purple-500 transition active:scale-95"
                >
                  Move Now
                </button>
              )}
            </div>
          ) : isUserTurn ? (
            <div className="flex items-center gap-2 text-cyan-300 text-xs sm:text-sm font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              Your turn! Select any empty cell to place {userMark}.
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-400 text-xs sm:text-sm font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
              Opponent's turn to move...
            </div>
          )}
        </div>

        {/* Rematch button when finished */}
        {winner && onRematch && (
          <button
            onClick={onRematch}
            className="flex items-center gap-1.5 text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-3 py-1.5 rounded-lg transition active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Play Again
          </button>
        )}
      </div>
    </div>
  );
};
