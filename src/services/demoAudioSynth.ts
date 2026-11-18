import { Track } from '../types/music';

const synthCache = new Map<string, Blob>();

/**
 * Generates a musical stereo 16-bit PCM WAV Blob for curated demo tracks
 * so dual-deck crossfade, 10-band Web Audio EQ, loudness normalization,
 * seeking, and IndexedDB offline caching operate on real audio streams
 * even when external network access is restricted.
 */
export function generateDemoTrackWav(track: Track): Blob {
  const cached = synthCache.get(track.id);
  if (cached) return cached;

  const sampleRate = 22050;
  const duration = Math.min(Math.max(track.duration || 45, 24), 75);
  const numChannels = 2;
  const numSamples = Math.floor(sampleRate * duration);
  const byteRate = sampleRate * numChannels * 2;
  const dataSize = numSamples * numChannels * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  const profile = track.demoProfile ?? {
    rootHz: 110,
    bpm: 96,
    character: 'ambient' as const,
  };

  const beatDuration = 60 / profile.bpm;
  // Musical minor ninth / pentatonic harmonic ratios
  const chords = [
    [1, 1.1892, 1.4983, 1.7818], // m7
    [0.8909, 1.0595, 1.3348, 1.5874], // bVII6
    [0.7937, 1, 1.1892, 1.4983], // bVI maj7
    [0.9439, 1.1225, 1.4142, 1.6818], // iv9
  ];

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const barTime = t % (beatDuration * 16);
    const chordIdx = Math.floor(barTime / (beatDuration * 4)) % chords.length;
    const chord = chords[chordIdx];

    const beatPhase = (t % beatDuration) / beatDuration;
    const subBeatPhase = (t % (beatDuration * 0.5)) / (beatDuration * 0.5);

    // Master envelope (smooth fade in & fade out)
    let env = 1;
    if (t < 1.2) env = t / 1.2;
    else if (t > duration - 1.8) env = Math.max(0, (duration - t) / 1.8);

    // Warm chord pad voices
    let padL = 0;
    let padR = 0;
    for (let v = 0; v < chord.length; v++) {
      const freq = profile.rootHz * 2 * chord[v];
      const detune = v % 2 === 0 ? 1.0025 : 0.9975;
      const slowLfo = 0.55 + 0.45 * Math.sin(2 * Math.PI * (0.14 + v * 0.05) * t);
      const voiceL = Math.sin(2 * Math.PI * freq * t) + 0.25 * Math.sin(2 * Math.PI * freq * 2 * t);
      const voiceR = Math.sin(2 * Math.PI * freq * detune * t + 0.4) + 0.25 * Math.sin(2 * Math.PI * freq * 2 * detune * t);
      padL += voiceL * slowLfo * 0.11;
      padR += voiceR * slowLfo * 0.11;
    }

    // Sub-bass pulse
    const bassFreq = profile.rootHz * chord[0] * 0.5;
    const bassPulse =
      profile.character === 'kinetic' || profile.character === 'afro'
        ? Math.exp(-beatPhase * 3.8)
        : 0.65 + 0.35 * Math.sin(2 * Math.PI * (1 / (beatDuration * 2)) * t);
    const bass = Math.sin(2 * Math.PI * bassFreq * t) * bassPulse * 0.26;

    // Gentle melodic arpeggio / Rhodes pluck
    const arpStep = Math.floor(t / (beatDuration * 0.5)) % 4;
    const arpFreq = profile.rootHz * 4 * chord[arpStep];
    const arpEnv = Math.exp(-subBeatPhase * (profile.character === 'ambient' ? 3.0 : 5.5));
    const arp = Math.sin(2 * Math.PI * arpFreq * t) * arpEnv * 0.14;

    // Subtle percussive transient for rhythmic tracks
    let perc = 0;
    if (profile.character === 'afro' || profile.character === 'kinetic' || profile.character === 'dub') {
      const kickEnv = Math.exp(-beatPhase * 18);
      const kickFreq = 52 + 80 * Math.exp(-beatPhase * 30);
      perc += Math.sin(2 * Math.PI * kickFreq * t) * kickEnv * 0.22;

      const hatTrig = Math.floor(t / (beatDuration * 0.5)) % 2 === 1;
      if (hatTrig) {
        const hatEnv = Math.exp(-subBeatPhase * 28);
        const pseudoNoise = Math.sin(i * 12.9898) * 43758.5453;
        const noise = (pseudoNoise - Math.floor(pseudoNoise)) * 2 - 1;
        perc += noise * hatEnv * 0.04;
      }
    }

    // Intro quiet section for SponsorBlock demo on first 6s if applicable
    let sectionGain = 1;
    if (track.demoSponsorSegments && track.demoSponsorSegments.length > 0) {
      const seg = track.demoSponsorSegments[0];
      if (t >= seg.segment[0] && t <= seg.segment[1]) {
        sectionGain = 0.22;
      }
    }

    const left = Math.max(-0.95, Math.min(0.95, (padL + bass + arp * 0.85 + perc) * env * sectionGain));
    const right = Math.max(-0.95, Math.min(0.95, (padR + bass + arp * 1.05 + perc) * env * sectionGain));

    view.setInt16(offset, Math.floor(left * 32767), true);
    view.setInt16(offset + 2, Math.floor(right * 32767), true);
    offset += 4;
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  synthCache.set(track.id, blob);
  return blob;
}

export function getDemoTrackUrl(track: Track): string {
  const blob = generateDemoTrackWav(track);
  return URL.createObjectURL(blob);
}
