import React from 'react';
import { User, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import {
  Volume2,
  VolumeX,
  LogIn,
  LogOut,
  Gamepad2,
  Share2,
  Copy,
  Check,
} from 'lucide-react';

interface HeaderProps {
  user: User | null;
  authLoading: boolean;
  activeGameCode?: string | null;
  onOpenShare?: () => void;
  onLeaveGame?: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  authLoading,
  activeGameCode,
  onOpenShare,
  onLeaveGame,
  soundEnabled,
  onToggleSound,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Sign in error:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const handleCopyCode = () => {
    if (!activeGameCode) return;
    navigator.clipboard.writeText(activeGameCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="border-b-2 border-slate-800 bg-slate-900 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo / Brand */}
        <div className="flex items-center gap-3">
          <div
            onClick={onLeaveGame}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500 text-slate-950 flex items-center justify-center font-black group-hover:bg-cyan-400 transition-colors">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  Tic-Tac-Toe
                </span>
                <span className="text-xs uppercase font-bold tracking-widest text-cyan-300 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded">
                  Chronicle
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Event-Sourced Replay & Rollback
              </p>
            </div>
          </div>
        </div>

        {/* Center: Active Game Room Code if playing */}
        {activeGameCode && (
          <div className="flex items-center gap-2 bg-slate-950 border-2 border-slate-800 rounded-lg px-3 py-1.5">
            <span className="text-xs font-semibold text-slate-400">Room:</span>
            <span className="font-mono font-bold text-sm tracking-widest text-cyan-400">
              {activeGameCode}
            </span>
            <button
              onClick={handleCopyCode}
              title="Copy Room Code"
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
            {onOpenShare && (
              <button
                onClick={onOpenShare}
                title="Share Match Link"
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 rounded transition"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            )}
            {onLeaveGame && (
              <button
                onClick={onLeaveGame}
                title="Exit to Lobby"
                className="text-xs text-slate-400 hover:text-rose-400 ml-1 px-1.5 py-0.5 rounded hover:bg-slate-800 transition font-medium"
              >
                Leave
              </button>
            )}
          </div>
        )}

        {/* Right Actions: Sound & Auth */}
        <div className="flex items-center gap-3">
          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
            className="p-2 rounded-lg bg-slate-950 border-2 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* User Sign In / Profile */}
          {authLoading ? (
            <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-2 pl-2 border-l-2 border-slate-800">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-8 h-8 rounded-full border-2 border-cyan-500 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-cyan-600 border-2 border-cyan-400 flex items-center justify-center text-white font-bold text-xs">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'P'}
                </div>
              )}
              <span className="text-sm font-semibold text-slate-200 hidden md:inline max-w-[120px] truncate">
                {user.displayName || 'Player'}
              </span>
              <button
                onClick={handleSignOut}
                title="Sign out"
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-lg transition"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In with Google</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
