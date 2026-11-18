import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  ShieldAlert,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { formatFirebaseAuthError, sendPasswordReset } from '../services/firebase';
import { useDulo } from '../store/DuloContext';
import { AcousticStageCanvas } from './AcousticStageCanvas';

type LegalModalType = 'privacy' | 'terms' | null;

const DuloAppBadge: React.FC = () => (
  <div className="mx-auto w-[58px] h-[58px] rounded-[18px] border border-[#27272A] bg-[#121215]/95 p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.65)]">
    <div className="w-full h-full rounded-[12px] bg-[#09090B] flex items-center justify-center">
      {/* Tactile sculpted monochrome music-wave emblem */}
      <svg
        width="26"
        height="26"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="duloSculpt" x1="6" y1="6" x2="26" y2="26" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#A1A1AA" />
          </linearGradient>
        </defs>
        <rect x="5" y="13" width="4.5" height="9" rx="2.25" fill="url(#duloSculpt)" />
        <rect x="11.5" y="7" width="4.5" height="18" rx="2.25" fill="url(#duloSculpt)" />
        <rect x="18" y="10" width="4.5" height="14" rx="2.25" fill="url(#duloSculpt)" />
        <circle cx="26" cy="20" r="2.3" fill="#FAFAFA" />
      </svg>
    </div>
  </div>
);

const MonochromeGoogleGlyph: React.FC = () => (
  <svg aria-hidden="true" className="w-[17px] h-[17px] shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21.8 12.23c0-.7-.06-1.4-.19-2.07H12v3.92h5.5a4.7 4.7 0 0 1-2.04 3.08v2.56h3.3c1.93-1.78 3.04-4.4 3.04-7.49Z" />
    <path d="M12 22c2.75 0 5.06-.91 6.75-2.47l-3.3-2.56c-.91.61-2.08.97-3.45.97-2.65 0-4.9-1.79-5.7-4.2H2.89v2.64A10 10 0 0 0 12 22Z" />
    <path d="M6.3 13.74a6 6 0 0 1 0-3.48V7.62H2.89a10 10 0 0 0 0 8.76l3.41-2.64Z" />
    <path d="M12 6.06c1.5 0 2.84.51 3.9 1.53l2.92-2.92C17.05 3.02 14.75 2 12 2a10 10 0 0 0-9.11 5.62l3.41 2.64c.8-2.41 3.05-4.2 5.7-4.2Z" />
  </svg>
);

