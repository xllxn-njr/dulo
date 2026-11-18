import { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';
import { ListeningHistoryEntry, Track, UserPlaylist } from '../types/music';
import { OperationType, db, handleFirestoreError } from './firebase';

function toSafeDocId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  return cleaned || `item_${Date.now()}`;
}

function sanitizeTrackForCloud(track: Track) {
  return {
    id: String(track.id || track.videoId).slice(0, 128),
    videoId: String(track.videoId || track.id).slice(0, 128),
    title: String(track.title || 'Untitled').slice(0, 240),
    artist: String(track.artist || 'Unknown Artist').slice(0, 200),
    album: String(track.album || 'YouTube Music').slice(0, 200),
    duration: Math.max(0, Math.min(86400, Number(track.duration || 0))),
    artwork: String(track.artwork || '').slice(0, 1000),
    source: (['demo', 'piped', 'proxy', 'local'].includes(track.source)
      ? track.source
      : 'proxy') as 'demo' | 'piped' | 'proxy' | 'local',
  };
}

function timestampToMs(val: unknown): number {
  if (val instanceof Timestamp) return val.toMillis();
  if (typeof val === 'number') return val;
  return Date.now();
}

export async function ensureUserAccountDoc(user: User): Promise<void> {
  const path = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: user.uid,
        isAnonymous: user.isAnonymous,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(
        ref,
        {
          isAnonymous: user.isAnonymous,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export function subscribeLikedSongs(
  uid: string,
  onUpdate: (tracks: Track[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const path = `users/${uid}/liked_songs`;
  const q = query(
    collection(db, 'users', uid, 'liked_songs'),
    where('uid', '==', uid)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const tracks = snapshot.docs
        .map((d) => {
          const data = d.data();
          return {
            likedAtMs: timestampToMs(data.likedAt),
            track: {
              id: String(data.id || d.id),
              videoId: String(data.videoId || data.id || d.id),
              title: String(data.title || 'Untitled'),
              artist: String(data.artist || 'Unknown Artist'),
              album: String(data.album || 'YouTube Music'),
              duration: Number(data.duration || 180),
              artwork: String(data.artwork || ''),
              source: (data.source as Track['source']) || 'proxy',
            } satisfies Track,
          };
        })
        .sort((a, b) => b.likedAtMs - a.likedAtMs)
        .map((item) => item.track);
      onUpdate(tracks);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError) onError(wrapped);
        else console.error(wrapped);
      }
    }
  );
}

export async function syncLikeSong(uid: string, track: Track): Promise<void> {
  const docId = toSafeDocId(track.id);
  const path = `users/${uid}/liked_songs/${docId}`;
  const ref = doc(db, 'users', uid, 'liked_songs', docId);
  const clean = sanitizeTrackForCloud(track);

  try {
    const existing = await getDoc(ref);
    if (existing.exists()) {
      await setDoc(
        ref,
        {
          title: clean.title,
          artist: clean.artist,
          album: clean.album,
          artwork: clean.artwork,
          duration: clean.duration,
          source: clean.source,
          likedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      await setDoc(ref, {
        uid,
        ...clean,
        likedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function syncUnlikeSong(uid: string, trackId: string): Promise<void> {
  const docId = toSafeDocId(trackId);
  const path = `users/${uid}/liked_songs/${docId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'liked_songs', docId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export function subscribePlaylists(
  uid: string,
  onUpdate: (playlists: UserPlaylist[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const path = `users/${uid}/playlists`;
  const q = query(
    collection(db, 'users', uid, 'playlists'),
    where('uid', '==', uid)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const playlists = snapshot.docs
        .map((d) => {
          const data = d.data();
          const rawTracks = Array.isArray(data.tracks) ? data.tracks : [];
          const tracks: Track[] = rawTracks.map((t: Record<string, unknown>) => ({
            id: String(t.id || t.videoId || ''),
            videoId: String(t.videoId || t.id || ''),
            title: String(t.title || 'Untitled'),
            artist: String(t.artist || 'Unknown Artist'),
            album: String(t.album || 'Playlist'),
            duration: Number(t.duration || 180),
            artwork: String(t.artwork || ''),
            source: (t.source as Track['source']) || 'proxy',
          }));

          return {
            updatedAtMs: timestampToMs(data.updatedAt),
            playlist: {
              id: String(data.id || d.id),
              name: String(data.name || 'Playlist'),
              artwork: data.artwork ? String(data.artwork) : tracks[0]?.artwork,
              sourceUrl: data.sourceUrl ? String(data.sourceUrl) : undefined,
              tracks,
              createdAt: timestampToMs(data.createdAt),
            } satisfies UserPlaylist,
          };
        })
        .sort((a, b) => b.updatedAtMs - a.updatedAtMs)
        .map((item) => item.playlist);
      onUpdate(playlists);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError) onError(wrapped);
        else console.error(wrapped);
      }
    }
  );
}

export async function syncSavePlaylist(
  uid: string,
  playlist: UserPlaylist
): Promise<void> {
  const docId = toSafeDocId(playlist.id);
  const path = `users/${uid}/playlists/${docId}`;
  const ref = doc(db, 'users', uid, 'playlists', docId);

  const boundedTracks = playlist.tracks.slice(0, 200).map(sanitizeTrackForCloud);
  const baseFields: Record<string, unknown> = {
    name: String(playlist.name || 'Untitled Playlist').slice(0, 160),
    tracks: boundedTracks,
    updatedAt: serverTimestamp(),
  };
  if (playlist.artwork) baseFields.artwork = playlist.artwork.slice(0, 1000);
  if (playlist.sourceUrl) baseFields.sourceUrl = playlist.sourceUrl.slice(0, 1000);

  try {
    const existing = await getDoc(ref);
    if (existing.exists()) {
      await setDoc(ref, baseFields, { merge: true });
    } else {
      await setDoc(ref, {
        uid,
        id: String(playlist.id).slice(0, 128),
        ...baseFields,
        createdAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function syncDeletePlaylist(
  uid: string,
  playlistId: string
): Promise<void> {
  const docId = toSafeDocId(playlistId);
  const path = `users/${uid}/playlists/${docId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'playlists', docId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export function subscribeHistory(
  uid: string,
  onUpdate: (entries: ListeningHistoryEntry[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const path = `users/${uid}/history`;
  const q = query(
    collection(db, 'users', uid, 'history'),
    where('uid', '==', uid)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const entries: ListeningHistoryEntry[] = snapshot.docs
        .map((d) => {
          const data = d.data();
          const track: Track = {
            id: String(data.id || d.id),
            videoId: String(data.videoId || data.id || d.id),
            title: String(data.title || 'Untitled'),
            artist: String(data.artist || 'Unknown Artist'),
            album: String(data.album || 'YouTube Music'),
            duration: Number(data.duration || 180),
            artwork: String(data.artwork || ''),
            source: (data.source as Track['source']) || 'proxy',
          };
          return {
            track,
            playedAt: timestampToMs(data.playedAt),
            playCount: Number(data.playCount || 1),
          };
        })
        .sort((a, b) => b.playedAt - a.playedAt)
        .slice(0, 24);
      onUpdate(entries);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError) onError(wrapped);
        else console.error(wrapped);
      }
    }
  );
}

export async function syncRecordHistory(uid: string, track: Track): Promise<void> {
  const docId = toSafeDocId(track.id);
  const path = `users/${uid}/history/${docId}`;
  const ref = doc(db, 'users', uid, 'history', docId);
  const clean = sanitizeTrackForCloud(track);

  try {
    const existing = await getDoc(ref);
    if (existing.exists()) {
      const prevCount = Number(existing.data()?.playCount || 0);
      await setDoc(
        ref,
        {
          title: clean.title,
          artist: clean.artist,
          album: clean.album,
          artwork: clean.artwork,
          duration: clean.duration,
          source: clean.source,
          playCount: Math.min(1000000, prevCount + 1),
          playedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      await setDoc(ref, {
        uid,
        ...clean,
        playCount: 1,
        playedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}
