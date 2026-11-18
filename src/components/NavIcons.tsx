import React from 'react';

export interface NavIconProps {
  active?: boolean;
  className?: string;
}

export const SFHomeIcon: React.FC<NavIconProps> = ({ active = false, className = '' }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={`transition-transform duration-200 spring-transition ${
      active ? 'scale-[1.06]' : 'scale-100'
    } ${className}`}
  >
    {active ? (
      <path
        d="M11.35 3.18a1 1 0 0 1 1.3 0l7.5 6.45c.22.19.35.47.35.76V19a2 2 0 0 1-2 2h-3.75a.75.75 0 0 1-.75-.75V15a2 2 0 0 0-4 0v5.25a.75.75 0 0 1-.75.75H5.5a2 2 0 0 1-2-2v-8.61c0-.29.13-.57.35-.76l7.5-6.45Z"
        fill="#FFFFFF"
      />
    ) : (
      <path
        d="M4 10.25 12 3.5l8 6.75V19a1.75 1.75 0 0 1-1.75 1.75h-3.5v-5.25a2.75 2.75 0 0 0-5.5 0v5.25h-3.5A1.75 1.75 0 0 1 4 19v-8.75Z"
        stroke="rgba(255, 255, 255, 0.5)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )}
  </svg>
);

export const SFSearchIcon: React.FC<NavIconProps> = ({ active = false, className = '' }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={`transition-transform duration-200 spring-transition ${
      active ? 'scale-[1.06]' : 'scale-100'
    } ${className}`}
  >
    {active ? (
      <>
        <circle cx="10.75" cy="10.75" r="6.75" fill="rgba(255,255,255,0.16)" stroke="#FFFFFF" strokeWidth="2.2" />
        <path
          d="M15.75 15.75 20.25 20.25"
          stroke="#FFFFFF"
          strokeWidth="2.35"
          strokeLinecap="round"
        />
      </>
    ) : (
      <>
        <circle
          cx="10.75"
          cy="10.75"
          r="6.5"
          stroke="rgba(255, 255, 255, 0.5)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M15.6 15.6 20 20"
          stroke="rgba(255, 255, 255, 0.5)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </>
    )}
  </svg>
);

export const SFLibraryIcon: React.FC<NavIconProps> = ({ active = false, className = '' }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={`transition-transform duration-200 spring-transition ${
      active ? 'scale-[1.06]' : 'scale-100'
    } ${className}`}
  >
    {active ? (
      <>
        <path
          d="M6.5 4.25h11"
          stroke="#FFFFFF"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M5 7.25h14"
          stroke="#FFFFFF"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <rect x="3.5" y="9.75" width="17" height="10.75" rx="2.5" fill="#FFFFFF" />
        <path
          d="M10.75 17.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm1.5-1.5V12.5l3.25-.6v3.35"
          stroke="#0A0A0C"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ) : (
      <>
        <path
          d="M6.75 4.5h10.5"
          stroke="rgba(255, 255, 255, 0.5)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M5.25 7.5h13.5"
          stroke="rgba(255, 255, 255, 0.5)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <rect
          x="3.75"
          y="10.25"
          width="16.5"
          height="10"
          rx="2.25"
          stroke="rgba(255, 255, 255, 0.5)"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <circle cx="10.5" cy="16.25" r="1.25" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="1.6" />
        <path
          d="M11.75 16.25V12.75l2.75-.5"
          stroke="rgba(255, 255, 255, 0.5)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    )}
  </svg>
);

export const SFStatsIcon: React.FC<NavIconProps> = ({ active = false, className = '' }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={`transition-transform duration-200 spring-transition ${
      active ? 'scale-[1.06]' : 'scale-100'
    } ${className}`}
  >
    {active ? (
      <>
        <rect x="4" y="12.5" width="3.75" height="7.5" rx="1.6" fill="#FFFFFF" />
        <rect x="10.1" y="4.5" width="3.75" height="15.5" rx="1.6" fill="#FFFFFF" />
        <rect x="16.25" y="8.5" width="3.75" height="11.5" rx="1.6" fill="#FFFFFF" />
      </>
    ) : (
      <>
        <rect
          x="4.25"
          y="12.75"
          width="3.25"
          height="7"
          rx="1.2"
          stroke="rgba(255, 255, 255, 0.5)"
          strokeWidth="1.8"
        />
        <rect
          x="10.35"
          y="4.75"
          width="3.25"
          height="15"
          rx="1.2"
          stroke="rgba(255, 255, 255, 0.5)"
          strokeWidth="1.8"
        />
        <rect
          x="16.5"
          y="8.75"
          width="3.25"
          height="11"
          rx="1.2"
          stroke="rgba(255, 255, 255, 0.5)"
          strokeWidth="1.8"
        />
      </>
    )}
  </svg>
);

export const SFSettingsIcon: React.FC<NavIconProps> = ({ active = false, className = '' }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={`transition-transform duration-200 spring-transition ${
      active ? 'scale-[1.06]' : 'scale-100'
    } ${className}`}
  >
    {active ? (
      <>
        <path
          d="M4 7.5h9M17 7.5h3M4 16.5h3M11 16.5h9"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="15" cy="7.5" r="2.75" fill="#FFFFFF" />
        <circle cx="9" cy="16.5" r="2.75" fill="#FFFFFF" />
      </>
    ) : (
      <>
        <path
          d="M4 7.5h8.25M17.75 7.5H20M4 16.5h2.25M11.75 16.5H20"
          stroke="rgba(255, 255, 255, 0.5)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle
          cx="15"
          cy="7.5"
          r="2.5"
          stroke="rgba(255, 255, 255, 0.5)"
          strokeWidth="1.8"
        />
        <circle
          cx="9"
          cy="16.5"
          r="2.5"
          stroke="rgba(255, 255, 255, 0.5)"
          strokeWidth="1.8"
        />
      </>
    )}
  </svg>
);
