import React from 'react';
import { User, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import { GameMode, AIDifficulty, PlayerMark } from '../types/game';
import {
  Bot,
  Users,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  History,
  Layers,
  LogIn,
} from 'lucide-react';

interface LobbyProps {
  user: User | null;
  onCreateMatch: (params: {
    mode: GameMode;
    aiDifficulty?: AIDifficulty;
    creatorMark: PlayerMark;
  }) => Promise<void>;
  onJoinMatch: (code: string) => Promise<void>;
  isLoading: boolean;
  initialCode?: string;
}

export const Lobby: React.FC<LobbyProps> = ({
  user,
  onCreateMatch,
  onJoinMatch,
  isLoading,
  initialCode = '',
}) => {
  const [activeTab, setActiveTab] = React.useState<'ai' | 'pvp'>('ai');

  // AI settings
  const [aiDifficulty, setAiDifficulty] = React.useState<AIDifficulty>('impossible');
  const [aiCreatorMark, setAiCreatorMark] = React.useState<PlayerMark>('X');

  // PvP settings
  const [pvpCreatorMark, setPvpCreatorMark] = React.useState<PlayerMark>('X');
  const [joinCode, setJoinCode] = React.useState<string>(initialCode);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartAi = () => {
    if (!user) {
      handleSignIn();
      return;
    }
    onCreateMatch({
      mode: 'ai',
      aiDifficulty,
      creatorMark: aiCreatorMark,
    });
  };

  const handleCreatePvp = () => {
    if (!user) {
      handleSignIn();
      return;
    }
    onCreateMatch({
      mode: 'pvp',
      creatorMark: pvpCreatorMark,
    });
  };

  const handleJoinPvp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    if (!user) {
      handleSignIn();
      return;
    }
    onJoinMatch(joinCode.trim().toUpperCase());
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6 px-4 flex flex-col gap-8">
      {/* Hero Banner */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border-2 border-slate-800 text-cyan-400 text-xs font-bold tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Firestore Event-Sourced Tic-Tac-Toe</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Every Turn Sourced. <br />
          <span className="text-cyan-400">
            Every State Replayable.
          </span>
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed font-medium">
          Challenge an unbeatable Minimax AI or play in real time with a friend. Inspect any past turn and roll back time with event sourcing.
        </p>

        {!user && (
          <div className="pt-2">
            <button
              onClick={handleSignIn}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm transition active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign in with Google to Play</span>
            </button>
          </div>
        )}
      </div>

      {/* Mode Tabs */}
      <div className="w-full max-w-xl mx-auto">
        <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-slate-900 border-2 border-slate-800">
          <button
            onClick={() => setActiveTab('ai')}
            className={`
              flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-colors
              ${
                activeTab === 'ai'
                  ? 'bg-slate-800 text-cyan-400 border-2 border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }
            `}
          >
            <Bot className="w-4 h-4" />
            <span>Play vs Minimax AI</span>
          </button>

          <button
            onClick={() => setActiveTab('pvp')}
            className={`
              flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-colors
              ${
                activeTab === 'pvp'
                  ? 'bg-slate-800 text-rose-400 border-2 border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }
            `}
          >
            <Users className="w-4 h-4" />
            <span>Play vs Friend (Online)</span>
          </button>
        </div>
      </div>

      {/* Main Mode Card */}
      <div className="w-full max-w-xl mx-auto bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 sm:p-8">
        {activeTab === 'ai' ? (
          /* AI Configuration */
          <div className="flex flex-col gap-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Bot className="w-5 h-5 text-cyan-400" />
                <span>Minimax Opponent</span>
              </h2>
              <p className="text-xs text-slate-400">
                Powered strictly by the pure Minimax algorithm with alpha-beta pruning. No external LLM or API calls.
              </p>
            </div>

            {/* Difficulty Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Select Difficulty
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {(
                  [
                    { id: 'easy', label: 'Casual', sub: 'Makes mistakes' },
                    { id: 'medium', label: 'Challenging', sub: 'Balanced' },
                    { id: 'impossible', label: 'Impossible', sub: 'Unbeatable' },
                  ] as const
                ).map((level) => (
                  <button
                    key={level.id}
                    onClick={() => setAiDifficulty(level.id)}
                    className={`
                      p-3 rounded-xl border-2 text-left transition-colors
                      ${
                        aiDifficulty === level.id
                          ? 'bg-slate-950 border-cyan-500 text-cyan-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                      }
                    `}
                  >
                    <div className="font-bold text-xs sm:text-sm">{level.label}</div>
                    <div className="text-[10px] text-slate-500 font-medium">{level.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Choose Mark */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Your Mark & Turn Order
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setAiCreatorMark('X')}
                  className={`
                    p-3.5 rounded-xl border-2 flex items-center gap-3 transition-colors
                    ${
                      aiCreatorMark === 'X'
                        ? 'bg-slate-950 border-cyan-500 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }
                  `}
                >
                  <div className="w-8 h-8 rounded-lg bg-cyan-500 text-slate-950 font-black flex items-center justify-center text-sm">
                    X
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-xs sm:text-sm text-white">Play as X</div>
                    <div className="text-[10px] text-slate-400 font-medium">You move first</div>
                  </div>
                </button>

                <button
                  onClick={() => setAiCreatorMark('O')}
                  className={`
                    p-3.5 rounded-xl border-2 flex items-center gap-3 transition-colors
                    ${
                      aiCreatorMark === 'O'
                        ? 'bg-slate-950 border-rose-500 text-rose-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }
                  `}
                >
                  <div className="w-8 h-8 rounded-lg bg-rose-500 text-white font-black flex items-center justify-center text-sm">
                    O
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-xs sm:text-sm text-white">Play as O</div>
                    <div className="text-[10px] text-slate-400 font-medium">AI moves first</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartAi}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-sm sm:text-base active:scale-98 transition disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>{isLoading ? 'Creating Match...' : 'Start Match vs AI'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* PvP Online Multiplayer */
          <div className="flex flex-col gap-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-rose-400" />
                <span>Multiplayer Match</span>
              </h2>
              <p className="text-xs text-slate-400">
                Play live with a friend across devices. Generates a short room code or shareable URL.
              </p>
            </div>

            {/* Create Section */}
            <div className="p-4 rounded-2xl bg-slate-950 border-2 border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">
                  Host New Match
                </span>
                <span className="text-[11px] text-slate-400">Creates room code</span>
              </div>

              {/* Mark choice for host */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPvpCreatorMark('X')}
                  className={`
                    p-2.5 rounded-xl border-2 text-xs font-bold flex items-center justify-center gap-2 transition-colors
                    ${
                      pvpCreatorMark === 'X'
                        ? 'bg-slate-900 border-cyan-500 text-cyan-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }
                  `}
                >
                  <span className="font-black text-cyan-400">X</span>
                  <span>Play as X (First)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPvpCreatorMark('O')}
                  className={`
                    p-2.5 rounded-xl border-2 text-xs font-bold flex items-center justify-center gap-2 transition-colors
                    ${
                      pvpCreatorMark === 'O'
                        ? 'bg-slate-900 border-rose-500 text-rose-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }
                  `}
                >
                  <span className="font-black text-rose-400">O</span>
                  <span>Play as O</span>
                </button>
              </div>

              <button
                onClick={handleCreatePvp}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm active:scale-98 transition disabled:opacity-50"
              >
                <span>{isLoading ? 'Creating Room...' : 'Create Match Room & Invite'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t-2 border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-[11px] font-mono text-slate-500 uppercase tracking-widest absolute font-bold">
                or join match
              </span>
            </div>

            {/* Join Section */}
            <form onSubmit={handleJoinPvp} className="space-y-3">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Enter 6-Character Room Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={10}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ABC123"
                  className="flex-1 bg-slate-950 border-2 border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-sm font-mono tracking-widest uppercase text-white placeholder:text-slate-600 focus:outline-none transition"
                />
                <button
                  type="submit"
                  disabled={!joinCode.trim() || isLoading}
                  className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-bold text-xs sm:text-sm border-2 border-slate-700 transition"
                >
                  Join
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto w-full pt-4">
        <div className="p-4 rounded-2xl bg-slate-900 border-2 border-slate-800 flex flex-col gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-bold">
            <Layers className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-white">Event Sourcing</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            Every move is saved as an immutable event in a Firestore subcollection. The board is projected deterministically.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border-2 border-slate-800 flex flex-col gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
            <History className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-white">Replay & Rollback</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            Step through past moves like a tape recorder and roll back the live match state to any historical turn at any time.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border-2 border-slate-800 flex flex-col gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-white">Pure Minimax AI</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            Built using deterministic game theory algorithms. Unbeatable on impossible mode, completely LLM-free.
          </p>
        </div>
      </div>
    </div>
  );
};
