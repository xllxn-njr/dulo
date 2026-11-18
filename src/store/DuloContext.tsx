import { User } from 'firebase/auth';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { audioEngine, EQ_PRESETS } from '../services/audioEngine';
import {
  signInWithAppleModal,
  signInWithEmailCredentials,
  signInWithGoogleModal,
  signOutAccount,
  signUpWithEmailCredentials,
  subscribeAuth,
} from '../services/firebase';
import { fetchSyncedLyrics } from '../services/lyrics';
import { fetchSponsorSegments, findActiveSkipSegment } from '../services/sponsorblock';
import {
  DEFAULT_PIPED_INSTANCES,
  DEFAULT_PROXY_URL,
  fetchStreamFromProxy,
  fetchUpNextRadio,
} from '../services/streamEngine';
import {
  ensureUserAccountDoc,
  subscribeHistory,
  subscribeLikedSongs,
  subscribePlaylists,
  syncDeletePlaylist,
  syncLikeSong,
  syncRecordHistory,
  syncSavePlaylist,
  syncUnlikeSong,
} from '../services/syncEngine';
import {
  cacheTrackOffline,
  clearAllOfflineVault,
  deletePlaylist,
  getAllLocalTracks,
  getAllOfflineTracks,
  getAllPlaylists,
  getListeningStats,
  getLocalAudioObjectUrl,
  getOfflineAudioObjectUrl,
  getPlaybackHistory,
  incrementListeningStats,
  recordPlaybackHistory,
  removeLocalTrack,
  removeOfflineTrack,
  saveLocalAudioFile,
  savePlaylist,
} from '../services/vaultDb';
import { youtubePlayer } from '../services/youtubePlayer';
import {
  AppSettings,
  EQPresetId,
  HomeSubRoute,
  ListeningHistoryEntry,
  ListeningStats,
  LyricLine,
  NavTab,
  RepeatMode,
  SleepTimerState,
  SponsorSegment,
  Track,
  TrendingArtist,
  UserPlaylist,
} from '../types/music';
import { formatDuration } from '../utils/format';

const SETTINGS_STORAGE_KEY = 'dulo_settings_v2';
const RECENT_SEARCHES_KEY = 'dulo_recent_searches_v1';
const LIKED_SONGS_KEY = 'dulo_liked_songs_v1';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'obsidian',
  streamMode: 'proxy',
  pipedInstances: DEFAULT_PIPED_INSTANCES,
  customProxyUrl: DEFAULT_PROXY_URL,
  crossfadeSeconds: 4,
  loudnessNormalization: true,
  sponsorBlockEnabled: true,
  autoRadioEnabled: true,
  eqPreset: 'flat',
  eqGains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

function loadInitialSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      customProxyUrl:
        parsed.customProxyUrl && parsed.customProxyUrl.trim()
          ? parsed.customProxyUrl
          : DEFAULT_PROXY_URL,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function loadRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : ['Afrobeats', 'Lofi Beats', 'Daft Punk'];
  } catch {
    return ['Afrobeats', 'Lofi Beats'];
  }
}

interface DuloContextValue {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  homeSubRoute: HomeSubRoute;
  openArtistProfile: (artist: TrendingArtist) => void;
  openCatalogView: (title: string, tracks: Track[], subtitle?: string) => void;
  clearHomeSubRoute: () => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;

  // Playback
  currentTrack: Track | null;
  queue: Track[];
  queueIndex: number;
  isPlaying: boolean;
  isLoadingTrack: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  shuffle: boolean;
  repeat: RepeatMode;
  videoMode: boolean;
  setVideoMode: (v: boolean) => void;
  playbackBackend: 'audio' | 'youtube';
  activeStreamLabel: string;

