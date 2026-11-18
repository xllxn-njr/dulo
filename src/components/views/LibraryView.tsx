import React, { useRef, useState } from 'react';
import {
  DownloadCloud,
  FileAudio,
  HardDrive,
  Heart,
  Link2,
  ListMusic,
  Play,
  Trash2,
  Upload,
} from 'lucide-react';
import { useDulo } from '../../store/DuloContext';
import { formatBytes } from '../../utils/format';
import { TrackArtwork } from '../TrackArtwork';
import { TrackRow } from '../TrackRow';

type LibrarySubTab = 'liked' | 'vault' | 'local' | 'playlists' | 'history';

export const LibraryView: React.FC = () => {
  const {
    offlineVault,
    clearOfflineVault,
    localTracks,
    importLocalFiles,
    deleteLocalFile,
    playlists,
    removePlaylist,
    history,
    likedSongs,
    playTrack,
    setImportModalOpen,
  } = useDulo();

  const [tab, setTab] = useState<LibrarySubTab>('liked');
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const totalVaultBytes = offlineVault.reduce((acc, item) => acc + item.sizeBytes, 0);

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await importLocalFiles(e.dataTransfer.files);
      setTab('local');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[#FAFAFA]">
            Library & Offline Vault
          </h1>
          <p className="text-xs text-[#A1A1AA] mt-1 font-mono-tabular">
            {offlineVault.length} cached · {formatBytes(totalVaultBytes)} in IndexedDB
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-[#27272A] bg-[#121215] px-3.5 py-2 text-xs font-medium text-[#FAFAFA] hover:bg-[#1C1C21] transition-colors min-h-[40px]"
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Import YouTube Playlist</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg bg-[#FAFAFA] px-3.5 py-2 text-xs font-semibold text-[#09090B] hover:bg-[#E4E4E7] transition-colors min-h-[40px]"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Add Audio Files</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.flac,.m4a,.wav,.ogg,.aac,audio/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                void importLocalFiles(e.target.files).then(() => setTab('local'));
              }
            }}
          />
        </div>
      </div>

      {/* Drag & Drop Local Audio Importer */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => void handleDrop(e)}
        className={`rounded-2xl border border-dashed p-5 text-center transition-colors ${
          dragging
            ? 'border-[#FAFAFA] bg-[#1C1C21]'
            : 'border-[#27272A] bg-[#121215]/70'
        }`}
      >
        <FileAudio className="w-5 h-5 text-[#A1A1AA] mx-auto mb-2" />
        <p className="text-sm font-medium text-[#FAFAFA]">
          Drop local audio files here
        </p>
        <p className="text-xs text-[#71717A] mt-1">
          Supports .mp3, .flac, .m4a, .wav — stored privately in browser IndexedDB
        </p>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'liked' as const, label: `Liked Songs (${likedSongs.length})` },
          { id: 'vault' as const, label: `Offline Vault (${offlineVault.length})` },
          { id: 'local' as const, label: `Local Files (${localTracks.length})` },
          { id: 'playlists' as const, label: `Playlists (${playlists.length})` },
          { id: 'history' as const, label: `History (${history.length})` },
        ].map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 min-h-[38px] ${
                active
                  ? 'bg-[#FAFAFA] text-[#09090B]'
                  : 'bg-[#121215] text-[#A1A1AA] border border-[#27272A] hover:bg-[#1C1C21] hover:text-[#FAFAFA]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {tab === 'liked' && (
        <div className="space-y-3">
          {likedSongs.length === 0 ? (
            <div className="rounded-2xl border border-[#27272A] bg-[#121215] p-10 text-center">
              <Heart className="w-6 h-6 text-[#71717A] mx-auto mb-2.5" />
              <p className="text-sm font-medium text-[#FAFAFA]">No liked songs yet</p>
              <p className="text-xs text-[#71717A] mt-1 max-w-sm mx-auto">
                Tap the heart icon on any track to save it here and sync across your devices.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#27272A] bg-[#121215]/60 p-2 space-y-1">
              {likedSongs.map((track, idx) => (
                <TrackRow
                  key={`liked-${track.id}`}
                  track={track}
                  index={idx}
                  queueContext={likedSongs}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'vault' && (
        <div className="space-y-3">
          {offlineVault.length > 0 && (
            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-[#A1A1AA] flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5" />
                Ready for 100% offline playback
              </span>
              <button
                onClick={() => void clearOfflineVault()}
                className="text-xs text-[#71717A] hover:text-[#FAFAFA] transition-colors"
              >
                Clear Vault
              </button>
            </div>
          )}

          {offlineVault.length === 0 ? (
            <div className="rounded-2xl border border-[#27272A] bg-[#121215] p-10 text-center">
              <DownloadCloud className="w-6 h-6 text-[#71717A] mx-auto mb-2.5" />
              <p className="text-sm font-medium text-[#FAFAFA]">Offline Vault is empty</p>
              <p className="text-xs text-[#71717A] mt-1 max-w-sm mx-auto">
                Click the download button on any track in Home or Search to cache its audio stream and artwork into IndexedDB.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#27272A] bg-[#121215]/60 p-2 space-y-1">
              {offlineVault.map((entry, idx) => (
                <TrackRow
                  key={entry.track.id}
                  track={entry.track}
                  index={idx}
                  queueContext={offlineVault.map((v) => v.track)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'local' && (
        <div className="space-y-3">
          {localTracks.length === 0 ? (
            <div className="rounded-2xl border border-[#27272A] bg-[#121215] p-10 text-center">
              <FileAudio className="w-6 h-6 text-[#71717A] mx-auto mb-2.5" />
              <p className="text-sm font-medium text-[#FAFAFA]">No local files imported yet</p>
              <p className="text-xs text-[#71717A] mt-1">
                Drop MP3, FLAC, M4A, or WAV files above to play them with the 10-band EQ.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#27272A] bg-[#121215]/60 p-2 space-y-1">
              {localTracks.map((track, idx) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={idx}
                  queueContext={localTracks}
                  onRemoveLocal={(id) => void deleteLocalFile(id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'playlists' && (
        <div className="space-y-3">
          {playlists.length === 0 ? (
            <div className="rounded-2xl border border-[#27272A] bg-[#121215] p-10 text-center">
              <ListMusic className="w-6 h-6 text-[#71717A] mx-auto mb-2.5" />
              <p className="text-sm font-medium text-[#FAFAFA]">No imported playlists yet</p>
              <p className="text-xs text-[#71717A] mt-1">
                Paste any public YouTube playlist URL to bulk-import tracks locally.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {playlists.map((pl) => (
                <div
                  key={pl.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-[#27272A] bg-[#121215] p-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <TrackArtwork
                      src={pl.artwork}
                      alt={pl.name}
                      className="w-14 h-14 rounded-lg"
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#FAFAFA] truncate">
                        {pl.name}
                      </p>
                      <p className="text-xs text-[#A1A1AA] font-mono-tabular mt-0.5">
                        {pl.tracks.length} tracks
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        if (pl.tracks[0]) void playTrack(pl.tracks[0], pl.tracks);
                      }}
                      aria-label={`Play ${pl.name}`}
                      className="w-9 h-9 rounded-full bg-[#FAFAFA] text-[#09090B] flex items-center justify-center hover:bg-[#E4E4E7]"
                    >
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </button>
                    <button
                      onClick={() => void removePlaylist(pl.id)}
                      aria-label={`Delete ${pl.name}`}
                      className="p-2 rounded-lg text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#1C1C21]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="rounded-2xl border border-[#27272A] bg-[#121215] p-10 text-center">
              <p className="text-sm font-medium text-[#FAFAFA]">Listening history is empty</p>
              <p className="text-xs text-[#71717A] mt-1">
                Tracks you play will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#27272A] bg-[#121215]/60 p-2 space-y-1">
              {history.map((entry, idx) => (
                <TrackRow
                  key={`hist-${entry.track.id}`}
                  track={entry.track}
                  index={idx}
                  queueContext={history.map((h) => h.track)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
