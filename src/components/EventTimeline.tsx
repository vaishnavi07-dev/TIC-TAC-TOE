import React from 'react';
import { ProjectedState } from '../types/game';
import {
  History,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Database,
  AlertTriangle,
} from 'lucide-react';

interface EventTimelineProps {
  projectedState: ProjectedState;
  inspectedIndex: number | null; // null means live state (latest)
  onInspectIndex: (index: number | null) => void;
  onRequestRollback: (targetSequence: number, targetTurnNumber: number) => void;
  disabled?: boolean;
}

function getCellLabel(pos?: number): string {
  if (pos === undefined || pos < 0 || pos > 8) return 'N/A';
  const row = Math.floor(pos / 3) + 1;
  const col = (pos % 3) + 1;
  const names = [
    'Top-Left (1)',
    'Top-Center (2)',
    'Top-Right (3)',
    'Mid-Left (4)',
    'Center (5)',
    'Mid-Right (6)',
    'Bottom-Left (7)',
    'Bottom-Center (8)',
    'Bottom-Right (9)',
  ];
  return names[pos] || `R${row} C${col}`;
}

export const EventTimeline: React.FC<EventTimelineProps> = ({
  projectedState,
  inspectedIndex,
  onInspectIndex,
  onRequestRollback,
  disabled = false,
}) => {
  const { snapshots, events } = projectedState;
  const maxIndex = snapshots.length - 1;
  const currentIndex = inspectedIndex === null ? maxIndex : inspectedIndex;
  const isViewingHistorical = inspectedIndex !== null && inspectedIndex < maxIndex;

  const currentSnapshot = snapshots[currentIndex] || snapshots[maxIndex];

  const handleStepPrev = () => {
    if (currentIndex > 0) {
      onInspectIndex(currentIndex - 1);
    }
  };

  const handleStepNext = () => {
    if (currentIndex < maxIndex) {
      const next = currentIndex + 1;
      onInspectIndex(next === maxIndex ? null : next);
    }
  };

  const handleJumpStart = () => {
    onInspectIndex(0);
  };

  const handleJumpLatest = () => {
    onInspectIndex(null);
  };

  return (
    <div className="w-full bg-slate-900 border-2 border-slate-800 rounded-3xl p-4 sm:p-5 flex flex-col gap-4">
      {/* Title & Sourcing Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-white text-sm sm:text-base">
            Turn History & Event Log
          </h3>
        </div>
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1 rounded-full text-[11px] text-slate-300 font-mono">
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold">Event Sourced</span>
          <span className="text-slate-600">•</span>
          <span className="text-cyan-400 font-bold">{events.length} events</span>
        </div>
      </div>

      {/* Historical Inspection Alert & Rollback Bar */}
      {isViewingHistorical && (
        <div className="bg-amber-950 border-2 border-amber-500 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-amber-200 text-xs sm:text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
            <div>
              <p className="font-bold text-amber-300">
                Viewing Turn #{currentSnapshot.turnNumber} (Past State)
              </p>
              <p className="text-[11px] text-amber-200">
                Roll back the live match to this turn, or return to live play.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleJumpLatest}
              className="text-xs px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition"
            >
              Back to Live
            </button>
            <button
              disabled={disabled}
              onClick={() =>
                onRequestRollback(currentSnapshot.sequence, currentSnapshot.turnNumber)
              }
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-95 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Roll Back to Turn #{currentSnapshot.turnNumber}</span>
            </button>
          </div>
        </div>
      )}

      {/* Stepper Controls Bar */}
      <div className="flex items-center justify-between gap-2 bg-slate-950 border-2 border-slate-800 rounded-2xl p-2">
        <div className="flex items-center gap-1">
          <button
            onClick={handleJumpStart}
            disabled={currentIndex === 0}
            title="First Move"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleStepPrev}
            disabled={currentIndex === 0}
            title="Previous Turn"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Turn indicator text */}
        <div className="text-center font-mono text-xs">
          {inspectedIndex === null ? (
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Live State (Turn {snapshots[maxIndex].turnNumber})
            </span>
          ) : (
            <span className="text-amber-400 font-bold">
              Turn {currentSnapshot.turnNumber} of {snapshots[maxIndex].turnNumber}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleStepNext}
            disabled={currentIndex === maxIndex}
            title="Next Turn"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleJumpLatest}
            disabled={inspectedIndex === null}
            title="Jump to Latest"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive Event List */}
      <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
        {events.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs font-mono">
            No moves recorded yet. First turn will initialize event stream.
          </div>
        ) : (
          snapshots.slice(1).map((snapshot, idx) => {
            const snapshotIdx = idx + 1;
            const isSelected =
              inspectedIndex === snapshotIdx ||
              (inspectedIndex === null && snapshotIdx === maxIndex);

            const ev = snapshot.lastEvent;
            const isRollback = ev.type === 'ROLLBACK';

            return (
              <div
                key={ev.id || snapshotIdx}
                onClick={() => onInspectIndex(snapshotIdx === maxIndex ? null : snapshotIdx)}
                className={`
                  p-3 rounded-xl text-xs cursor-pointer transition-colors flex items-center justify-between gap-3
                  ${
                    isSelected
                      ? isViewingHistorical
                        ? 'bg-slate-900 border-2 border-amber-500'
                        : 'bg-slate-900 border-2 border-cyan-500'
                      : 'bg-slate-950 border border-slate-800 hover:bg-slate-800 hover:border-slate-700'
                  }
                `}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Mark badge or Rollback icon */}
                  {isRollback ? (
                    <div className="w-7 h-7 rounded-lg bg-purple-600 text-white font-bold flex items-center justify-center shrink-0">
                      <RotateCcw className="w-4 h-4" />
                    </div>
                  ) : ev.player === 'X' ? (
                    <div className="w-7 h-7 rounded-lg bg-cyan-500 font-black text-slate-950 flex items-center justify-center shrink-0 text-sm">
                      X
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-rose-500 font-black text-white flex items-center justify-center shrink-0 text-sm">
                      O
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      {isRollback ? (
                        <span className="text-purple-300 font-bold">
                          Rollback Event
                        </span>
                      ) : (
                        <span>
                          Turn {snapshot.turnNumber}: Player {ev.player}
                        </span>
                      )}
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-400 truncate max-w-[120px] font-medium">
                        {ev.byName}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 font-medium">
                      {isRollback ? (
                        <span>Rewound match to state at sequence #{ev.targetSequence}</span>
                      ) : (
                        <span>Placed at {getCellLabel(ev.position)}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side: sequence badge and inspector button */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono font-semibold text-slate-500">
                    seq #{ev.sequence}
                  </span>
                  {isSelected && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isViewingHistorical
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-emerald-500 text-slate-950'
                      }`}
                    >
                      {isViewingHistorical ? 'Inspecting' : 'Current'}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
