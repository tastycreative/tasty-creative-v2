"use client";

import React from 'react';
import WallPostGallery from './WallPostGallery';
import OFTVGallery from './OFTVGallery';

interface BoardGalleryProps {
  teamId: string;
  teamName: string;
}

export default function BoardGallery({ teamId, teamName }: BoardGalleryProps) {
  // Render the appropriate gallery based on team name
  if (teamName === 'Wall Post') {
    return <WallPostGallery teamId={teamId} teamName={teamName} />;
  }

  if (teamName === 'OFTV') {
    return <OFTVGallery teamId={teamId} teamName={teamName} />;
  }

  // Fallback for unsupported teams
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-800 dark:via-gray-700/50 dark:to-purple-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60">
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Gallery not available</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Gallery is only available for selected Teams
      </p>
    </div>
  );
}
