import { Track } from '../types/music';

export interface MediaSessionHandlers {
  onPlay: () => void;
  onPause: () => void;
  onPreviousTrack: () => void;
  onNextTrack: () => void;
  onSeekTo: (seconds: number) => void;
}

let lastPositionSyncMs = 0;

function inferImageMimeType(src: string): string {
  const clean = src.split('?')[0].toLowerCase();
  if (clean.endsWith('.png')) return 'image/png';
  if (clean.endsWith('.webp')) return 'image/webp';
  if (clean.endsWith('.svg')) return 'image/svg+xml';
  return 'image/jpeg';
}

function buildArtworkList(artwork?: string): MediaImage[] {
  if (!artwork) {
    return [
      { src: '/pwa-192x192.png', sizes: '96x96', type: 'image/png' },
      { src: '/pwa-512x512.png', sizes: '256x256', type: 'image/png' },
      { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
    ];
  }

  const type = inferImageMimeType(artwork);
  return [
    { src: artwork, sizes: '96x96', type },
    { src: artwork, sizes: '256x256', type },
    { src: artwork, sizes: '512x512', type },
  ];
}

function safeSetActionHandler(
  action: MediaSessionAction,
  handler: MediaSessionActionHandler | null
): void {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  try {
    navigator.mediaSession.setActionHandler(action, handler);
  } catch {
    // Unsupported MediaSessionAction in this browser/OS
  }
}

export function updateMediaSessionMetadata(
  track: Track,
  handlers: MediaSessionHandlers
): void {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: 'Dulo',
      artwork: buildArtworkList(track.artwork),
    });
  } catch {
    // Ignore if MediaMetadata fails on restricted environments
  }

  safeSetActionHandler('play', () => handlers.onPlay());
  safeSetActionHandler('pause', () => handlers.onPause());
  safeSetActionHandler('previoustrack', () => handlers.onPreviousTrack());
  safeSetActionHandler('nexttrack', () => handlers.onNextTrack());
  safeSetActionHandler('seekto', (details) => {
    if (typeof details.seekTime === 'number' && Number.isFinite(details.seekTime)) {
      handlers.onSeekTo(Math.max(0, details.seekTime));
    }
  });
}

export function updateMediaSessionPlaybackState(isPlaying: boolean): void {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  try {
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  } catch {
    // Ignore unsupported playbackState assignment
  }
}

export function updateMediaSessionPosition(
  position: number,
  duration: number,
  force = false
): void {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  if (!('setPositionState' in navigator.mediaSession)) return;
  if (!Number.isFinite(duration) || duration <= 0) return;

  const now = performance.now();
  if (!force && now - lastPositionSyncMs < 900) return;
  lastPositionSyncMs = now;

  const clampedPosition = Math.max(
    0,
    Math.min(Number.isFinite(position) ? position : 0, duration)
  );

  try {
    navigator.mediaSession.setPositionState({
      duration,
      position: clampedPosition,
      playbackRate: 1,
    });
  } catch {
    // Ignore browsers where setPositionState rejects transient values
  }
}
