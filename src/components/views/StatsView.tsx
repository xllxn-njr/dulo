import React from 'react';
import { Clock, Disc3, Play, Users } from 'lucide-react';
import { useDulo } from '../../store/DuloContext';
import { formatMinutesLabel } from '../../utils/format';
import { TrackArtwork } from '../TrackArtwork';

export const StatsView: React.FC = () => {
  const { stats, playTrack } = useDulo();

  const topTracks = Object.values(stats.trackCounts)
    .sort((a, b) => b.seconds - a.seconds || b.plays - a.plays)
    .slice(0, 6);

  const topArtists = Object.values(stats.artistCounts)
    .sort((a, b) => b.seconds - a.seconds || b.plays - a.plays)
    .slice(0, 6);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en-US', { weekday: 'short' });
    return {
      key,
      label,
      minutes: Math.round((stats.dailyMinutes[key] || 0) * 10) / 10,
    };
  });

  const maxDaily = Math.max(1, ...last7Days.map((d) => d.minutes));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[#FAFAFA]">
          Dulo Pulse
        </h1>
        <p className="text-xs text-[#A1A1AA] mt-1">
          Private listening analytics stored locally in IndexedDB
        </p>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#27272A] bg-[#121215] p-5">
          <div className="flex items-center justify-between text-[#71717A] text-xs">
            <span>Time Listened</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="font-display text-3xl font-semibold text-[#FAFAFA] mt-3 font-mono-tabular">
            {formatMinutesLabel(stats.totalSeconds)}
          </p>
        </div>

        <div className="rounded-2xl border border-[#27272A] bg-[#121215] p-5">
          <div className="flex items-center justify-between text-[#71717A] text-xs">
            <span>Tracks Played</span>
            <Disc3 className="w-4 h-4" />
          </div>
          <p className="font-display text-3xl font-semibold text-[#FAFAFA] mt-3 font-mono-tabular">
            {stats.totalPlays}
          </p>
        </div>

        <div className="rounded-2xl border border-[#27272A] bg-[#121215] p-5">
          <div className="flex items-center justify-between text-[#71717A] text-xs">
            <span>Unique Artists</span>
            <Users className="w-4 h-4" />
          </div>
          <p className="font-display text-3xl font-semibold text-[#FAFAFA] mt-3 font-mono-tabular">
            {Object.keys(stats.artistCounts).length}
          </p>
        </div>
      </div>

      {/* 7-Day Listening Activity */}
      <section className="rounded-2xl border border-[#27272A] bg-[#121215] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-[#FAFAFA]">
            7-Day Listening Activity
          </h2>
          <span className="text-xs text-[#71717A] font-mono-tabular">Minutes / day</span>
        </div>

        <div className="grid grid-cols-7 gap-3 items-end h-36 pt-4">
          {last7Days.map((day) => {
            const pct = Math.max(6, Math.round((day.minutes / maxDaily) * 100));
            return (
              <div key={day.key} className="flex flex-col items-center gap-2 h-full justify-end">
                <span className="font-mono-tabular text-[10px] text-[#71717A]">
                  {day.minutes > 0 ? day.minutes.toFixed(1) : '0'}
                </span>
                <div className="w-full max-w-[36px] flex-1 flex items-end bg-[#1C1C21] rounded-md overflow-hidden">
                  <div
                    className="w-full bg-[#FAFAFA] rounded-t-md transition-[height] duration-300"
                    style={{ height: `${pct}%` }}
                  />
                </div>
                <span className="text-[11px] text-[#A1A1AA]">{day.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Top Tracks & Top Artists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-[#27272A] bg-[#121215] p-5 space-y-4">
          <h2 className="font-display text-base font-semibold text-[#FAFAFA]">
            Top Tracks
          </h2>
          {topTracks.length === 0 ? (
            <p className="text-xs text-[#71717A] py-6">
              Play a few tracks to build your local Top Tracks chart.
            </p>
          ) : (
            <div className="space-y-2">
              {topTracks.map((item, idx) => (
                <button
                  key={item.track.id}
                  onClick={() => void playTrack(item.track)}
                  className="w-full flex items-center gap-3 rounded-xl p-2 hover:bg-[#1C1C21] transition-colors text-left"
                >
                  <span className="w-5 font-mono-tabular text-xs text-[#71717A]">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <TrackArtwork
                    src={item.track.artwork}
                    alt={item.track.title}
                    className="w-10 h-10 rounded-lg"
                    size="xs"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#FAFAFA] truncate">
                      {item.track.title}
                    </p>
                    <p className="text-xs text-[#A1A1AA] truncate">
                      {item.track.artist}
                    </p>
                  </div>
                  <span className="font-mono-tabular text-xs text-[#71717A]">
                    {item.plays} plays
                  </span>
                  <Play className="w-3.5 h-3.5 text-[#A1A1AA]" />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-[#27272A] bg-[#121215] p-5 space-y-4">
          <h2 className="font-display text-base font-semibold text-[#FAFAFA]">
            Top Artists
          </h2>
          {topArtists.length === 0 ? (
            <p className="text-xs text-[#71717A] py-6">
              Play tracks to populate your local artist breakdown.
            </p>
          ) : (
            <div className="space-y-3">
              {topArtists.map((item, idx) => {
                const maxArtistSec = Math.max(1, topArtists[0].seconds || 1);
                const widthPct = Math.max(12, Math.round((item.seconds / maxArtistSec) * 100));
                return (
                  <div key={item.artist} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#FAFAFA] font-medium">
                        {idx + 1}. {item.artist}
                      </span>
                      <span className="font-mono-tabular text-[#71717A]">
                        {item.plays} plays · {formatMinutesLabel(item.seconds)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[#1C1C21] overflow-hidden">
                      <div
                        className="h-full bg-[#FAFAFA] rounded-full"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
