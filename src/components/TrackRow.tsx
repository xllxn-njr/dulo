import React from 'react';
import {
  Check,
  Download,
  Heart,
  ListPlus,
  Loader2,
  Pause,
  Play,
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
    offlineIds,
    downloadingIds,
    toggleOfflineTrack,
    likedIds,
    toggleLikeTrack,
  } = useDulo();

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
      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors spring-transition duration-150 ${
        isCurrent
          ? 'bg-[#1C1C21] border border-[#27272A]'
          : 'border border-transparent hover:bg-[#121215] hover:border-[#27272A]'
      }`}
    >
      {typeof index === 'number' && (
        <span className="w-6 text-center font-mono-tabular text-xs text-[#71717A] shrink-0">
          {isCurrent && isPlaying ? '••' : String(index + 1).padStart(2, '0')}
        </span>
      )}

      <button
        onClick={handlePlay}
        className={`relative flex items-center justify-center shrink-0 rounded-lg overflow-hidden min-w-[44px] min-h-[44px] transition-all ${
          isCurrent && isLoadingTrack
            ? 'ring-2 ring-[#FAFAFA]/60 animate-pulse'
            : ''
        }`}
        aria-label={isCurrent && isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
      >
        <TrackArtwork
          src={track.artwork}
          alt={`${track.title} artwork`}
          className="w-11 h-11 rounded-lg"
          size="sm"
        />
        <span
          className={`absolute inset-0 flex items-center justify-center bg-[#09090B]/65 transition-opacity ${
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
          className={`min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg transition-colors ${
            isLiked
              ? 'text-[#FAFAFA]'
              : 'text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#1C1C21]'
          }`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#FAFAFA]' : ''}`} />
        </button>

        {showVaultButton && (
          <button
            onClick={() => void toggleOfflineTrack(track)}
            disabled={isDownloading}
            title={isOffline ? 'Cached in Offline Vault (click to remove)' : 'Save to Offline Vault'}
            aria-label={isOffline ? 'Remove from Offline Vault' : 'Download to Offline Vault'}
            className={`min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg transition-colors ${
              isOffline
                ? 'text-[#FAFAFA] bg-[#1C1C21]'
                : 'text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#1C1C21]'
            }`}
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isOffline ? (
              <Check className="w-4 h-4" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </button>
        )}

        <button
          onClick={() => addToQueue(track)}
          title="Add to Queue"
          aria-label={`Add ${track.title} to queue`}
          className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#1C1C21] transition-colors"
        >
          <ListPlus className="w-4 h-4" />
        </button>

        {onRemoveLocal && (
          <button
            onClick={() => onRemoveLocal(track.id)}
            title="Remove local track"
            aria-label={`Remove ${track.title}`}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#1C1C21] transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        <span className="hidden sm:inline-block w-12 text-right font-mono-tabular text-xs text-[#71717A]">
          {formatDuration(track.duration)}
        </span>
      </div>
    </div>
  );
};
