import React from 'react';
import { LogIn, User as UserIcon } from 'lucide-react';
import { useDulo } from '../store/DuloContext';

interface AccountButtonProps {
  collapsed?: boolean;
  compact?: boolean;
}

export const AccountButton: React.FC<AccountButtonProps> = ({
  collapsed = false,
  compact = false,
}) => {
  const { user, setAuthModalOpen } = useDulo();
  const isGoogleUser = Boolean(user && !user.isAnonymous);

  if (compact) {
    return (
      <button
        onClick={() => setAuthModalOpen(true)}
        aria-label={isGoogleUser ? 'Account profile' : 'Sign In'}
        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full border border-[#27272A] bg-[#121215] px-3 text-xs font-medium text-[#FAFAFA] hover:bg-[#1C1C21] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FAFAFA] transition-colors whitespace-nowrap shrink-0"
      >
        {isGoogleUser && user?.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'Profile avatar'}
            referrerPolicy="no-referrer"
            className="w-6 h-6 rounded-full object-cover"
          />
        ) : isGoogleUser ? (
          <UserIcon className="w-4 h-4 text-[#FAFAFA]" />
        ) : (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </span>
        )}
      </button>
    );
  }

  if (collapsed) {
    return (
      <button
        onClick={() => setAuthModalOpen(true)}
        title={isGoogleUser ? user?.displayName || 'Synced Account' : 'Sign In'}
        aria-label={isGoogleUser ? 'Account profile' : 'Sign In'}
        className="w-full h-10 flex items-center justify-center rounded-lg border border-[#27272A] bg-[#121215] hover:bg-[#1C1C21] transition-colors"
      >
        {isGoogleUser && user?.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'Profile avatar'}
            referrerPolicy="no-referrer"
            className="w-6 h-6 rounded-full object-cover"
          />
        ) : isGoogleUser ? (
          <UserIcon className="w-4 h-4 text-[#FAFAFA]" />
        ) : (
          <LogIn className="w-4 h-4 text-[#A1A1AA]" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={() => setAuthModalOpen(true)}
      className="w-full flex items-center justify-between gap-2.5 rounded-full border border-[#27272A] bg-[#121215] px-3 py-2 text-left hover:bg-[#1C1C21] transition-colors"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {isGoogleUser && user?.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'Profile avatar'}
            referrerPolicy="no-referrer"
            className="w-6 h-6 rounded-full object-cover shrink-0 border border-[#27272A]"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-[#1C1C21] border border-[#27272A] flex items-center justify-center shrink-0">
            {isGoogleUser ? (
              <UserIcon className="w-3.5 h-3.5 text-[#FAFAFA]" />
            ) : (
              <LogIn className="w-3.5 h-3.5 text-[#A1A1AA]" />
            )}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#FAFAFA] truncate">
            {isGoogleUser ? user?.displayName || 'Google Account' : 'Sign In'}
          </p>
          <p className="text-[10px] text-[#71717A] truncate">
            {isGoogleUser ? 'Cloud Sync Active' : 'Anonymous Session'}
          </p>
        </div>
      </div>
    </button>
  );
};
