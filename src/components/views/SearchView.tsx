import React, { useEffect, useState } from 'react';
import { Loader2, Play, Search, Video, X } from 'lucide-react';
import { searchMusic, SearchOutput } from '../../services/streamEngine';
import { useDulo } from '../../store/DuloContext';
import { SearchFilter } from '../../types/music';
import { TrackArtwork } from '../TrackArtwork';
import { TrackRow } from '../TrackRow';

const FILTER_TABS: Array<{ id: SearchFilter; label: string }> = [
  { id: 'music_songs', label: 'Songs' },
  { id: 'music_albums', label: 'Albums' },
  { id: 'music_playlists', label: 'Playlists' },
  { id: 'videos', label: 'Videos' },
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

  // 450ms debounced instant search
  useEffect(() => {
    if (!query.trim()) {
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

    const timer = window.setTimeout(() => {
      setLoading(true);
      void searchMusic(query, filter, settings)
        .then((res) => {
          setOutput(res);
          if (query.trim().length >= 2) {
            addRecentSearch(query.trim());
          }
        })
        .finally(() => setLoading(false));
    }, 450);

    return () => window.clearTimeout(timer);
  }, [query, filter, settings, addRecentSearch]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[#FAFAFA]">
          Search & Discovery
        </h1>
        <p className="text-xs text-[#A1A1AA]">
          Active source: {output.providerLabel}
        </p>
      </div>

      {/* Instant Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#71717A] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search songs, artists, albums, or video sessions..."
          aria-label="Search music"
          className="w-full rounded-xl border border-[#27272A] bg-[#121215] pl-11 pr-11 py-3.5 text-sm text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:border-[#FAFAFA] transition-colors"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#71717A] hover:text-[#FAFAFA]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {FILTER_TABS.map((tab) => {
          const active = filter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 min-h-[38px] ${
                active
                  ? 'bg-[#FAFAFA] text-[#09090B]'
                  : 'bg-[#121215] text-[#A1A1AA] border border-[#27272A] hover:bg-[#1C1C21] hover:text-[#FAFAFA]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Recent Searches */}
      {recentSearches.length > 0 && !query && (
        <div className="space-y-2.5">
          <p className="text-xs font-medium text-[#71717A]">Recent Searches</p>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((term) => (
              <div
                key={term}
                className="inline-flex items-center rounded-lg border border-[#27272A] bg-[#121215] overflow-hidden"
              >
                <button
                  onClick={() => setQuery(term)}
                  className="px-3 py-1.5 text-xs text-[#FAFAFA] hover:bg-[#1C1C21] transition-colors"
                >
                  {term}
                </button>
                <button
                  onClick={() => removeRecentSearch(term)}
                  aria-label={`Remove recent search ${term}`}
                  className="px-2 py-1.5 text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#1C1C21] border-l border-[#27272A]"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Area */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-[#A1A1AA] gap-2.5 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Querying {settings.streamMode === 'proxy' ? 'InnerTube Proxy' : 'Piped network'}…</span>
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
              className="rounded-xl border border-[#27272A] bg-[#121215] p-3 text-left hover:bg-[#1C1C21] transition-colors"
            >
              <TrackArtwork
                src={alb.artwork}
                alt={alb.title}
                className="w-full aspect-square rounded-lg mb-3"
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
              className="flex items-center gap-4 rounded-xl border border-[#27272A] bg-[#121215] p-3.5 text-left hover:bg-[#1C1C21] transition-colors"
            >
              <TrackArtwork
                src={pl.artwork}
                alt={pl.title}
                className="w-16 h-16 rounded-lg"
                size="md"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#FAFAFA] truncate">{pl.title}</p>
                <p className="text-xs text-[#A1A1AA] truncate mt-0.5">
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
                  className="flex items-center gap-3.5 rounded-xl border border-[#27272A] bg-[#121215] p-3 text-left hover:bg-[#1C1C21] transition-colors"
                >
                  <div className="relative shrink-0">
                    <TrackArtwork
                      src={track.artwork}
                      alt={track.title}
                      className="w-24 h-14 rounded-lg"
                      size="sm"
                    />
                    <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] text-[#FAFAFA] flex items-center gap-1">
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
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {filter !== 'videos' && output.songs.length > 0 && (
            <div className="rounded-2xl border border-[#27272A] bg-[#121215]/60 p-2 space-y-1">
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
            <div className="rounded-2xl border border-[#27272A] bg-[#121215] p-10 text-center">
              <Search className="w-5 h-5 text-[#71717A] mx-auto mb-2.5" />
              <p className="text-sm font-medium text-[#FAFAFA]">
                {query.trim() ? 'No matching results found' : 'Search YouTube Music'}
              </p>
              <p className="text-xs text-[#71717A] mt-1">
                {query.trim()
                  ? 'Try another artist, song title, or filter tab.'
                  : 'Enter a song or artist above to search and play immediately.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
