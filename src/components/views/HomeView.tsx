import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronRight,
  Heart,
  Loader2,
  Pause,
  Play,
  RefreshCw,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { searchMusic } from '../../services/streamEngine';
import { useDulo } from '../../store/DuloContext';
import { MoodCategory, Track, TrendingArtist } from '../../types/music';
import { SegmentedPillSwitcher } from '../SegmentedPillSwitcher';
import { TrackArtwork } from '../TrackArtwork';
import { TrackRow } from '../TrackRow';
import { ArtistProfileView } from './ArtistProfileView';
import { CatalogSeeAllView } from './CatalogSeeAllView';

type HomeFeedTab = 'for_you' | 'curators';

const CURATOR_MOODS: MoodCategory[] = [
  'All',
  'Focus',
  'Late Night',
  'Workout',
  'Throwbacks',
  'Afro-Fusion',
];

const MOOD_QUERIES: Record<MoodCategory, string> = {
  All: 'curated top music sessions',
  Focus: 'lofi focus instrumental beats',
  'Late Night': 'late night chill r&b',
  Workout: 'high energy workout electronic',
  Throwbacks: '90s 2000s classic hits',
  'Afro-Fusion': 'afrobeats fusion hits',
};

function cleanArtistName(raw: string): string {
  return raw
    .replace(/\s*-\s*Topic$/i, '')
    .replace(/\s+VEVO$/i, '')
    .split(/,|&|\bfeat\.?\b|\bft\.?\b/i)[0]
    .trim();
}

function deriveTrendingArtists(pools: Array<{ tracks: Track[]; genre: string }>): TrendingArtist[] {
  const byName = new Map<string, TrendingArtist>();

  for (const pool of pools) {
    for (const track of pool.tracks) {
      const displayName = cleanArtistName(track.artist || '');
      if (!displayName || /^unknown artist$/i.test(displayName)) continue;
      const key = displayName.toLowerCase();
      const existing = byName.get(key);
      if (existing) {
        if (!existing.tracks.some((t) => t.id === track.id)) {
          existing.tracks.push(track);
        }
      } else {
        byName.set(key, {
          id: `artist-${key.replace(/[^a-z0-9]+/g, '-')}`,
          name: displayName,
          avatar: track.artwork,
          genre: track.mood || pool.genre,
          tracks: [track],
        });
      }
    }
  }

  return Array.from(byName.values()).slice(0, 14);
}

interface CatalogRailProps {
  title: string;
  subtitle: string;
  tracks: Track[];
  loading: boolean;
  onSeeAll: () => void;
}

