import React, { useState } from 'react';
import { CheckCircle2, Cloud, Loader2, LogOut, ShieldCheck, User as UserIcon, X } from 'lucide-react';
import { useDulo } from '../../store/DuloContext';

export const AuthModal: React.FC = () => {
  const {
    authModalOpen,
    setAuthModalOpen,
    user,
    authNotice,
    signInWithGoogle,
    signOut,
    likedSongs,
    playlists,
    history,
  } = useDulo();

  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!authModalOpen) return null;

  const isGoogleUser = Boolean(user && !user.isAnonymous);

  const handleGoogleSignIn = async () => {
    setBusy(true);
    setErrorMsg(null);
    try {
      await signInWithGoogle();
      setAuthModalOpen(false);
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in popup was closed before completing.');
      } else {
        setErrorMsg(err instanceof Error ? err.message : 'Unable to sign in with Google');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setBusy(true);
    setErrorMsg(null);
    try {
      await signOut();
      setAuthModalOpen(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to sign out');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={() => setAuthModalOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Account & Cloud Sync"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-[#27272A] bg-[#121215] p-6 space-y-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#FAFAFA]">
              {isGoogleUser ? 'Cloud Account' : 'Sign In & Sync'}
            </h2>
            <p className="text-xs text-[#A1A1AA] mt-1">
              {isGoogleUser
                ? 'Your liked songs, playlists, and playback history sync automatically.'
                : 'Link a Google account to sync your library across devices.'}
            </p>
          </div>
          <button
            onClick={() => setAuthModalOpen(false)}
            aria-label="Close modal"
            className="p-2 rounded-lg text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#1C1C21]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Summary Card */}
        <div className="rounded-xl border border-[#27272A] bg-[#09090B] p-4 flex items-center gap-3.5">
          {isGoogleUser && user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'User avatar'}
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-full object-cover border border-[#27272A]"
            />
          ) : (
            <div className="w-11 h-11 rounded-full border border-[#27272A] bg-[#121215] flex items-center justify-center shrink-0">
              <UserIcon className="w-5 h-5 text-[#A1A1AA]" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#FAFAFA] truncate">
              {isGoogleUser
                ? user?.displayName || 'Google User'
                : user?.isAnonymous
                  ? 'Guest Session'
                  : 'Local Session'}
            </p>
            <p className="text-xs text-[#71717A] truncate mt-0.5">
              {isGoogleUser
                ? user?.email || 'Authenticated'
                : user
                  ? 'Anonymous cloud session active'
                  : 'Sign in to enable Firestore sync'}
            </p>
          </div>

          {isGoogleUser && (
            <CheckCircle2 className="w-4 h-4 text-[#FAFAFA] shrink-0" />
          )}
        </div>

        {/* Synced Collections Overview */}
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="rounded-xl border border-[#27272A] bg-[#09090B] p-3">
            <p className="font-mono-tabular text-base font-semibold text-[#FAFAFA]">
              {likedSongs.length}
            </p>
            <p className="text-[11px] text-[#71717A] mt-0.5">Liked</p>
          </div>
          <div className="rounded-xl border border-[#27272A] bg-[#09090B] p-3">
            <p className="font-mono-tabular text-base font-semibold text-[#FAFAFA]">
              {playlists.length}
            </p>
            <p className="text-[11px] text-[#71717A] mt-0.5">Playlists</p>
          </div>
          <div className="rounded-xl border border-[#27272A] bg-[#09090B] p-3">
            <p className="font-mono-tabular text-base font-semibold text-[#FAFAFA]">
              {history.length}
            </p>
            <p className="text-[11px] text-[#71717A] mt-0.5">History</p>
          </div>
        </div>

        {authNotice && (
          <div className="rounded-xl border border-[#27272A] bg-[#09090B] p-3 flex items-start gap-2.5 text-xs text-[#A1A1AA]">
            <ShieldCheck className="w-4 h-4 text-[#FAFAFA] shrink-0 mt-0.5" />
            <span>{authNotice}</span>
          </div>
        )}

        {errorMsg && (
          <p className="text-xs text-[#FAFAFA] bg-[#1C1C21] border border-[#27272A] rounded-lg px-3 py-2">
            {errorMsg}
          </p>
        )}

        <div className="pt-1 space-y-2.5">
          {!isGoogleUser ? (
            <button
              onClick={() => void handleGoogleSignIn()}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-[#FAFAFA] text-[#09090B] py-3 text-xs font-semibold hover:bg-[#E4E4E7] transition-colors disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Cloud className="w-4 h-4" />
              )}
              <span>Continue with Google</span>
            </button>
          ) : (
            <button
              onClick={() => void handleSignOut()}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#27272A] bg-[#1C1C21] text-[#FAFAFA] py-3 text-xs font-medium hover:bg-[#27272A] transition-colors disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
