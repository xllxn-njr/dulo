import { Track } from '../types/music';
import {
  updateMediaSessionMetadata,
  updateMediaSessionPlaybackState,
  updateMediaSessionPosition,
} from './mediaSession';

interface YTPlayerInstance {
  loadVideoById: (videoId: string, startSeconds?: number) => void;
  cueVideoById: (videoId: string, startSeconds?: number) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  destroy: () => void;
}

interface YTNamespace {
  Player: new (
    elementId: string | HTMLElement,
    options: {
      height?: string | number;
      width?: string | number;
      videoId?: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (event: { target: YTPlayerInstance }) => void;
        onStateChange?: (event: { data: number; target: YTPlayerInstance }) => void;
        onError?: (event: { data: number; target: YTPlayerInstance }) => void;
      };
    }
  ) => YTPlayerInstance;
  PlayerState: {
    UNSTARTED: -1;
    ENDED: 0;
    PLAYING: 1;
    PAUSED: 2;
    BUFFERING: 3;
    CUED: 5;
  };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export interface YouTubePlayerCallbacks {
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onTrackEnded: () => void;
  onPlayStateChange: (isPlaying: boolean) => void;
  onCanPlay: () => void;
  onPlaybackError: (err: Error) => void;
  onSeekRequest?: (time: number) => void;
  onPrevRequest?: () => void;
  onNextRequest?: () => void;
}

const YT_ERROR_MESSAGES: Record<number, string> = {
  2: 'Invalid YouTube video ID.',
  5: 'YouTube HTML5 player error.',
  100: 'Video not found or private.',
  101: 'Track owner disabled embedded playback.',
  150: 'Track owner disabled embedded playback.',
};

class DuloYouTubePlayerService {
  private apiPromise: Promise<YTNamespace> | null = null;
  private player: YTPlayerInstance | null = null;
  private readyPromise: Promise<YTPlayerInstance> | null = null;
  private mountId = 'dulo-yt-player-mount';
  private callbacks: YouTubePlayerCallbacks | null = null;
  private pollTimer: number | null = null;
  private fadeTimer: number | null = null;
  private volume = 0.85; // 0..1
  private currentVideoId: string | null = null;
  private endedDispatchedForVideo: string | null = null;

  public setCallbacks(cb: YouTubePlayerCallbacks) {
    this.callbacks = cb;
  }

