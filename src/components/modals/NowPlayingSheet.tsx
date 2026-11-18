import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  Download,
  GripVertical,
  Heart,
  Image as ImageIcon,
  ListMusic,
  Loader2,
  Mic2,
  Music2,
  Pause,
  Play,
  Radio,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Timer,
  Trash2,
  Video,
} from 'lucide-react';
import { AnimatePresence, motion, Reorder } from 'motion/react';
import { audioEngine } from '../../services/audioEngine';
import { renderLyricCardPng } from '../../services/lyrics';
import { useDulo } from '../../store/DuloContext';
import { LyricLine } from '../../types/music';
import { formatDuration } from '../../utils/format';
import { TrackArtwork } from '../TrackArtwork';

export const NowPlayingSheet: React.FC = () => {
  const {
    nowPlayingOpen,
    setNowPlayingOpen,
    currentTrack,
    queue,
    queueIndex,
    isPlaying,
    isLoadingTrack,
    currentTime,
    duration,
    shuffle,
    repeat,
    videoMode,
    setVideoMode,
    playbackBackend,
    activeStreamLabel,
    playTrack,
    togglePlay,
    playNext,
    playPrevious,
    seekTo,
    toggleShuffle,
    cycleRepeat,
    removeFromQueue,
    replaceQueueOrder,
    lyrics,
    lyricsLoading,
    lyricsSource,
    sponsorSegments,
    settings,
    updateSettings,
    setEqModalOpen,
    setSleepModalOpen,
    offlineIds,
    downloadingIds,
    toggleOfflineTrack,
    likedIds,
    toggleLikeTrack,
    showToast,
  } = useDulo();

  const [rightTab, setRightTab] = useState<'lyrics' | 'queue'>('lyrics');
  const [spectrum, setSpectrum] = useState<number[]>(new Array(20).fill(0.1));
  const [cardMode, setCardMode] = useState(false);
  const [selectedLyricIndices, setSelectedLyricIndices] = useState<number[]>([]);
  const [exportingCard, setExportingCard] = useState(false);
  const [slotRect, setSlotRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const activeLineRef = useRef<HTMLButtonElement | null>(null);
  const ytSlotRef = useRef<HTMLDivElement | null>(null);

  const isAudioBackend = playbackBackend === 'audio' || currentTrack?.source === 'local';
  const showYouTubeInSheet = Boolean(nowPlayingOpen && currentTrack && !isAudioBackend);

  // Keep persistent YT.Player container positioned cleanly inside the Now Playing slot
  useEffect(() => {
    if (!showYouTubeInSheet) {
      setSlotRect(null);
      return;
    }

    let rafId = 0;
    const syncRect = () => {
      const el = ytSlotRef.current;
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.width >= 180 && r.height >= 100) {
          setSlotRect({
            top: r.top,
            left: r.left,
            width: r.width,
            height: r.height,
          });
        }
      }
    };

    // Track slide-in animation smoothly for ~420ms, then observe resize/scroll
    const start = performance.now();
    const animateTrack = () => {
      syncRect();
      if (performance.now() - start < 460) {
        rafId = requestAnimationFrame(animateTrack);
      }
    };
    rafId = requestAnimationFrame(animateTrack);

    const observer = new ResizeObserver(syncRect);
    if (ytSlotRef.current) observer.observe(ytSlotRef.current);
    window.addEventListener('resize', syncRect);
    window.addEventListener('scroll', syncRect, true);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener('resize', syncRect);
      window.removeEventListener('scroll', syncRect, true);
    };
  }, [showYouTubeInSheet, videoMode, currentTrack?.id]);

  // Subtle bar motion while playing
  useEffect(() => {
    if (!nowPlayingOpen || !isPlaying || videoMode) return;
    let raf = 0;
    const loop = () => {
      if (isAudioBackend) {
        setSpectrum(audioEngine.getSpectrumLevels(20));
      } else {
        const t = performance.now() / 220;
        setSpectrum(
          Array.from({ length: 20 }, (_, idx) =>
            Math.max(0.14, 0.25 + 0.55 * Math.abs(Math.sin(t + idx * 0.45)))
          )
        );
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [nowPlayingOpen, isPlaying, videoMode, isAudioBackend]);

  const activeLyricIndex = useMemo(() => {
    let found = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (currentTime >= lyrics[i].time) found = i;
      else break;
    }
    return found;
  }, [lyrics, currentTime]);

  useEffect(() => {
    if (rightTab === 'lyrics' && !cardMode && activeLineRef.current) {
      activeLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeLyricIndex, rightTab, cardMode]);

  const handleToggleVideoMode = () => {
    if (!currentTrack) return;
    if (currentTrack.source === 'local') {
      showToast('Video mode is unavailable for local audio files');
      return;
    }
    setVideoMode(!videoMode);
  };

  const toggleLyricSelection = (idx: number) => {
    setSelectedLyricIndices((prev) => {
      if (prev.includes(idx)) return prev.filter((i) => i !== idx);
      if (prev.length >= 4) {
        showToast('Select up to 4 lines for a Lyric Card');
        return prev;
      }
      return [...prev, idx].sort((a, b) => a - b);
    });
  };

  const handleExportLyricCard = async () => {
    if (!currentTrack || selectedLyricIndices.length === 0) return;
    setExportingCard(true);
    try {
      const selected: LyricLine[] = selectedLyricIndices.map((i) => lyrics[i]).filter(Boolean);
      const dataUrl = await renderLyricCardPng(currentTrack, selected);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${currentTrack.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-lyric-card.png`;
      a.click();
      showToast('Downloaded Lyric Card PNG');
      setCardMode(false);
      setSelectedLyricIndices([]);
    } catch {
      showToast('Unable to render Lyric Card');
    } finally {
      setExportingCard(false);
    }
  };

  const progressPct =
    currentTrack && duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const isOffline = currentTrack ? offlineIds.has(currentTrack.id) : false;
  const isDownloading = currentTrack ? downloadingIds.has(currentTrack.id) : false;
  const isLiked = currentTrack ? likedIds.has(currentTrack.id) : false;

  return (
    <>
      {/* Persistent non-remounting YouTube IFrame Player host (>=200x200px visible compliance) */}
      <div
        id="dulo-yt-host"
        className={
          showYouTubeInSheet && slotRect
            ? 'fixed z-[45] rounded-xl overflow-hidden border border-[#27272A] bg-[#09090B]'
            : 'fixed bottom-20 right-4 w-[200px] h-[200px] z-[1] opacity-[0.01] pointer-events-none rounded-xl overflow-hidden bg-[#09090B]'
        }
        style={
          showYouTubeInSheet && slotRect
            ? {
                top: `${slotRect.top}px`,
                left: `${slotRect.left}px`,
                width: `${slotRect.width}px`,
                height: `${slotRect.height}px`,
              }
            : undefined
        }
      >
        <div id="dulo-yt-player-mount" className="w-full h-full" />
      </div>

      <AnimatePresence>
        {nowPlayingOpen && currentTrack && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-40 bg-[#09090B] flex flex-col overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Now Playing"
          >
            {/* Sheet Top Bar */}
            <header className="h-16 px-4 sm:px-8 border-b border-[#27272A] flex items-center justify-between shrink-0">
              <button
                onClick={() => setNowPlayingOpen(false)}
                aria-label="Close Now Playing"
                className="inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#1C1C21] min-h-[40px]"
              >
                <ChevronDown className="w-4 h-4" />
                <span>Dismiss</span>
              </button>

              {/* Audio / Video Mode Toggle */}
              <div className="inline-flex items-center rounded-lg border border-[#27272A] bg-[#121215] p-1">
                <button
                  onClick={() => {
                    if (videoMode) handleToggleVideoMode();
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    !videoMode ? 'bg-[#FAFAFA] text-[#09090B]' : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
                  }`}
                >
                  <Music2 className="w-3.5 h-3.5" />
                  <span>Audio</span>
                </button>
                <button
                  onClick={() => {
                    if (!videoMode) handleToggleVideoMode();
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    videoMode ? 'bg-[#FAFAFA] text-[#09090B]' : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Video</span>
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => void toggleLikeTrack(currentTrack)}
                  aria-label={isLiked ? 'Unlike track' : 'Like track'}
                  className={`p-2 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center ${
                    isLiked
                      ? 'text-[#FAFAFA]'
                      : 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#1C1C21]'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#FAFAFA]' : ''}`} />
                </button>
                <button
                  onClick={() => void toggleOfflineTrack(currentTrack)}
                  disabled={isDownloading}
                  aria-label="Cache Offline"
                  className={`p-2 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center ${
                    isOffline
                      ? 'text-[#FAFAFA] bg-[#1C1C21]'
                      : 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#1C1C21]'
                  }`}
                >
                  {isDownloading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isOffline ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </button>
              </div>
            </header>

            {/* Main 2-Column Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 lg:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                {/* Left Column: Matte YouTube Player / Artwork + Waveform + Transport */}
                <div className="lg:col-span-5 space-y-6">
                  {isAudioBackend ? (
                    <div
                      className={`relative w-full max-w-sm mx-auto lg:max-w-none rounded-2xl transition-all ${
                        isLoadingTrack ? 'ring-2 ring-[#FAFAFA]/45 animate-pulse' : ''
                      }`}
                    >
                      <TrackArtwork
                        src={currentTrack.artwork}
                        alt={currentTrack.title}
                        className="w-full aspect-square rounded-2xl border border-[#27272A]"
                        size="xl"
                      />
                      {isLoadingTrack && (
                        <div className="absolute inset-0 rounded-2xl bg-[#09090B]/55 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full border border-[#27272A] bg-[#121215] flex items-center justify-center">
                            <Loader2 className="w-5 h-5 text-[#FAFAFA] animate-spin" />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : videoMode ? (
                    <div
                      ref={ytSlotRef}
                      className="w-full aspect-video rounded-2xl border border-[#27272A] bg-[#09090B]"
                    />
                  ) : (
                    <div className="rounded-2xl border border-[#27272A] bg-[#121215] p-4 flex flex-col sm:flex-row items-center gap-4">
                      {/* 200x200px YouTube IFrame Player slot blended into #09090B */}
                      <div
                        ref={ytSlotRef}
                        className={`w-[200px] h-[200px] shrink-0 rounded-xl border border-[#27272A] bg-[#09090B] transition-all ${
                          isLoadingTrack ? 'ring-2 ring-[#FAFAFA]/45 animate-pulse' : ''
                        }`}
                      />
                      <div className="flex-1 min-w-0 flex flex-col items-center sm:items-start gap-3">
                        <TrackArtwork
                          src={currentTrack.artwork}
                          alt={currentTrack.title}
                          className="w-24 h-24 rounded-xl border border-[#27272A]"
                          size="md"
                        />
                        <div className="text-center sm:text-left min-w-0 w-full">
                          <p className="text-xs font-medium text-[#FAFAFA] truncate">
                            {isLoadingTrack ? 'Buffering stream…' : 'Active YouTube Stream'}
                          </p>
                          <p className="text-[11px] text-[#71717A] mt-0.5 truncate">
                            Switch to Video above for widescreen
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="font-display text-xl sm:text-2xl font-semibold text-[#FAFAFA] truncate">
                          {currentTrack.title}
                        </h2>
                        <p className="text-sm text-[#A1A1AA] truncate mt-0.5">
                          {currentTrack.artist} · {currentTrack.album}
                        </p>
                      </div>
                    </div>
                    <p className="font-mono-tabular text-[11px] text-[#71717A]">
                      {activeStreamLabel}
                      {sponsorSegments.length > 0 && settings.sponsorBlockEnabled
                        ? ` · SponsorBlock (${sponsorSegments.length})`
                        : ''}
                    </p>
                  </div>

                  {/* Subtle Live Spectrum Bars + Scrubbable Progress */}
                  <div className="space-y-2">
                    {!videoMode && (
                      <div className="flex items-end gap-1 h-7" aria-hidden="true">
                        {spectrum.map((val, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-sm bg-[#3F3F46] transition-[height] duration-75"
                            style={{
                              height: `${Math.max(14, Math.round(val * 100))}%`,
                              backgroundColor:
                                (i / spectrum.length) * 100 <= progressPct ? '#FAFAFA' : '#27272A',
                            }}
                          />
                        ))}
                      </div>
                    )}

                    <div className="relative h-5 flex items-center">
                      <div className="w-full h-1.5 rounded-full bg-[#3F3F46] overflow-hidden">
                        <div
                          className="h-full bg-[#FAFAFA]"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={Math.max(duration, 1)}
                        step={0.1}
                        value={currentTime}
                        onChange={(e) => seekTo(Number(e.target.value))}
                        aria-label="Seek track"
                        className="absolute inset-0 w-full opacity-0 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between font-mono-tabular text-xs text-[#71717A]">
                      <span>{formatDuration(currentTime)}</span>
                      <span>{formatDuration(duration)}</span>
                    </div>
                  </div>

                  {/* Transport Controls */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={toggleShuffle}
                      aria-label="Shuffle"
                      className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors ${
                        shuffle ? 'text-[#FAFAFA] bg-[#1C1C21]' : 'text-[#71717A] hover:text-[#FAFAFA]'
                      }`}
                    >
                      <Shuffle className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => void playPrevious()}
                      aria-label="Previous track"
                      className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl text-[#FAFAFA] hover:bg-[#1C1C21]"
                    >
                      <SkipBack className="w-5 h-5 fill-current" />
                    </button>

                    <button
                      onClick={() => void togglePlay()}
                      aria-label={isPlaying ? 'Pause' : 'Play'}
                      className="w-14 h-14 rounded-full bg-[#FAFAFA] text-[#09090B] flex items-center justify-center hover:bg-[#E4E4E7] transition-transform active:scale-95"
                    >
                      {isLoadingTrack ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : isPlaying ? (
                        <Pause className="w-5 h-5 fill-current" />
                      ) : (
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      )}
                    </button>

                    <button
                      onClick={() => void playNext(false)}
                      aria-label="Next track"
                      className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl text-[#FAFAFA] hover:bg-[#1C1C21]"
                    >
                      <SkipForward className="w-5 h-5 fill-current" />
                    </button>

                    <button
                      onClick={cycleRepeat}
                      aria-label="Repeat"
                      className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors ${
                        repeat !== 'off'
                          ? 'text-[#FAFAFA] bg-[#1C1C21]'
                          : 'text-[#71717A] hover:text-[#FAFAFA]'
                      }`}
                    >
                      {repeat === 'one' ? (
                        <Repeat1 className="w-4 h-4" />
                      ) : (
                        <Repeat className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Quick Utility Row */}
                  <div className="grid grid-cols-2 gap-2.5 pt-2">
                    <button
                      onClick={() => setEqModalOpen(true)}
                      className="flex items-center justify-center gap-2 rounded-xl border border-[#27272A] bg-[#121215] py-2.5 text-xs font-medium text-[#FAFAFA] hover:bg-[#1C1C21] min-h-[42px]"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>EQ & Crossfade ({settings.crossfadeSeconds}s)</span>
                    </button>
                    <button
                      onClick={() => setSleepModalOpen(true)}
                      className="flex items-center justify-center gap-2 rounded-xl border border-[#27272A] bg-[#121215] py-2.5 text-xs font-medium text-[#FAFAFA] hover:bg-[#1C1C21] min-h-[42px]"
                    >
                      <Timer className="w-3.5 h-3.5" />
                      <span>Sleep Timer</span>
                    </button>
                  </div>
                </div>

                {/* Right Column: Live Synced Lyrics & Up Next Queue */}
                <div className="lg:col-span-7 rounded-2xl border border-[#27272A] bg-[#121215] flex flex-col h-[520px] lg:h-[620px] overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#27272A] flex items-center justify-between gap-3 shrink-0">
                    <div className="inline-flex items-center rounded-lg bg-[#09090B] p-1 border border-[#27272A]">
                      <button
                        onClick={() => setRightTab('lyrics')}
                        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                          rightTab === 'lyrics'
                            ? 'bg-[#1C1C21] text-[#FAFAFA]'
                            : 'text-[#71717A] hover:text-[#FAFAFA]'
                        }`}
                      >
                        <Mic2 className="w-3.5 h-3.5" />
                        <span>Synced Lyrics</span>
                      </button>
                      <button
                        onClick={() => setRightTab('queue')}
                        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                          rightTab === 'queue'
                            ? 'bg-[#1C1C21] text-[#FAFAFA]'
                            : 'text-[#71717A] hover:text-[#FAFAFA]'
                        }`}
                      >
                        <ListMusic className="w-3.5 h-3.5" />
                        <span>Up Next ({queue.length})</span>
                      </button>
                    </div>

                    {rightTab === 'lyrics' && lyrics.length > 0 && (
                      <div className="flex items-center gap-2">
                        {cardMode ? (
                          <>
                            <button
                              onClick={() => {
                                setCardMode(false);
                                setSelectedLyricIndices([]);
                              }}
                              className="text-xs text-[#A1A1AA] hover:text-[#FAFAFA] px-2 py-1"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => void handleExportLyricCard()}
                              disabled={selectedLyricIndices.length === 0 || exportingCard}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#FAFAFA] text-[#09090B] px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span>
                                {exportingCard
                                  ? 'Rendering…'
                                  : `Export Card (${selectedLyricIndices.length}/4)`}
                              </span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setCardMode(true)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#27272A] bg-[#1C1C21] px-3 py-1.5 text-xs font-medium text-[#FAFAFA] hover:bg-[#27272A]"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>Share Lyric Card</span>
                          </button>
                        )}
                      </div>
                    )}

                    {rightTab === 'queue' && (
                      <button
                        onClick={() =>
                          updateSettings({ autoRadioEnabled: !settings.autoRadioEnabled })
                        }
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                          settings.autoRadioEnabled
                            ? 'border-[#FAFAFA] bg-[#1C1C21] text-[#FAFAFA]'
                            : 'border-[#27272A] bg-[#09090B] text-[#71717A]'
                        }`}
                      >
                        <Radio className="w-3.5 h-3.5" />
                        <span>Auto-Radio {settings.autoRadioEnabled ? 'On' : 'Off'}</span>
                      </button>
                    )}
                  </div>

                  {/* Synced Lyrics View */}
                  {rightTab === 'lyrics' && (
                    <div className="flex-1 overflow-y-auto p-6 space-y-2">
                      {lyricsLoading ? (
                        <div className="h-full flex items-center justify-center text-xs text-[#A1A1AA] gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Fetching synced lyrics via LRCLIB…</span>
                        </div>
                      ) : lyrics.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center px-6">
                          <Mic2 className="w-6 h-6 text-[#71717A] mb-2" />
                          <p className="text-sm font-medium text-[#FAFAFA]">
                            No synced lyrics found
                          </p>
                          <p className="text-xs text-[#71717A] mt-1">
                            LRCLIB returned no timestamped lines for this track.
                          </p>
                        </div>
                      ) : (
                        <>
                          {cardMode && (
                            <p className="text-xs text-[#A1A1AA] pb-3 border-b border-[#27272A] mb-3">
                              Tap 1 to 4 lyric lines below to compose a downloadable PNG Lyric Card.
                            </p>
                          )}
                          {lyrics.map((line, idx) => {
                            const isActive = idx === activeLyricIndex;
                            const isSelected = selectedLyricIndices.includes(idx);
                            return (
                              <button
                                key={`${line.time}-${idx}`}
                                ref={isActive ? activeLineRef : undefined}
                                onClick={() => {
                                  if (cardMode) {
                                    toggleLyricSelection(idx);
                                  } else {
                                    seekTo(line.time);
                                  }
                                }}
                                className={`w-full text-left rounded-xl px-3.5 py-2.5 transition-colors flex items-baseline gap-3 ${
                                  cardMode && isSelected
                                    ? 'bg-[#FAFAFA] text-[#09090B]'
                                    : isActive
                                      ? 'bg-[#1C1C21] text-[#FFFFFF]'
                                      : 'text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#1C1C21]/50'
                                }`}
                              >
                                <span className="font-mono-tabular text-[11px] opacity-60 shrink-0 w-10">
                                  {formatDuration(line.time)}
                                </span>
                                <span className="font-display text-base sm:text-lg font-medium leading-snug">
                                  {line.text}
                                </span>
                              </button>
                            );
                          })}
                          <p className="pt-6 text-[11px] text-[#71717A] font-mono-tabular">
                            Lyrics source: {lyricsSource === 'lrclib' ? 'LRCLIB API' : 'Embedded LRC'} · Tap any line to seek
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  {/* Interactive Drag-to-Reorder Up Next Queue */}
                  {rightTab === 'queue' && (
                    <div className="flex-1 overflow-y-auto p-3">
                      <Reorder.Group
                        axis="y"
                        values={queue}
                        onReorder={replaceQueueOrder}
                        className="space-y-1.5"
                      >
                        {queue.map((track, idx) => {
                          const isCur = idx === queueIndex;
                          return (
                            <Reorder.Item
                              key={track.id}
                              value={track}
                              className={`flex items-center gap-3 rounded-xl px-3 py-2 border transition-colors cursor-grab active:cursor-grabbing ${
                                isCur
                                  ? 'border-[#3F3F46] bg-[#1C1C21]'
                                  : 'border-transparent bg-[#09090B]/60 hover:bg-[#1C1C21]/70'
                              }`}
                            >
                              <GripVertical className="w-4 h-4 text-[#71717A] shrink-0" />
                              <button
                                onClick={() => void playTrack(track, queue)}
                                className="flex items-center gap-3 flex-1 min-w-0 text-left"
                              >
                                <div
                                  className={`relative rounded-lg overflow-hidden shrink-0 ${
                                    isCur && isLoadingTrack
                                      ? 'ring-2 ring-[#FAFAFA]/50 animate-pulse'
                                      : ''
                                  }`}
                                >
                                  <TrackArtwork
                                    src={track.artwork}
                                    alt={track.title}
                                    className="w-10 h-10 rounded-lg"
                                    size="xs"
                                  />
                                  {isCur && isLoadingTrack && (
                                    <span className="absolute inset-0 bg-[#09090B]/65 flex items-center justify-center">
                                      <Loader2 className="w-3.5 h-3.5 text-[#FAFAFA] animate-spin" />
                                    </span>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-medium text-[#FAFAFA] truncate">
                                    {track.title}
                                  </p>
                                  <p className="text-[11px] text-[#A1A1AA] truncate">
                                    {track.artist}
                                  </p>
                                </div>
                              </button>
                              <span className="font-mono-tabular text-[11px] text-[#71717A] shrink-0">
                                {formatDuration(track.duration)}
                              </span>
                              {queue.length > 1 && (
                                <button
                                  onClick={() => removeFromQueue(idx)}
                                  aria-label={`Remove ${track.title} from queue`}
                                  className="p-1.5 rounded-lg text-[#71717A] hover:text-[#FAFAFA]"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </Reorder.Item>
                          );
                        })}
                      </Reorder.Group>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
