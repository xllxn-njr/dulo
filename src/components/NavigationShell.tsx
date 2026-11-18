import React from 'react';
import {
  BarChart2,
  Command,
  Disc3,
  Home,
  Library,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  SlidersHorizontal,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useDulo } from '../store/DuloContext';
import { NavTab } from '../types/music';
import { AccountButton } from './AccountButton';
import { PWAInstallButton } from './PWAInstallButton';

const DESKTOP_NAV: Array<{ id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'library', label: 'Library', icon: Library },
  { id: 'stats', label: 'Stats', icon: BarChart2 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const MOBILE_NAV: Array<{ id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'library', label: 'Library', icon: Library },
];

export const NavigationShell: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const {
    activeTab,
    setActiveTab,
    sidebarCollapsed,
    setSidebarCollapsed,
    setCommandPaletteOpen,
    setEqModalOpen,
  } = useDulo();

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col md:flex-row">
      {/* Desktop Collapsible Left Navigation Rail */}
      <aside
        className={`hidden md:flex flex-col fixed top-0 left-0 bottom-20 z-20 border-r border-[#27272A] bg-[#09090B] transition-[width] duration-200 spring-transition ${
          sidebarCollapsed ? 'w-[72px]' : 'w-60'
        }`}
      >
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#27272A]">
          {!sidebarCollapsed && (
            <button
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0"
            >
              <Disc3 className="w-5 h-5 text-[#FAFAFA]" strokeWidth={1.75} />
              <span className="font-display text-base font-semibold tracking-tight text-[#FAFAFA]">
                Dulo
              </span>
            </button>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-2 rounded-lg text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#1C1C21] transition-colors mx-auto md:mx-0"
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
            className={`w-full flex items-center gap-2.5 rounded-lg border border-[#27272A] bg-[#121215] px-3 py-2 text-xs text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#1C1C21] transition-colors ${
              sidebarCollapsed ? 'justify-center px-0' : 'justify-between'
            }`}
            title="Command Palette (Cmd/Ctrl + K)"
          >
            <span className="flex items-center gap-2 whitespace-nowrap">
              <Command className="w-3.5 h-3.5 shrink-0" />
              {!sidebarCollapsed && <span>Quick Command</span>}
            </span>
            {!sidebarCollapsed && (
              <kbd className="font-mono-tabular text-[10px] text-[#71717A]">⌘K</kbd>
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
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#1C1C21] text-[#FFFFFF]'
                    : 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#121215]'
                } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                title={item.label}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[#27272A] space-y-2">
          <AccountButton collapsed={sidebarCollapsed} />
          {!sidebarCollapsed && (
            <>
              <button
                onClick={() => setEqModalOpen(true)}
                className="w-full flex items-center gap-2.5 rounded-lg border border-[#27272A] bg-[#121215] px-3 py-2 text-xs font-medium text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#1C1C21] transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>10-Band EQ & DSP</span>
              </button>
              <PWAInstallButton />
            </>
          )}
        </div>
      </aside>

      {/* Mobile Compact Header */}
      <header className="md:hidden sticky top-0 z-20 h-13 px-4 flex items-center justify-between border-b border-[#27272A] bg-[#09090B]">
        <button
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2 whitespace-nowrap shrink-0 min-h-[44px]"
        >
          <Disc3 className="w-5 h-5 text-[#FAFAFA]" strokeWidth={1.75} />
          <span className="font-display text-base font-semibold tracking-tight">
            Dulo
          </span>
        </button>

        <div className="flex items-center gap-1.5">
          <PWAInstallButton compact dismissible={false} label="Install" />
          <AccountButton compact />
          <button
            onClick={() => setActiveTab('stats')}
            aria-label="Dulo Pulse Stats"
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-colors ${
              activeTab === 'stats' ? 'text-[#FAFAFA] bg-[#1C1C21]' : 'text-[#A1A1AA]'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            aria-label="Settings"
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-colors ${
              activeTab === 'settings' ? 'text-[#FAFAFA] bg-[#1C1C21]' : 'text-[#A1A1AA]'
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Scrollable Viewport */}
      <main
        className={`relative z-10 bg-[#09090B] flex-1 min-w-0 pb-36 md:pb-28 transition-[margin] duration-200 spring-transition ${
          sidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-60'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>

      {/* Mobile 3-Tab Bottom Navigation Bar with Spring-Animated Active Slider */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-16 border-t border-[#27272A] bg-[#09090B] px-3 flex items-center"
      >
        <div className="grid grid-cols-3 w-full relative">
          {MOBILE_NAV.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex flex-col items-center justify-center min-h-[48px] rounded-xl transition-colors z-10 ${
                  active ? 'text-[#FAFAFA]' : 'text-[#71717A]'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="mobile-tab-slider"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    className="absolute inset-x-2 inset-y-1 rounded-xl bg-[#1C1C21] border border-[#27272A] -z-10"
                  />
                )}
                <Icon className="w-5 h-5" />
                <span className="text-[11px] font-medium mt-0.5">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