export const OnboardingScreen: React.FC = () => {
  const {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    completeOnboarding,
  } = useDulo();

  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busyMode, setBusyMode] = useState<'email' | 'google' | 'reset' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);
  const [legalModal, setLegalModal] = useState<LegalModalType>(null);

  const handleTabChange = (nextTab: 'signin' | 'signup') => {
    setAuthTab(nextTab);
    setErrorMsg(null);
    setNoticeMsg(null);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Enter both your email address and password.');
      return;
    }
    setBusyMode('email');
    setErrorMsg(null);
    setNoticeMsg(null);
    try {
      if (authTab === 'signin') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
    } catch (err) {
      setErrorMsg(formatFirebaseAuthError(err));
    } finally {
      setBusyMode(null);
    }
  };

  const handleForgotPassword = async () => {
    setErrorMsg(null);
    setNoticeMsg(null);
    if (!email.trim()) {
      setErrorMsg('Enter your email address above first to reset your password.');
      return;
    }
    setBusyMode('reset');
    try {
      await sendPasswordReset(email);
      setNoticeMsg(`Password reset email sent to ${email.trim()}.`);
    } catch (err) {
      setErrorMsg(formatFirebaseAuthError(err));
    } finally {
      setBusyMode(null);
    }
  };

  const handleGoogle = async () => {
    setBusyMode('google');
    setErrorMsg(null);
    setNoticeMsg(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setErrorMsg(formatFirebaseAuthError(err));
    } finally {
      setBusyMode(null);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col justify-between overflow-hidden">
      {/* Soft colorful studio ambient glow */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 25% 30%, rgba(46, 196, 182, 0.12), transparent 50%), radial-gradient(ellipse at 75% 70%, rgba(168, 118, 255, 0.12), transparent 50%)',
        }}
      />

      {/* Simple dot-matrix grid & smooth colorful live soundwaves */}
      <AcousticStageCanvas />

      {/* Top Navigation Row: Clean Right-Aligned Skip */}
      <header className="relative z-20 flex items-center justify-end px-5 pt-4 sm:px-8 sm:pt-6">
        <button
          type="button"
          onClick={completeOnboarding}
          className="min-h-[44px] min-w-[44px] px-3 text-sm font-medium text-[#A1A1AA] hover:text-[#FAFAFA] active:scale-95 transition-all spring-transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-full"
        >
          Skip
        </button>
      </header>

      {/* Centered Auth Column Following Reference Arrangement */}
      <main className="relative z-20 flex-1 flex items-center justify-center px-5 py-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[392px] mx-auto"
        >
          {/* 1. Centered Emblem Square */}
          <DuloAppBadge />

          {/* 2. Title & 1-line Subtitle */}
          <div className="mt-5 text-center space-y-1.5">
            <h1 className="font-display text-[28px] sm:text-[30px] leading-tight font-bold tracking-[-0.025em] text-[#FAFAFA]">
              {authTab === 'signin' ? 'Sign in to Dulo' : 'Create your Dulo'}
            </h1>
            <p className="text-[13.5px] text-[#A1A1AA]">
              Access your playlists, synced library, and offline vault.
            </p>
          </div>

          {/* 3. Segmented Tab Switcher (Sign In | Create Account) */}
          <div
            role="tablist"
            aria-label="Authentication mode"
            className="mt-6 grid grid-cols-2 rounded-full border border-[#27272A] bg-[#121215]/90 backdrop-blur-md p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={authTab === 'signin'}
              onClick={() => handleTabChange('signin')}
              className={`h-10 rounded-full text-[13px] font-medium transition-all duration-200 spring-transition whitespace-nowrap ${
                authTab === 'signin'
                  ? 'bg-white text-[#09090B] font-semibold shadow-sm'
                  : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={authTab === 'signup'}
              onClick={() => handleTabChange('signup')}
              className={`h-10 rounded-full text-[13px] font-medium transition-all duration-200 spring-transition whitespace-nowrap ${
                authTab === 'signup'
                  ? 'bg-white text-[#09090B] font-semibold shadow-sm'
                  : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
              }`}
            >
              Create Account
            </button>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="mt-4 rounded-2xl border border-[#27272A] bg-[#121215] px-4 py-3 flex items-start gap-2.5 text-xs text-[#E4E4E7]"
            >
              <ShieldAlert className="w-4 h-4 text-[#FAFAFA] shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {noticeMsg && (
            <div
              role="status"
              className="mt-4 rounded-2xl border border-[#27272A] bg-[#121215] px-4 py-3 flex items-start gap-2.5 text-xs text-[#E4E4E7]"
            >
              <CheckCircle2 className="w-4 h-4 text-[#FAFAFA] shrink-0 mt-0.5" />
              <span className="leading-relaxed">{noticeMsg}</span>
            </div>
          )}

          {/* 4. Grouped Dual-Row Email & Password Container + 5. Forgot Password + 6. Primary White Continue CTA */}
          <form onSubmit={(e) => void handleEmailSubmit(e)} className="mt-5">
            <div className="rounded-2xl border border-[#27272A] bg-[#121215]/90 backdrop-blur-md overflow-hidden focus-within:border-[#52525B] transition-colors">
              <label className="flex items-center gap-3 px-4 h-[52px]">
                <Mail className="w-4 h-4 text-[#71717A] shrink-0" aria-hidden="true" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  autoComplete="email"
                  className="w-full bg-transparent text-sm text-[#FAFAFA] placeholder-[#71717A] focus:outline-none"
                />
              </label>

              <div className="border-t border-[#27272A]" />

              <label className="flex items-center gap-3 px-4 h-[52px]">
                <Lock className="w-4 h-4 text-[#71717A] shrink-0" aria-hidden="true" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={authTab === 'signup' ? 'Password (min 6 characters)' : 'Password'}
                  autoComplete={authTab === 'signin' ? 'current-password' : 'new-password'}
                  className="w-full bg-transparent text-sm text-[#FAFAFA] placeholder-[#71717A] focus:outline-none"
                />
              </label>
            </div>

            <div className="mt-2.5 flex justify-end">
              <button
                type="button"
                onClick={() => void handleForgotPassword()}
                disabled={busyMode !== null}
                className="min-h-[36px] px-1 text-xs font-medium text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-md"
              >
                {busyMode === 'reset' ? 'Sending reset link...' : 'Forgot password?'}
              </button>
            </div>

            <button
              type="submit"
              disabled={busyMode !== null}
              className="mt-3 w-full h-[52px] rounded-full bg-white text-[#09090B] px-6 text-[15px] font-semibold flex items-center justify-center gap-2 whitespace-nowrap hover:bg-[#F4F4F5] hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 spring-transition disabled:opacity-55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090B]"
            >
              {busyMode === 'email' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{authTab === 'signin' ? 'Continue' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* 7. "or" Hairline Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#27272A]" />
            <span className="text-xs text-[#71717A]">or</span>
            <div className="h-px flex-1 bg-[#27272A]" />
          </div>

          {/* 8. Translucent Dark Pill: Continue with Google */}
          <button
            type="button"
            onClick={() => void handleGoogle()}
            disabled={busyMode !== null}
            className="w-full h-[52px] rounded-full border border-[#27272A] bg-[#121215]/90 backdrop-blur-md text-[#FAFAFA] px-6 text-[14.5px] font-medium flex items-center justify-center gap-2.5 whitespace-nowrap hover:bg-[#1C1C21] hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 spring-transition disabled:opacity-55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090B]"
          >
            {busyMode === 'google' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MonochromeGoogleGlyph />
            )}
            <span>Continue with Google</span>
          </button>
        </motion.div>
      </main>

      {/* Minimalist Legal Footer */}
      <footer className="relative z-20 pb-6 pt-2 flex items-center justify-center gap-6 text-xs text-[#71717A]">
        <button
          type="button"
          onClick={() => setLegalModal('privacy')}
          className="min-h-[44px] px-2 hover:text-[#A1A1AA] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-md"
        >
          Privacy policy
        </button>
        <button
          type="button"
          onClick={() => setLegalModal('terms')}
          className="min-h-[44px] px-2 hover:text-[#A1A1AA] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-md"
        >
          Terms of service
        </button>
      </footer>

      {/* Legal Modal */}
      {legalModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#09090B]/90 backdrop-blur-md p-4"
          onClick={() => setLegalModal(null)}
          role="dialog"
          aria-modal="true"
          aria-label={legalModal === 'privacy' ? 'Privacy policy' : 'Terms of service'}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-[#27272A] bg-[#121215] p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-[#FAFAFA]">
                {legalModal === 'privacy' ? 'Privacy policy' : 'Terms of service'}
              </h2>
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                aria-label="Close"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#1C1C21]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              {legalModal === 'privacy'
                ? 'Dulo stores your offline audio vault, equalizer presets, and local files privately in browser IndexedDB. When you sign in, only your liked songs, playlists, and playback history sync securely under your private Firestore user document.'
                : 'Dulo is a personal audio player and discovery workspace. You are responsible for the local audio files and public stream links you load into your library. You can skip sign-in or disconnect your account anytime.'}
            </p>
            <button
              type="button"
              onClick={() => setLegalModal(null)}
              className="w-full h-11 rounded-full bg-white text-[#09090B] text-xs font-semibold hover:bg-[#F4F4F5] active:scale-[0.98] transition-all spring-transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