  playTrack: (track: Track, newQueue?: Track[], useCrossfade?: boolean) => Promise<void>;
  togglePlay: () => Promise<void>;
  playNext: (viaCrossfade?: boolean) => Promise<void>;
  playPrevious: () => Promise<void>;
  seekTo: (seconds: number) => void;
  setVolume: (val: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  addToQueue: (track: Track) => void;
  playNextInQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  replaceQueueOrder: (newOrder: Track[]) => void;

  // Lyrics & SponsorBlock
  lyrics: LyricLine[];
  lyricsLoading: boolean;
  lyricsSource: 'lrclib' | 'embedded' | 'none';
  sponsorSegments: SponsorSegment[];

  // Modals / Sheets
  nowPlayingOpen: boolean;
  setNowPlayingOpen: (v: boolean) => void;
  eqModalOpen: boolean;
  setEqModalOpen: (v: boolean) => void;
  sleepModalOpen: boolean;
  setSleepModalOpen: (v: boolean) => void;
  importModalOpen: boolean;
  setImportModalOpen: (v: boolean) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (v: boolean) => void;
  authModalOpen: boolean;
  setAuthModalOpen: (v: boolean) => void;

  // Firebase Auth & Cloud Sync + Onboarding
  onboardingCompleted: boolean;
  completeOnboarding: () => void;
  reopenOnboarding: () => void;
  user: User | null;
  authLoading: boolean;
  authNotice: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  likedSongs: Track[];
  likedIds: Set<string>;
  toggleLikeTrack: (track: Track) => Promise<void>;

  // Settings & Audio DSP
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  setEqPreset: (presetId: EQPresetId) => void;
  setEqBandGain: (index: number, gain: number) => void;

  // Sleep timer
  sleepTimer: SleepTimerState;
  setSleepTimerMode: (mode: SleepTimerState['mode']) => void;
  sleepSecondsLeft: number | null;

  // Vault, Local Files, Playlists, History, Stats
  offlineVault: Array<{ track: Track; cachedAt: number; sizeBytes: number }>;
  offlineIds: Set<string>;
  downloadingIds: Set<string>;
  toggleOfflineTrack: (track: Track) => Promise<void>;
  clearOfflineVault: () => Promise<void>;
  localTracks: Track[];
  importLocalFiles: (files: FileList | File[]) => Promise<number>;
  deleteLocalFile: (trackId: string) => Promise<void>;
  playlists: UserPlaylist[];
  createPlaylist: (name: string, tracks: Track[], sourceUrl?: string) => Promise<UserPlaylist>;
  removePlaylist: (id: string) => Promise<void>;
  history: ListeningHistoryEntry[];
  stats: ListeningStats;
  recentSearches: string[];
  addRecentSearch: (q: string) => void;
  removeRecentSearch: (q: string) => void;

  // Toast feedback
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const DuloContext = createContext<DuloContextValue | null>(null);

export const DuloProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTabState] = useState<NavTab>('home');
  const [homeSubRoute, setHomeSubRoute] = useState<HomeSubRoute>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const setActiveTab = useCallback((tab: NavTab) => {
    setActiveTabState(tab);
    setHomeSubRoute(null);
  }, []);

  const openArtistProfile = useCallback((artist: TrendingArtist) => {
    setActiveTabState('home');
    setHomeSubRoute({ type: 'artist', artist });
  }, []);

  const openCatalogView = useCallback((title: string, tracks: Track[], subtitle?: string) => {
    setActiveTabState('home');
    setHomeSubRoute({ type: 'catalog', title, tracks, subtitle });
  }, []);

  const clearHomeSubRoute = useCallback(() => {
    setHomeSubRoute(null);
  }, []);

