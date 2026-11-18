export type MoodCategory = 'All' | 'Focus' | 'Late Night' | 'Workout' | 'Afro-Fusion' | 'Throwbacks';

export type SearchFilter = 'music_songs' | 'music_albums' | 'music_playlists' | 'videos';

export type StreamMode = 'piped' | 'proxy';

export type RepeatMode = 'off' | 'all' | 'one';

export type NavTab = 'home' | 'search' | 'library' | 'stats' | 'settings';

export type EQPresetId = 'flat' | 'bass_boost' | 'vocal_clarity' | 'late_night' | 'studio' | 'custom';

export interface EQBand {
  frequency: number;
  label: string;
  gain: number; // -12 to +12 dB
}

export interface EQPreset {
  id: EQPresetId;
  name: string;
  gains: number[]; // 10 bands: 32, 64, 125, 250, 500, 1k, 2k, 4k, 8k, 16k
}

export interface Track {
  id: string;
  videoId: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // seconds
  artwork: string;
  mood?: Exclude<MoodCategory, 'All'>;
  source: 'demo' | 'piped' | 'proxy' | 'local';
  bitrate?: string;
  codec?: string;
  isVideo?: boolean;
  demoProfile?: {
    rootHz: number;
    bpm: number;
    character: 'ambient' | 'afro' | 'synth' | 'dub' | 'kinetic' | 'tape';
  };
  lrcText?: string;
  demoSponsorSegments?: SponsorSegment[];
  addedAt?: number;
}

export interface AlbumResult {
  id: string;
  browseId: string;
  title: string;
  artist: string;
  year?: string;
  artwork: string;
  trackCount?: number;
}

export interface PlaylistResult {
  id: string;
  playlistId: string;
  title: string;
  author: string;
  artwork: string;
  trackCount: number;
}

export interface UserPlaylist {
  id: string;
  name: string;
  description?: string;
  artwork?: string;
  tracks: Track[];
  createdAt: number;
  sourceUrl?: string;
}

export interface LyricLine {
  time: number; // seconds
  text: string;
}

export interface SponsorSegment {
  UUID: string;
  category: 'music_offtopic' | 'intro' | 'outro' | 'sponsor';
  segment: [number, number]; // [startSec, endSec]
}

export interface StreamResolution {
  audioUrl: string;
  mimeType: string;
  bitrate: number;
  codec: string;
  source: 'vault' | 'piped' | 'proxy' | 'demo';
  instanceUsed?: string;
}

export interface ListeningHistoryEntry {
  track: Track;
  playedAt: number;
  playCount: number;
}

export interface ListeningStats {
  totalSeconds: number;
  totalPlays: number;
  trackCounts: Record<string, { track: Track; plays: number; seconds: number }>;
  artistCounts: Record<string, { artist: string; plays: number; seconds: number }>;
  dailyMinutes: Record<string, number>; // YYYY-MM-DD -> minutes
}

export interface SleepTimerState {
  active: boolean;
  mode: '15m' | '30m' | '45m' | 'end_of_track' | null;
  endsAt: number | null; // epoch ms
}

export interface AppSettings {
  streamMode: StreamMode;
  pipedInstances: string[];
  customProxyUrl: string;
  crossfadeSeconds: number; // 0 to 12
  loudnessNormalization: boolean;
  sponsorBlockEnabled: boolean;
  autoRadioEnabled: boolean;
  eqPreset: EQPresetId;
  eqGains: number[]; // 10 values
}
