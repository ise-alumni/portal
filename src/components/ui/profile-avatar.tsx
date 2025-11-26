import React from 'react';
import { cn } from '@/lib/utils';

interface ProfileAvatarProps {
  src?: string | null;
  alt?: string;
  fullName?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-20 h-20 text-xl'
};

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  src,
  alt,
  fullName,
  size = 'md',
  className
}) => {
  const initials = fullName
    ? fullName
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  if (src) {
    return (
      <img
        src={src}
        alt={alt || `${fullName || 'User'} avatar`}
        className={cn(
          'rounded-full object-cover flex-shrink-0 border-2 border-border',
          sizeClasses[size],
          className
        )}
        onError={(e) => {
          // Fallback to initials if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent && !parent.querySelector('.fallback-avatar')) {
            const fallback = document.createElement('div');
            fallback.className = cn(
              'bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-medium border-2 border-border fallback-avatar',
              sizeClasses[size]
            );
            fallback.textContent = initials;
            parent.appendChild(fallback);
          }
        }}
      />
    );
  }

  return (
    <div
      className={cn(
        'bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-medium border-2 border-border',
        sizeClasses[size],
        className
      )}
    >
      {initials}
    </div>
  );
};

export default ProfileAvatar;