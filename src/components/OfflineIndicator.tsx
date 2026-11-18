import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed top-3 right-3 z-50 flex items-center gap-2 rounded-lg border border-[#27272A] bg-[#121215] px-3 py-1.5 text-xs font-medium text-[#FAFAFA]"
    >
      <WifiOff className="w-3.5 h-3.5 text-[#A1A1AA]" />
      <span>Offline Mode — Playing from IndexedDB Vault</span>
    </div>
  );
};
