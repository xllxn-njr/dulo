import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  Download,
  Heart,
  ListPlus,
  Loader2,
  MoreHorizontal,
  Pause,
  Play,
  SkipForward,
  Trash2,
} from 'lucide-react';
import { useDulo } from '../store/DuloContext';
import { Track } from '../types/music';
import { formatDuration } from '../utils/format';
import { TrackArtwork } from './TrackArtwork';

interface TrackRowProps {
  track: Track;
  index?: number;
  queueContext?: Track[];
  onRemoveLocal?: (id: string) => void;
  showVaultButton?: boolean;
}

export const TrackRow: React.FC<TrackRowProps> = ({
  track,
  index,
  queueContext,
  onRemoveLocal,
  showVaultButton = true,
}) => {
  const {
    currentTrack,
    isPlaying,
    isLoadingTrack,
    playTrack,
    togglePlay,
    addToQueue,
    playNextInQueue,
    offlineIds,
    downloadingIds,
    toggleOfflineTrack,
    likedIds,
    toggleLikeTrack,
  } = useDulo();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [menuOpen]);

  const isCurrent = currentTrack?.id === track.id;
  const isOffline = offlineIds.has(track.id);
  const isDownloading = downloadingIds.has(track.id);
  const isLiked = likedIds.has(track.id);

  const handlePlay = () => {
    if (isCurrent) {
      void togglePlay();
    } else {
      void playTrack(track, queueContext);
    }
  };

  return (
    <div
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 transition-all duration-200 spring-transition ${
        isCurrent
          ? 'bg-[#1C1C21] border border-[#27272A]'
          : 'border border-transparent hover:bg-[#1C1C21]/55 hover:border-[#27272A]/80'
      }`}
    >
      {typeof index === 'number' && (
        <span className="w-6 text-center font-mono-tabular tabular-nums text-xs text-[#71717A] shrink-0">
          {isCurrent && isPlaying ? '••' : String(index + 1).padStart(2, '0')}
        </span>
      )}

      <button
        onClick={handlePlay}
        className={`relative flex items-center justify-center shrink-0 rounded-lg overflow-hidden min-w-[44px] min-h-[44px] transition-transform duration-200 spring-transition active:scale-[0.95] ${
          isCurrent && isLoadingTrack
            ? 'ring-2 ring-[#FAFAFA]/60 animate-pulse'
            : ''
        }`}
        aria-label={isCurrent && isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
      >
        <TrackArtwork
          src={track.artwork}
          alt={`${track.title} artwork`}
          className="w-11 h-11 rounded-lg border border-[#27272A]"
          size="sm"
        />
        <span
          className={`absolute inset-0 flex items-center justify-center bg-[#09090B]/65 transition-opacity duration-200 ${
            isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          {isCurrent && isLoadingTrack ? (
            <Loader2 className="w-4 h-4 text-[#FAFAFA] animate-spin" />
          ) : isCurrent && isPlaying ? (
            <Pause className="w-4 h-4 text-[#FAFAFA] fill-[#FAFAFA]" />
          ) : (
            <Play className="w-4 h-4 text-[#FAFAFA] fill-[#FAFAFA] ml-0.5" />
          )}
        </span>
      </button>

      <button
        onClick={handlePlay}
        className="flex-1 min-w-0 text-left py-1"
      >
        <p
          className={`text-sm font-medium truncate ${
            isCurrent ? 'text-[#FFFFFF]' : 'text-[#FAFAFA]'
          }`}
        >
          {track.title}
        </p>
        <p className="text-xs text-[#A1A1AA] truncate mt-0.5">
          <span>{track.artist}</span>
          <span aria-hidden="true" className="mx-1.5 text-[#71717A]">
            ·
          </span>
          <span className="text-[#71717A]">{track.album}</span>
        </p>
      </button>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => void toggleLikeTrack(track)}
          title={isLiked ? 'Remove from Liked Songs' : 'Like Song'}
          aria-label={isLiked ? `Unlike ${track.title}` : `Like ${track.title}`}
          className={`min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full transition-all duration-200 spring-transition active:scale-[0.94] ${
            isLiked
              ? 'text-[#FAFAFA]'
              : 'text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#1C1C21]'
          }`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#FAFAFA]' : ''}`} />
        </button>

        <span className="hidden sm:inline-block w-12 text-right font-mono-tabular tabular-nums text-xs text-[#71717A]">
          {formatDuration(track.duration)}
        </span>

        {/* Minimalist Action Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={`More actions for ${track.title}`}
            aria-expanded={menuOpen}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#1C1C21] transition-all duration-200 spring-transition active:scale-[0.94]"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#FAFAFA]" />
            ) : (
              <MoreHorizontal className="w-4 h-4" />
            )}
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-11 z-30 w-52 rounded-xl border border-[#27272A] bg-[#121215] p-1.5 shadow-2xl space-y-0.5"
            >
              <button
                role="menuitem"
                onClick={() => {
                  playNextInQueue(track);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[#FAFAFA] hover:bg-[#1C1C21] transition-colors text-left"
              >
                <SkipForward className="w-3.5 h-3.5 text-[#A1A1AA]" />
                <span>Play Next</span>
              </button>

              <button
                role="menuitem"
                onClick={() => {
                  addToQueue(track);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[#FAFAFA] hover:bg-[#1C1C21] transition-colors text-left"
              >
                <ListPlus className="w-3.5 h-3.5 text-[#A1A1AA]" />
                <span>Add to Queue</span>
              </button>

              {showVaultButton && (
                <button
                  role="menuitem"
                  disabled={isDownloading}
                  onClick={() => {
                    void toggleOfflineTrack(track);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[#FAFAFA] hover:bg-[#1C1C21] transition-colors text-left disabled:opacity-50"
                >
                  {isOffline ? (
                    <Check className="w-3.5 h-3.5 text-[#FAFAFA]" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-[#A1A1AA]" />
                  )}
                  <span>{isOffline ? 'Remove from Vault' : 'Save Offline'}</span>
                </button>
              )}

              {onRemoveLocal && (
                <button
                  role="menuitem"
                  onClick={() => {
                    onRemoveLocal(track.id);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[#FAFAFA] hover:bg-[#1C1C21] transition-colors text-left"
                >
                  <Trash2 className="w-3.5 h-3.5 text-[#A1A1AA]" />
                  <span>Delete Local File</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
