import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AuthModal } from './components/modals/AuthModal';
import { CommandPalette } from './components/modals/CommandPalette';
import { EqualizerModal } from './components/modals/EqualizerModal';
import { NowPlayingSheet } from './components/modals/NowPlayingSheet';
import { PlaylistImportModal } from './components/modals/PlaylistImportModal';
import { SleepTimerModal } from './components/modals/SleepTimerModal';
import { NavigationShell } from './components/NavigationShell';
import { OfflineIndicator } from './components/OfflineIndicator';
import { OnboardingScreen } from './components/OnboardingScreen';
import { PlaybackDock } from './components/PlaybackDock';
import { HomeView } from './components/views/HomeView';
import { LibraryView } from './components/views/LibraryView';
import { SearchView } from './components/views/SearchView';
import { SettingsView } from './components/views/SettingsView';
import { StatsView } from './components/views/StatsView';
import { DuloProvider, useDulo } from './store/DuloContext';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message || 'Unexpected application error' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl border border-[#27272A] bg-[#121215] p-6 space-y-4">
            <h1 className="font-display text-lg font-semibold">Something went wrong</h1>
            <p className="text-xs text-[#A1A1AA] break-words">{this.state.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-full bg-[#FAFAFA] px-5 py-2.5 text-xs font-semibold text-[#09090B] active:scale-[0.97] transition-all spring-transition"
            >
              Reload Dulo
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const DuloWorkspace: React.FC = () => {
  const { activeTab, authLoading, onboardingCompleted, toastMessage } = useDulo();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#27272A] border-t-[#FAFAFA] animate-spin" />
      </div>
    );
  }

  if (!onboardingCompleted) {
    return (
      <>
        <OfflineIndicator />
        <OnboardingScreen />
        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 rounded-full border border-[var(--dulo-border)] bg-[var(--dulo-surface)] px-4 py-2 text-xs font-medium text-[#FAFAFA] whitespace-nowrap"
          >
            {toastMessage}
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <OfflineIndicator />
      <NavigationShell>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          >
            {activeTab === 'home' && <HomeView />}
            {activeTab === 'search' && <SearchView />}
            {activeTab === 'library' && <LibraryView />}
            {activeTab === 'stats' && <StatsView />}
            {activeTab === 'settings' && <SettingsView />}
          </motion.div>
        </AnimatePresence>
      </NavigationShell>

      <PlaybackDock />
      <NowPlayingSheet />
      <EqualizerModal />
      <SleepTimerModal />
      <PlaylistImportModal />
      <CommandPalette />
      <AuthModal />

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-44 md:bottom-24 left-1/2 -translate-x-1/2 z-50 rounded-full border border-white/[0.08] bg-[#141417] px-4 py-2 text-xs font-medium text-[#FAFAFA] whitespace-nowrap shadow-xl"
        >
          {toastMessage}
        </div>
      )}
    </>
  );
};

export default function App() {
  return (
    <AppErrorBoundary>
      <DuloProvider>
        <DuloWorkspace />
      </DuloProvider>
    </AppErrorBoundary>
  );
}
