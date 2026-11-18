import React from 'react';
import { Timer, X } from 'lucide-react';
import { useDulo } from '../../store/DuloContext';
import { SleepTimerState } from '../../types/music';
import { formatDuration } from '../../utils/format';

const OPTIONS: Array<{ mode: SleepTimerState['mode']; label: string; sub: string }> = [
  { mode: '15m', label: '15 Minutes', sub: 'Includes 20s gradual fade-out' },
  { mode: '30m', label: '30 Minutes', sub: 'Includes 20s gradual fade-out' },
  { mode: '45m', label: '45 Minutes', sub: 'Includes 20s gradual fade-out' },
  { mode: 'end_of_track', label: 'End of Track', sub: 'Stops cleanly after current song' },
];

export const SleepTimerModal: React.FC = () => {
  const {
    sleepModalOpen,
    setSleepModalOpen,
    sleepTimer,
    setSleepTimerMode,
    sleepSecondsLeft,
  } = useDulo();

  if (!sleepModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Sleep Timer"
    >
      <div className="w-full max-w-sm rounded-2xl border border-[#27272A] bg-[#121215] p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-[#FAFAFA]" />
            <h2 className="font-display text-base font-semibold text-[#FAFAFA]">
              Sleep Timer
            </h2>
          </div>
          <button
            onClick={() => setSleepModalOpen(false)}
            aria-label="Close Sleep Timer"
            className="p-2 rounded-lg text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#1C1C21]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {sleepTimer.active && (
          <div className="rounded-xl border border-[#27272A] bg-[#09090B] px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-[#A1A1AA]">Active countdown</span>
            <span className="font-mono-tabular text-sm font-medium text-[#FAFAFA]">
              {sleepTimer.mode === 'end_of_track'
                ? 'End of Track'
                : sleepSecondsLeft !== null
                  ? formatDuration(sleepSecondsLeft)
                  : '--:--'}
            </span>
          </div>
        )}

        <div className="space-y-2">
          {OPTIONS.map((opt) => {
            const active = sleepTimer.active && sleepTimer.mode === opt.mode;
            return (
              <button
                key={opt.mode}
                onClick={() => {
                  setSleepTimerMode(opt.mode);
                  setSleepModalOpen(false);
                }}
                className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                  active
                    ? 'border-[#FAFAFA] bg-[#1C1C21]'
                    : 'border-[#27272A] bg-[#09090B] hover:bg-[#1C1C21]'
                }`}
              >
                <p className="text-sm font-medium text-[#FAFAFA]">{opt.label}</p>
                <p className="text-[11px] text-[#71717A] mt-0.5">{opt.sub}</p>
              </button>
            );
          })}
        </div>

        {sleepTimer.active && (
          <button
            onClick={() => {
              setSleepTimerMode(null);
              setSleepModalOpen(false);
            }}
            className="w-full rounded-xl border border-[#27272A] py-2.5 text-xs font-medium text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#1C1C21]"
          >
            Turn Off Timer
          </button>
        )}
      </div>
    </div>
  );
};
