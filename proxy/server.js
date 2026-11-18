/**
 * Dulo Custom InnerTube Proxy Server (youtubei.js)
 * Ready-to-deploy Node.js proxy for high-reliability YouTube Music extraction,
 * HTTP Range byte-serving for instant scrubbing, and full CORS support.
 */
import express from 'express';
import { Innertube } from 'youtubei.js';

const app = express();
const PORT = process.env.PORT || 4000;

let yt = null;

async function getInnertube() {
  if (!yt) {
    yt = await Innertube.create({
      lang: 'en',
      location: 'US',
      retrieve_player: true,
    });
  }
  return yt;
}

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, engine: 'youtubei.js', service: 'dulo-innertube-proxy' });
});

app.get('/api/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const filter = String(req.query.filter || 'music_songs');
    if (!q) return res.json({ items: [] });

    const client = await getInnertube();
    const typeMap = {
      music_songs: 'song',
      music_albums: 'album',
      music_playlists: 'playlist',
      videos: 'video',
    };

    const results = await client.music.search(q, { type: typeMap[filter] || 'song' });
    const shelf = results.results?.[0];
    const rawItems = shelf?.contents || [];

    const items = rawItems.map((item) => ({
      id: item.id || item.video_id || item.browse_id,
      videoId: item.id || item.video_id || '',
      title: item.title?.text || item.title || 'Untitled',
      artist:
        item.artists?.map((a) => a.name).join(', ') ||
        item.author?.name ||
        'Unknown Artist',
      album: item.album?.name || 'Single',
      duration: item.duration?.seconds || 0,
      artwork: item.thumbnails?.[0]?.url || '',
      source: 'proxy',
    }));

    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Search failed' });
  }
});

app.get('/api/radio/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const client = await getInnertube();
    const info = await client.music.getUpNext(videoId);
    const items = (info.contents || []).map((item) => ({
      id: `proxy-${item.video_id}`,
      videoId: item.video_id,
      title: item.title?.text || item.title || 'Untitled',
      artist: item.artists?.map((a) => a.name).join(', ') || item.author?.name || 'Unknown Artist',
      album: 'Up Next Radio',
      duration: item.duration?.seconds || 180,
      artwork: item.thumbnails?.[0]?.url || '',
      source: 'proxy',
    }));
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Radio lookup failed' });
  }
});

app.get('/api/stream/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const client = await getInnertube();
    const info = await client.getBasicInfo(videoId);
    const format = info.chooseFormat({ type: 'audio', quality: 'best' });

    if (!format) {
      return res.status(404).json({ error: 'No audio format available' });
    }

    const streamUrl = format.decipher(client.session.player);
    const range = req.headers.range;
    const upstreamHeaders = {};
    if (range) upstreamHeaders['Range'] = range;

    const upstream = await fetch(streamUrl, { headers: upstreamHeaders });
    res.status(upstream.status);
    res.setHeader('Content-Type', format.mime_type || 'audio/mp4');
    res.setHeader('Accept-Ranges', 'bytes');

    const contentLength = upstream.headers.get('content-length');
    const contentRange = upstream.headers.get('content-range');
    if (contentLength) res.setHeader('Content-Length', contentLength);
    if (contentRange) res.setHeader('Content-Range', contentRange);

    if (!upstream.body) return res.end();
    const reader = upstream.body.getReader();
    const pump = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          res.end();
          break;
        }
        res.write(Buffer.from(value));
      }
    };
    await pump();
  } catch (err) {
    res.status(500).json({ error: err.message || 'Stream extraction failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Dulo InnerTube Proxy listening on http://localhost:${PORT}`);
});