const CatalogRail: React.FC<CatalogRailProps> = ({
  title,
  subtitle,
  tracks,
  loading,
  onSeeAll,
}) => {
  const { playTrack, togglePlay, currentTrack, isPlaying, isLoadingTrack } = useDulo();

  return (
    <section className="space-y-3.5" aria-label={title}>
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-lg sm:text-xl font-semibold tracking-tight text-[#FFFFFF]">
          {title}
        </h2>
        <button
          type="button"
          onClick={onSeeAll}
          disabled={tracks.length === 0}
          className="inline-flex items-center gap-1 text-xs font-medium text-white/60 hover:text-[#FFFFFF] active:scale-[0.97] transition-all spring-transition min-h-[36px] px-1 disabled:opacity-40"
        >
          <span>See All</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {loading && tracks.length === 0 ? (
        <div className="flex gap-3.5 overflow-hidden">
          {[0, 1, 2, 3, 4].map((idx) => (
            <div
              key={`${title}-skeleton-${idx}`}
              className="w-[156px] sm:w-[178px] shrink-0 rounded-[20px] border border-white/[0.08] bg-[#141417] p-2.5 animate-pulse"
            >
              <div className="aspect-square w-full rounded-[16px] bg-white/[0.06]" />
              <div className="mt-2.5 h-3.5 w-3/4 rounded bg-white/[0.08]" />
              <div className="mt-1.5 h-3 w-1/2 rounded bg-white/[0.05]" />
            </div>
          ))}
        </div>
      ) : tracks.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.08] bg-[#141417] px-5 py-6 text-xs text-white/55">
          {subtitle} unavailable right now.
        </div>
      ) : (
        <div className="flex items-stretch gap-3.5 overflow-x-auto pb-1 snap-x snap-mandatory no-scrollbar">
          {tracks.map((track) => {
            const active = currentTrack?.id === track.id;
            return (
              <button
                key={`${title}-${track.id}`}
                type="button"
                onClick={() => {
                  if (active) void togglePlay();
                  else void playTrack(track, tracks);
                }}
                className={`group w-[156px] sm:w-[178px] shrink-0 snap-start rounded-[20px] border p-2.5 text-left bg-[#141417] hover:bg-[#1C1C22] hover:scale-[1.02] active:scale-[0.97] transition-all duration-200 spring-transition ${
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
                      active
                        ? 'opacity-100 scale-100'
                        : 'opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0'
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
                <p className="mt-0.5 text-[11px] text-white/55 truncate">
                  {track.artist}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};

export const HomeView: React.FC = () => {
  const {
    homeSubRoute,
    openArtistProfile,
    openCatalogView,
    history,
    likedSongs,
    likedIds,
    toggleLikeTrack,
    playTrack,
    togglePlay,
    currentTrack,
    isPlaying,
    isLoadingTrack,
    settings,
  } = useDulo();

  const [homeTab, setHomeTab] = useState<HomeFeedTab>('for_you');

  // For You state (live feeds)
  const [trendingTracks, setTrendingTracks] = useState<Track[]>([]);
  const [newReleases, setNewReleases] = useState<Track[]>([]);
  const [popularHits, setPopularHits] = useState<Track[]>([]);
  const [recommendedTracks, setRecommendedTracks] = useState<Track[]>([]);
  const [loadingForYou, setLoadingForYou] = useState(true);
  const [forYouError, setForYouError] = useState<string | null>(null);

  // Hero Carousel state (5-second auto-advance, pause on hover/touch, swipe)
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const swipeStartXRef = useRef<number | null>(null);

  // Curators tab state
  const [selectedMood, setSelectedMood] = useState<MoodCategory>('All');
  const [tracksByMood, setTracksByMood] = useState<Partial<Record<MoodCategory, Track[]>>>({});
  const [loadingCurators, setLoadingCurators] = useState(false);

  const recommendedSeedQuery = useMemo(() => {
    const seedArtist = history[0]?.track.artist || likedSongs[0]?.artist;
    if (seedArtist && !/^unknown artist$/i.test(seedArtist)) {
      return `${cleanArtistName(seedArtist)} mix music`;
    }
    return 'melodic electronic r&b chill vibes';
  }, [history, likedSongs]);

  const loadForYouFeeds = useCallback(async () => {
    setLoadingForYou(true);
    setForYouError(null);
    try {
      const [trendRes, newRes, popRes, recRes] = await Promise.all([
        searchMusic('trending top music hits', 'music_songs', settings),
        searchMusic('new music releases 2025 audio', 'music_songs', settings),
        searchMusic('global popular hits top charts', 'music_songs', settings),
        searchMusic(recommendedSeedQuery, 'music_songs', settings),
      ]);

      setTrendingTracks(trendRes.songs.slice(0, 10));
      setNewReleases(newRes.songs.slice(0, 12));
      setPopularHits(popRes.songs.slice(0, 12));
      setRecommendedTracks(recRes.songs.slice(0, 12));

      if (
        trendRes.songs.length === 0 &&
        newRes.songs.length === 0 &&
        popRes.songs.length === 0
      ) {
        setForYouError('Unable to reach live catalog right now.');
      }
    } catch (err) {
      setForYouError(err instanceof Error ? err.message : 'Unable to load music feeds.');
    } finally {
      setLoadingForYou(false);
    }
  }, [recommendedSeedQuery, settings]);

  useEffect(() => {
    void loadForYouFeeds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.customProxyUrl, settings.streamMode]);

  const loadMoodFeed = useCallback(
    async (mood: MoodCategory) => {
      if (tracksByMood[mood]?.length) return;
      setLoadingCurators(true);
      try {
        const res = await searchMusic(MOOD_QUERIES[mood], 'music_songs', settings);
        if (res.songs.length > 0) {
          setTracksByMood((prev) => ({ ...prev, [mood]: res.songs }));
        }
      } finally {
        setLoadingCurators(false);
      }
    },
    [settings, tracksByMood]
  );

  useEffect(() => {
    if (homeTab === 'curators') {
      void loadMoodFeed(selectedMood);
    }
  }, [homeTab, selectedMood, loadMoodFeed]);

  const heroTracks = useMemo(() => {
    const pool = trendingTracks.length > 0 ? trendingTracks : popularHits;
    return pool.slice(0, 5);
  }, [trendingTracks, popularHits]);

  useEffect(() => {
    if (heroIndex >= heroTracks.length && heroTracks.length > 0) {
      setHeroIndex(0);
    }
  }, [heroTracks.length, heroIndex]);

  // 5-second auto-rotation timer with automatic pause on hover/touch
  useEffect(() => {
    if (homeTab !== 'for_you' || homeSubRoute || heroPaused || heroTracks.length <= 1) {
      return;
    }
    const id = window.setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroTracks.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, [homeTab, homeSubRoute, heroPaused, heroTracks.length]);

  const trendingArtists = useMemo(
    () =>
      deriveTrendingArtists([
        { tracks: trendingTracks, genre: 'Trending' },
        { tracks: popularHits, genre: 'Pop & Charts' },
        { tracks: newReleases, genre: 'New Release' },
        { tracks: recommendedTracks, genre: 'Curated' },
      ]),
    [trendingTracks, popularHits, newReleases, recommendedTracks]
  );

  // Contextual sub-routes rendered seamlessly under the Fixed Matte Upper Header
  if (homeSubRoute?.type === 'artist') {
    return <ArtistProfileView artist={homeSubRoute.artist} />;
  }

  if (homeSubRoute?.type === 'catalog') {
    return (
      <CatalogSeeAllView
        title={homeSubRoute.title}
        subtitle={homeSubRoute.subtitle}
        tracks={homeSubRoute.tracks}
      />
    );
  }

  const activeHeroTrack = heroTracks[heroIndex] || null;
  const activeHeroLiked = activeHeroTrack ? likedIds.has(activeHeroTrack.id) : false;
  const activeHeroPlaying = activeHeroTrack
    ? currentTrack?.id === activeHeroTrack.id && isPlaying
    : false;
  const activeHeroLoading = activeHeroTrack
    ? currentTrack?.id === activeHeroTrack.id && isLoadingTrack
    : false;

  const curatorTracks = tracksByMood[selectedMood] || [];

  const handleHeroSwipeEnd = (endX: number) => {
    if (swipeStartXRef.current === null || heroTracks.length <= 1) return;
    const delta = endX - swipeStartXRef.current;
    swipeStartXRef.current = null;
    if (Math.abs(delta) < 36) return;
    if (delta < 0) {
      setHeroIndex((prev) => (prev + 1) % heroTracks.length);
    } else {
      setHeroIndex((prev) => (prev - 1 + heroTracks.length) % heroTracks.length);
    }
  };

  return (
    <div className="space-y-7">
      {/* Sub-Navigation Tab Switcher: For You | Curators */}
      <div className="flex items-center justify-between gap-4">
        <SegmentedPillSwitcher
          ariaLabel="Home feed switcher"
          value={homeTab}
          onChange={setHomeTab}
          options={[
            { id: 'for_you', label: 'For You' },
            { id: 'curators', label: 'Curators' },
          ]}
          className="w-full max-w-[260px]"
          fullWidth
        />
      </div>

      <AnimatePresence mode="wait">
        {homeTab === 'for_you' ? (
          <motion.div
            key="home-for-you"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-8"
          >
            {/* 1. Auto-Rotating Trending Song Hero Banner */}
            {activeHeroTrack ? (
              <section
                aria-label="Trending Spotlight"
                onMouseEnter={() => setHeroPaused(true)}
                onMouseLeave={() => setHeroPaused(false)}
                onTouchStart={(e) => {
                  setHeroPaused(true);
                  swipeStartXRef.current = e.touches[0]?.clientX ?? null;
                }}
                onTouchEnd={(e) => {
                  const endX = e.changedTouches[0]?.clientX;
                  if (typeof endX === 'number') handleHeroSwipeEnd(endX);
                  setHeroPaused(false);
                }}
                onPointerDown={(e) => {
                  if (e.pointerType === 'mouse') {
                    swipeStartXRef.current = e.clientX;
                  }
                }}
                onPointerUp={(e) => {
                  if (e.pointerType === 'mouse') {
                    handleHeroSwipeEnd(e.clientX);
                  }
                }}
                className="relative overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#141417] min-h-[300px] sm:min-h-[348px] flex flex-col justify-end select-none"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeHeroTrack.id}
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0"
                  >
                    <TrackArtwork
                      src={activeHeroTrack.artwork}
                      alt={activeHeroTrack.title}
                      className="w-full h-full object-cover"
                      size="xl"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C] via-[#0A0A0C]/65 to-[#0A0A0C]/20"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-r from-[#0A0A0C]/85 via-[#0A0A0C]/35 to-transparent"
                    />
                  </motion.div>
                </AnimatePresence>

                <div className="relative z-10 p-6 sm:p-8 pb-10 sm:pb-11 flex flex-col gap-5 max-w-2xl">
                  <div className="space-y-2">
                    <span className="inline-flex items-center rounded-full border border-white/[0.14] bg-[#0A0A0C]/65 backdrop-blur-md px-3 py-1 text-[11px] font-medium text-white/90">
                      {activeHeroTrack.mood ? `Trending · ${activeHeroTrack.mood}` : 'Trending Now'}
                    </span>
                    <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#FFFFFF] line-clamp-2 text-balance">
                      {activeHeroTrack.title}
                    </h1>
                    <button
                      type="button"
                      onClick={() => {
                        const matched = trendingArtists.find(
                          (a) =>
                            a.name.toLowerCase() ===
                            cleanArtistName(activeHeroTrack.artist).toLowerCase()
                        );
                        if (matched) {
                          openArtistProfile(matched);
                        } else {
                          openArtistProfile({
                            id: `artist-hero-${activeHeroTrack.id}`,
                            name: cleanArtistName(activeHeroTrack.artist) || activeHeroTrack.artist,
                            avatar: activeHeroTrack.artwork,
                            genre: activeHeroTrack.mood || 'Featured Artist',
                            tracks: [activeHeroTrack],
                          });
                        }
                      }}
                      className="text-sm font-medium text-white/75 hover:text-[#FFFFFF] transition-colors truncate text-left"
                    >
                      {activeHeroTrack.artist}
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (currentTrack?.id === activeHeroTrack.id) {
                          void togglePlay();
                        } else {
                          void playTrack(activeHeroTrack, heroTracks);
                        }
                      }}
                      className="inline-flex items-center gap-2 rounded-full bg-[#FFFFFF] px-6 py-3 text-xs sm:text-sm font-semibold text-[#000000] hover:bg-[#E4E4E7] active:scale-[0.97] transition-all duration-200 spring-transition min-h-[44px] shadow-lg"
                    >
                      {activeHeroLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : activeHeroPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current" />
                      )}
                      <span>
                        {activeHeroLoading
                          ? 'Loading…'
                          : activeHeroPlaying
                            ? 'Pause'
                            : 'Play Now'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => void toggleLikeTrack(activeHeroTrack)}
                      aria-label={activeHeroLiked ? 'Remove from favorites' : 'Save to favorites'}
                      className={`w-11 h-11 rounded-full border flex items-center justify-center backdrop-blur-md active:scale-[0.94] transition-all duration-200 spring-transition ${
                        activeHeroLiked
                          ? 'border-white/30 bg-[#FFFFFF]/15 text-[#FFFFFF]'
                          : 'border-white/[0.14] bg-[#0A0A0C]/60 text-white/75 hover:text-[#FFFFFF] hover:bg-[#141417]'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${activeHeroLiked ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Minimal Dot Pagination Indicators */}
                {heroTracks.length > 1 && (
                  <div
                    role="tablist"
                    aria-label="Hero slides"
                    className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2"
                  >
                    {heroTracks.map((t, idx) => {
                      const active = idx === heroIndex;
                      return (
                        <button
                          key={`dot-${t.id}`}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          aria-label={`Slide ${idx + 1}: ${t.title}`}
                          onClick={() => setHeroIndex(idx)}
                          className={`h-1.5 rounded-full transition-all duration-200 spring-transition ${
                            active ? 'w-5 bg-[#FFFFFF]' : 'w-1.5 bg-white/35 hover:bg-white/60'
                          }`}
                        />
                      );
                    })}
                  </div>
                )}
              </section>
            ) : loadingForYou ? (
              <div className="rounded-[24px] border border-white/[0.08] bg-[#141417] min-h-[280px] flex items-center justify-center gap-3 text-xs text-white/60">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading trending music…</span>
              </div>
            ) : (
              <div className="rounded-[24px] border border-white/[0.08] bg-[#141417] p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-lg font-semibold text-[#FFFFFF]">
                    Live catalog paused
                  </h2>
                  <p className="text-xs text-white/60 mt-1">
                    {forYouError || 'Retry fetching trending songs and releases.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void loadForYouFeeds()}
                  className="inline-flex items-center gap-2 rounded-full bg-[#FFFFFF] px-5 py-2.5 text-xs font-semibold text-[#000000] active:scale-[0.97] transition-all spring-transition self-start"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              </div>
            )}

            {/* 2. Horizontally Scrolling Trending Artists (72px Circular Avatars with Real Data) */}
            {trendingArtists.length > 0 && (
              <section className="space-y-3.5" aria-label="Trending Artists">
                <h2 className="font-display text-lg sm:text-xl font-semibold tracking-tight text-[#FFFFFF]">
                  Trending Artists
                </h2>
                <div className="flex items-start gap-4 overflow-x-auto pb-2 snap-x snap-mandatory no-scrollbar">
                  {trendingArtists.map((artist) => (
                    <button
                      key={artist.id}
                      type="button"
                      onClick={() => openArtistProfile(artist)}
                      className="group flex flex-col items-center gap-2 shrink-0 snap-start w-[82px] active:scale-[0.95] transition-transform duration-200 spring-transition focus-visible:outline-none"
                    >
                      <div className="w-[72px] h-[72px] rounded-full overflow-hidden border border-white/[0.12] bg-[#141417] group-hover:border-white/40 group-hover:scale-[1.04] transition-all duration-200 spring-transition">
                        <TrackArtwork
                          src={artist.avatar}
                          alt={artist.name}
                          className="w-[72px] h-[72px] rounded-full"
                          size="sm"
                        />
                      </div>
                      <span className="w-full text-center text-xs font-medium text-[#FFFFFF] truncate">
                        {artist.name}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* 3. Netflix-Style Horizontal Music Catalogs */}
            <CatalogRail
              title="New Releases"
              subtitle="Fresh releases"
              tracks={newReleases}
              loading={loadingForYou}
              onSeeAll={() =>
                openCatalogView('New Releases', newReleases, 'Fresh drops & studio releases')
              }
            />

            <CatalogRail
              title="Popular Hits"
              subtitle="Global top hits"
              tracks={popularHits}
              loading={loadingForYou}
              onSeeAll={() =>
                openCatalogView('Popular Hits', popularHits, 'Most played across the charts')
              }
            />

            <CatalogRail
              title="Recommended For You"
              subtitle="Tailored picks"
              tracks={recommendedTracks}
              loading={loadingForYou}
              onSeeAll={() =>
                openCatalogView(
                  'Recommended For You',
                  recommendedTracks,
                  'Curated around your listening taste'
                )
              }
            />
          </motion.div>
        ) : (
          <motion.div
            key="home-curators"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            {/* Mood Filter Pills */}
            <div
              role="tablist"
              aria-label="Curator moods"
              className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar"
            >
              {CURATOR_MOODS.map((mood) => {
                const active = selectedMood === mood;
                return (
                  <button
                    key={mood}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSelectedMood(mood)}
                    className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 spring-transition active:scale-[0.97] whitespace-nowrap shrink-0 min-h-[38px] ${
                      active
                        ? 'bg-[#FFFFFF] text-[#000000] font-semibold'
                        : 'bg-[#141417] text-white/60 border border-white/[0.08] hover:text-[#FFFFFF] hover:bg-[#1C1C22]'
                    }`}
                  >
                    {mood}
                  </button>
                );
              })}
            </div>

            {loadingCurators && curatorTracks.length === 0 ? (
              <div className="rounded-[24px] border border-white/[0.08] bg-[#141417] p-12 flex items-center justify-center gap-3 text-xs text-white/60">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading {selectedMood} curation…</span>
              </div>
            ) : (
              <div className="space-y-6">
                {curatorTracks.length > 0 && (
                  <div className="rounded-2xl border border-white/[0.08] bg-[#141417] p-2 space-y-1">
                    {curatorTracks.map((track, idx) => (
                      <TrackRow
                        key={`curator-${selectedMood}-${track.id}`}
                        track={track}
                        index={idx}
                        queueContext={curatorTracks}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