  private loadIframeApi(): Promise<YTNamespace> {
    if (window.YT && window.YT.Player) {
      return Promise.resolve(window.YT);
    }
    if (this.apiPromise) return this.apiPromise;

    this.apiPromise = new Promise<YTNamespace>((resolve, reject) => {
      const prevReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prevReady?.();
        if (window.YT && window.YT.Player) {
          resolve(window.YT);
        } else {
          reject(new Error('YouTube IFrame API loaded without YT.Player'));
        }
      };

      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[src="https://www.youtube.com/iframe_api"]'
      );
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.async = true;
        tag.onerror = () => {
          this.apiPromise = null;
          reject(new Error('Failed to load https://www.youtube.com/iframe_api'));
        };
        document.head.appendChild(tag);
      }
    });

    return this.apiPromise;
  }

  public async ensurePlayer(mountElementId = 'dulo-yt-player-mount'): Promise<YTPlayerInstance> {
    this.mountId = mountElementId;
    if (this.readyPromise) return this.readyPromise;

    this.readyPromise = (async () => {
      const YT = await this.loadIframeApi();
      const targetEl = document.getElementById(this.mountId);
      if (!targetEl) {
        this.readyPromise = null;
        throw new Error(`YouTube player mount #${this.mountId} is not in the DOM`);
      }

      return new Promise<YTPlayerInstance>((resolve) => {
        const instance = new YT.Player(this.mountId, {
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 1,
            controls: 1,
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event) => {
              this.player = event.target;
              event.target.setVolume(Math.round(this.volume * 100));
              resolve(event.target);
            },
            onStateChange: (event) => {
              this.handleStateChange(event.data);
            },
            onError: (event) => {
              const code = Number(event.data);
              const detail =
                YT_ERROR_MESSAGES[code] || `YouTube player error (code ${code})`;
              console.error('[Dulo YouTubePlayer] onError:', {
                code,
                detail,
                videoId: this.currentVideoId,
              });
              this.stopPolling();
              this.callbacks?.onPlaybackError(new Error(detail));
            },
          },
        });
        this.player = instance;
      });
    })();

    try {
      return await this.readyPromise;
    } catch (err) {
      this.readyPromise = null;
      throw err;
    }
  }

  private handleStateChange(state: number) {
    // YT.PlayerState: -1 UNSTARTED, 0 ENDED, 1 PLAYING, 2 PAUSED, 3 BUFFERING, 5 CUED
    if (state === 1) {
      // PLAYING
      this.endedDispatchedForVideo = null;
      updateMediaSessionPlaybackState(true);
      this.callbacks?.onCanPlay();
      this.callbacks?.onPlayStateChange(true);
      this.startPolling();
      this.emitProgressOnce(true);
    } else if (state === 2) {
      // PAUSED
      updateMediaSessionPlaybackState(false);
      this.callbacks?.onPlayStateChange(false);
      this.stopPolling();
      this.emitProgressOnce(true);
    } else if (state === 5) {
      // VIDEO_CUED
      updateMediaSessionPlaybackState(false);
      this.callbacks?.onCanPlay();
      this.callbacks?.onPlayStateChange(false);
    } else if (state === 0) {
      // ENDED
      updateMediaSessionPlaybackState(false);
      this.stopPolling();
      this.callbacks?.onPlayStateChange(false);
      if (this.endedDispatchedForVideo !== this.currentVideoId) {
        this.endedDispatchedForVideo = this.currentVideoId;
        this.callbacks?.onTrackEnded();
      }
    }
  }

  private emitProgressOnce(forceMediaSync = false) {
    if (!this.player) return;
    try {
      const current = Number(this.player.getCurrentTime?.() || 0);
      const duration = Number(this.player.getDuration?.() || 0);
      this.callbacks?.onTimeUpdate(current, duration);
      if (duration > 0) {
        updateMediaSessionPosition(current, duration, forceMediaSync);
      }
    } catch {
      // Ignore transient reads during player transitions
    }
  }

  private startPolling() {
    this.stopPolling();
    this.pollTimer = window.setInterval(() => {
      this.emitProgressOnce();
    }, 250);
  }

  private stopPolling() {
    if (this.pollTimer !== null) {
      window.clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  public async loadAndPlay(track: Track, startSeconds = 0) {
    if (!track.videoId) {
      throw new Error(`Track "${track.title}" has no YouTube videoId`);
    }

    this.cancelSleepFade();
    this.currentVideoId = track.videoId;
    this.endedDispatchedForVideo = null;
    this.updateMediaSession(track);

    const player = await this.ensurePlayer(this.mountId);
    player.setVolume(Math.round(this.volume * 100));
    player.loadVideoById(track.videoId, startSeconds);
    player.playVideo();
  }

  public play() {
    this.player?.playVideo();
  }

  public pause() {
    this.player?.pauseVideo();
  }

  public stop() {
    this.stopPolling();
    updateMediaSessionPlaybackState(false);
    this.player?.stopVideo();
  }

  public seekTo(seconds: number) {
    if (!this.player || !Number.isFinite(seconds)) return;
    const clamped = Math.max(0, seconds);
    this.player.seekTo(clamped, true);
    try {
      const dur = Number(this.player.getDuration?.() || 0);
      if (dur > 0) updateMediaSessionPosition(clamped, dur, true);
    } catch {
      // Ignore transient duration read failure
    }
    this.callbacks?.onSeekRequest?.(clamped);
  }

  public getCurrentTime(): number {
    if (!this.player) return 0;
    try {
      return Number(this.player.getCurrentTime?.() || 0);
    } catch {
      return 0;
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.player) {
      try {
        this.player.setVolume(Math.round(this.volume * 100));
      } catch {
        // Ignore if player not yet ready
      }
    }
  }

  public startSleepFadeOut(fadeSeconds = 20) {
    this.cancelSleepFade();
    if (!this.player || fadeSeconds <= 0) return;

    const startVol = Math.round(this.volume * 100);
    const startTime = performance.now();
    const durationMs = fadeSeconds * 1000;

    this.fadeTimer = window.setInterval(() => {
      const elapsed = performance.now() - startTime;
      const ratio = Math.max(0, 1 - elapsed / durationMs);
      try {
        this.player?.setVolume(Math.round(startVol * ratio));
      } catch {
        // Ignore
      }
      if (ratio <= 0) {
        this.cancelSleepFade();
      }
    }, 200);
  }

  public cancelSleepFade() {
    if (this.fadeTimer !== null) {
      window.clearInterval(this.fadeTimer);
      this.fadeTimer = null;
    }
    if (this.player) {
      try {
        this.player.setVolume(Math.round(this.volume * 100));
      } catch {
        // Ignore
      }
    }
  }

  public updateMediaSession(track: Track) {
    updateMediaSessionMetadata(track, {
      onPlay: () => this.play(),
      onPause: () => this.pause(),
      onPreviousTrack: () => this.callbacks?.onPrevRequest?.(),
      onNextTrack: () => this.callbacks?.onNextRequest?.(),
      onSeekTo: (time) => this.seekTo(time),
    });
    updateMediaSessionPlaybackState(true);
    if (track.duration > 0) {
      updateMediaSessionPosition(0, track.duration, true);
    }
  }
}

export const youtubePlayer = new DuloYouTubePlayerService();
