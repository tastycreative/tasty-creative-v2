"use client";

import React from 'react';
import Image from 'next/image';

interface UserData {
  id: string;
  name?: string | null;
  email: string | null;
  image?: string | null;
}

interface UserProfileProps {
  user: UserData;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTooltip?: boolean;
  onClick?: () => void;
}

const sizeConfig = {
  xs: {
    container: 'w-4 h-4',
    text: 'text-[8px]',
    border: 'border'
  },
  sm: {
    container: 'w-6 h-6',
    text: 'text-xs',
    border: 'border'
  },
  md: {
    container: 'w-8 h-8',
    text: 'text-sm',
    border: 'border-2'
  },
  lg: {
    container: 'w-10 h-10',
    text: 'text-base',
    border: 'border-2'
  },
  xl: {
    container: 'w-12 h-12',
    text: 'text-lg',
    border: 'border-2'
  }
};

export default function UserProfile({ 
  user, 
  size = 'md', 
  className = '', 
  showTooltip = false,
  onClick 
}: UserProfileProps) {
  const config = sizeConfig[size];
  const displayName = user.name || user.email?.split('@')[0] || 'User';
  const initials = user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U';
  
  const profileElement = (
    <div 
      className={`relative ${config.container} ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''} ${className}`}
      onClick={onClick}
      title={showTooltip ? displayName : undefined}
    >
      {user.image ? (
        <Image
          src={user.image}
          alt={displayName}
          width={size === 'xs' ? 16 : size === 'sm' ? 24 : size === 'md' ? 32 : size === 'lg' ? 40 : 48}
          height={size === 'xs' ? 16 : size === 'sm' ? 24 : size === 'md' ? 32 : size === 'lg' ? 40 : 48}
          className={`${config.container} rounded-full object-cover ${config.border} border-white dark:border-gray-800 shadow-sm`}
        />
      ) : (
        <div className={`${config.container} bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center ${config.border} border-white dark:border-gray-800 shadow-sm`}>
          <span className={`text-white font-semibold ${config.text}`}>
            {initials}
          </span>
        </div>
      )}
    </div>
  );

  return profileElement;
}