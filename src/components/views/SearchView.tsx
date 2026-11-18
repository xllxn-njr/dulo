import React, { useEffect, useState } from 'react';
import { Loader2, Play, Search, Video, X } from 'lucide-react';
import coverKinetic from '../../assets/images/cover_kinetic_form_1794983244444.jpg';
import coverLagos from '../../assets/images/cover_lagos_pulse_1794983242519.jpg';
import coverMidnight from '../../assets/images/cover_midnight_transit_1794983243554.jpg';
import coverObsidian from '../../assets/images/cover_obsidian_drift_1794983242257.jpg';
import coverTape from '../../assets/images/cover_tape_echo_1794983244037.jpg';
import coverVelvet from '../../assets/images/cover_velvet_static_1794983244488.jpg';
import { searchMusic, SearchOutput } from '../../services/streamEngine';
import { useDulo } from '../../store/DuloContext';
import { SearchFilter } from '../../types/music';
import { formatDuration } from '../../utils/format';
import { SegmentedPillSwitcher } from '../SegmentedPillSwitcher';
import { TrackArtwork } from '../TrackArtwork';
import { TrackRow } from '../TrackRow';

const FILTER_TABS: Array<{ id: SearchFilter; label: string }> = [
  { id: 'music_songs', label: 'Songs' },
  { id: 'music_albums', label: 'Albums' },
  { id: 'music_playlists', label: 'Playlists' },
  { id: 'videos', label: 'Videos' },
];

const BROWSE_CATEGORIES: Array<{
  title: string;
  subtitle: string;
  query: string;
  image: string;
}> = [
  {
    title: 'Focus & Ambient',
    subtitle: 'Instrumental & deep work',
    query: 'lofi focus instrumental beats',
    image: coverKinetic,
  },
  {
    title: 'Late Night R&B',
    subtitle: 'Velvet vocals & slow grooves',
    query: 'late night chill r&b',
    image: coverObsidian,
  },
  {
    title: 'Afro-Fusion',
    subtitle: 'Lagos rhythm & soulful bounce',
    query: 'afrobeats fusion hits',
    image: coverLagos,
  },
  {
    title: 'Electronic & Synth',
    subtitle: 'Modular pulse & club edits',
    query: 'electronic melodic synthwave',
    image: coverVelvet,
  },
  {
    title: 'Workout Energy',
    subtitle: 'High-tempo kinetic sessions',
    query: 'high energy workout electronic',
    image: coverMidnight,
  },
  {
    title: 'Throwbacks',
    subtitle: 'Timeless 90s & 2000s staples',
    query: '90s 2000s classic hits',
    image: coverTape,
  },
];

