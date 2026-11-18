import React from 'react';
import { RotateCcw, X } from 'lucide-react';
import { EQ_LABELS, EQ_PRESETS } from '../../services/audioEngine';
import { useDulo } from '../../store/DuloContext';

export const EqualizerModal: React.FC = () => {
  const {
    eqModalOpen,
    setEqModalOpen,
    settings,
    updateSettings,
    setEqPreset,
    setEqBandGain,
  } = useDulo();

  if (!eqModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="10-Band Parametric Equalizer"
    >
      <div className="w-full max-w-2xl rounded-2xl border border-[#27272A] bg-[#121215] p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#FAFAFA]">
              10-Band Parametric Equalizer
            </h2>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              Real-time Web Audio BiquadFilterNode DSP chain
            </p>
          </div>
          <button
            onClick={() => setEqModalOpen(false)}
            aria-label="Close Equalizer"
            className="p-2 rounded-lg text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#1C1C21]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap items-center gap-2">
          {EQ_PRESETS.map((preset) => {
            const active = settings.eqPreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => setEqPreset(preset.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  active
                    ? 'bg-[#FAFAFA] text-[#09090B]'
                    : 'border border-[#27272A] bg-[#09090B] text-[#A1A1AA] hover:text-[#FAFAFA]'
                }`}
              >
                {preset.name}
              </button>
            );
          })}
          <button
            onClick={() => setEqPreset('flat')}
            className="ml-auto inline-flex items-center gap-1.5 text-xs text-[#71717A] hover:text-[#FAFAFA]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* 10-Band Sliders */}
        <div className="rounded-xl border border-[#27272A] bg-[#09090B] p-4 sm:p-5">
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
            {EQ_LABELS.map((label, idx) => {
              const gain = settings.eqGains[idx] ?? 0;
              return (
                <div key={label} className="flex flex-col items-center gap-2">
                  <span className="font-mono-tabular text-[11px] text-[#FAFAFA]">
                    {gain > 0 ? `+${gain}` : gain}
                  </span>
                  <div className="h-32 flex items-center justify-center">
                    <input
                      type="range"
                      min={-12}
                      max={12}
                      step={1}
                      value={gain}
                      onChange={(e) => setEqBandGain(idx, Number(e.target.value))}
                      aria-label={`${label} Hz gain`}
                      className="dulo-range w-28 -rotate-90"
                    />
                  </div>
                  <span className="font-mono-tabular text-[10px] text-[#71717A]">
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Crossfade & Loudness Normalization */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#27272A]">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#FAFAFA] font-medium">Dual-Deck Crossfade</span>
              <span className="font-mono-tabular text-[#A1A1AA]">
                {settings.crossfadeSeconds}s
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={12}
              step={1}
              value={settings.crossfadeSeconds}
              onChange={(e) =>
                updateSettings({ crossfadeSeconds: Number(e.target.value) })
              }
              className="dulo-range w-full"
            />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-[#27272A] bg-[#09090B] px-3.5 py-2.5">
            <div>
              <p className="text-xs font-medium text-[#FAFAFA]">Loudness Normalization</p>
              <p className="text-[11px] text-[#71717A]">DynamicsCompressor leveling</p>
            </div>
            <button
              role="switch"
              aria-checked={settings.loudnessNormalization}
              onClick={() =>
                updateSettings({
                  loudnessNormalization: !settings.loudnessNormalization,
                })
              }
              className={`w-10 h-5 rounded-full p-0.5 transition-colors shrink-0 ${
                settings.loudnessNormalization ? 'bg-[#FAFAFA]' : 'bg-[#27272A]'
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full transition-transform ${
                  settings.loudnessNormalization
                    ? 'translate-x-5 bg-[#09090B]'
                    : 'translate-x-0 bg-[#A1A1AA]'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
