import {
  ListeningHistoryEntry,
  ListeningStats,
  Track,
  UserPlaylist,
} from '../types/music';
import { generateDemoTrackWav } from './demoAudioSynth';

const DB_NAME = 'dulo-vault-v1';
const DB_VERSION = 1;

interface OfflineVaultRecord {
  id: string;
  track: Track;
  audioBlob: Blob;
  artworkBlob?: Blob;
  cachedAt: number;
  sizeBytes: number;
}

interface LocalTrackRecord {
  id: string;
  track: Track;
  audioBlob: Blob;
  addedAt: number;
}

const EMPTY_STATS: ListeningStats = {
  totalSeconds: 0,
  totalPlays: 0,
  trackCounts: {},
  artistCounts: {},
  dailyMinutes: {},
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('offlineTracks')) {
        db.createObjectStore('offlineTracks', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('localTracks')) {
        db.createObjectStore('localTracks', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('playlists')) {
        db.createObjectStore('playlists', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('history')) {
        db.createObjectStore('history', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txPromise<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        const req = fn(store);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

export async function cacheTrackOffline(
  track: Track,
  audioUrl?: string
): Promise<OfflineVaultRecord> {
  let audioBlob: Blob;

  if (track.source === 'demo') {
    audioBlob = generateDemoTrackWav(track);
  } else if (track.source === 'local') {
    const existingLocal = await getLocalTrackRecord(track.id);
    audioBlob = existingLocal?.audioBlob ?? generateDemoTrackWav(track);
  } else if (audioUrl) {
    try {
      const res = await fetch(audioUrl);
      if (!res.ok) throw new Error('Stream fetch failed');
      audioBlob = await res.blob();
    } catch {
      audioBlob = generateDemoTrackWav(track);
    }
  } else {
    audioBlob = generateDemoTrackWav(track);
  }

  let artworkBlob: Blob | undefined;
  if (track.artwork) {
    try {
      const imgRes = await fetch(track.artwork);
      if (imgRes.ok) {
        artworkBlob = await imgRes.blob();
      }
    } catch {
      // Keep URL fallback
    }
  }

  const record: OfflineVaultRecord = {
    id: track.id,
    track,
    audioBlob,
    artworkBlob,
    cachedAt: Date.now(),
    sizeBytes: audioBlob.size + (artworkBlob?.size || 0),
  };

  await txPromise('offlineTracks', 'readwrite', (s) => s.put(record));
  return record;
}

export async function removeOfflineTrack(trackId: string): Promise<void> {
  await txPromise('offlineTracks', 'readwrite', (s) => s.delete(trackId));
}

export async function getOfflineTrackRecord(
  trackId: string
): Promise<OfflineVaultRecord | undefined> {
  return txPromise('offlineTracks', 'readonly', (s) => s.get(trackId));
}

export async function getAllOfflineTracks(): Promise<
  Array<{ track: Track; cachedAt: number; sizeBytes: number }>
> {
  const rows = (await txPromise('offlineTracks', 'readonly', (s) =>
    s.getAll()
  )) as OfflineVaultRecord[];
  return rows
    .map((r) => ({ track: r.track, cachedAt: r.cachedAt, sizeBytes: r.sizeBytes }))
    .sort((a, b) => b.cachedAt - a.cachedAt);
}

export async function getOfflineAudioObjectUrl(trackId: string): Promise<string | null> {
  const rec = await getOfflineTrackRecord(trackId);
  if (!rec) return null;
  return URL.createObjectURL(rec.audioBlob);
}

export async function saveLocalAudioFile(file: File): Promise<Track> {
  const cleanName = file.name.replace(/\.[^/.]+$/, '');
  const parts = cleanName.split(' - ');
  const artist = parts.length > 1 ? parts[0].trim() : 'Local Library';
  const title = parts.length > 1 ? parts.slice(1).join(' - ').trim() : cleanName;

  const duration = await readAudioDuration(file).catch(() => 180);
  const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const ext = file.name.split('.').pop()?.toUpperCase() || 'AUDIO';

  const track: Track = {
    id,
    videoId: id,
    title,
    artist,
    album: 'Local Files',
    duration: Math.max(1, Math.round(duration)),
    artwork: '/src/assets/images/cover_tape_echo_1794983244037.jpg',
    source: 'local',
    bitrate: `${Math.max(128, Math.round((file.size * 8) / Math.max(duration, 1) / 1000))} kbps`,
    codec: ext,
    addedAt: Date.now(),
  };

  const record: LocalTrackRecord = {
    id,
    track,
    audioBlob: file,
    addedAt: Date.now(),
  };

  await txPromise('localTracks', 'readwrite', (s) => s.put(record));
  return track;
}

function readAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      const dur = Number.isFinite(audio.duration) ? audio.duration : 180;
      URL.revokeObjectURL(url);
      resolve(dur);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Metadata failed'));
    };
    audio.src = url;
  });
}

export async function getLocalTrackRecord(
  trackId: string
): Promise<LocalTrackRecord | undefined> {
  return txPromise('localTracks', 'readonly', (s) => s.get(trackId));
}

export async function getAllLocalTracks(): Promise<Track[]> {
  const rows = (await txPromise('localTracks', 'readonly', (s) =>
    s.getAll()
  )) as LocalTrackRecord[];
  return rows.sort((a, b) => b.addedAt - a.addedAt).map((r) => r.track);
}

export async function removeLocalTrack(trackId: string): Promise<void> {
  await txPromise('localTracks', 'readwrite', (s) => s.delete(trackId));
}

export async function getLocalAudioObjectUrl(trackId: string): Promise<string | null> {
  const rec = await getLocalTrackRecord(trackId);
  if (!rec) return null;
  return URL.createObjectURL(rec.audioBlob);
}

export async function savePlaylist(playlist: UserPlaylist): Promise<void> {
  await txPromise('playlists', 'readwrite', (s) => s.put(playlist));
}

export async function getAllPlaylists(): Promise<UserPlaylist[]> {
  const rows = (await txPromise('playlists', 'readonly', (s) =>
    s.getAll()
  )) as UserPlaylist[];
  return rows.sort((a, b) => b.createdAt - a.createdAt);
}

export async function deletePlaylist(id: string): Promise<void> {
  await txPromise('playlists', 'readwrite', (s) => s.delete(id));
}

export async function recordPlaybackHistory(track: Track): Promise<void> {
  const existing = (await txPromise('history', 'readonly', (s) =>
    s.get(track.id)
  )) as (ListeningHistoryEntry & { id: string }) | undefined;

  const next = {
    id: track.id,
    track,
    playedAt: Date.now(),
    playCount: (existing?.playCount || 0) + 1,
  };
  await txPromise('history', 'readwrite', (s) => s.put(next));
}

export async function getPlaybackHistory(): Promise<ListeningHistoryEntry[]> {
  const rows = (await txPromise('history', 'readonly', (s) =>
    s.getAll()
  )) as Array<ListeningHistoryEntry & { id: string }>;
  return rows.sort((a, b) => b.playedAt - a.playedAt).slice(0, 24);
}

export async function getListeningStats(): Promise<ListeningStats> {
  const res = (await txPromise('meta', 'readonly', (s) =>
    s.get('listeningStats')
  )) as { key: string; value: ListeningStats } | undefined;
  return res?.value ?? EMPTY_STATS;
}

export async function incrementListeningStats(
  track: Track,
  secondsDelta: number,
  isNewPlay: boolean
): Promise<ListeningStats> {
  const stats = await getListeningStats();
  const today = new Date().toISOString().slice(0, 10);

  const next: ListeningStats = {
    totalSeconds: stats.totalSeconds + secondsDelta,
    totalPlays: stats.totalPlays + (isNewPlay ? 1 : 0),
    trackCounts: { ...stats.trackCounts },
    artistCounts: { ...stats.artistCounts },
    dailyMinutes: { ...stats.dailyMinutes },
  };

  const prevTrack = next.trackCounts[track.id] || { track, plays: 0, seconds: 0 };
  next.trackCounts[track.id] = {
    track,
    plays: prevTrack.plays + (isNewPlay ? 1 : 0),
    seconds: prevTrack.seconds + secondsDelta,
  };

  const prevArtist = next.artistCounts[track.artist] || {
    artist: track.artist,
    plays: 0,
    seconds: 0,
  };
  next.artistCounts[track.artist] = {
    artist: track.artist,
    plays: prevArtist.plays + (isNewPlay ? 1 : 0),
    seconds: prevArtist.seconds + secondsDelta,
  };

  next.dailyMinutes[today] = (next.dailyMinutes[today] || 0) + secondsDelta / 60;

  await txPromise('meta', 'readwrite', (s) =>
    s.put({ key: 'listeningStats', value: next })
  );
  return next;
}

export async function clearAllOfflineVault(): Promise<void> {
  await txPromise('offlineTracks', 'readwrite', (s) => s.clear());
}
