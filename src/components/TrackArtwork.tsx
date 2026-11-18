import React, { useEffect, useState } from 'react';
import { Disc3 } from 'lucide-react';

interface TrackArtworkProps {
  src?: string;
  alt: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const TrackArtwork: React.FC<TrackArtworkProps> = ({
  src,
  alt,
  className = '',
  size = 'md',
}) => {
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setErrored(false);
  }, [src]);

  const iconSizes = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
    xl: 'w-14 h-14',
  };

  if (!src || errored) {
    return (
      <div
        className={`flex items-center justify-center bg-[#1C1C21] border border-[#27272A] text-[#71717A] shrink-0 ${className}`}
        aria-label={alt}
      >
        <Disc3 className={iconSizes[size]} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setErrored(true)}
      className={`object-cover bg-[#1C1C21] shrink-0 ${className}`}
      loading="lazy"
    />
  );
};
