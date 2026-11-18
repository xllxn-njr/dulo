import React from 'react';
import { Loader2, Pause, Play } from 'lucide-react';
import { useDulo } from '../../store/DuloContext';
import { Track } from '../../types/music';
import { formatDuration } from '../../utils/format';
import { TrackArtwork } from '../TrackArtwork';

interface CatalogSeeAllViewProps {
  title: string;
  subtitle?: string;
  tracks: Track[];
}

export const CatalogSeeAllView: React.FC<CatalogSeeAllViewProps> = ({
  title,
  subtitle,
  tracks,
}) => {
  const { playTrack, togglePlay, currentTrack, isPlaying, isLoadingTrack } = useDulo();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/50">
            {subtitle || 'Catalog'}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#FFFFFF] mt-1">
            {title}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => tracks[0] && void playTrack(tracks[0], tracks)}
          disabled={tracks.length === 0}
          className="inline-flex items-center gap-2 rounded-full bg-[#FFFFFF] px-5 py-2.5 text-xs font-semibold text-[#000000] hover:bg-[#E4E4E7] active:scale-[0.97] transition-all spring-transition min-h-[42px] self-start sm:self-auto"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Play All</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {tracks.map((track) => {
          const active = currentTrack?.id === track.id;
          return (
            <button
              key={`seeall-${track.id}`}
              type="button"
              onClick={() => {
                if (active) void togglePlay();
                else void playTrack(track, tracks);
              }}
              className={`group rounded-[20px] border p-2.5 text-left bg-[#141417] hover:bg-[#1C1C22] hover:scale-[1.02] active:scale-[0.97] transition-all duration-200 spring-transition ${
                active ? 'border-white/30' : 'border-white/[0.08]'
              }`}
            >
              <div className="relative aspect-square w-full rounded-[16px] overflow-hidden bg-[#0A0A0C]">
                <TrackArtwork
                  src={track.artwork}
                  alt={track.title}
                  className="w-full h-full group-hover:scale-[1.04] transition-transform duration-300 spring-transition"
                  size="md"
                />
                <span
                  className={`absolute bottom-2.5 right-2.5 w-9 h-9 rounded-full bg-[#FFFFFF] text-[#000000] flex items-center justify-center shadow-lg transition-all duration-200 spring-transition ${
                    active ? 'opacity-100 scale-100' : 'opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0'
                  }`}
                >
                  {active && isLoadingTrack ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : active && isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </span>
              </div>
              <p className="mt-2.5 text-xs font-semibold text-[#FFFFFF] truncate">
                {track.title}
              </p>
              <div className="mt-0.5 flex items-center justify-between gap-2 text-[11px] text-white/55">
                <span className="truncate">{track.artist}</span>
                <span className="font-mono-tabular tabular-nums shrink-0 text-white/40">
                  {formatDuration(track.duration)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
