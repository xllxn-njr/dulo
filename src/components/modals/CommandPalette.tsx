import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart2,
  Home,
  Library,
  Play,
  Search,
  Settings,
  SlidersHorizontal,
  Timer,
  X,
} from 'lucide-react';
import { EQ_PRESETS } from '../../services/audioEngine';
import { useDulo } from '../../store/DuloContext';
import { Track } from '../../types/music';

export const CommandPalette: React.FC = () => {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    setActiveTab,
    playTrack,
    setEqPreset,
    setEqModalOpen,
    setSleepModalOpen,
    queue,
    likedSongs,
    localTracks,
    history,
  } = useDulo();

  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      window.setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [commandPaletteOpen]);

  useEffect(() => {
    if (!commandPaletteOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCommandPaletteOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  const allTracks = useMemo(() => {
    const map = new Map<string, Track>();
    [...queue, ...likedSongs, ...localTracks, ...history.map((h) => h.track)].forEach((t) => {
      if (!map.has(t.id)) map.set(t.id, t);
    });
    return Array.from(map.values());
  }, [queue, likedSongs, localTracks, history]);

  const q = query.trim().toLowerCase();

  const matchedTracks = useMemo(() => {
    if (!q) return allTracks.slice(0, 4);
    return allTracks
      .filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.artist.toLowerCase().includes(q) ||
          t.album.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [allTracks, q]);

  const matchedPresets = useMemo(() => {
    if (!q) return EQ_PRESETS.slice(0, 3);
    return EQ_PRESETS.filter((p) => p.name.toLowerCase().includes(q));
  }, [q]);

  if (!commandPaletteOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 pt-20 p-4"
      onClick={() => setCommandPaletteOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-[#27272A] bg-[#121215] overflow-hidden"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#27272A]">
          <Search className="w-4 h-4 text-[#71717A]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search songs, EQ presets, or jump to view…"
            className="flex-1 bg-transparent text-sm text-[#FAFAFA] placeholder-[#71717A] focus:outline-none"
          />
          <button
            onClick={() => setCommandPaletteOpen(false)}
            className="p-1 rounded text-[#71717A] hover:text-[#FAFAFA]"
            aria-label="Close Command Palette"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2 space-y-4">
          {matchedTracks.length > 0 && (
            <div className="space-y-1">
              <p className="px-2.5 pt-1 text-[11px] font-medium text-[#71717A]">
                Tracks
              </p>
              {matchedTracks.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    void playTrack(t);
                    setCommandPaletteOpen(false);
                  }}
                  className="w-full flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-[#1C1C21] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#FAFAFA] truncate">
                      {t.title}
                    </p>
                    <p className="text-[11px] text-[#A1A1AA] truncate">
                      {t.artist}
                    </p>
                  </div>
                  <Play className="w-3.5 h-3.5 text-[#A1A1AA] shrink-0" />
                </button>
              ))}
            </div>
          )}

          {matchedPresets.length > 0 && (
            <div className="space-y-1">
              <p className="px-2.5 text-[11px] font-medium text-[#71717A]">
                EQ Presets
              </p>
              {matchedPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setEqPreset(preset.id);
                    setCommandPaletteOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-[#FAFAFA] hover:bg-[#1C1C21]"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#A1A1AA]" />
                  <span>Switch EQ to {preset.name}</span>
                </button>
              ))}
            </div>
          )}

          <div className="space-y-1">
            <p className="px-2.5 text-[11px] font-medium text-[#71717A]">
              Navigation & Actions
            </p>
            {[
              { label: 'Go to Home', icon: Home, act: () => setActiveTab('home') },
              { label: 'Go to Search', icon: Search, act: () => setActiveTab('search') },
              { label: 'Go to Library & Vault', icon: Library, act: () => setActiveTab('library') },
              { label: 'Go to Dulo Pulse Stats', icon: BarChart2, act: () => setActiveTab('stats') },
              { label: 'Go to Settings', icon: Settings, act: () => setActiveTab('settings') },
              { label: 'Open 10-Band Equalizer', icon: SlidersHorizontal, act: () => setEqModalOpen(true) },
              { label: 'Configure Sleep Timer', icon: Timer, act: () => setSleepModalOpen(true) },
            ]
              .filter((item) => !q || item.label.toLowerCase().includes(q))
              .map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      item.act();
                      setCommandPaletteOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-[#FAFAFA] hover:bg-[#1C1C21]"
                  >
                    <Icon className="w-3.5 h-3.5 text-[#A1A1AA]" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};
