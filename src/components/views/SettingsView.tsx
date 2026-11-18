import React, { useState } from 'react';
import { Activity, Check, Plus, Radio, Server, Sliders, Trash2 } from 'lucide-react';
import { testPipedInstanceLatency } from '../../services/streamEngine';
import { useDulo } from '../../store/DuloContext';
import { PWAInstallButton } from '../PWAInstallButton';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, setEqModalOpen, showToast } = useDulo();
  const [newInstance, setNewInstance] = useState('');
  const [latencyResults, setLatencyResults] = useState<
    Record<string, { ok: boolean; latencyMs: number } | 'testing'>
  >({});
  const [proxyStatus, setProxyStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');

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
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[#FAFAFA]">
          Settings
        </h1>
        <p className="text-xs text-[#A1A1AA] mt-1">
          Configure zero-quota stream extraction, Web Audio DSP, and offline PWA behavior
        </p>
      </div>

      {/* Stream Engine Mode */}
      <section className="rounded-2xl border border-[#27272A] bg-[#121215] p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-[#FAFAFA]">
              Stream & Metadata Engine
            </h2>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              Switch between Direct Browser Mode (Piped failover) and your Custom InnerTube Proxy
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => updateSettings({ streamMode: 'piped' })}
            className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
              settings.streamMode === 'piped'
                ? 'border-[#FAFAFA] bg-[#1C1C21]'
                : 'border-[#27272A] bg-[#09090B] hover:bg-[#1C1C21]'
            }`}
          >
            <Radio className="w-4 h-4 text-[#FAFAFA] mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-[#FAFAFA]">
                Direct Browser Mode
              </p>
              <p className="text-xs text-[#A1A1AA] mt-1">
                Zero-backend Piped API failover with curated offline fallback.
              </p>
            </div>
          </button>

          <button
            onClick={() => updateSettings({ streamMode: 'proxy' })}
            className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
              settings.streamMode === 'proxy'
                ? 'border-[#FAFAFA] bg-[#1C1C21]'
                : 'border-[#27272A] bg-[#09090B] hover:bg-[#1C1C21]'
            }`}
          >
            <Server className="w-4 h-4 text-[#FAFAFA] mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-[#FAFAFA]">
                Cloudflare Worker / InnerTube Proxy
              </p>
              <p className="text-xs text-[#A1A1AA] mt-1">
                Primary edge backend (`dulo-proxy.xllxn-io.workers.dev`) with Piped fallback.
              </p>
            </div>
          </button>
        </div>

        {settings.streamMode === 'piped' ? (
          <div className="space-y-3 pt-2 border-t border-[#27272A]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#A1A1AA]">
                Piped Failover Instances
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
                    className="flex items-center justify-between gap-3 rounded-lg border border-[#27272A] bg-[#09090B] px-3 py-2"
                  >
                    <span className="font-mono-tabular text-xs text-[#FAFAFA] truncate">
                      {url}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      {status === 'testing' && (
                        <span className="font-mono-tabular text-[11px] text-[#71717A]">
                          Testing…
                        </span>
                      )}
                      {status && status !== 'testing' && (
                        <span className="font-mono-tabular text-[11px] text-[#A1A1AA]">
                          {status.ok ? `${status.latencyMs} ms` : 'Unreachable'}
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
                className="flex-1 rounded-lg border border-[#27272A] bg-[#09090B] px-3 py-2 text-xs text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:border-[#FAFAFA]"
              />
              <button
                onClick={addPipedInstance}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#27272A] bg-[#1C1C21] px-3.5 py-2 text-xs font-medium text-[#FAFAFA] hover:bg-[#27272A]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-2 border-t border-[#27272A]">
            <label className="block text-xs font-medium text-[#A1A1AA]">
              Primary Proxy Backend URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={settings.customProxyUrl}
                onChange={(e) => updateSettings({ customProxyUrl: e.target.value })}
                placeholder="https://dulo-proxy.xllxn-io.workers.dev"
                className="flex-1 rounded-lg border border-[#27272A] bg-[#09090B] px-3 py-2 text-xs font-mono-tabular text-[#FAFAFA] focus:outline-none focus:border-[#FAFAFA]"
              />
              <button
                onClick={() => void testCustomProxy()}
                className="rounded-lg bg-[#FAFAFA] px-4 py-2 text-xs font-semibold text-[#09090B] hover:bg-[#E4E4E7]"
              >
                {proxyStatus === 'testing' ? 'Checking…' : 'Verify'}
              </button>
            </div>
            {proxyStatus === 'ok' && (
              <p className="text-xs text-[#FAFAFA] flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                Proxy connected and returning search results
              </p>
            )}
            {proxyStatus === 'fail' && (
              <p className="text-xs text-[#A1A1AA]">
                Proxy unreachable — check the Worker URL or switch to Direct Browser Mode.
              </p>
            )}
          </div>
        )}
      </section>

      {/* Audio Engine & Automation */}
      <section className="rounded-2xl border border-[#27272A] bg-[#121215] p-5 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-[#FAFAFA]">
            Web Audio & Playback Behavior
          </h2>
          <button
            onClick={() => setEqModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#27272A] bg-[#1C1C21] px-3 py-1.5 text-xs font-medium text-[#FAFAFA] hover:bg-[#27272A]"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Open 10-Band EQ</span>
          </button>
        </div>

        {/* Crossfade Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#FAFAFA] font-medium">Gapless Crossfade</span>
            <span className="font-mono-tabular text-[#A1A1AA]">
              {settings.crossfadeSeconds === 0
                ? 'Gapless (0s)'
                : `${settings.crossfadeSeconds}s overlap`}
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
            className="dulo-range w-full"
          />
        </div>

        {/* Toggle switches */}
        {[
          {
            key: 'loudnessNormalization' as const,
            title: 'Loudness Normalization',
            desc: 'Web Audio DynamicsCompressor levels quiet and loud masters evenly.',
          },
          {
            key: 'sponsorBlockEnabled' as const,
            title: 'SponsorBlock Auto-Skip',
            desc: 'Automatically skips non-music intros, outros, and off-topic segments.',
          },
          {
            key: 'autoRadioEnabled' as const,
            title: 'Infinite Auto-Radio',
            desc: 'Fetches related Up Next tracks automatically when your queue finishes.',
          },
        ].map((item) => {
          const enabled = settings[item.key];
          return (
            <div
              key={item.key}
              className="flex items-center justify-between gap-4 pt-4 border-t border-[#27272A]"
            >
              <div>
                <p className="text-sm font-medium text-[#FAFAFA]">{item.title}</p>
                <p className="text-xs text-[#A1A1AA] mt-0.5">{item.desc}</p>
              </div>
              <button
                role="switch"
                aria-checked={enabled}
                onClick={() => updateSettings({ [item.key]: !enabled })}
                className={`w-11 h-6 rounded-full transition-colors p-0.5 shrink-0 ${
                  enabled ? 'bg-[#FAFAFA]' : 'bg-[#27272A]'
                }`}
              >
                <span
                  className={`block w-5 h-5 rounded-full transition-transform ${
                    enabled
                      ? 'translate-x-5 bg-[#09090B]'
                      : 'translate-x-0 bg-[#A1A1AA]'
                  }`}
                />
              </button>
            </div>
          );
        })}
      </section>

      {/* PWA Installation Section */}
      <section className="rounded-2xl border border-[#27272A] bg-[#121215] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-base font-semibold text-[#FAFAFA]">
            Progressive Web App
          </h2>
          <p className="text-xs text-[#A1A1AA] mt-0.5">
            Install Dulo to your desktop or home screen for standalone offline playback.
          </p>
        </div>
        <div className="shrink-0">
          <PWAInstallButton compact dismissible={false} label="Install Dulo App" />
        </div>
      </section>
    </div>
  );
};
