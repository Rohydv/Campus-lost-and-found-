import React from 'react';
import { cn, getInitials } from '../../lib/utils';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  return (
    <div
      className={cn(
        'rounded-full flex-shrink-0 overflow-hidden',
        sizes[size],
        !src && 'bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold',
        className
      )}
    >
      {src ? (
        <img src={src} alt={name ?? 'User'} className="w-full h-full object-cover" />
      ) : (
        <span>{name ? getInitials(name) : '?'}</span>
      )}
    </div>
  );
}
