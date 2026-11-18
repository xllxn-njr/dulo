import React, { useState } from 'react';
import { Download, MonitorDown, Share, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

const DISMISS_STORAGE_KEY = 'dulo_install_prompt_dismissed_v1';

interface PWAInstallButtonProps {
  compact?: boolean;
  dismissible?: boolean;
  label?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  compact = false,
  dismissible = true,
  label = 'Install Dulo App',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  if (isInstalled) return null;
  if (dismissible && dismissed) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, 'true');
    } catch {
      // Ignore storage failures
    }
  };

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) return;
    }
    setShowGuideModal(true);
  };

  return (
    <>
      {compact ? (
        <button
          onClick={() => void handleClick()}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-[#FAFAFA] text-[#09090B] font-medium transition-colors hover:bg-[#E4E4E7] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FAFAFA] whitespace-nowrap shrink-0 px-2.5 py-1.5 text-xs min-h-[40px]"
        >
          {isIOS ? (
            <Share className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
          ) : (
            <Download className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
          )}
          <span>{label}</span>
        </button>
      ) : (
        <div className="flex items-center gap-1 rounded-lg border border-[#27272A] bg-[#121215] p-1">
          <button
            onClick={() => void handleClick()}
            className="flex-1 flex items-center justify-center gap-2 rounded-md bg-[#FAFAFA] text-[#09090B] font-medium transition-colors hover:bg-[#E4E4E7] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FAFAFA] whitespace-nowrap px-3 py-2 text-xs min-h-[36px]"
          >
            {isIOS ? (
              <Share className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
            ) : (
              <Download className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
            )}
            <span>{label}</span>
          </button>
          {dismissible && (
            <button
              onClick={handleDismiss}
              aria-label="Dismiss install prompt"
              title="Dismiss"
              className="p-2 rounded-md text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#1C1C21] transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setShowGuideModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Install Dulo App"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-[#27272A] bg-[#121215] p-6 space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-semibold text-[#FAFAFA]">
                  {isIOS ? 'Install Dulo on iOS' : 'Install Dulo App'}
                </h3>
                <p className="text-xs text-[#A1A1AA] mt-1">
                  Run Dulo in its own standalone window with offline app-shell caching and lock-screen controls.
                </p>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-2 rounded-lg text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#1C1C21]"
                aria-label="Close install guide"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <ol className="space-y-2.5 text-xs text-[#A1A1AA] leading-relaxed rounded-xl border border-[#27272A] bg-[#09090B] p-4">
                <li>1. Tap the Share button in the Safari toolbar.</li>
                <li>2. Scroll down and select Add to Home Screen.</li>
                <li>3. Tap Add to launch Dulo as a standalone app.</li>
              </ol>
            ) : (
              <div className="space-y-3 text-xs text-[#A1A1AA] leading-relaxed rounded-xl border border-[#27272A] bg-[#09090B] p-4">
                <div className="flex items-start gap-2.5">
                  <MonitorDown className="w-4 h-4 text-[#FAFAFA] shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-[#FAFAFA] font-medium">Desktop (Chrome / Edge):</strong>{' '}
                    Open Dulo in a standalone browser tab (if viewing inside an embedded preview) and click the Install icon in the address bar or choose <span className="text-[#FAFAFA]">Install Dulo</span> from the browser menu.
                  </p>
                </div>
                <div className="flex items-start gap-2.5 pt-2 border-t border-[#27272A]">
                  <Smartphone className="w-4 h-4 text-[#FAFAFA] shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-[#FAFAFA] font-medium">Mobile (Android / Safari):</strong>{' '}
                    Open the browser menu and tap <span className="text-[#FAFAFA]">Install app</span> or <span className="text-[#FAFAFA]">Add to Home Screen</span>.
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full rounded-xl bg-[#FAFAFA] py-2.5 text-xs font-semibold text-[#09090B] hover:bg-[#E4E4E7] transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};