  const [settings, setSettings] = useState<AppSettings>(loadInitialSettings);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingTrack, setIsLoadingTrack] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.85);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('off');
  const [videoMode, setVideoModeState] = useState(false);
  const videoModeRef = useRef(false);
  videoModeRef.current = videoMode;
  const [playbackBackend, setPlaybackBackend] = useState<'audio' | 'youtube'>('youtube');
  const [activeStreamLabel, setActiveStreamLabel] = useState('Cloudflare Worker Proxy');

  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [lyricsSource, setLyricsSource] = useState<'lrclib' | 'embedded' | 'none'>('none');
  const [sponsorSegments, setSponsorSegments] = useState<SponsorSegment[]>([]);

  const [nowPlayingOpen, setNowPlayingOpen] = useState(false);
  const [eqModalOpen, setEqModalOpen] = useState(false);
  const [sleepModalOpen, setSleepModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [skippedLogin, setSkippedLogin] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const onboardingCompleted = Boolean(user && !user.isAnonymous) || skippedLogin;

  const [likedSongs, setLikedSongs] = useState<Track[]>(() => {
    try {
      const raw = localStorage.getItem(LIKED_SONGS_KEY);
      return raw ? (JSON.parse(raw) as Track[]) : [];
    } catch {
      return [];
    }
  });

  const [sleepTimer, setSleepTimer] = useState<SleepTimerState>({
    active: false,
    mode: null,
    endsAt: null,
  });
  const [sleepSecondsLeft, setSleepSecondsLeft] = useState<number | null>(null);

  const [offlineVault, setOfflineVault] = useState<
    Array<{ track: Track; cachedAt: number; sizeBytes: number }>
  >([]);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [localTracks, setLocalTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<UserPlaylist[]>([]);
  const [history, setHistory] = useState<ListeningHistoryEntry[]>([]);
  const [stats, setStats] = useState<ListeningStats>({
    totalSeconds: 0,
    totalPlays: 0,
    trackCounts: {},
    artistCounts: {},
    dailyMinutes: {},
  });
  const [recentSearches, setRecentSearches] = useState<string[]>(loadRecentSearches);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const playRequestIdRef = useRef(0);
  const activeEngineRef = useRef<'youtube' | 'local'>('youtube');
  const skippedIdsRef = useRef<Set<string>>(new Set());
  const lastStatTickRef = useRef<number>(0);
  const sleepFadeTriggeredRef = useRef(false);
  const toastTimerRef = useRef<number | null>(null);
  const userRef = useRef<User | null>(null);
  userRef.current = user;

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMessage(null), 3200);
  }, []);

  // Hydrate IndexedDB stores on boot
  useEffect(() => {
    void (async () => {
      const [vault, locals, pls, hist, st] = await Promise.all([
        getAllOfflineTracks(),
        getAllLocalTracks(),
        getAllPlaylists(),
        getPlaybackHistory(),
        getListeningStats(),
      ]);
      setOfflineVault(vault);
      setLocalTracks(locals);
      setPlaylists(pls);
      setHistory(hist);
      setStats(st);
    })();
  }, []);

  // Firebase Auth listener + anonymous first-launch sign-in + Firestore sync listeners
  useEffect(() => {
    let unsubLiked: (() => void) | null = null;
    let unsubPlaylists: (() => void) | null = null;
    let unsubHistory: (() => void) | null = null;

    const cleanupSync = () => {
      unsubLiked?.();
      unsubPlaylists?.();
      unsubHistory?.();
      unsubLiked = null;
      unsubPlaylists = null;
      unsubHistory = null;
    };

    const unsubAuth = subscribeAuth((authUser) => {
      cleanupSync();
      setUser(authUser);

      if (!authUser) {
        setAuthLoading(false);
        return;
      }

      setAuthLoading(false);
      setAuthNotice(null);

      void (async () => {
        try {
          await ensureUserAccountDoc(authUser);
          const onSyncErr = (err: unknown) => {
            const msg = err instanceof Error ? err.message : 'Cloud sync unavailable';
            if (msg.includes('Missing or insufficient permissions')) {
              setAuthNotice('Firestore rules need deployment for cloud sync. Playing in local mode.');
            }
          };
          unsubLiked = subscribeLikedSongs(
            authUser.uid,
            (remoteLiked) => {
              setLikedSongs(remoteLiked);
              localStorage.setItem(LIKED_SONGS_KEY, JSON.stringify(remoteLiked));
            },
            onSyncErr
          );
          unsubPlaylists = subscribePlaylists(
            authUser.uid,
            (remotePlaylists) => {
              setPlaylists((prev) => {
                const map = new Map<string, UserPlaylist>();
                remotePlaylists.forEach((p) => map.set(p.id, p));
                prev.forEach((p) => {
                  if (!map.has(p.id)) map.set(p.id, p);
                });
                return Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt);
              });
            },
            onSyncErr
          );
          unsubHistory = subscribeHistory(
            authUser.uid,
            (remoteHistory) => {
              setHistory((prev) => {
                const map = new Map<string, ListeningHistoryEntry>();
                remoteHistory.forEach((h) => map.set(h.track.id, h));
                prev.forEach((h) => {
                  if (!map.has(h.track.id)) map.set(h.track.id, h);
                });
                return Array.from(map.values())
                  .sort((a, b) => b.playedAt - a.playedAt)
                  .slice(0, 24);
              });
            },
            onSyncErr
          );
        } catch (err) {
          console.error('Sync initialization warning:', err);
        }
      })();
    });

    return () => {
      cleanupSync();
      unsubAuth();
    };
  }, []);

  // Sync audioEngine parameters & document matte theme variant
  useEffect(() => {
    audioEngine.setCrossfadeSeconds(settings.crossfadeSeconds);
    audioEngine.setEqGains(settings.eqGains);
    audioEngine.setLoudnessNormalization(settings.loudnessNormalization);
    if (settings.theme === 'obsidian') {
      delete document.documentElement.dataset.duloTheme;
    } else {
      document.documentElement.dataset.duloTheme = settings.theme;
    }
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Global Cmd/Ctrl + K keyboard shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const offlineIds = new Set(offlineVault.map((v) => v.track.id));

  const playTrack = useCallback(
    async (track: Track, newQueue?: Track[], useCrossfade = false) => {
      const reqId = ++playRequestIdRef.current;
      setIsLoadingTrack(true);
      skippedIdsRef.current = new Set();
      lastStatTickRef.current = 0;

      if (newQueue && newQueue.length > 0) {
        setQueue(newQueue);
        const idx = newQueue.findIndex((t) => t.id === track.id);
        setQueueIndex(idx >= 0 ? idx : 0);
      } else {
        setQueue((prev) => {
          const existingIdx = prev.findIndex((t) => t.id === track.id);
          if (existingIdx >= 0) {
            setQueueIndex(existingIdx);
            return prev;
          }
          const updated = [track, ...prev];
          setQueueIndex(0);
          return updated;
        });
      }

      setCurrentTrack(track);
      setCurrentTime(0);
      setDuration(track.duration || 180);

      // Load lyrics & sponsor segments concurrently
      setLyricsLoading(true);
      void fetchSyncedLyrics(track)
        .then((res) => {
          if (reqId !== playRequestIdRef.current) return;
          setLyrics(res.lines);
          setLyricsSource(res.source);
        })
        .finally(() => {
          if (reqId === playRequestIdRef.current) setLyricsLoading(false);
        });

      if (settings.sponsorBlockEnabled) {
        void fetchSponsorSegments(track).then((segs) => {
          if (reqId === playRequestIdRef.current) setSponsorSegments(segs);
        });
      } else {
        setSponsorSegments([]);
      }

      try {
        // Local imported audio files or local vault blobs play via Web Audio HTML5 engine
        const localUrl =
          track.source === 'local'
            ? await getLocalAudioObjectUrl(track.id)
            : await getOfflineAudioObjectUrl(track.id);

        if (reqId !== playRequestIdRef.current) return;

        if (localUrl) {
          activeEngineRef.current = 'local';
          setPlaybackBackend('audio');
          youtubePlayer.stop();
          setActiveStreamLabel(
            track.source === 'local' ? 'Local File · Web Audio DSP' : 'Offline Vault · Cached'
          );
          await audioEngine.playStream(localUrl, track, { useCrossfade });
        } else {
          if (!track.videoId) {
            throw new Error(`Track "${track.title}" does not have a valid videoId.`);
          }

          let playedViaProxy = false;
          if (settingsRef.current.streamMode === 'proxy' && !track.isVideo && !videoModeRef.current) {
            try {
              const streamMeta = await fetchStreamFromProxy(
                track.videoId,
                settingsRef.current
              );
              if (reqId !== playRequestIdRef.current) return;

              activeEngineRef.current = 'local';
              setPlaybackBackend('audio');
              youtubePlayer.stop();
              setActiveStreamLabel(
                `${streamMeta.providerLabel} · ${streamMeta.codec || 'Web Audio'}`
              );
              await audioEngine.playStream(streamMeta.audioUrl, track, {
                useCrossfade,
              });
              playedViaProxy = true;
            } catch (proxyErr) {
              if (reqId !== playRequestIdRef.current) return;
              console.warn(
                '[Dulo Proxy Stream] /api/stream unavailable, falling back to YouTube IFrame:',
                proxyErr
              );
            }
          }

          if (!playedViaProxy) {
            activeEngineRef.current = 'youtube';
            setPlaybackBackend('youtube');
            audioEngine.pause();
            setActiveStreamLabel('YouTube IFrame Player');
            await youtubePlayer.loadAndPlay(track);
          }
        }

        if (reqId !== playRequestIdRef.current) return;

        await recordPlaybackHistory(track);
        const [hist, nextStats] = await Promise.all([
          getPlaybackHistory(),
          incrementListeningStats(track, 0, true),
        ]);
        setHistory(hist);
        setStats(nextStats);

        if (userRef.current) {
          void syncRecordHistory(userRef.current.uid, track).catch((e) =>
            console.error('History sync error:', e)
          );
        }
      } catch (err) {
        if (reqId !== playRequestIdRef.current) return;
        console.error('[Dulo Playback] Failed to start playback:', {
          trackId: track.id,
          videoId: track.videoId,
          title: track.title,
          error: err,
        });
        setIsLoadingTrack(false);
        setIsPlaying(false);
        const msg = err instanceof Error ? err.message : 'Unable to start track';
        showToast(`Playback failed: ${msg}`);
      }
    },
    [settings.sponsorBlockEnabled, showToast]
  );

  // Refs for callbacks inside youtubePlayer & audioEngine
  const queueRef = useRef(queue);
  queueRef.current = queue;
  const queueIndexRef = useRef(queueIndex);
  queueIndexRef.current = queueIndex;
  const repeatRef = useRef(repeat);
  repeatRef.current = repeat;
  const shuffleRef = useRef(shuffle);
  shuffleRef.current = shuffle;
  const currentTrackRef = useRef(currentTrack);
  currentTrackRef.current = currentTrack;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const sponsorSegmentsRef = useRef(sponsorSegments);
  sponsorSegmentsRef.current = sponsorSegments;
  const sleepTimerRef = useRef(sleepTimer);
  sleepTimerRef.current = sleepTimer;

  const playNext = useCallback(
    async (viaCrossfade = false) => {
      const q = queueRef.current;
      const idx = queueIndexRef.current;
      const rep = repeatRef.current;
      const cur = currentTrackRef.current;

      if (rep === 'one' && cur) {
        await playTrack(cur, q, false);
        return;
      }

      if (q.length === 0) return;

      let nextIdx = idx + 1;
      if (shuffleRef.current && q.length > 1) {
        do {
          nextIdx = Math.floor(Math.random() * q.length);
        } while (nextIdx === idx);
      }

      if (nextIdx < q.length) {
        setQueueIndex(nextIdx);
        await playTrack(q[nextIdx], q, viaCrossfade);
        return;
      }

      if (rep === 'all') {
        setQueueIndex(0);
        await playTrack(q[0], q, viaCrossfade);
        return;
      }

      // Infinite Auto-Radio via search
      if (settingsRef.current.autoRadioEnabled && cur) {
        const radioTracks = await fetchUpNextRadio(cur, settingsRef.current);
        const existingIds = new Set(q.map((t) => t.id));
        const fresh = radioTracks.filter((r) => !existingIds.has(r.id));
        if (fresh.length > 0) {
          const updated = [...q, ...fresh];
          setQueue(updated);
          setQueueIndex(q.length);
          await playTrack(fresh[0], updated, viaCrossfade);
          return;
        }
      }

      setIsPlaying(false);
    },
    [playTrack]
  );

  const playPrevious = useCallback(async () => {
    const activeTime =
      activeEngineRef.current === 'youtube'
        ? youtubePlayer.getCurrentTime()
        : audioEngine.getCurrentTime();

    if (activeTime > 3) {
      if (activeEngineRef.current === 'youtube') {
        youtubePlayer.seekTo(0);
      } else {
        audioEngine.seek(0);
      }
      setCurrentTime(0);
      return;
    }

    const q = queueRef.current;
    if (q.length === 0) return;
    const prevIdx = queueIndexRef.current > 0 ? queueIndexRef.current - 1 : q.length - 1;
    setQueueIndex(prevIdx);
    await playTrack(q[prevIdx], q, false);
  }, [playTrack]);

  // Shared progress handler for both YouTube IFrame API (250ms polling) & local AudioEngine
  const handleEngineTimeUpdate = useCallback(
    (engine: 'youtube' | 'local', curTime: number, dur: number) => {
      if (activeEngineRef.current !== engine) return;
      setCurrentTime(curTime);
      if (dur > 0) setDuration(dur);

      // SponsorBlock auto-skip
      if (settingsRef.current.sponsorBlockEnabled && sponsorSegmentsRef.current.length > 0) {
        const activeSeg = findActiveSkipSegment(
          sponsorSegmentsRef.current,
          curTime,
          skippedIdsRef.current
        );
        if (activeSeg) {
          skippedIdsRef.current.add(activeSeg.UUID);
          const targetEnd = activeSeg.segment[1];
          if (engine === 'youtube') {
            youtubePlayer.seekTo(targetEnd);
          } else {
            audioEngine.seek(targetEnd);
          }
          showToast(
            `Skipped ${activeSeg.category.replace('_', ' ')} (${formatDuration(
              activeSeg.segment[0]
            )} → ${formatDuration(targetEnd)})`
          );
        }
      }

      // Accumulate listening stats every ~5 seconds
      const activeTrack = currentTrackRef.current;
      if (activeTrack && curTime - lastStatTickRef.current >= 5) {
        const delta = Math.min(10, Math.round(curTime - lastStatTickRef.current));
        lastStatTickRef.current = curTime;
        void incrementListeningStats(activeTrack, delta, false).then(setStats);
      }
    },
    [showToast]
  );

  // Wire YouTube Player & Local AudioEngine callbacks
  useEffect(() => {
    youtubePlayer.setCallbacks({
      onTimeUpdate: (curTime, dur) => handleEngineTimeUpdate('youtube', curTime, dur),
      onTrackEnded: () => {
        if (activeEngineRef.current !== 'youtube') return;
        if (sleepTimerRef.current.active && sleepTimerRef.current.mode === 'end_of_track') {
          setIsPlaying(false);
          setSleepTimer({ active: false, mode: null, endsAt: null });
          setSleepSecondsLeft(null);
          showToast('Sleep timer paused playback at end of track');
          return;
        }
        void playNext(false);
      },
      onPlayStateChange: (playing) => {
        if (activeEngineRef.current === 'youtube') setIsPlaying(playing);
      },
      onCanPlay: () => {
        if (activeEngineRef.current === 'youtube') setIsLoadingTrack(false);
      },
      onPlaybackError: (err) => {
        if (activeEngineRef.current !== 'youtube') return;
        console.error('[Dulo Playback] YouTube player error:', err);
        setIsLoadingTrack(false);
        setIsPlaying(false);
        showToast(`YouTube playback error: ${err.message}`);
      },
      onSeekRequest: (time) => setCurrentTime(time),
      onPrevRequest: () => void playPrevious(),
      onNextRequest: () => void playNext(false),
    });

    audioEngine.setCallbacks({
      onTimeUpdate: (curTime, dur) => handleEngineTimeUpdate('local', curTime, dur),
      onCrossfadeStart: () => {
        if (activeEngineRef.current !== 'local') return;
        if (sleepTimerRef.current.active && sleepTimerRef.current.mode === 'end_of_track') {
          return;
        }
        void playNext(true);
      },
      onTrackEnded: () => {
        if (activeEngineRef.current !== 'local') return;
        if (sleepTimerRef.current.active && sleepTimerRef.current.mode === 'end_of_track') {
          setIsPlaying(false);
          setSleepTimer({ active: false, mode: null, endsAt: null });
          setSleepSecondsLeft(null);
          showToast('Sleep timer paused playback at end of track');
          return;
        }
        void playNext(false);
      },
      onPlayStateChange: (playing) => {
        if (activeEngineRef.current === 'local') setIsPlaying(playing);
      },
      onCanPlay: () => {
        if (activeEngineRef.current === 'local') setIsLoadingTrack(false);
      },
      onPlaybackError: (err) => {
        if (activeEngineRef.current !== 'local') return;
        const cur = currentTrackRef.current;
        if (cur && cur.source !== 'local' && cur.videoId) {
          console.warn(
            '[Dulo Proxy Stream] Audio stream error, falling back to YouTube IFrame:',
            err
          );
          activeEngineRef.current = 'youtube';
          setPlaybackBackend('youtube');
          audioEngine.pause();
          setActiveStreamLabel('YouTube IFrame Player');
          void youtubePlayer.loadAndPlay(cur).catch((ytErr) => {
            console.error('[Dulo Playback] YouTube fallback error:', ytErr);
            setIsLoadingTrack(false);
            setIsPlaying(false);
            const msg = ytErr instanceof Error ? ytErr.message : 'Unable to play track';
            showToast(`Playback failed: ${msg}`);
          });
          return;
        }
        console.error('[Dulo Playback] Local audio error:', err);
        setIsLoadingTrack(false);
        setIsPlaying(false);
        const msg = err instanceof Error ? err.message : 'Audio failed to load';
        showToast(`Playback error: ${msg}`);
      },
      onSeekRequest: (time) => setCurrentTime(time),
      onPrevRequest: () => void playPrevious(),
      onNextRequest: () => void playNext(false),
    });
  }, [handleEngineTimeUpdate, playNext, playPrevious, showToast]);

  // Sleep Timer countdown + 20s gradual fade-out
  useEffect(() => {
    if (!sleepTimer.active || sleepTimer.mode === 'end_of_track' || !sleepTimer.endsAt) {
      setSleepSecondsLeft(null);
      sleepFadeTriggeredRef.current = false;
      return;
    }

    const tick = () => {
      const rem = Math.max(0, Math.ceil((sleepTimer.endsAt! - Date.now()) / 1000));
      setSleepSecondsLeft(rem);

      if (rem <= 20 && rem > 0 && !sleepFadeTriggeredRef.current) {
        sleepFadeTriggeredRef.current = true;
        if (activeEngineRef.current === 'youtube') {
          youtubePlayer.startSleepFadeOut(rem);
        } else {
          audioEngine.startSleepFadeOut(rem);
        }
      }

      if (rem <= 0) {
        youtubePlayer.pause();
        youtubePlayer.cancelSleepFade();
        audioEngine.pause();
        audioEngine.cancelSleepFade();
        setSleepTimer({ active: false, mode: null, endsAt: null });
        setSleepSecondsLeft(null);
        sleepFadeTriggeredRef.current = false;
        showToast('Sleep timer complete');
      }
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [sleepTimer, showToast]);

  const togglePlay = useCallback(async () => {
    if (!currentTrack) return;
    if (activeEngineRef.current === 'youtube') {
      if (isPlaying) {
        youtubePlayer.pause();
      } else {
        youtubePlayer.play();
      }
      return;
    }

    if (isPlaying) {
      audioEngine.pause();
    } else {
      await audioEngine.resume();
    }
  }, [currentTrack, isPlaying]);

  const seekTo = useCallback((seconds: number) => {
    if (activeEngineRef.current === 'youtube') {
      youtubePlayer.seekTo(seconds);
    } else {
      audioEngine.seek(seconds);
    }
    setCurrentTime(seconds);
  }, []);

  const setVolume = useCallback((val: number) => {
    setVolumeState(val);
    youtubePlayer.setVolume(val);
    audioEngine.setVolume(val);
  }, []);

  const setVideoMode = useCallback(
    (next: boolean) => {
      setVideoModeState(next);
      videoModeRef.current = next;
      const cur = currentTrackRef.current;
      if (
        next &&
        cur &&
        cur.source !== 'local' &&
        cur.videoId &&
        activeEngineRef.current === 'local'
      ) {
        const offset = audioEngine.getCurrentTime();
        audioEngine.pause();
        activeEngineRef.current = 'youtube';
        setPlaybackBackend('youtube');
        setActiveStreamLabel('YouTube IFrame Player');
        setIsLoadingTrack(true);
        void youtubePlayer.loadAndPlay(cur, offset).catch((err) => {
          console.error('[Dulo VideoMode] Failed to switch to YouTube video:', err);
          setIsLoadingTrack(false);
        });
      }
    },
    []
  );

  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);

  const cycleRepeat = useCallback(() => {
    setRepeat((r) => (r === 'off' ? 'all' : r === 'all' ? 'one' : 'off'));
  }, []);

  const addToQueue = useCallback(
    (track: Track) => {
      setQueue((prev) => [...prev, track]);
      showToast(`Added "${track.title}" to queue`);
    },
    [showToast]
  );

  const playNextInQueue = useCallback(
    (track: Track) => {
      setQueue((prev) => {
        const copy = [...prev];
        copy.splice(queueIndex + 1, 0, track);
        return copy;
      });
      showToast(`Playing "${track.title}" next`);
    },
    [queueIndex, showToast]
  );

  const removeFromQueue = useCallback(
    (index: number) => {
      setQueue((prev) => prev.filter((_, i) => i !== index));
      if (index < queueIndex) {
        setQueueIndex((i) => Math.max(0, i - 1));
      }
    },
    [queueIndex]
  );

  const reorderQueue = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;
      setQueue((prev) => {
        const copy = [...prev];
        const [moved] = copy.splice(fromIndex, 1);
        copy.splice(toIndex, 0, moved);
        if (currentTrack) {
          const newIdx = copy.findIndex((t) => t.id === currentTrack.id);
          if (newIdx >= 0) setQueueIndex(newIdx);
        }
        return copy;
      });
    },
    [currentTrack]
  );

  const replaceQueueOrder = useCallback(
    (newOrder: Track[]) => {
      setQueue(newOrder);
      if (currentTrack) {
        const newIdx = newOrder.findIndex((t) => t.id === currentTrack.id);
        if (newIdx >= 0) setQueueIndex(newIdx);
      }
    },
    [currentTrack]
  );

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const setEqPreset = useCallback((presetId: EQPresetId) => {
    const preset = EQ_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    audioEngine.setEqGains(preset.gains);
    setSettings((prev) => ({
      ...prev,
      eqPreset: presetId,
      eqGains: [...preset.gains],
    }));
  }, []);

  const setEqBandGain = useCallback((index: number, gain: number) => {
    setSettings((prev) => {
      const nextGains = [...prev.eqGains];
      nextGains[index] = gain;
      audioEngine.setEqGains(nextGains);
      return {
        ...prev,
        eqPreset: 'custom',
        eqGains: nextGains,
      };
    });
  }, []);

  const setSleepTimerMode = useCallback(
    (mode: SleepTimerState['mode']) => {
      youtubePlayer.cancelSleepFade();
      audioEngine.cancelSleepFade();
      sleepFadeTriggeredRef.current = false;
      if (!mode) {
        setSleepTimer({ active: false, mode: null, endsAt: null });
        showToast('Sleep timer cancelled');
        return;
      }
      if (mode === 'end_of_track') {
        setSleepTimer({ active: true, mode, endsAt: null });
        showToast('Sleep timer set for end of track');
        return;
      }
      const mins = mode === '15m' ? 15 : mode === '30m' ? 30 : 45;
      setSleepTimer({
        active: true,
        mode,
        endsAt: Date.now() + mins * 60 * 1000,
      });
      showToast(`Sleep timer set for ${mins} minutes`);
    },
    [showToast]
  );

  const toggleOfflineTrack = useCallback(
    async (track: Track) => {
      if (offlineIds.has(track.id)) {
        await removeOfflineTrack(track.id);
        setOfflineVault(await getAllOfflineTracks());
        showToast(`Removed "${track.title}" from Offline Vault`);
        return;
      }

      if (track.source !== 'local') {
        showToast('Offline audio caching is available for imported local audio files');
        return;
      }

      setDownloadingIds((prev) => new Set(prev).add(track.id));
      try {
        await cacheTrackOffline(track);
        setOfflineVault(await getAllOfflineTracks());
        showToast(`Cached "${track.title}" to Offline Vault`);
      } catch (err) {
        console.error('[Dulo Vault] Failed to cache track:', err);
        showToast('Unable to cache track offline');
      } finally {
        setDownloadingIds((prev) => {
          const next = new Set(prev);
          next.delete(track.id);
          return next;
        });
      }
    },
    [offlineIds, showToast]
  );

  const clearOfflineVault = useCallback(async () => {
    await clearAllOfflineVault();
    setOfflineVault([]);
    showToast('Cleared Offline Vault');
  }, [showToast]);

  const importLocalFiles = useCallback(
    async (files: FileList | File[]) => {
      const validExt = /\.(mp3|flac|m4a|wav|ogg|aac)$/i;
      const list = Array.from(files).filter(
        (f) => f.type.startsWith('audio/') || validExt.test(f.name)
      );
      for (const file of list) {
        await saveLocalAudioFile(file);
      }
      setLocalTracks(await getAllLocalTracks());
      if (list.length > 0) {
        showToast(`Imported ${list.length} local audio ${list.length === 1 ? 'track' : 'tracks'}`);
      }
      return list.length;
    },
    [showToast]
  );

  const deleteLocalFile = useCallback(
    async (trackId: string) => {
      await removeLocalTrack(trackId);
      setLocalTracks(await getAllLocalTracks());
      showToast('Removed local track');
    },
    [showToast]
  );

  const likedIds = new Set(likedSongs.map((t) => t.id));

  const toggleLikeTrack = useCallback(
    async (track: Track) => {
      const alreadyLiked = likedSongs.some((t) => t.id === track.id);
      const next = alreadyLiked
        ? likedSongs.filter((t) => t.id !== track.id)
        : [track, ...likedSongs];
      setLikedSongs(next);
      localStorage.setItem(LIKED_SONGS_KEY, JSON.stringify(next));

      if (userRef.current) {
        try {
          if (alreadyLiked) {
            await syncUnlikeSong(userRef.current.uid, track.id);
          } else {
            await syncLikeSong(userRef.current.uid, track);
          }
        } catch (err) {
          console.error('Liked song sync error:', err);
        }
      }

      showToast(
        alreadyLiked
          ? `Removed "${track.title}" from Liked Songs`
          : `Saved "${track.title}" to Liked Songs`
      );
    },
    [likedSongs, showToast]
  );

  const completeOnboarding = useCallback(() => {
    setSkippedLogin(true);
  }, []);

  const reopenOnboarding = useCallback(() => {
    setSkippedLogin(false);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const signedUser = await signInWithGoogleModal();
    setUser(signedUser);
    completeOnboarding();
    showToast(`Signed in as ${signedUser.displayName || signedUser.email || 'Google User'}`);
  }, [completeOnboarding, showToast]);

  const signInWithApple = useCallback(async () => {
    const signedUser = await signInWithAppleModal();
    setUser(signedUser);
    completeOnboarding();
    showToast(`Signed in as ${signedUser.displayName || signedUser.email || 'Apple User'}`);
  }, [completeOnboarding, showToast]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const signedUser = await signInWithEmailCredentials(email, password);
      setUser(signedUser);
      completeOnboarding();
      showToast(`Signed in as ${signedUser.email || 'Dulo Member'}`);
    },
    [completeOnboarding, showToast]
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      const signedUser = await signUpWithEmailCredentials(email, password);
      setUser(signedUser);
      completeOnboarding();
      showToast(`Welcome to Dulo, ${signedUser.email || 'Member'}`);
    },
    [completeOnboarding, showToast]
  );

  const signOut = useCallback(async () => {
    await signOutAccount();
    setSkippedLogin(false);
    setLikedSongs([]);
    localStorage.removeItem(LIKED_SONGS_KEY);
    showToast('Signed out');
  }, [showToast]);

  const createPlaylist = useCallback(
    async (name: string, tracks: Track[], sourceUrl?: string) => {
      const playlist: UserPlaylist = {
        id: `pl-${Date.now()}`,
        name,
        artwork: tracks[0]?.artwork,
        tracks,
        createdAt: Date.now(),
        sourceUrl,
      };
      await savePlaylist(playlist);
      setPlaylists(await getAllPlaylists());
      if (userRef.current) {
        void syncSavePlaylist(userRef.current.uid, playlist).catch((e) =>
          console.error('Playlist sync error:', e)
        );
      }
      showToast(`Saved playlist "${name}" (${tracks.length} tracks)`);
      return playlist;
    },
    [showToast]
  );

  const removePlaylist = useCallback(
    async (id: string) => {
      await deletePlaylist(id);
      setPlaylists(await getAllPlaylists());
      if (userRef.current) {
        void syncDeletePlaylist(userRef.current.uid, id).catch((e) =>
          console.error('Playlist delete sync error:', e)
        );
      }
      showToast('Deleted playlist');
    },
    [showToast]
  );

  const addRecentSearch = useCallback((q: string) => {
    const clean = q.trim();
    if (!clean) return;
    setRecentSearches((prev) => {
      const next = [clean, ...prev.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, 8);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeRecentSearch = useCallback((q: string) => {
    setRecentSearches((prev) => {
      const next = prev.filter((item) => item !== q);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <DuloContext.Provider
      value={{
        activeTab,
        setActiveTab,
        homeSubRoute,
        openArtistProfile,
        openCatalogView,
        clearHomeSubRoute,
        sidebarCollapsed,
        setSidebarCollapsed,
        currentTrack,
        queue,
        queueIndex,
        isPlaying,
        isLoadingTrack,
        currentTime,
        duration,
        volume,
        shuffle,
        repeat,
        videoMode,
        setVideoMode,
        playbackBackend,
        activeStreamLabel,
        playTrack,
        togglePlay,
        playNext,
        playPrevious,
        seekTo,
        setVolume,
        toggleShuffle,
        cycleRepeat,
        addToQueue,
        playNextInQueue,
        removeFromQueue,
        reorderQueue,
        replaceQueueOrder,
        lyrics,
        lyricsLoading,
        lyricsSource,
        sponsorSegments,
        nowPlayingOpen,
        setNowPlayingOpen,
        eqModalOpen,
        setEqModalOpen,
        sleepModalOpen,
        setSleepModalOpen,
        importModalOpen,
        setImportModalOpen,
        commandPaletteOpen,
        setCommandPaletteOpen,
        authModalOpen,
        setAuthModalOpen,
        onboardingCompleted,
        completeOnboarding,
        reopenOnboarding,
        user,
        authLoading,
        authNotice,
        signInWithGoogle,
        signInWithApple,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        likedSongs,
        likedIds,
        toggleLikeTrack,
        settings,
        updateSettings,
        setEqPreset,
        setEqBandGain,
        sleepTimer,
        setSleepTimerMode,
        sleepSecondsLeft,
        offlineVault,
        offlineIds,
        downloadingIds,
        toggleOfflineTrack,
        clearOfflineVault,
        localTracks,
        importLocalFiles,
        deleteLocalFile,
        playlists,
        createPlaylist,
        removePlaylist,
        history,
        stats,
        recentSearches,
        addRecentSearch,
        removeRecentSearch,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </DuloContext.Provider>
  );
};

export function useDulo() {
  const ctx = useContext(DuloContext);
  if (!ctx) throw new Error('useDulo must be used within DuloProvider');
  return ctx;
}
