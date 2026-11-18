import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Play, Plus, RefreshCw, Search } from 'lucide-react';
import { searchMusic } from '../../services/streamEngine';
import { useDulo } from '../../store/DuloContext';
import { MoodCategory, Track } from '../../types/music';
import { formatDuration } from '../../utils/format';
import { TrackArtwork } from '../TrackArtwork';
import { TrackRow } from '../TrackRow';

const MOODS: MoodCategory[] = [
  'All',
  'Focus',
  'Late Night',
  'Workout',
  'Afro-Fusion',
  'Throwbacks',
];

const MOOD_QUERIES: Record<MoodCategory, string> = {
  All: 'top music hits',
  Focus: 'lofi focus instrumental beats',
  'Late Night': 'late night chill r&b',
  Workout: 'high energy workout electronic',
  'Afro-Fusion': 'afrobeats fusion hits',
  Throwbacks: '90s 2000s classic hits',
};

export const HomeView: React.FC = () => {
  const {
    history,
    playTrack,
    addToQueue,
    currentTrack,
    isPlaying,
    isLoadingTrack,
    settings,
    setActiveTab,
  } = useDulo();

  const [selectedMood, setSelectedMood] = useState<MoodCategory>('All');
  const [tracksByMood, setTracksByMood] = useState<Partial<Record<MoodCategory, Track[]>>>({});
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);

  const loadMoodFeed = async (mood: MoodCategory, force = false) => {
    if (!force && tracksByMood[mood]?.length) return;
    setLoadingFeed(true);
    setFeedError(null);
    try {
      const res = await searchMusic(MOOD_QUERIES[mood], 'music_songs', settings);
      if (res.songs.length === 0) {
        setFeedError('No live tracks returned for this mood right now.');
      } else {
        setTracksByMood((prev) => ({ ...prev, [mood]: res.songs }));
      }
    } catch (err) {
      setFeedError(err instanceof Error ? err.message : 'Unable to load tracks');
    } finally {
      setLoadingFeed(false);
    }
  };

  useEffect(() => {
    void loadMoodFeed(selectedMood);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMood, settings.customProxyUrl, settings.streamMode]);

  const filteredTracks = useMemo(
    () => tracksByMood[selectedMood] || [],
    [tracksByMood, selectedMood]
  );

  const jumpBackIn: Track[] = useMemo(() => {
    if (history.length > 0) {
      return history.slice(0, 6).map((h) => h.track);
    }
    return filteredTracks.slice(0, 6);
  }, [history, filteredTracks]);

  const featuredTrack = filteredTracks[0] || history[0]?.track || null;

  return (
    <div className="space-y-10">
      {/* Header + Quick-Mood Filter Controls */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#FAFAFA] text-balance">
              Listen without friction
            </h1>
            <p className="text-sm text-[#A1A1AA] mt-1">
              Matte audio streaming · Live search & YouTube IFrame playback
            </p>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Mood filter"
          className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar"
        >
          {MOODS.map((mood) => {
            const active = selectedMood === mood;
            return (
              <button
                key={mood}
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedMood(mood)}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 min-h-[38px] ${
                  active
                    ? 'bg-[#FAFAFA] text-[#09090B]'
                    : 'bg-[#121215] text-[#A1A1AA] border border-[#27272A] hover:bg-[#1C1C21] hover:text-[#FAFAFA]'
                }`}
              >
                {mood}
              </button>
            );
          })}
        </div>
      </section>

      {/* Single Dominant Focal Anchor: Featured Session */}
      {featuredTrack ? (
        <section className="rounded-2xl border border-[#27272A] bg-[#121215] p-5 sm:p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <TrackArtwork
              src={featuredTrack.artwork}
              alt={featuredTrack.title}
              className="w-full sm:w-44 h-44 rounded-xl border border-[#27272A]"
              size="xl"
            />
            <div className="flex-1 min-w-0 space-y-3">
              <p className="text-xs font-medium text-[#71717A]">
                Featured Selection · {selectedMood}
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#FAFAFA] tracking-tight text-balance">
                {featuredTrack.title}
              </h2>
              <p className="text-sm text-[#A1A1AA]">
                {featuredTrack.artist}
                <span aria-hidden="true" className="mx-2 text-[#71717A]">
                  ·
                </span>
                {featuredTrack.album}
                <span aria-hidden="true" className="mx-2 text-[#71717A]">
                  ·
                </span>
                <span className="font-mono-tabular">
                  {formatDuration(featuredTrack.duration)}
                </span>
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => void playTrack(featuredTrack, filteredTracks)}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#FAFAFA] px-5 py-2.5 text-xs font-semibold text-[#09090B] hover:bg-[#E4E4E7] transition-colors min-h-[42px]"
                >
                  {currentTrack?.id === featuredTrack.id && isLoadingTrack ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                  <span>
                    {currentTrack?.id === featuredTrack.id && isLoadingTrack
                      ? 'Loading Stream…'
                      : currentTrack?.id === featuredTrack.id && isPlaying
                        ? 'Playing Now'
                        : 'Play Session'}
                  </span>
                </button>
                <button
                  onClick={() => addToQueue(featuredTrack)}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#27272A] bg-[#1C1C21] px-4 py-2.5 text-xs font-medium text-[#FAFAFA] hover:bg-[#27272A] transition-colors min-h-[42px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Queue Next</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : loadingFeed ? (
        <section className="rounded-2xl border border-[#27272A] bg-[#121215] p-10 flex items-center justify-center gap-3 text-xs text-[#A1A1AA]">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Fetching live {selectedMood} tracks…</span>
        </section>
      ) : (
        <section className="rounded-2xl border border-[#27272A] bg-[#121215] p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-display text-lg font-semibold text-[#FAFAFA]">
              Start listening
            </h2>
            <p className="text-xs text-[#A1A1AA]">
              {feedError || 'Search any artist, song, or album to play immediately.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void loadMoodFeed(selectedMood, true)}
              className="inline-flex items-center gap-2 rounded-lg border border-[#27272A] bg-[#1C1C21] px-4 py-2 text-xs font-medium text-[#FAFAFA] hover:bg-[#27272A]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className="inline-flex items-center gap-2 rounded-lg bg-[#FAFAFA] px-4 py-2 text-xs font-semibold text-[#09090B] hover:bg-[#E4E4E7]"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search Music</span>
            </button>
          </div>
        </section>
      )}

      {/* Jump Back In Grid */}
      {jumpBackIn.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-[#FAFAFA]">
              Jump Back In
            </h2>
            <span className="text-xs text-[#71717A]">
              {history.length > 0 ? 'From recent history' : 'Live rotation'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {jumpBackIn.map((track) => {
              const active = currentTrack?.id === track.id;
              return (
                <button
                  key={`jump-${track.id}`}
                  onClick={() => void playTrack(track, jumpBackIn)}
                  className={`group flex items-center gap-3.5 rounded-xl border p-2.5 text-left transition-colors ${
                    active
                      ? 'border-[#3F3F46] bg-[#1C1C21]'
                      : 'border-[#27272A] bg-[#121215] hover:bg-[#1C1C21]'
                  }`}
                >
                  <div
                    className={`relative rounded-lg overflow-hidden shrink-0 ${
                      active && isLoadingTrack ? 'ring-2 ring-[#FAFAFA]/60 animate-pulse' : ''
                    }`}
                  >
                    <TrackArtwork
                      src={track.artwork}
                      alt={track.title}
                      className="w-14 h-14 rounded-lg"
                      size="sm"
                    />
                    {active && isLoadingTrack && (
                      <span className="absolute inset-0 bg-[#09090B]/65 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 text-[#FAFAFA] animate-spin" />
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#FAFAFA] truncate">
                      {track.title}
                    </p>
                    <p className="text-xs text-[#A1A1AA] truncate mt-0.5">
                      {track.artist}
                    </p>
                  </div>
                  <span className="w-9 h-9 rounded-lg flex items-center justify-center text-[#A1A1AA] group-hover:text-[#FAFAFA] shrink-0">
                    {active && isLoadingTrack ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#FAFAFA]" />
                    ) : (
                      <Play className="w-4 h-4 fill-current" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Live Mood Tracks */}
      {filteredTracks.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-[#FAFAFA]">
              {selectedMood === 'All' ? 'Trending Music' : `${selectedMood} Rotation`}
            </h2>
            <span className="font-mono-tabular text-xs text-[#71717A]">
              {filteredTracks.length} tracks
            </span>
          </div>

          <div className="rounded-2xl border border-[#27272A] bg-[#121215]/60 p-2 space-y-1">
            {filteredTracks.map((track, idx) => (
              <TrackRow
                key={track.id}
                track={track}
                index={idx}
                queueContext={filteredTracks}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
