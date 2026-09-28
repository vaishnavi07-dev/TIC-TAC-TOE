import React from 'react';
import { Board, PlayerMark } from '../types/game';

interface GameBoardProps {
  board: Board;
  onCellClick: (index: number) => void;
  disabled: boolean;
  userMark: PlayerMark | null;
  winningLine: number[] | null;
  isHistoricalPreview?: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  board,
  onCellClick,
  disabled,
  userMark,
  winningLine,
  isHistoricalPreview = false,
}) => {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  return (
    <div className="relative p-3 sm:p-4 rounded-3xl bg-slate-900 border-2 border-slate-800">
      {/* Historical preview overlay banner */}
      {isHistoricalPreview && (
        <div className="absolute inset-0 bg-slate-950/80 rounded-3xl z-10 pointer-events-none flex items-center justify-center">
          <div className="bg-amber-500 text-slate-950 font-mono font-bold text-xs uppercase px-4 py-2 rounded-full flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-950" />
            Historical State (Read-only)
          </div>
        </div>
      )}

      {/* 3x3 Grid */}
      <div className="grid grid-cols-3 gap-3 w-[290px] h-[290px] sm:w-[380px] sm:h-[380px]">
        {board.map((cell, index) => {
          const isWinningCell = winningLine ? winningLine.includes(index) : false;
          const isCellClickable = !disabled && cell === null && !isHistoricalPreview;
          const showGhostMark =
            isCellClickable && hoveredIndex === index && userMark !== null;

          return (
            <button
              key={index}
              disabled={!isCellClickable}
              onClick={() => onCellClick(index)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`
                relative flex items-center justify-center rounded-2xl text-4xl sm:text-5xl font-black
                transition-colors duration-150 select-none
                ${
                  isWinningCell
                    ? 'bg-emerald-950 border-4 border-emerald-500 z-1'
                    : 'bg-slate-950 border-2 border-slate-800'
                }
                ${
                  isCellClickable
                    ? 'hover:bg-slate-800 hover:border-slate-600 cursor-pointer active:bg-slate-700'
                    : 'cursor-default'
                }
              `}
            >
              {/* Cell coordinate label in corner */}
              <span className="absolute top-2 left-2 text-[10px] font-mono font-bold text-slate-600 select-none">
                {index + 1}
              </span>

              {/* Placed Mark */}
              {cell === 'X' && (
                <div
                  className={`w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center ${
                    isWinningCell ? 'text-emerald-400' : 'text-cyan-400'
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-full h-full"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </div>
              )}

              {cell === 'O' && (
                <div
                  className={`w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center ${
                    isWinningCell ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-full h-full"
                  >
                    <circle cx="12" cy="12" r="9"></circle>
                  </svg>
                </div>
              )}

              {/* Ghost Hover Preview */}
              {cell === null && showGhostMark && (
                <div className="w-10 h-10 sm:w-14 sm:h-14 text-slate-700">
                  {userMark === 'X' ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-full h-full"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-full h-full"
                    >
                      <circle cx="12" cy="12" r="9"></circle>
                    </svg>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
