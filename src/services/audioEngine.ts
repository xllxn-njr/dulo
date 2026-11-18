import { EQPreset, EQPresetId, Track } from '../types/music';
import {
  updateMediaSessionMetadata,
  updateMediaSessionPlaybackState,
  updateMediaSessionPosition,
} from './mediaSession';

export const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
export const EQ_LABELS = ['32', '64', '125', '250', '500', '1K', '2K', '4K', '8K', '16K'];

export const EQ_PRESETS: EQPreset[] = [
  { id: 'flat', name: 'Flat', gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { id: 'bass_boost', name: 'Bass Boost', gains: [6, 5, 4, 2, 0, 0, 0, 1, 2, 2] },
  { id: 'vocal_clarity', name: 'Vocal Clarity', gains: [-2, -1, 0, 1, 3, 4, 4, 3, 1, 0] },
  { id: 'late_night', name: 'Late Night', gains: [3, 2, 1, 0, -1, -1, 0, 1, 2, 1] },
  { id: 'studio', name: 'Studio', gains: [2, 1, 0, -1, 0, 1, 2, 2, 3, 2] },
];

type DeckId = 'A' | 'B';

export interface AudioEngineCallbacks {
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onTrackEnded: () => void;
  onCrossfadeStart: () => void;
  onPlayStateChange: (isPlaying: boolean) => void;
  onCanPlay?: () => void;
  onPlaybackError?: (err: unknown) => void;
  onSeekRequest?: (time: number) => void;
  onPrevRequest?: () => void;
  onNextRequest?: () => void;
}

class DuloAudioEngine {
  private ctx: AudioContext | null = null;
  private deckA: HTMLAudioElement;
  private deckB: HTMLAudioElement;
  private activeDeck: DeckId = 'A';

  private sourceA: MediaElementAudioSourceNode | null = null;
  private sourceB: MediaElementAudioSourceNode | null = null;
  private gainA: GainNode | null = null;
  private gainB: GainNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private compressor: DynamicsCompressorNode | null = null;
  private normalizerMakeup: GainNode | null = null;
  private sleepFadeGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  private eqGains: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  private normalizationEnabled = true;
  private crossfadeSeconds = 4;
  private volume = 0.85;
  private crossfadeTriggered = false;
  private callbacks: AudioEngineCallbacks | null = null;
  private rafId: number | null = null;
  private frequencyBuffer = new Uint8Array(32);

  constructor() {
    this.deckA = new Audio();
    this.deckB = new Audio();
    this.deckA.crossOrigin = 'anonymous';
    this.deckB.crossOrigin = 'anonymous';
    this.deckA.preload = 'auto';
    this.deckB.preload = 'auto';

    this.bindDeckEvents('A', this.deckA);
    this.bindDeckEvents('B', this.deckB);
  }

  public setCallbacks(cb: AudioEngineCallbacks) {
    this.callbacks = cb;
  }

  private ensureGraph() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      return;
    }

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    this.ctx = new AudioCtx();

    this.sourceA = this.ctx.createMediaElementSource(this.deckA);
    this.sourceB = this.ctx.createMediaElementSource(this.deckB);

    this.gainA = this.ctx.createGain();
    this.gainB = this.ctx.createGain();
    this.gainA.gain.value = this.activeDeck === 'A' ? 1 : 0;
    this.gainB.gain.value = this.activeDeck === 'B' ? 1 : 0;

    // 10-band Parametric Equalizer
    this.eqFilters = EQ_FREQUENCIES.map((freq, idx) => {
      const filter = this.ctx!.createBiquadFilter();
      if (idx === 0) filter.type = 'lowshelf';
      else if (idx === EQ_FREQUENCIES.length - 1) filter.type = 'highshelf';
      else filter.type = 'peaking';
      filter.frequency.value = freq;
      filter.Q.value = 1.4;
      filter.gain.value = this.eqGains[idx] || 0;
      return filter;
    });

    // Loudness Normalization via DynamicsCompressorNode
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = this.normalizationEnabled ? -18 : 0;
    this.compressor.knee.value = 24;
    this.compressor.ratio.value = this.normalizationEnabled ? 4 : 1;
    this.compressor.attack.value = 0.005;
    this.compressor.release.value = 0.25;

    this.normalizerMakeup = this.ctx.createGain();
    this.normalizerMakeup.gain.value = this.normalizationEnabled ? 1.18 : 1.0;

    this.sleepFadeGain = this.ctx.createGain();
    this.sleepFadeGain.gain.value = 1;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.volume;

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 64;
    this.frequencyBuffer = new Uint8Array(this.analyser.frequencyBinCount);

    // Connect graph: Deck A/B -> Gain A/B -> EQ0..9 -> Compressor -> Makeup -> SleepFade -> Master -> Analyser -> Destination
    this.sourceA.connect(this.gainA);
    this.sourceB.connect(this.gainB);

    const eqInput = this.eqFilters[0];
    this.gainA.connect(eqInput);
    this.gainB.connect(eqInput);

    for (let i = 0; i < this.eqFilters.length - 1; i++) {
      this.eqFilters[i].connect(this.eqFilters[i + 1]);
    }

    this.eqFilters[this.eqFilters.length - 1].connect(this.compressor);
    this.compressor.connect(this.normalizerMakeup);
    this.normalizerMakeup.connect(this.sleepFadeGain);
    this.sleepFadeGain.connect(this.masterGain);
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
  }

  private getDeck(id: DeckId): HTMLAudioElement {
    return id === 'A' ? this.deckA : this.deckB;
  }

  private getInactiveDeckId(): DeckId {
    return this.activeDeck === 'A' ? 'B' : 'A';
  }

  private bindDeckEvents(id: DeckId, deck: HTMLAudioElement) {
    deck.addEventListener('timeupdate', () => {
      if (id !== this.activeDeck) return;
      const current = deck.currentTime || 0;
      const duration = Number.isFinite(deck.duration) ? deck.duration : 0;
      this.callbacks?.onTimeUpdate(current, duration);
      if (duration > 0) {
        updateMediaSessionPosition(current, duration);
      }

      // Trigger true crossfade / gapless handoff
      if (
        duration > 0 &&
        this.crossfadeSeconds > 0 &&
        !this.crossfadeTriggered &&
        duration - current <= this.crossfadeSeconds &&
        duration > this.crossfadeSeconds + 2
      ) {
        this.crossfadeTriggered = true;
        this.callbacks?.onCrossfadeStart();
      }
    });

    deck.addEventListener('ended', () => {
      if (id !== this.activeDeck) return;
      updateMediaSessionPlaybackState(false);
      if (!this.crossfadeTriggered) {
        this.callbacks?.onTrackEnded();
      }
    });

    deck.addEventListener('canplay', () => {
      if (id !== this.activeDeck) return;
      this.callbacks?.onCanPlay?.();
    });

    deck.addEventListener('error', () => {
      if (id !== this.activeDeck) return;
      const mediaErr = deck.error;
      const codeMap: Record<number, string> = {
        1: 'MEDIA_ERR_ABORTED',
        2: 'MEDIA_ERR_NETWORK',
        3: 'MEDIA_ERR_DECODE',
        4: 'MEDIA_ERR_SRC_NOT_SUPPORTED (check CORS headers, URL encoding, or codec)',
      };
      const codeName = mediaErr ? codeMap[mediaErr.code] || `CODE_${mediaErr.code}` : 'UNKNOWN';
      console.error('[Dulo AudioEngine] HTML5 Audio error event:', {
        code: mediaErr?.code,
        codeName,
        message: mediaErr?.message || 'Unknown MediaError',
        src: deck.currentSrc || deck.src,
        crossOrigin: deck.crossOrigin,
        networkState: deck.networkState,
        readyState: deck.readyState,
      });
      this.callbacks?.onPlaybackError?.(
        new Error(
          `Audio load error (${codeName}${mediaErr?.message ? `: ${mediaErr.message}` : ''})`
        )
      );
    });

    deck.addEventListener('play', () => {
      if (id === this.activeDeck) {
        updateMediaSessionPlaybackState(true);
        this.callbacks?.onPlayStateChange(true);
      }
    });

    deck.addEventListener('pause', () => {
      if (id === this.activeDeck) {
        updateMediaSessionPlaybackState(false);
        this.callbacks?.onPlayStateChange(false);
      }
    });
  }

  public async playStream(
    url: string,
    track: Track,
    options?: { useCrossfade?: boolean; startAt?: number }
  ) {
    if (!url || !url.trim()) {
      const err = new Error(`Missing audioUrl for "${track.title}"`);
      console.error('[Dulo AudioEngine] Empty stream URL:', { track });
      throw err;
    }

    this.ensureGraph();
    this.crossfadeTriggered = false;

    if (this.sleepFadeGain && this.ctx) {
      this.sleepFadeGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.sleepFadeGain.gain.setValueAtTime(1, this.ctx.currentTime);
    }

    const useCrossfade = options?.useCrossfade && this.crossfadeSeconds > 0;
    const prevId = this.activeDeck;
    const nextId = useCrossfade ? this.getInactiveDeckId() : prevId;

    const prevDeck = this.getDeck(prevId);
    const nextDeck = this.getDeck(nextId);

    if (!useCrossfade && prevDeck.src) {
      prevDeck.pause();
    }

    this.activeDeck = nextId;
    nextDeck.src = url;
    if (options?.startAt && options.startAt > 0) {
      nextDeck.currentTime = options.startAt;
    }

    if (this.ctx && this.gainA && this.gainB) {
      const now = this.ctx.currentTime;
      const fadeDur = useCrossfade ? this.crossfadeSeconds : 0.04;
      const nextGain = nextId === 'A' ? this.gainA : this.gainB;
      const prevGain = prevId === 'A' ? this.gainA : this.gainB;

      if (useCrossfade && prevId !== nextId) {
        nextGain.gain.cancelScheduledValues(now);
        prevGain.gain.cancelScheduledValues(now);
        nextGain.gain.setValueAtTime(0.001, now);
        nextGain.gain.linearRampToValueAtTime(1, now + fadeDur);
        prevGain.gain.setValueAtTime(prevGain.gain.value, now);
        prevGain.gain.linearRampToValueAtTime(0, now + fadeDur);

        setTimeout(() => {
          if (this.activeDeck !== prevId) {
            prevDeck.pause();
          }
        }, fadeDur * 1000 + 80);
      } else {
        nextGain.gain.setValueAtTime(1, now);
        prevGain.gain.setValueAtTime(nextId === prevId ? 1 : 0, now);
      }
    }

    try {
      await nextDeck.play();
    } catch (err) {
      console.error('[Dulo AudioEngine] audioElement.play() failed:', {
        url,
        trackId: track.id,
        videoId: track.videoId,
        error: err,
        mediaError: nextDeck.error,
      });
      throw err;
    }

    this.updateMediaSession(track);
  }

  public pause() {
    this.getDeck(this.activeDeck).pause();
  }

  public async resume() {
    this.ensureGraph();
    await this.getDeck(this.activeDeck).play();
  }

  public seek(seconds: number) {
    const deck = this.getDeck(this.activeDeck);
    if (!Number.isFinite(seconds)) return;
    const clamped = Math.max(0, Math.min(seconds, deck.duration || seconds));
    deck.currentTime = clamped;
    if (Number.isFinite(deck.duration) && deck.duration > 0) {
      updateMediaSessionPosition(clamped, deck.duration, true);
    }
  }

  public getCurrentTime(): number {
    return this.getDeck(this.activeDeck).currentTime || 0;
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.02);
    } else {
      this.deckA.volume = this.volume;
      this.deckB.volume = this.volume;
    }
  }

  public setCrossfadeSeconds(seconds: number) {
    this.crossfadeSeconds = Math.max(0, Math.min(12, seconds));
  }

  public setEqGains(gains: number[]) {
    this.eqGains = [...gains];
    if (this.eqFilters.length === 10 && this.ctx) {
      gains.forEach((g, idx) => {
        this.eqFilters[idx].gain.setTargetAtTime(g, this.ctx!.currentTime, 0.03);
      });
    }
  }

  public applyEqPreset(presetId: EQPresetId): number[] {
    const found = EQ_PRESETS.find((p) => p.id === presetId);
    const gains = found ? [...found.gains] : [...this.eqGains];
    this.setEqGains(gains);
    return gains;
  }

  public setLoudnessNormalization(enabled: boolean) {
    this.normalizationEnabled = enabled;
    if (this.compressor && this.normalizerMakeup && this.ctx) {
      const now = this.ctx.currentTime;
      this.compressor.threshold.setTargetAtTime(enabled ? -18 : 0, now, 0.05);
      this.compressor.ratio.setTargetAtTime(enabled ? 4 : 1, now, 0.05);
      this.normalizerMakeup.gain.setTargetAtTime(enabled ? 1.18 : 1.0, now, 0.05);
    }
  }

  public startSleepFadeOut(fadeSeconds = 20) {
    if (this.sleepFadeGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.sleepFadeGain.gain.cancelScheduledValues(now);
      this.sleepFadeGain.gain.setValueAtTime(this.sleepFadeGain.gain.value, now);
      this.sleepFadeGain.gain.linearRampToValueAtTime(0.001, now + fadeSeconds);
    }
  }

  public cancelSleepFade() {
    if (this.sleepFadeGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.sleepFadeGain.gain.cancelScheduledValues(now);
      this.sleepFadeGain.gain.setTargetAtTime(1, now, 0.1);
    }
  }

  public getSpectrumLevels(barCount = 24): number[] {
    if (!this.analyser) return new Array(barCount).fill(0.08);
    this.analyser.getByteFrequencyData(this.frequencyBuffer);
    const out: number[] = [];
    const step = Math.max(1, Math.floor(this.frequencyBuffer.length / barCount));
    for (let i = 0; i < barCount; i++) {
      const val = this.frequencyBuffer[Math.min(i * step, this.frequencyBuffer.length - 1)] / 255;
      out.push(Math.max(0.08, val));
    }
    return out;
  }

  public updateMediaSession(track: Track) {
    updateMediaSessionMetadata(track, {
      onPlay: () => {
        void this.resume();
      },
      onPause: () => {
        this.pause();
      },
      onPreviousTrack: () => {
        this.callbacks?.onPrevRequest?.();
      },
      onNextTrack: () => {
        this.callbacks?.onNextRequest?.();
      },
      onSeekTo: (seekTime) => {
        this.seek(seekTime);
        this.callbacks?.onSeekRequest?.(seekTime);
      },
    });
    updateMediaSessionPlaybackState(true);
    if (track.duration > 0) {
      updateMediaSessionPosition(0, track.duration, true);
    }
  }

  public dispose() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }
}

export const audioEngine = new DuloAudioEngine();
