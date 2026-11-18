import React from 'react';
import {
  ChevronLeft,
  Command,
  Disc3,
  PanelLeftClose,
  PanelLeftOpen,
  SlidersHorizontal,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useDulo } from '../store/DuloContext';
import { NavTab } from '../types/music';
import { AccountButton } from './AccountButton';
import {
  NavIconProps,
  SFHomeIcon,
  SFLibraryIcon,
  SFSearchIcon,
  SFSettingsIcon,
  SFStatsIcon,
} from './NavIcons';
import { PWAInstallButton } from './PWAInstallButton';

const DESKTOP_NAV: Array<{
  id: NavTab;
  label: string;
  icon: React.ComponentType<NavIconProps>;
}> = [
  { id: 'home', label: 'Home', icon: SFHomeIcon },
  { id: 'search', label: 'Search', icon: SFSearchIcon },
  { id: 'library', label: 'Library', icon: SFLibraryIcon },
  { id: 'stats', label: 'Pulse', icon: SFStatsIcon },
  { id: 'settings', label: 'Settings', icon: SFSettingsIcon },
];

const MOBILE_NAV: Array<{
  id: NavTab;
  label: string;
  icon: React.ComponentType<NavIconProps>;
}> = [
  { id: 'home', label: 'Home', icon: SFHomeIcon },
  { id: 'search', label: 'Search', icon: SFSearchIcon },
  { id: 'library', label: 'Library', icon: SFLibraryIcon },
  { id: 'settings', label: 'Settings', icon: SFSettingsIcon },
];

const TAB_TITLES: Record<NavTab, string> = {
  home: 'Listen Now',
  search: 'Explore',
  library: 'Library',
  stats: 'Pulse',
  settings: 'Settings',
};

