import React, { useState } from 'react';
import { Link2, Loader2, X } from 'lucide-react';
import { importYouTubePlaylist } from '../../services/streamEngine';
import { useDulo } from '../../store/DuloContext';

export const PlaylistImportModal: React.FC = () => {
  const {
    importModalOpen,
    setImportModalOpen,
    settings,
    createPlaylist,
    playTrack,
    setActiveTab,
  } = useDulo();

  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!importModalOpen) return null;

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await importYouTubePlaylist(url, settings);
      await createPlaylist(result.name, result.tracks, url.trim());
      setImportModalOpen(false);
      setUrl('');
      setActiveTab('library');
      if (result.tracks[0]) {
        void playTrack(result.tracks[0], result.tracks);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Playlist import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Import YouTube Playlist"
    >
      <div className="w-full max-w-md rounded-2xl border border-[#27272A] bg-[#121215] p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-[#FAFAFA]" />
            <h2 className="font-display text-base font-semibold text-[#FAFAFA]">
              Import YouTube Playlist
            </h2>
          </div>
          <button
            onClick={() => setImportModalOpen(false)}
            aria-label="Close Import Modal"
            className="p-2 rounded-lg text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#1C1C21]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[#A1A1AA] leading-relaxed">
          Paste any public YouTube or YouTube Music playlist URL (or Playlist ID) to bulk-import its tracks into your local Library.
        </p>

        <form onSubmit={(e) => void handleImport(e)} className="space-y-4">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://music.youtube.com/playlist?list=PL..."
            required
            className="w-full rounded-xl border border-[#27272A] bg-[#09090B] px-3.5 py-3 text-xs text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:border-[#FAFAFA]"
          />

          {error && <p className="text-xs text-[#FAFAFA]">{error}</p>}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setImportModalOpen(false)}
              className="rounded-lg border border-[#27272A] px-4 py-2 text-xs font-medium text-[#A1A1AA] hover:text-[#FAFAFA]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-[#FAFAFA] px-4 py-2 text-xs font-semibold text-[#09090B] hover:bg-[#E4E4E7] disabled:opacity-40"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? 'Importing…' : 'Import Playlist'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
