import React from 'react';
import {
  ChevronUp,
  ListMusic,
  Loader2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Timer,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useDulo } from '../store/DuloContext';
import { formatDuration } from '../utils/format';
import { TrackArtwork } from './TrackArtwork';

export const PlaybackDock: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    isLoadingTrack,
    currentTime,
    duration,
    volume,
    shuffle,
    repeat,
    togglePlay,
    playNext,
    playPrevious,
    seekTo,
    setVolume,
    toggleShuffle,
    cycleRepeat,
    setNowPlayingOpen,
    setEqModalOpen,
    setSleepModalOpen,
    sleepTimer,
    sleepSecondsLeft,
  } = useDulo();

  if (!currentTrack) return null;

  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <>
      {/* Desktop Persistent Bottom Playback Dock */}
      <footer className="hidden md:flex fixed bottom-0 left-0 right-0 z-30 h-20 border-t border-[var(--dulo-border)] bg-[var(--dulo-surface)]/95 backdrop-blur-xl px-5 items-center justify-between gap-6">
        {/* Left: Track Info & Expand Sheet Trigger */}
        <div className="flex items-center gap-3.5 min-w-0 w-[28%]">
          <button
            onClick={() => setNowPlayingOpen(true)}
            className={`group relative rounded-lg overflow-hidden shrink-0 border transition-all ${
              isLoadingTrack
                ? 'border-[#FAFAFA] ring-2 ring-[#FAFAFA]/40 animate-pulse'
                : 'border-[#27272A]'
            }`}
            aria-label="Open Now Playing sheet"
          >
            <TrackArtwork
              src={currentTrack.artwork}
              alt={currentTrack.title}
              className="w-12 h-12"
              size="sm"
            />
            {isLoadingTrack ? (
              <span className="absolute inset-0 bg-[#09090B]/65 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-[#FAFAFA] animate-spin" />
              </span>
            ) : (
              <span className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <ChevronUp className="w-4 h-4 text-[#FAFAFA]" />
              </span>
            )}
          </button>
          <button
            onClick={() => setNowPlayingOpen(true)}
            className="min-w-0 text-left hover:opacity-85 transition-opacity"
          >
            <p className="text-sm font-medium text-[#FAFAFA] truncate">
              {currentTrack.title}
            </p>
            <p className="text-xs text-[#A1A1AA] truncate mt-0.5">
              {currentTrack.artist}
              <span aria-hidden="true" className="mx-1.5 text-[#71717A]">
                ·
              </span>
              <span className="text-[#71717A]">{currentTrack.album}</span>
            </p>
          </button>
        </div>

        {/* Center: Transport & Scrubbable Timeline */}
        <div className="flex flex-col items-center justify-center flex-1 max-w-xl gap-1.5">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleShuffle}
              aria-label="Toggle shuffle"
              className={`p-2 rounded-lg transition-colors ${
                shuffle ? 'text-[#FAFAFA] bg-[#1C1C21]' : 'text-[#71717A] hover:text-[#FAFAFA]'
              }`}
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              onClick={() => void playPrevious()}
              aria-label="Previous track"
              className="p-2 rounded-lg text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>

            <button
              onClick={() => void togglePlay()}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="w-9 h-9 rounded-full bg-[#FAFAFA] text-[#09090B] flex items-center justify-center hover:bg-[#E4E4E7] transition-transform active:scale-95"
            >
              {isLoadingTrack ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={() => void playNext(false)}
              aria-label="Next track"
              className="p-2 rounded-lg text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>

            <button
              onClick={cycleRepeat}
              aria-label="Cycle repeat mode"
              className={`p-2 rounded-lg transition-colors ${
                repeat !== 'off'
                  ? 'text-[#FAFAFA] bg-[#1C1C21]'
                  : 'text-[#71717A] hover:text-[#FAFAFA]'
              }`}
            >
              {repeat === 'one' ? (
                <Repeat1 className="w-4 h-4" />
              ) : (
                <Repeat className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="w-full flex items-center gap-2.5">
            <span className="font-mono-tabular tabular-nums text-[11px] text-[#71717A] w-10 text-right">
              {formatDuration(currentTime)}
            </span>
            <div className="relative flex-1 h-4 flex items-center">
              <div className="w-full h-1 rounded-full bg-[#3F3F46] overflow-hidden">
                <div
                  className="h-full bg-[#FAFAFA] transition-[width] duration-75"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(duration, 1)}
                step={0.1}
                value={currentTime}
                onChange={(e) => seekTo(Number(e.target.value))}
                aria-label="Seek timeline"
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>
            <span className="font-mono-tabular tabular-nums text-[11px] text-[#71717A] w-10">
              {formatDuration(duration)}
            </span>
          </div>
        </div>

        {/* Right: DSP / Sleep / Queue / Volume */}
        <div className="flex items-center justify-end gap-1.5 w-[28%]">
          <button
            onClick={() => setSleepModalOpen(true)}
            aria-label="Sleep timer"
            title="Sleep Timer"
            className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs transition-colors ${
              sleepTimer.active
                ? 'bg-[#1C1C21] text-[#FAFAFA] border border-[#27272A]'
                : 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#1C1C21]'
            }`}
          >
            <Timer className="w-4 h-4" />
            {sleepTimer.active && (
              <span className="font-mono-tabular text-[11px]">
                {sleepTimer.mode === 'end_of_track'
                  ? 'End'
                  : sleepSecondsLeft !== null
                    ? formatDuration(sleepSecondsLeft)
                    : ''}
              </span>
            )}
          </button>

          <button
            onClick={() => setEqModalOpen(true)}
            aria-label="10-Band Equalizer & Crossfade"
            title="10-Band Equalizer & Crossfade"
            className="p-2 rounded-lg text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#1C1C21] transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          <button
            onClick={() => setNowPlayingOpen(true)}
            aria-label="Queue & Synced Lyrics"
            title="Queue & Synced Lyrics"
            className="p-2 rounded-lg text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#1C1C21] transition-colors"
          >
            <ListMusic className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 ml-1">
            <button
              onClick={() => setVolume(volume > 0 ? 0 : 0.85)}
              aria-label={volume === 0 ? 'Unmute' : 'Mute'}
              className="p-1.5 text-[#A1A1AA] hover:text-[#FAFAFA]"
            >
              {volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label="Volume"
              className="dulo-range w-20"
            />
          </div>
        </div>
      </footer>

      {/* Mobile Floating Mini-Player Pill hovering cleanly above Floating Lower Pill Dock */}
      <div className="md:hidden fixed bottom-[92px] left-4 right-4 max-w-[430px] mx-auto z-30">
        <div className="rounded-2xl border border-white/[0.08] bg-[#141417]/95 backdrop-blur-xl overflow-hidden shadow-[0_12px_32px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-3 px-2.5 py-2">
            <button
              onClick={() => setNowPlayingOpen(true)}
              className="flex items-center gap-3 flex-1 min-w-0 text-left min-h-[44px]"
            >
              <div
                className={`relative rounded-lg overflow-hidden shrink-0 border transition-all ${
                  isLoadingTrack
                    ? 'border-[#FAFAFA] ring-2 ring-[#FAFAFA]/40 animate-pulse'
                    : 'border-[#27272A]'
                }`}
              >
                <TrackArtwork
                  src={currentTrack.artwork}
                  alt={currentTrack.title}
                  className="w-10 h-10 rounded-lg"
                  size="xs"
                />
                {isLoadingTrack && (
                  <span className="absolute inset-0 bg-[#09090B]/65 flex items-center justify-center">
                    <Loader2 className="w-3.5 h-3.5 text-[#FAFAFA] animate-spin" />
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-[#FAFAFA] truncate">
                  {currentTrack.title}
                </p>
                <p className="text-[11px] text-[#A1A1AA] truncate">
                  {currentTrack.artist}
                </p>
              </div>
            </button>

            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={() => void togglePlay()}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[#FAFAFA] hover:bg-[#1C1C21]"
              >
                {isLoadingTrack ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>
              <button
                onClick={() => void playNext(false)}
                aria-label="Next track"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[#A1A1AA] hover:text-[#FAFAFA]"
              >
                <SkipForward className="w-4 h-4 fill-current" />
              </button>
            </div>
          </div>
          <div className="h-[2px] w-full bg-[#3F3F46]">
            <div
              className="h-full bg-[#FAFAFA] transition-[width] duration-100"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>
    </>
  );
};
