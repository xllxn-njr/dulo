import { LyricLine, Track } from '../types/music';

const lyricsCache = new Map<string, LyricLine[]>();

export function parseLrc(lrc: string): LyricLine[] {
  const lines: LyricLine[] = [];
  const regex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.*)/;

  for (const rawLine of lrc.split('\n')) {
    const match = rawLine.match(regex);
    if (!match) continue;
    const mins = parseInt(match[1], 10);
    const secs = parseInt(match[2], 10);
    const msStr = match[3] || '0';
    const ms = parseInt(msStr.padEnd(3, '0').slice(0, 3), 10);
    const time = mins * 60 + secs + ms / 1000;
    const text = match[4].trim();
    if (text) {
      lines.push({ time, text });
    }
  }

  return lines.sort((a, b) => a.time - b.time);
}

export async function fetchSyncedLyrics(track: Track): Promise<{
  lines: LyricLine[];
  source: 'lrclib' | 'embedded' | 'none';
}> {
  const cacheKey = track.id;
  if (lyricsCache.has(cacheKey)) {
    return { lines: lyricsCache.get(cacheKey)!, source: 'lrclib' };
  }

  if (track.lrcText) {
    const parsed = parseLrc(track.lrcText);
    lyricsCache.set(cacheKey, parsed);
    return { lines: parsed, source: 'embedded' };
  }

  try {
    const params = new URLSearchParams({
      artist_name: track.artist,
      track_name: track.title,
      duration: String(Math.round(track.duration || 180)),
    });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://lrclib.net/api/get?${params.toString()}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (data.syncedLyrics) {
        const parsed = parseLrc(data.syncedLyrics);
        lyricsCache.set(cacheKey, parsed);
        return { lines: parsed, source: 'lrclib' };
      }
      if (data.plainLyrics) {
        const step = (track.duration || 180) / Math.max(1, data.plainLyrics.split('\n').length);
        const plain = data.plainLyrics
          .split('\n')
          .map((t: string) => t.trim())
          .filter(Boolean)
          .map((text: string, idx: number) => ({
            time: Math.round(idx * step * 10) / 10,
            text,
          }));
        lyricsCache.set(cacheKey, plain);
        return { lines: plain, source: 'lrclib' };
      }
    }

    // Fallback to LRCLIB search endpoint
    const searchRes = await fetch(
      `https://lrclib.net/api/search?q=${encodeURIComponent(`${track.artist} ${track.title}`)}`
    );
    if (searchRes.ok) {
      const arr = await searchRes.json();
      const first = Array.isArray(arr)
        ? arr.find((item) => item.syncedLyrics) || arr[0]
        : null;
      if (first?.syncedLyrics) {
        const parsed = parseLrc(first.syncedLyrics);
        lyricsCache.set(cacheKey, parsed);
        return { lines: parsed, source: 'lrclib' };
      }
    }
  } catch {
    // Graceful fallback when offline or blocked
  }

  return { lines: [], source: 'none' };
}

export async function renderLyricCardPng(
  track: Track,
  selectedLines: LyricLine[]
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unsupported');

  // Deep matte obsidian card background
  ctx.fillStyle = '#09090B';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle elevated matte card frame
  ctx.fillStyle = '#121215';
  roundRect(ctx, 72, 72, 936, 1206, 36);
  ctx.fill();

  ctx.strokeStyle = '#27272A';
  ctx.lineWidth = 2;
  roundRect(ctx, 72, 72, 936, 1206, 36);
  ctx.stroke();

  // Artwork header
  try {
    const img = await loadImage(track.artwork);
    ctx.save();
    roundRect(ctx, 136, 136, 160, 160, 20);
    ctx.clip();
    ctx.drawImage(img, 136, 136, 160, 160);
    ctx.restore();
  } catch {
    ctx.fillStyle = '#1C1C21';
    roundRect(ctx, 136, 136, 160, 160, 20);
    ctx.fill();
  }

  // Track metadata next to artwork
  ctx.fillStyle = '#FAFAFA';
  ctx.font = '600 40px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(truncateText(ctx, track.title, 600), 330, 205);

  ctx.fillStyle = '#A1A1AA';
  ctx.font = '400 30px "DM Sans", system-ui, sans-serif';
  ctx.fillText(truncateText(ctx, `${track.artist} · ${track.album}`, 600), 330, 255);

  // Hairline divider
  ctx.strokeStyle = '#27272A';
  ctx.beginPath();
  ctx.moveTo(136, 356);
  ctx.lineTo(944, 356);
  ctx.stroke();

  // Render 1–4 selected lyric lines
  const linesToDraw = selectedLines.slice(0, 4);
  ctx.fillStyle = '#FAFAFA';
  ctx.font = '600 50px "Plus Jakarta Sans", system-ui, sans-serif';
  let y = 470;
  for (const line of linesToDraw) {
    const wrapped = wrapText(ctx, line.text, 800);
    for (const wLine of wrapped) {
      ctx.fillText(wLine, 136, y);
      y += 72;
    }
    y += 28;
  }

  // Minimalist footer wordmark
  ctx.strokeStyle = '#27272A';
  ctx.beginPath();
  ctx.moveTo(136, 1140);
  ctx.lineTo(944, 1140);
  ctx.stroke();

  ctx.fillStyle = '#71717A';
  ctx.font = '500 24px "JetBrains Mono", monospace';
  ctx.fillText('DULO · SYNCED LYRICS', 136, 1205);

  return canvas.toDataURL('image/png');
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let out = text;
  while (out.length > 0 && ctx.measureText(`${out}…`).width > maxW) {
    out = out.slice(0, -1);
  }
  return `${out}…`;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxW && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}
