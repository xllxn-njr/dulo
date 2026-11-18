import {
  AlbumResult,
  AppSettings,
  PlaylistResult,
  SearchFilter,
  Track,
} from '../types/music';

export const DEFAULT_PROXY_URL = 'https://dulo-proxy.xllxn-io.workers.dev/';

export const DEFAULT_PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.adminforge.de',
  'https://api.piped.private.coffee',
  'https://pipedapi.drgns.space',
];

async function fetchWithTimeout(
  url: string,
  timeoutMs = 7000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

function normalizeProxyBase(proxyUrl?: string): string {
  return (proxyUrl || DEFAULT_PROXY_URL).trim().replace(/\/+$/, '');
}

function extractVideoIdFromUrl(url: string): string {
  if (!url) return '';
  if (url.includes('/watch?v=')) {
    return url.replace('/watch?v=', '').split('&')[0];
  }
  const match = url.match(/[a-zA-Z0-9_-]{11}/);
  return match ? match[0] : url;
}

function mapProxyItemToTrack(
  it: Record<string, unknown>,
  fallbackAlbum = 'YouTube Music',
  isVideo = false
): Track | null {
  const rawUrl = typeof it.url === 'string' ? it.url : '';
  const videoId = rawUrl
    ? rawUrl.replace('/watch?v=', '').split('&')[0]
    : typeof it.videoId === 'string'
      ? it.videoId
      : typeof it.id === 'string'
        ? it.id
        : '';

  if (!videoId) return null;

  return {
    id: `yt-${videoId}`,
    videoId,
    title: String(it.title || 'Untitled'),
    artist: String(it.uploaderName || it.artist || 'Unknown Artist'),
    album: String(it.album || (isVideo ? 'Music Video' : fallbackAlbum)),
    duration: Number(it.duration || 180),
    artwork: String(
      it.thumbnail ||
        it.artwork ||
        '/src/assets/images/cover_obsidian_drift_1794983242257.jpg'
    ),
    source: 'proxy',
    isVideo,
    bitrate: 'YouTube IFrame',
    codec: 'YT Embed API',
  };
}

export interface SearchOutput {
  songs: Track[];
  albums: AlbumResult[];
  playlists: PlaylistResult[];
  providerLabel: string;
  usedFallback: boolean;
}

export async function searchMusic(
  query: string,
  filter: SearchFilter,
  settings: AppSettings
): Promise<SearchOutput> {
  const trimmed = query.trim();
  const base = normalizeProxyBase(settings.customProxyUrl);

  if (!trimmed) {
    return {
      songs: [],
      albums: [],
      playlists: [],
      providerLabel: base.replace(/^https?:\/\//, ''),
      usedFallback: false,
    };
  }

  // 1. Primary Cloudflare Worker Proxy (`GET {PROXY_URL}/api/search`)
  if (settings.streamMode === 'proxy') {
    try {
      const res = await fetchWithTimeout(
        `${base}/api/search?q=${encodeURIComponent(trimmed)}&filter=${encodeURIComponent(
          filter || 'music_songs'
        )}`,
        8000
      );
      if (res.ok) {
        const data = await res.json();
        const rawItems = Array.isArray(data.items) ? data.items : [];

        if (filter === 'music_albums') {
          const albums: AlbumResult[] = rawItems.map((it: Record<string, unknown>) => ({
            id: String(it.url || it.id || Math.random()),
            browseId: String(it.url || it.browseId || ''),
            title: String(it.name || it.title || 'Album'),
            artist: String(it.uploaderName || it.artist || 'Artist'),
            artwork: String(it.thumbnail || it.artwork || ''),
            trackCount: Number(it.videos || it.trackCount || 0) || undefined,
          }));
          return {
            songs: [],
            albums,
            playlists: [],
            providerLabel: base.replace(/^https?:\/\//, ''),
            usedFallback: false,
          };
        }

        if (filter === 'music_playlists') {
          const playlists: PlaylistResult[] = rawItems.map((it: Record<string, unknown>) => ({
            id: String(it.url || it.id || Math.random()),
            playlistId: String(it.url || it.playlistId || '').replace('/playlist?list=', ''),
            title: String(it.name || it.title || 'Playlist'),
            author: String(it.uploaderName || it.author || 'Curator'),
            artwork: String(it.thumbnail || it.artwork || ''),
            trackCount: Number(it.videos || it.trackCount || 0),
          }));
          return {
            songs: [],
            albums: [],
            playlists,
            providerLabel: base.replace(/^https?:\/\//, ''),
            usedFallback: false,
          };
        }

        const songs: Track[] = rawItems
          .map((it: Record<string, unknown>) =>
            mapProxyItemToTrack(it, 'YouTube Music', filter === 'videos')
          )
          .filter((t: Track | null): t is Track => Boolean(t));

        return {
          songs,
          albums: [],
          playlists: [],
          providerLabel: base.replace(/^https?:\/\//, ''),
          usedFallback: false,
        };
      } else {
        const bodyText = await res.text().catch(() => '');
        console.error('[Dulo Search] Proxy /api/search HTTP error:', {
          url: res.url,
          status: res.status,
          statusText: res.statusText,
          body: bodyText,
        });
      }
    } catch (err) {
      console.error('[Dulo Search] Proxy /api/search failed:', err);
    }
  }

  // 2. Piped public API failover (search metadata only)
  for (const instance of settings.pipedInstances) {
    const pipedBase = instance.replace(/\/$/, '');
    try {
      const res = await fetchWithTimeout(
        `${pipedBase}/search?q=${encodeURIComponent(trimmed)}&filter=${filter}`,
        4500
      );
      if (!res.ok) continue;
      const data = await res.json();
      const rawItems = Array.isArray(data.items) ? data.items : [];

      if (filter === 'music_albums') {
        const albums: AlbumResult[] = rawItems.map((it: Record<string, unknown>) => ({
          id: String(it.url || Math.random()),
          browseId: String(it.url || ''),
          title: String(it.name || it.title || 'Album'),
          artist: String(it.uploaderName || 'Artist'),
          artwork: String(it.thumbnail || ''),
          trackCount: Number(it.videos || 0) || undefined,
        }));
        if (albums.length > 0) {
          return {
            songs: [],
            albums,
            playlists: [],
            providerLabel: pipedBase.replace('https://', ''),
            usedFallback: false,
          };
        }
      } else if (filter === 'music_playlists') {
        const playlists: PlaylistResult[] = rawItems.map((it: Record<string, unknown>) => ({
          id: String(it.url || Math.random()),
          playlistId: String(it.url || '').replace('/playlist?list=', ''),
          title: String(it.name || it.title || 'Playlist'),
          author: String(it.uploaderName || 'Curator'),
          artwork: String(it.thumbnail || ''),
          trackCount: Number(it.videos || 0),
        }));
        if (playlists.length > 0) {
          return {
            songs: [],
            albums: [],
            playlists,
            providerLabel: pipedBase.replace('https://', ''),
            usedFallback: false,
          };
        }
      } else {
        const songs: Track[] = rawItems
          .filter((it: Record<string, unknown>) => it.url)
          .map((it: Record<string, unknown>) => {
            const videoId = extractVideoIdFromUrl(String(it.url));
            return {
              id: `yt-${videoId}`,
              videoId,
              title: String(it.title || 'Untitled'),
              artist: String(it.uploaderName || 'Unknown Artist'),
              album: filter === 'videos' ? 'Music Video' : 'YouTube Music',
              duration: Number(it.duration || 180),
              artwork: String(
                it.thumbnail || '/src/assets/images/cover_obsidian_drift_1794983242257.jpg'
              ),
              source: 'piped' as const,
              isVideo: filter === 'videos',
              bitrate: 'YouTube IFrame',
              codec: 'YT Embed API',
            };
          });
        if (songs.length > 0) {
          return {
            songs,
            albums: [],
            playlists: [],
            providerLabel: pipedBase.replace('https://', ''),
            usedFallback: false,
          };
        }
      }
    } catch {
      // Failover to next Piped instance
    }
  }

  return {
    songs: [],
    albums: [],
    playlists: [],
    providerLabel: 'Search unavailable',
    usedFallback: true,
  };
}

export interface StreamMetadataOutput {
  audioUrl: string;
  title?: string;
  artist?: string;
  artwork?: string;
  duration?: number;
  bitrate?: string;
  codec?: string;
  relatedStreams: Track[];
  providerLabel: string;
}

const relatedStreamsCache = new Map<string, Track[]>();

export async function fetchStreamFromProxy(
  videoId: string,
  settings: AppSettings
): Promise<StreamMetadataOutput> {
  const base = normalizeProxyBase(settings.customProxyUrl);
  const endpoint = `${base}/api/stream/${encodeURIComponent(videoId)}`;

  const res = await fetchWithTimeout(endpoint, 10000);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `Proxy /api/stream/${videoId} returned HTTP ${res.status}${body ? `: ${body.slice(0, 140)}` : ''}`
    );
  }

  const data = (await res.json()) as Record<string, unknown>;
  const audioUrl = typeof data.audioUrl === 'string' ? data.audioUrl.trim() : '';

  const rawRelated = Array.isArray(data.relatedStreams) ? data.relatedStreams : [];
  const relatedStreams: Track[] = rawRelated
    .map((it) => mapProxyItemToTrack(it as Record<string, unknown>, 'Auto-Radio', false))
    .filter((t: Track | null): t is Track => Boolean(t));

  if (relatedStreams.length > 0) {
    relatedStreamsCache.set(videoId, relatedStreams);
  }

  if (!audioUrl) {
    throw new Error(`Proxy /api/stream/${videoId} response did not include audioUrl`);
  }

  return {
    audioUrl,
    title: typeof data.title === 'string' ? data.title : undefined,
    artist: typeof data.uploader === 'string' ? data.uploader : typeof data.artist === 'string' ? data.artist : undefined,
    artwork: typeof data.thumbnailUrl === 'string' ? data.thumbnailUrl : typeof data.thumbnail === 'string' ? data.thumbnail : undefined,
    duration: typeof data.duration === 'number' ? data.duration : undefined,
    bitrate: typeof data.bitrate === 'string' ? data.bitrate : 'Proxy Stream',
    codec: typeof data.codec === 'string' ? data.codec : 'Web Audio',
    relatedStreams,
    providerLabel: base.replace(/^https?:\/\//, ''),
  };
}

export async function fetchUpNextRadio(
  track: Track,
  settings: AppSettings
): Promise<Track[]> {
  if (track.videoId) {
    const cached = relatedStreamsCache.get(track.videoId);
    if (cached && cached.length > 0) {
      return cached.filter((s) => s.videoId !== track.videoId).slice(0, 8);
    }

    if (settings.streamMode === 'proxy') {
      try {
        const stream = await fetchStreamFromProxy(track.videoId, settings);
        if (stream.relatedStreams.length > 0) {
          return stream.relatedStreams
            .filter((s) => s.videoId !== track.videoId)
            .slice(0, 8);
        }
      } catch {
        // Fall through to search-based radio
      }
    }
  }

  const radioQuery = `${track.artist} ${track.title}`.trim();
  if (!radioQuery) return [];

  try {
    const out = await searchMusic(radioQuery, 'music_songs', settings);
    return out.songs.filter((s) => s.videoId !== track.videoId).slice(0, 8);
  } catch (err) {
    console.error('[Dulo AutoRadio] Failed to fetch Up Next tracks:', err);
    return [];
  }
}

export function extractPlaylistId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    const list = parsed.searchParams.get('list');
    if (list) return list;
  } catch {
    // Not a full URL; check raw ID
  }
  if (/^[a-zA-Z0-9_-]{12,}$/.test(trimmed)) return trimmed;
  return null;
}

export async function importYouTubePlaylist(
  urlOrId: string,
  settings: AppSettings
): Promise<{ name: string; tracks: Track[]; fromNetwork: boolean }> {
  const listId = extractPlaylistId(urlOrId);
  if (!listId) {
    throw new Error('Please paste a valid YouTube or YouTube Music playlist URL.');
  }

  for (const instance of settings.pipedInstances) {
    const base = instance.replace(/\/$/, '');
    try {
      const res = await fetchWithTimeout(`${base}/playlists/${listId}`, 5000);
      if (!res.ok) continue;
      const data = await res.json();
      const related = Array.isArray(data.relatedStreams) ? data.relatedStreams : [];
      const tracks: Track[] = related
        .filter((it: Record<string, unknown>) => it.url)
        .map((it: Record<string, unknown>) => {
          const vid = extractVideoIdFromUrl(String(it.url));
          return {
            id: `yt-${vid}`,
            videoId: vid,
            title: String(it.title || 'Untitled'),
            artist: String(it.uploaderName || 'Unknown Artist'),
            album: String(data.name || 'Imported Playlist'),
            duration: Number(it.duration || 180),
            artwork: String(
              it.thumbnail || '/src/assets/images/cover_obsidian_drift_1794983242257.jpg'
            ),
            source: 'piped' as const,
            bitrate: 'YouTube IFrame',
            codec: 'YT Embed API',
          };
        });
      if (tracks.length > 0) {
        return {
          name: String(data.name || `Playlist ${listId.slice(0, 6)}`),
          tracks,
          fromNetwork: true,
        };
      }
    } catch {
      // failover
    }
  }

  throw new Error('Could not load playlist tracks from the network.');
}

export async function testPipedInstanceLatency(
  instanceUrl: string
): Promise<{ ok: boolean; latencyMs: number }> {
  const start = performance.now();
  try {
    const base = instanceUrl.replace(/\/$/, '');
    const res = await fetchWithTimeout(`${base}/trending?region=US`, 3500);
    return {
      ok: res.ok,
      latencyMs: Math.round(performance.now() - start),
    };
  } catch {
    return { ok: false, latencyMs: 0 };
  }
}