export const SearchView: React.FC = () => {
  const {
    settings,
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    playTrack,
    setVideoMode,
    setNowPlayingOpen,
  } = useDulo();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<SearchFilter>('music_songs');
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<SearchOutput>({
    songs: [],
    albums: [],
    playlists: [],
    providerLabel: settings.customProxyUrl.replace(/^https?:\/\//, ''),
    usedFallback: false,
  });

  // 400ms debounced instant search with stale-response cancellation
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setLoading(false);
      setOutput({
        songs: [],
        albums: [],
        playlists: [],
        providerLabel: settings.customProxyUrl.replace(/^https?:\/\//, ''),
        usedFallback: false,
      });
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      void searchMusic(trimmed, filter, settings)
        .then((res) => {
          if (cancelled) return;
          setOutput(res);
          if (trimmed.length >= 2) {
            addRecentSearch(trimmed);
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, filter, settings, addRecentSearch]);

  return (
    <div className="space-y-6">
      {/* Search Bar & Uniform Filter Switcher */}
      <div className="space-y-3.5 pb-4 border-b border-white/[0.08]">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-[#FFFFFF]">
            Search & Explore
          </h1>
          <p className="font-mono-tabular text-[11px] text-white/45 truncate">
            {output.providerLabel}
          </p>
        </div>

        <div className="relative rounded-full border border-white/[0.08] bg-[#141417] focus-within:border-white/30 focus-within:ring-2 focus-within:ring-white/10 transition-all duration-200 spring-transition">
          <Search className="w-4 h-4 text-white/45 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Songs, artists, albums, or video sessions..."
            aria-label="Search music"
            className="w-full rounded-full bg-transparent pl-11 pr-11 py-3 text-sm text-[#FFFFFF] placeholder-white/40 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-white/45 hover:text-[#FFFFFF] hover:bg-[#1C1C22] active:scale-[0.95] transition-all spring-transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sliding Pill Filter Switcher */}
        <SegmentedPillSwitcher
          ariaLabel="Search filter"
          value={filter}
          onChange={setFilter}
          options={FILTER_TABS}
          className="w-full max-w-md"
          fullWidth
        />
      </div>

      {/* Recent Search Pill Chips */}
      {recentSearches.length > 0 && !query.trim() && (
        <section className="space-y-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#71717A]">
            Recent Searches
          </p>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((term) => (
              <div
                key={term}
                className="inline-flex items-center rounded-full border border-[var(--dulo-border)] bg-[var(--dulo-surface)] overflow-hidden"
              >
                <button
                  onClick={() => setQuery(term)}
                  className="pl-3.5 pr-2.5 py-1.5 text-xs text-[#FAFAFA] hover:bg-[var(--dulo-hover)] active:scale-[0.97] transition-all spring-transition"
                >
                  {term}
                </button>
                <button
                  onClick={() => removeRecentSearch(term)}
                  aria-label={`Remove recent search ${term}`}
                  className="pr-3 pl-2 py-1.5 text-[#71717A] hover:text-[#FAFAFA] hover:bg-[var(--dulo-hover)] border-l border-[var(--dulo-border)] transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Categorized Genre & Mood Grid when Search Input is Empty */}
      {!query.trim() ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-[#FAFAFA] tracking-tight">
              Browse Moods & Genres
            </h2>
            <span className="text-xs text-[#71717A]">Tap any card to explore</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BROWSE_CATEGORIES.map((cat) => (
              <button
                key={cat.title}
                onClick={() => {
                  setFilter('music_songs');
                  setQuery(cat.query);
                }}
                className="group relative h-44 rounded-3xl overflow-hidden border border-[var(--dulo-border)] bg-[var(--dulo-surface)] text-left hover:border-[#3F3F46] active:scale-[0.97] transition-all duration-200 spring-transition"
              >
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 spring-transition"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-[#09090B]/95 via-[#09090B]/40 to-transparent"
                />
                <div className="absolute inset-x-3.5 bottom-3.5 rounded-2xl border border-[#27272A]/80 bg-[#09090B]/65 backdrop-blur-md px-3.5 py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-display text-sm font-semibold text-[#FAFAFA] truncate">
                      {cat.title}
                    </p>
                    <p className="text-[11px] text-[#A1A1AA] truncate mt-0.5">
                      {cat.subtitle}
                    </p>
                  </div>
                  <span className="w-8 h-8 rounded-full bg-[#FAFAFA] text-[#09090B] flex items-center justify-center shrink-0">
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : loading ? (
        <div className="flex items-center justify-center py-16 text-[#A1A1AA] gap-2.5 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Querying {settings.streamMode === 'proxy' ? 'Cloudflare Proxy' : 'Piped network'}…</span>
        </div>
      ) : filter === 'music_albums' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {output.albums.map((alb) => (
            <button
              key={alb.id}
              onClick={() => {
                setFilter('music_songs');
                setQuery(alb.title);
              }}
              className="rounded-2xl border border-[var(--dulo-border)] bg-[var(--dulo-surface)] p-3 text-left hover:bg-[var(--dulo-hover)] hover:border-[#3F3F46] active:scale-[0.97] transition-all spring-transition"
            >
              <TrackArtwork
                src={alb.artwork}
                alt={alb.title}
                className="w-full aspect-square rounded-xl mb-3"
                size="lg"
              />
              <p className="text-sm font-medium text-[#FAFAFA] truncate">{alb.title}</p>
              <p className="text-xs text-[#A1A1AA] truncate mt-0.5">
                {alb.artist}
                {alb.trackCount ? ` · ${alb.trackCount} tracks` : ''}
              </p>
            </button>
          ))}
        </div>
      ) : filter === 'music_playlists' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {output.playlists.map((pl) => (
            <button
              key={pl.id}
              onClick={() => {
                setFilter('music_songs');
                setQuery(pl.title);
              }}
              className="flex items-center gap-4 rounded-2xl border border-[var(--dulo-border)] bg-[var(--dulo-surface)] p-3.5 text-left hover:bg-[var(--dulo-hover)] hover:border-[#3F3F46] active:scale-[0.98] transition-all spring-transition"
            >
              <TrackArtwork
                src={pl.artwork}
                alt={pl.title}
                className="w-16 h-16 rounded-xl"
                size="md"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#FAFAFA] truncate">{pl.title}</p>
                <p className="text-xs text-[#A1A1AA] truncate mt-0.5 tabular-nums">
                  {pl.author} · {pl.trackCount} tracks
                </p>
              </div>
              <Play className="w-4 h-4 text-[#A1A1AA]" />
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filter === 'videos' && output.songs.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {output.songs.map((track) => (
                <button
                  key={track.id}
                  onClick={() => {
                    setVideoMode(true);
                    setNowPlayingOpen(true);
                    void playTrack(track, output.songs);
                  }}
                  className="flex items-center gap-3.5 rounded-2xl border border-[var(--dulo-border)] bg-[var(--dulo-surface)] p-3 text-left hover:bg-[var(--dulo-hover)] hover:border-[#3F3F46] active:scale-[0.98] transition-all spring-transition"
                >
                  <div className="relative shrink-0">
                    <TrackArtwork
                      src={track.artwork}
                      alt={track.title}
                      className="w-24 h-14 rounded-xl"
                      size="sm"
                    />
                    <span className="absolute bottom-1 right-1 rounded-full bg-black/80 px-2 py-0.5 text-[10px] text-[#FAFAFA] flex items-center gap-1">
                      <Video className="w-2.5 h-2.5" />
                      Video
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#FAFAFA] truncate">
                      {track.title}
                    </p>
                    <p className="text-xs text-[#A1A1AA] truncate mt-0.5">
                      {track.artist}
                      <span className="mx-1.5 text-[#71717A]">·</span>
                      <span className="font-mono-tabular tabular-nums">
                        {formatDuration(track.duration)}
                      </span>
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {filter !== 'videos' && output.songs.length > 0 && (
            <div className="rounded-2xl border border-[var(--dulo-border)] bg-[var(--dulo-surface)]/70 p-2 space-y-1">
              {output.songs.map((track, idx) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={idx}
                  queueContext={output.songs}
                />
              ))}
            </div>
          )}

          {output.songs.length === 0 && (
            <div className="rounded-3xl border border-[var(--dulo-border)] bg-[var(--dulo-surface)] p-10 text-center">
              <Search className="w-5 h-5 text-[#71717A] mx-auto mb-2.5" />
              <p className="text-sm font-medium text-[#FAFAFA]">No matching results found</p>
              <p className="text-xs text-[#71717A] mt-1">
                Try another artist, song title, or filter tab.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
