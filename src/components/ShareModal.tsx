import React from 'react';
import { X, Copy, Check, Share2, Link as LinkIcon, Users } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameCode: string;
  gameId: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  gameCode,
  gameId,
}) => {
  const [copiedCode, setCopiedCode] = React.useState(false);
  const [copiedLink, setCopiedLink] = React.useState(false);

  if (!isOpen) return null;

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?code=${gameCode}`
    : `?code=${gameCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(gameCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Tic-Tac-Toe Match Invite',
          text: `Join my live Tic-Tac-Toe match! Room code: ${gameCode}`,
          url: shareUrl,
        });
      } catch (err) {
        // Ignored or cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-slate-700 rounded-3xl p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-600 flex items-center justify-center text-white font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Invite a Friend</h3>
            <p className="text-xs text-slate-400">
              Share the match code or direct link to start playing
            </p>
          </div>
        </div>

        {/* Room Code Card */}
        <div className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 text-center mb-4">
          <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
            Room Code
          </span>
          <div className="text-3xl sm:text-4xl font-mono font-extrabold tracking-widest text-cyan-400 my-2 select-all">
            {gameCode}
          </div>
          <button
            onClick={handleCopyCode}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-600 transition"
          >
            {copiedCode ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-300" />
                <span>Copy Room Code</span>
              </>
            )}
          </button>
        </div>

        {/* Share Link */}
        <div className="flex flex-col gap-2 mb-6">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <LinkIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span>Direct Match Link</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-slate-950 border-2 border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 select-all focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 transition"
              title="Copy Link"
            >
              {copiedLink ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Native share button */}
        <button
          onClick={handleNativeShare}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm transition active:scale-95"
        >
          <Share2 className="w-4 h-4" />
          <span>Share Match Invite</span>
        </button>
      </div>
    </div>
  );
};
