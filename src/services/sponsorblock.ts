import { SponsorSegment, Track } from '../types/music';

const sbCache = new Map<string, SponsorSegment[]>();

export async function fetchSponsorSegments(track: Track): Promise<SponsorSegment[]> {
  if (track.demoSponsorSegments) {
    return track.demoSponsorSegments;
  }
  if (!track.videoId || track.source === 'local') {
    return [];
  }
  if (sbCache.has(track.videoId)) {
    return sbCache.get(track.videoId)!;
  }

  try {
    const categories = encodeURIComponent(
      JSON.stringify(['music_offtopic', 'intro', 'outro'])
    );
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3200);
    const res = await fetch(
      `https://sponsor.ajay.app/api/skipSegments?videoID=${encodeURIComponent(
        track.videoId
      )}&categories=${categories}`,
      { signal: controller.signal }
    );
    clearTimeout(timer);

    if (!res.ok) {
      sbCache.set(track.videoId, []);
      return [];
    }
    const data = await res.json();
    const segments: SponsorSegment[] = Array.isArray(data)
      ? data.map((s) => ({
          UUID: String(s.UUID || Math.random()),
          category: s.category || 'music_offtopic',
          segment: [Number(s.segment?.[0] || 0), Number(s.segment?.[1] || 0)],
        }))
      : [];
    sbCache.set(track.videoId, segments);
    return segments;
  } catch {
    return [];
  }
}

export function findActiveSkipSegment(
  segments: SponsorSegment[],
  currentTime: number,
  alreadySkippedIds: Set<string>
): SponsorSegment | null {
  for (const seg of segments) {
    if (alreadySkippedIds.has(seg.UUID)) continue;
    const [start, end] = seg.segment;
    if (end - start >= 1.5 && currentTime >= start && currentTime < end - 0.5) {
      return seg;
    }
  }
  return null;
}
