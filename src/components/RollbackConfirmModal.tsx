import React from 'react';
import { RotateCcw, AlertTriangle, X } from 'lucide-react';

interface RollbackConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  targetTurnNumber: number;
  targetSequence: number;
  isLoading?: boolean;
}

export const RollbackConfirmModal: React.FC<RollbackConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  targetTurnNumber,
  targetSequence,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-slate-700 rounded-3xl p-6">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold mb-4">
          <RotateCcw className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-white mb-1">
          Roll Back to Turn #{targetTurnNumber}?
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed mb-4 font-medium">
          Using event sourcing, the game will record a new <span className="text-amber-400 font-mono font-bold">ROLLBACK</span> event in the match log, rewinding the live board state to turn #{targetTurnNumber} (sequence #{targetSequence}). All subsequent turns will be undone, and the active turn will resume from that point.
        </p>

        <div className="bg-amber-950 border-2 border-amber-600 rounded-xl p-3 flex items-start gap-2.5 mb-6 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <span className="font-medium">
            Both players will immediately see the rewound board in real time and can continue playing.
          </span>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs active:scale-95 transition disabled:opacity-50"
          >
            {isLoading ? (
              <span>Rolling back...</span>
            ) : (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Confirm Rollback</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
