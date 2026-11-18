import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  LogOut,
  ShieldCheck,
  User as UserIcon,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { formatFirebaseAuthError } from '../../services/firebase';
import { useDulo } from '../../store/DuloContext';

const DuloMark: React.FC = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 44 44"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle cx="22" cy="22" r="17.5" stroke="#FAFAFA" strokeWidth="1.9" />
    <path
      d="M22 4.5V39.5M8.5 14L22 22L35.5 14M8.5 30L22 22L35.5 30"
      stroke="#FAFAFA"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="22" cy="22" r="4.5" fill="#09090B" stroke="#FAFAFA" strokeWidth="1.8" />
  </svg>
);

const GoogleGlyph: React.FC = () => (
  <svg aria-hidden="true" className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const AuthModal: React.FC = () => {
  const {
    authModalOpen,
    setAuthModalOpen,
    user,
    authNotice,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    likedSongs,
    playlists,
    history,
  } = useDulo();

  const [busyMode, setBusyMode] = useState<'google' | 'email' | 'signout' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [emailMode, setEmailMode] = useState(false);
  const [emailAction, setEmailAction] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!authModalOpen) return null;

  const isSignedInUser = Boolean(user && !user.isAnonymous);

  const handleGoogleSignIn = async () => {
    setBusyMode('google');
    setErrorMsg(null);
    try {
      await signInWithGoogle();
      setAuthModalOpen(false);
    } catch (err) {
      setErrorMsg(formatFirebaseAuthError(err));
    } finally {
      setBusyMode(null);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setBusyMode('email');
    setErrorMsg(null);
    try {
      if (emailAction === 'signin') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
      setAuthModalOpen(false);
    } catch (err) {
      setErrorMsg(formatFirebaseAuthError(err));
    } finally {
      setBusyMode(null);
    }
  };

  const handleSignOut = async () => {
    setBusyMode('signout');
    setErrorMsg(null);
    try {
      await signOut();
      setAuthModalOpen(false);
    } catch (err) {
      setErrorMsg(formatFirebaseAuthError(err));
    } finally {
      setBusyMode(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#09090B]/90 backdrop-blur-md p-4"
      onClick={() => setAuthModalOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Account & Cloud Sync"
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl border border-[#27272A] bg-[#121215] p-6 sm:p-7 space-y-5 relative overflow-hidden shadow-2xl"
      >
        <button
          type="button"
          onClick={() => setAuthModalOpen(false)}
          aria-label="Close modal"
          className="absolute top-5 right-5 p-2 rounded-full text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#1C1C21] active:scale-[0.95] transition-all spring-transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Centered Brand Mark or User Avatar */}
        <div className="pt-2 text-center space-y-3">
          <div className="relative mx-auto w-12 h-12 flex items-center justify-center">
            {isSignedInUser && user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User avatar'}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-2xl object-cover border border-[#27272A]"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl border border-[#27272A] bg-[#09090B] flex items-center justify-center shadow-lg">
                {isSignedInUser ? <UserIcon className="w-5 h-5 text-[#FAFAFA]" /> : <DuloMark />}
              </div>
            )}
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight lowercase text-[#FAFAFA]">
              {isSignedInUser ? user?.displayName || 'dulo' : 'dulo'}
            </h2>
            <p className="text-xs text-[#A1A1AA] mt-1 max-w-xs mx-auto">
              {isSignedInUser
                ? user?.email || 'Cloud sync is active across your devices.'
                : 'Listen without friction. Sign in to sync your library.'}
            </p>
          </div>
        </div>

        {/* Profile Status Row */}
        <div className="rounded-2xl border border-[#27272A] bg-[#09090B] px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#FAFAFA] truncate">
              {isSignedInUser ? 'Firebase Cloud Sync' : 'Guest Session'}
            </p>
            <p className="text-[11px] text-[#71717A] truncate mt-0.5">
              {isSignedInUser
                ? 'Synced automatically to Firestore'
                : 'Saved locally on this device'}
            </p>
          </div>
          {isSignedInUser && <CheckCircle2 className="w-4 h-4 text-[#FAFAFA] shrink-0" />}
        </div>

        {/* Synced Collections Overview */}
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="rounded-2xl border border-[#27272A] bg-[#09090B] p-3">
            <p className="font-mono-tabular tabular-nums text-base font-semibold text-[#FAFAFA]">
              {likedSongs.length}
            </p>
            <p className="text-[11px] text-[#71717A] mt-0.5">Liked</p>
          </div>
          <div className="rounded-2xl border border-[#27272A] bg-[#09090B] p-3">
            <p className="font-mono-tabular tabular-nums text-base font-semibold text-[#FAFAFA]">
              {playlists.length}
            </p>
            <p className="text-[11px] text-[#71717A] mt-0.5">Playlists</p>
          </div>
          <div className="rounded-2xl border border-[#27272A] bg-[#09090B] p-3">
            <p className="font-mono-tabular tabular-nums text-base font-semibold text-[#FAFAFA]">
              {history.length}
            </p>
            <p className="text-[11px] text-[#71717A] mt-0.5">History</p>
          </div>
        </div>

        {authNotice && (
          <div className="rounded-2xl border border-[#27272A] bg-[#09090B] p-3 flex items-start gap-2.5 text-xs text-[#A1A1AA]">
            <ShieldCheck className="w-4 h-4 text-[#FAFAFA] shrink-0 mt-0.5" />
            <span>{authNotice}</span>
          </div>
        )}

        {errorMsg && (
          <p
            role="alert"
            className="text-xs text-[#FAFAFA] bg-[#09090B] border border-[#27272A] rounded-2xl px-4 py-2.5 text-center"
          >
            {errorMsg}
          </p>
        )}

        {isSignedInUser ? (
          <button
            type="button"
            onClick={() => void handleSignOut()}
            disabled={busyMode !== null}
            className="w-full h-12 rounded-full border border-[#27272A] bg-[#09090B] text-[#FAFAFA] px-5 text-sm font-medium hover:bg-[#1C1C21] hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 spring-transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {busyMode === 'signout' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            <span>Sign Out</span>
          </button>
        ) : (
          <AnimatePresence mode="wait">
            {!emailMode ? (
              <motion.div
                key="modal-providers"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-3 pt-1"
              >
                {/* White Pill: Continue with Google */}
                <button
                  type="button"
                  onClick={() => void handleGoogleSignIn()}
                  disabled={busyMode !== null}
                  className="w-full h-12 rounded-full bg-white text-[#09090B] px-5 text-sm font-medium hover:bg-[#F4F4F5] hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 spring-transition flex items-center justify-center gap-2.5 shadow-sm disabled:opacity-50"
                >
                  {busyMode === 'google' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <GoogleGlyph />
                  )}
                  <span>Continue with Google</span>
                </button>

                {/* Translucent Dark Glass Pill: Continue with email */}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setEmailMode(true);
                  }}
                  disabled={busyMode !== null}
                  className="w-full h-12 rounded-full border border-[#27272A] bg-[#242427]/80 backdrop-blur-md text-[#E4E4E7] hover:text-white hover:bg-[#2C2C30] hover:scale-[1.01] active:scale-[0.98] px-5 text-sm font-medium transition-all duration-200 spring-transition disabled:opacity-50"
                >
                  Continue with email
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="modal-email"
                onSubmit={(e) => void handleEmailSubmit(e)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-2.5 pt-1"
              >
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setEmailMode(false);
                      setErrorMsg(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-[#A1A1AA] hover:text-[#FAFAFA]"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                  <div className="inline-flex rounded-full border border-[#27272A] bg-[#09090B] p-0.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setEmailAction('signin')}
                      className={`px-3 py-1 rounded-full transition-colors ${
                        emailAction === 'signin'
                          ? 'bg-[#FAFAFA] text-[#09090B] font-semibold'
                          : 'text-[#A1A1AA]'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmailAction('signup')}
                      className={`px-3 py-1 rounded-full transition-colors ${
                        emailAction === 'signup'
                          ? 'bg-[#FAFAFA] text-[#09090B] font-semibold'
                          : 'text-[#A1A1AA]'
                      }`}
                    >
                      Create
                    </button>
                  </div>
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  autoComplete="email"
                  className="w-full rounded-full border border-[#27272A] bg-[#09090B] px-4 py-3 text-xs text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:border-[#FAFAFA] transition-colors"
                />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (min 6 characters)"
                  autoComplete={emailAction === 'signin' ? 'current-password' : 'new-password'}
                  className="w-full rounded-full border border-[#27272A] bg-[#09090B] px-4 py-3 text-xs text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:border-[#FAFAFA] transition-colors"
                />
                <button
                  type="submit"
                  disabled={busyMode !== null}
                  className="w-full h-12 rounded-full bg-[#FAFAFA] text-[#09090B] px-5 text-sm font-medium hover:bg-[#E4E4E7] hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 spring-transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {busyMode === 'email' && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{emailAction === 'signin' ? 'Sign In with Email' : 'Create Account'}</span>
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
};
