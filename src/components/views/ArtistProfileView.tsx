import React, { useEffect, useState } from 'react';
import { Loader2, Play, Shuffle } from 'lucide-react';
import { searchMusic } from '../../services/streamEngine';
import { useDulo } from '../../store/DuloContext';
import { Track, TrendingArtist } from '../../types/music';
import { TrackArtwork } from '../TrackArtwork';
import { TrackRow } from '../TrackRow';

interface ArtistProfileViewProps {
  artist: TrendingArtist;
}

export const ArtistProfileView: React.FC<ArtistProfileViewProps> = ({ artist }) => {
  const { settings, playTrack, toggleShuffle, shuffle } = useDulo();
  const [tracks, setTracks] = useState<Track[]>(artist.tracks);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setTracks(artist.tracks);
    setLoading(true);

    void searchMusic(artist.name, 'music_songs', settings)
      .then((res) => {
        if (cancelled) return;
        if (res.songs.length > 0) {
          const seen = new Set(artist.tracks.map((t) => t.videoId || t.id));
          const merged = [
            ...artist.tracks,
            ...res.songs.filter((s) => !seen.has(s.videoId || s.id)),
          ];
          setTracks(merged.slice(0, 20));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [artist, settings]);

  const handlePlayAll = () => {
    if (tracks.length === 0) return;
    void playTrack(tracks[0], tracks);
  };

  const handleShufflePlay = () => {
    if (tracks.length === 0) return;
    if (!shuffle) toggleShuffle();
    const randomIdx = Math.floor(Math.random() * tracks.length);
    void playTrack(tracks[randomIdx], tracks);
  };

  return (
    <div className="space-y-7">
      {/* Artist Header Card */}
      <section className="rounded-[24px] border border-white/[0.08] bg-[#141417] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5 min-w-0">
          <div className="w-24 h-24 rounded-full overflow-hidden border border-white/[0.12] bg-[#0A0A0C] shrink-0">
            <TrackArtwork
              src={artist.avatar}
              alt={artist.name}
              className="w-24 h-24 rounded-full"
              size="md"
            />
          </div>
          <div className="min-w-0 space-y-1.5">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/50">
              Artist · {artist.genre}
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#FFFFFF] truncate">
              {artist.name}
            </h1>
            <p className="text-xs text-white/60 font-mono-tabular tabular-nums">
              {tracks.length} tracks in rotation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handlePlayAll}
            disabled={tracks.length === 0}
            className="inline-flex items-center gap-2 rounded-full bg-[#FFFFFF] px-5 py-2.5 text-xs font-semibold text-[#000000] hover:bg-[#E4E4E7] active:scale-[0.97] transition-all spring-transition min-h-[42px] disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Play Now</span>
          </button>
          <button
            type="button"
            onClick={handleShufflePlay}
            disabled={tracks.length === 0}
            className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-[#1C1C22] px-4 py-2.5 text-xs font-medium text-[#FFFFFF] hover:bg-[#24242C] active:scale-[0.97] transition-all spring-transition min-h-[42px] disabled:opacity-50"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Shuffle</span>
          </button>
        </div>
      </section>

      {/* Top Tracks List */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold tracking-tight text-[#FFFFFF]">
            Top Tracks
          </h2>
          {loading && (
            <span className="inline-flex items-center gap-1.5 text-xs text-white/50">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Refreshing</span>
            </span>
          )}
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#141417] p-2 space-y-1">
          {tracks.map((track, idx) => (
            <TrackRow
              key={`artist-${artist.id}-${track.id}`}
              track={track}
              index={idx}
              queueContext={tracks}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
