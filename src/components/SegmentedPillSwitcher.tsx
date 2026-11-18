import React from 'react';
import { motion } from 'motion/react';

export interface SegmentedOption<T extends string> {
  id: T;
  label: string;
  count?: number;
}

interface SegmentedPillSwitcherProps<T extends string> {
  options: Array<SegmentedOption<T>>;
  value: T;
  onChange: (id: T) => void;
  ariaLabel: string;
  className?: string;
  fullWidth?: boolean;
}

export function SegmentedPillSwitcher<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className = '',
  fullWidth = false,
}: SegmentedPillSwitcherProps<T>) {
  const activeIndex = Math.max(
    0,
    options.findIndex((opt) => opt.id === value)
  );

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`relative p-1 rounded-full bg-[#141417] border border-white/[0.08] ${
        fullWidth ? 'flex w-full' : 'inline-grid auto-cols-fr grid-flow-col'
      } ${className}`}
    >
      <div className="relative flex w-full">
        {/* Hardware-accelerated uniform sliding pill indicator */}
        <motion.div
          aria-hidden="true"
          animate={{ x: `${activeIndex * 100}%` }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: `${100 / options.length}%` }}
          className="absolute inset-y-0 left-0 rounded-full bg-[#242429] border border-white/[0.12] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16)] pointer-events-none"
        />

        {options.map((opt) => {
          const active = opt.id === value;
          return (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(opt.id)}
              className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium whitespace-nowrap transition-colors duration-200 spring-transition active:scale-[0.97] min-h-[36px] ${
                active
                  ? 'text-[#FFFFFF]'
                  : 'text-white/60 hover:text-white/85'
              }`}
            >
              <span>{opt.label}</span>
              {typeof opt.count === 'number' && (
                <span
                  className={`font-mono-tabular tabular-nums text-[11px] ${
                    active ? 'text-white/75' : 'text-white/40'
                  }`}
                >
                  {opt.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