export const NavigationShell: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const {
    activeTab,
    setActiveTab,
    homeSubRoute,
    clearHomeSubRoute,
    sidebarCollapsed,
    setSidebarCollapsed,
    setCommandPaletteOpen,
    setEqModalOpen,
  } = useDulo();

  const activeMobileIndex = MOBILE_NAV.findIndex((item) => item.id === activeTab);
  const showBackInHeader = activeTab === 'home' && Boolean(homeSubRoute);

  const headerContextTitle =
    activeTab === 'home' && homeSubRoute
      ? homeSubRoute.type === 'artist'
        ? homeSubRoute.artist.name
        : homeSubRoute.title
      : TAB_TITLES[activeTab];

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#FAFAFA] flex flex-col md:flex-row">
      {/* Desktop Collapsible Left Navigation Rail */}
      <aside
        className={`hidden md:flex flex-col fixed top-0 left-0 bottom-20 z-30 border-r border-white/[0.08] bg-[#0A0A0C] transition-[width] duration-200 spring-transition ${
          sidebarCollapsed ? 'w-[72px]' : 'w-60'
        }`}
      >
        <div className="h-16 px-4 flex items-center justify-between border-b border-white/[0.08]">
          {!sidebarCollapsed && (
            <button
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 active:scale-[0.97] transition-transform spring-transition"
            >
              <Disc3 className="w-5 h-5 text-[#FFFFFF]" strokeWidth={1.8} />
              <span className="font-display text-base font-semibold tracking-tight text-[#FFFFFF]">
                Dulo
              </span>
            </button>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-2 rounded-lg text-white/60 hover:text-[#FFFFFF] hover:bg-[#141417] active:scale-[0.97] transition-all spring-transition mx-auto md:mx-0"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="px-3 pt-4">
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className={`w-full flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-[#141417] px-3.5 py-2 text-xs text-white/60 hover:text-[#FFFFFF] hover:bg-[#1C1C22] active:scale-[0.97] transition-all spring-transition ${
              sidebarCollapsed ? 'justify-center px-0' : 'justify-between'
            }`}
            title="Command Palette (Cmd/Ctrl + K)"
          >
            <span className="flex items-center gap-2 whitespace-nowrap">
              <Command className="w-3.5 h-3.5 shrink-0" />
              {!sidebarCollapsed && <span>Quick Command</span>}
            </span>
            {!sidebarCollapsed && (
              <kbd className="font-mono-tabular tabular-nums text-[10px] text-white/40">⌘K</kbd>
            )}
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Primary">
          {DESKTOP_NAV.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium active:scale-[0.97] transition-all duration-200 spring-transition whitespace-nowrap ${
                  active
                    ? 'bg-[#141417] text-[#FFFFFF] border border-white/[0.08]'
                    : 'text-white/60 hover:text-[#FFFFFF] hover:bg-[#141417]/60 border border-transparent'
                } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                title={item.label}
              >
                <Icon active={active} className="shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/[0.08] space-y-2">
          <AccountButton collapsed={sidebarCollapsed} />
          {!sidebarCollapsed && (
            <>
              <button
                onClick={() => setEqModalOpen(true)}
                className="w-full flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-[#141417] px-3.5 py-2 text-xs font-medium text-white/65 hover:text-[#FFFFFF] hover:bg-[#1C1C22] active:scale-[0.97] transition-all spring-transition"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>10-Band EQ & DSP</span>
              </button>
              <PWAInstallButton />
            </>
          )}
        </div>
      </aside>

      {/* Main Content Area + Fixed Matte Upper Header */}
      <div
        className={`flex-1 min-w-0 flex flex-col transition-[margin] duration-200 spring-transition ${
          sidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-60'
        }`}
      >
        {/* Fixed / Sticky Translucent Matte Upper Navigation Bar */}
        <header className="sticky top-0 z-30 pt-[env(safe-area-inset-top)] bg-[#0A0A0C]/90 backdrop-blur-md border-b border-white/[0.08]">
          <div className="max-w-6xl mx-auto h-14 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
            {/* Left Zone: Contextual Back + Title OR Brand + Section Title */}
            <div className="flex items-center gap-2.5 min-w-0">
              <AnimatePresence mode="wait" initial={false}>
                {showBackInHeader ? (
                  <motion.div
                    key="subroute-header"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-center gap-2 min-w-0"
                  >
                    <button
                      type="button"
                      onClick={clearHomeSubRoute}
                      aria-label="Back to Listen Now"
                      className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-[#141417] pl-2 pr-3 py-1.5 text-xs font-medium text-[#FFFFFF] hover:bg-[#1C1C22] active:scale-[0.95] transition-all spring-transition min-h-[36px] shrink-0"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>
                    <span className="font-display text-sm sm:text-base font-semibold tracking-tight text-[#FFFFFF] truncate">
                      {headerContextTitle}
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="primary-header"
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 6 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-center gap-2.5 min-w-0"
                  >
                    <button
                      type="button"
                      onClick={() => setActiveTab('home')}
                      className="md:hidden flex items-center gap-2 whitespace-nowrap shrink-0 min-h-[40px] active:scale-[0.97] transition-transform spring-transition"
                    >
                      <Disc3 className="w-5 h-5 text-[#FFFFFF]" strokeWidth={1.8} />
                      <span className="font-display text-base font-semibold tracking-tight text-[#FFFFFF]">
                        Dulo
                      </span>
                    </button>
                    <span
                      aria-hidden="true"
                      className="md:hidden h-4 w-px bg-white/[0.12] shrink-0"
                    />
                    <span className="font-display text-sm sm:text-base font-semibold tracking-tight text-[#FFFFFF] truncate">
                      {headerContextTitle}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Zone: Global Search & Profile Shortcuts */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('search')}
                aria-label="Quick search tracks"
                className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#141417] px-3 py-1.5 text-xs text-white/65 hover:text-[#FFFFFF] hover:bg-[#1C1C22] active:scale-[0.96] transition-all duration-200 spring-transition min-h-[38px]"
              >
                <SFSearchIcon active={activeTab === 'search'} className="w-4 h-4" />
                <span className="hidden sm:inline">Search</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('stats')}
                aria-label="Listening Pulse"
                className={`md:hidden min-w-[38px] min-h-[38px] flex items-center justify-center rounded-full border transition-all spring-transition active:scale-[0.95] ${
                  activeTab === 'stats'
                    ? 'border-white/[0.14] bg-[#1C1C22]'
                    : 'border-white/[0.08] bg-[#141417]'
                }`}
              >
                <SFStatsIcon active={activeTab === 'stats'} className="w-4 h-4" />
              </button>

              <div className="md:hidden">
                <PWAInstallButton compact dismissible={false} label="Install" />
              </div>

              <AccountButton compact />
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="relative z-10 bg-[#0A0A0C] flex-1 min-w-0 pb-44 md:pb-28">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            {children}
          </div>
        </main>
      </div>

      {/* Floating Matte Lower Pill Dock (Mobile) with Uniform Liquid Glass Slider */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-[max(20px,env(safe-area-inset-bottom))] left-4 right-4 max-w-[430px] mx-auto z-40 rounded-full bg-[#141417] border border-white/[0.08] p-1.5 shadow-[0_18px_48px_rgba(0,0,0,0.72)]"
      >
        <div className="relative flex items-center w-full">
          {/* Uniform Liquid Glass Pill Slider Indicator */}
          {activeMobileIndex >= 0 && (
            <motion.div
              aria-hidden="true"
              animate={{ x: `${activeMobileIndex * 100}%` }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              style={{
                width: `${100 / MOBILE_NAV.length}%`,
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
              className="absolute inset-y-0 left-0 rounded-full pointer-events-none"
            />
          )}

          {MOBILE_NAV.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <motion.button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-full min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                <Icon active={active} />
                <span
                  className={`text-[10px] font-medium tracking-tight mt-1 whitespace-nowrap transition-colors duration-200 ${
                    active ? 'text-[#FFFFFF]' : 'text-white/50'
                  }`}
                >
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
