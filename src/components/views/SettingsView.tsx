import React, { useState } from 'react';
import {
  Activity,
  Check,
  ChevronRight,
  Palette,
  Plus,
  Radio,
  Server,
  Sliders,
  Sparkles,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import { testPipedInstanceLatency } from '../../services/streamEngine';
import { useDulo } from '../../store/DuloContext';
import { ThemeVariant } from '../../types/music';
import { PWAInstallButton } from '../PWAInstallButton';

const THEME_OPTIONS: Array<{
  id: ThemeVariant;
  label: string;
  swatch: string;
  desc: string;
}> = [
  { id: 'obsidian', label: 'Obsidian', swatch: '#09090B', desc: 'Signature matte black' },
  { id: 'midnight', label: 'Midnight', swatch: '#050507', desc: 'Deep OLED contrast' },
  { id: 'graphite', label: 'Graphite', swatch: '#0E0E12', desc: 'Soft charcoal slate' },
];

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    setEqModalOpen,
    setAuthModalOpen,
    reopenOnboarding,
    user,
    likedSongs,
    playlists,
    showToast,
  } = useDulo();

  const [newInstance, setNewInstance] = useState('');
  const [latencyResults, setLatencyResults] = useState<
    Record<string, { ok: boolean; latencyMs: number } | 'testing'>
  >({});
  const [proxyStatus, setProxyStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [showBackendConfig, setShowBackendConfig] = useState(false);

  const isGoogleUser = Boolean(user && !user.isAnonymous);

  const addPipedInstance = () => {
    const clean = newInstance.trim().replace(/\/$/, '');
    if (!clean.startsWith('http')) {
      showToast('Enter a valid https:// Piped API URL');
      return;
    }
    if (!settings.pipedInstances.includes(clean)) {
      updateSettings({ pipedInstances: [clean, ...settings.pipedInstances] });
    }
    setNewInstance('');
  };

  const runHealthChecks = async () => {
    const initial: Record<string, 'testing'> = {};
    settings.pipedInstances.forEach((u) => {
      initial[u] = 'testing';
    });
    setLatencyResults(initial);

    await Promise.all(
      settings.pipedInstances.map(async (url) => {
        const res = await testPipedInstanceLatency(url);
        setLatencyResults((prev) => ({ ...prev, [url]: res }));
      })
    );
  };

  const testCustomProxy = async () => {
    setProxyStatus('testing');
    try {
      const base = settings.customProxyUrl.replace(/\/$/, '');
      const res = await fetch(`${base}/api/search?q=lofi&filter=music_songs`);
      setProxyStatus(res.ok ? 'ok' : 'fail');
    } catch {
      setProxyStatus('fail');
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#71717A]">
          Preferences
        </p>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[#FAFAFA]">
          Settings
        </h1>
      </div>

      {/* Group 1: Account Details */}
      <section className="space-y-2.5">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#71717A] px-1">
          Account
        </h2>
        <div className="rounded-2xl border border-[var(--dulo-border)] bg-[var(--dulo-surface)] divide-y divide-[var(--dulo-border)] overflow-hidden">
          <button
            onClick={() => setAuthModalOpen(true)}
            className="w-full px-4 py-3.5 flex items-center justify-between gap-4 text-left hover:bg-[var(--dulo-hover)] active:scale-[0.99] transition-all spring-transition"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              {isGoogleUser && user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Profile'}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover border border-[var(--dulo-border)] shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full border border-[var(--dulo-border)] bg-[#09090B] flex items-center justify-center shrink-0">
                  <UserIcon className="w-4 h-4 text-[#A1A1AA]" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#FAFAFA] truncate">
                  {isGoogleUser ? user?.displayName || 'Google Account' : 'Guest Session'}
                </p>
                <p className="text-xs text-[#A1A1AA] truncate mt-0.5 tabular-nums">
                  {isGoogleUser
                    ? user?.email || 'Cloud sync enabled'
                    : `Sign in with Google · ${likedSongs.length} liked · ${playlists.length} playlists`}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#71717A] shrink-0" />
          </button>

          <button
            onClick={reopenOnboarding}
            className="w-full px-4 py-3.5 flex items-center justify-between gap-4 text-left hover:bg-[var(--dulo-hover)] transition-colors"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-[#A1A1AA]" />
              <span className="text-sm text-[#FAFAFA]">Show Welcome Screen</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#71717A]" />
          </button>
        </div>
      </section>

      {/* Group 2: Appearance (Theme Switcher) */}
      <section className="space-y-2.5">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#71717A] px-1">
          Appearance
        </h2>
        <div className="rounded-2xl border border-[var(--dulo-border)] bg-[var(--dulo-surface)] p-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <Palette className="w-4 h-4 text-[#A1A1AA]" />
            <p className="text-sm font-medium text-[#FAFAFA]">Matte Surface Theme</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {THEME_OPTIONS.map((opt) => {
              const active = settings.theme === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => updateSettings({ theme: opt.id })}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left active:scale-[0.97] transition-all duration-200 spring-transition ${
                    active
                      ? 'border-[#FAFAFA] bg-[var(--dulo-hover)]'
                      : 'border-[var(--dulo-border)] bg-[#09090B]/70 hover:bg-[var(--dulo-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-5 h-5 rounded-full border border-[#3F3F46] shrink-0"
                      style={{ backgroundColor: opt.swatch }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#FAFAFA] truncate">
                        {opt.label}
                      </p>
                      <p className="text-[10px] text-[#71717A] truncate">{opt.desc}</p>
                    </div>
                  </div>
                  {active && <Check className="w-3.5 h-3.5 text-[#FAFAFA] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Group 3: Audio Engine (Crossfade & 10-Band EQ) */}
      <section className="space-y-2.5">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#71717A] px-1">
          Audio Engine
        </h2>
        <div className="rounded-2xl border border-[var(--dulo-border)] bg-[var(--dulo-surface)] divide-y divide-[var(--dulo-border)] overflow-hidden">
          <button
            onClick={() => setEqModalOpen(true)}
            className="w-full px-4 py-3.5 flex items-center justify-between gap-4 text-left hover:bg-[var(--dulo-hover)] transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Sliders className="w-4 h-4 text-[#A1A1AA] shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#FAFAFA]">10-Band Equalizer</p>
                <p className="text-xs text-[#A1A1AA] capitalize mt-0.5">
                  Preset: {settings.eqPreset.replace('_', ' ')}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#71717A] shrink-0" />
          </button>

          <div className="px-4 py-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-sm font-medium text-[#FAFAFA]">Gapless Crossfade</span>
              <span className="font-mono-tabular tabular-nums text-[#A1A1AA]">
                {settings.crossfadeSeconds === 0
                  ? 'Off (0s)'
                  : `${settings.crossfadeSeconds}s`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={12}
              step={1}
              value={settings.crossfadeSeconds}
              onChange={(e) =>
                updateSettings({ crossfadeSeconds: Number(e.target.value) })
              }
              aria-label="Gapless Crossfade seconds"
              className="dulo-range w-full"
            />
          </div>

          {[
            {
              key: 'loudnessNormalization' as const,
              title: 'Loudness Normalization',
              desc: 'Balance dynamic range across tracks automatically.',
            },
            {
              key: 'sponsorBlockEnabled' as const,
              title: 'SponsorBlock Auto-Skip',
              desc: 'Skip non-music intros, outros, and off-topic segments.',
            },
            {
              key: 'autoRadioEnabled' as const,
              title: 'Infinite Auto-Radio',
              desc: 'Continue playback with related tracks when your queue ends.',
            },
          ].map((item) => {
            const enabled = settings[item.key];
            return (
              <div
                key={item.key}
                className="px-4 py-3.5 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#FAFAFA]">{item.title}</p>
                  <p className="text-xs text-[#A1A1AA] mt-0.5">{item.desc}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={enabled}
                  aria-label={item.title}
                  onClick={() => updateSettings({ [item.key]: !enabled })}
                  className={`w-11 h-6 rounded-full transition-colors duration-200 spring-transition p-0.5 shrink-0 ${
                    enabled ? 'bg-[#FAFAFA]' : 'bg-[#27272A]'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full transition-transform duration-200 spring-transition ${
                      enabled
                        ? 'translate-x-5 bg-[#09090B]'
                        : 'translate-x-0 bg-[#A1A1AA]'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Group 4: Stream Backend & Proxy */}
      <section className="space-y-2.5">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#71717A] px-1">
          Stream & Proxy
        </h2>
        <div className="rounded-2xl border border-[var(--dulo-border)] bg-[var(--dulo-surface)] divide-y divide-[var(--dulo-border)] overflow-hidden">
          <button
            onClick={() => setShowBackendConfig((v) => !v)}
            className="w-full px-4 py-3.5 flex items-center justify-between gap-4 text-left hover:bg-[var(--dulo-hover)] transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              {settings.streamMode === 'proxy' ? (
                <Server className="w-4 h-4 text-[#FAFAFA] shrink-0" />
              ) : (
                <Radio className="w-4 h-4 text-[#FAFAFA] shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#FAFAFA]">
                  {settings.streamMode === 'proxy'
                    ? 'Cloudflare Worker Proxy'
                    : 'Direct Piped Failover'}
                </p>
                <p className="font-mono-tabular text-xs text-[#A1A1AA] truncate mt-0.5">
                  {settings.streamMode === 'proxy'
                    ? settings.customProxyUrl.replace(/^https?:\/\//, '')
                    : `${settings.pipedInstances.length} configured instances`}
                </p>
              </div>
            </div>
            <ChevronRight
              className={`w-4 h-4 text-[#71717A] shrink-0 transition-transform duration-200 spring-transition ${
                showBackendConfig ? 'rotate-90' : ''
              }`}
            />
          </button>

          {showBackendConfig && (
            <div className="p-4 space-y-4 bg-[#09090B]/40">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={() => updateSettings({ streamMode: 'proxy' })}
                  className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                    settings.streamMode === 'proxy'
                      ? 'border-[#FAFAFA] bg-[var(--dulo-hover)]'
                      : 'border-[var(--dulo-border)] bg-[#09090B] hover:bg-[var(--dulo-hover)]'
                  }`}
                >
                  <Server className="w-4 h-4 text-[#FAFAFA] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-[#FAFAFA]">
                      Cloudflare Proxy
                    </p>
                    <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                      Primary edge search & stream endpoint
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => updateSettings({ streamMode: 'piped' })}
                  className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                    settings.streamMode === 'piped'
                      ? 'border-[#FAFAFA] bg-[var(--dulo-hover)]'
                      : 'border-[var(--dulo-border)] bg-[#09090B] hover:bg-[var(--dulo-hover)]'
                  }`}
                >
                  <Radio className="w-4 h-4 text-[#FAFAFA] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-[#FAFAFA]">
                      Piped Failover
                    </p>
                    <p className="text-[11px] text-[#A1A1AA] mt-0.5">
                      Zero-backend direct Piped instances
                    </p>
                  </div>
                </button>
              </div>

              {settings.streamMode === 'proxy' ? (
                <div className="space-y-2.5">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={settings.customProxyUrl}
                      onChange={(e) => updateSettings({ customProxyUrl: e.target.value })}
                      placeholder="https://dulo-proxy.xllxn-io.workers.dev/"
                      className="flex-1 rounded-full border border-[var(--dulo-border)] bg-[#09090B] px-4 py-2 text-xs font-mono-tabular text-[#FAFAFA] focus:outline-none focus:border-[#FAFAFA]"
                    />
                    <button
                      onClick={() => void testCustomProxy()}
                      className="rounded-full bg-[#FAFAFA] px-4 py-2 text-xs font-semibold text-[#09090B] hover:bg-[#E4E4E7] active:scale-[0.97] transition-all spring-transition"
                    >
                      {proxyStatus === 'testing' ? 'Checking…' : 'Verify'}
                    </button>
                  </div>
                  {proxyStatus === 'ok' && (
                    <p className="text-xs text-[#FAFAFA] flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      Worker connected and returning live results
                    </p>
                  )}
                  {proxyStatus === 'fail' && (
                    <p className="text-xs text-[#A1A1AA]">
                      Worker unreachable — verify URL or switch to Piped failover.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#A1A1AA]">
                      Piped Instances
                    </span>
                    <button
                      onClick={() => void runHealthChecks()}
                      className="inline-flex items-center gap-1.5 text-xs text-[#FAFAFA] hover:underline"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>Test Latency</span>
                    </button>
                  </div>
                  <div className="space-y-2">
                    {settings.pipedInstances.map((url) => {
                      const status = latencyResults[url];
                      return (
                        <div
                          key={url}
                          className="flex items-center justify-between gap-3 rounded-xl border border-[var(--dulo-border)] bg-[#09090B] px-3 py-2"
                        >
                          <span className="font-mono-tabular text-xs text-[#FAFAFA] truncate">
                            {url}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            {status === 'testing' && (
                              <span className="font-mono-tabular tabular-nums text-[11px] text-[#71717A]">
                                Testing…
                              </span>
                            )}
                            {status && status !== 'testing' && (
                              <span className="font-mono-tabular tabular-nums text-[11px] text-[#A1A1AA]">
                                {status.ok ? `${status.latencyMs} ms` : 'Offline'}
                              </span>
                            )}
                            {settings.pipedInstances.length > 1 && (
                              <button
                                onClick={() =>
                                  updateSettings({
                                    pipedInstances: settings.pipedInstances.filter((u) => u !== url),
                                  })
                                }
                                aria-label={`Remove ${url}`}
                                className="p-1 text-[#71717A] hover:text-[#FAFAFA]"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={newInstance}
                      onChange={(e) => setNewInstance(e.target.value)}
                      placeholder="https://pipedapi.example.com"
                      className="flex-1 rounded-full border border-[var(--dulo-border)] bg-[#09090B] px-4 py-2 text-xs text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:border-[#FAFAFA]"
                    />
                    <button
                      onClick={addPipedInstance}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--dulo-border)] bg-[var(--dulo-hover)] px-4 py-2 text-xs font-medium text-[#FAFAFA]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Group 5: App & Offline Installation */}
      <section className="space-y-2.5">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#71717A] px-1">
          Application
        </h2>
        <div className="rounded-2xl border border-[var(--dulo-border)] bg-[var(--dulo-surface)] px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#FAFAFA]">Progressive Web App</p>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              Install Dulo to your home screen or desktop for standalone playback.
            </p>
          </div>
          <div className="shrink-0">
            <PWAInstallButton compact dismissible={false} label="Install Dulo App" />
          </div>
        </div>
      </section>
    </div>
  );
};
