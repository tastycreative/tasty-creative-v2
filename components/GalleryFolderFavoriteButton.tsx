import React from 'react';
import { Star } from 'lucide-react';

interface GalleryFolderFavoriteButtonProps {
  galleryId: string;
  folderName: string;
  isFavorite: boolean;
  onToggle: (newState: boolean) => void;
  disabled?: boolean;
}

export default function GalleryFolderFavoriteButton({
  galleryId,
  folderName,
  isFavorite,
  onToggle,
  disabled = false,
}: GalleryFolderFavoriteButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    // Delegate actual API work to parent via onToggle so parent can perform optimistic updates
    onToggle(!isFavorite);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={isFavorite ? 'Unfavorite folder' : 'Favorite folder'}
  className={`ml-2 inline-flex items-center justify-center transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:ring-offset-0 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:text-pink-600'
      }`}
      style={{ width: 32, height: 32 }}
    >
      <Star
        className={`h-5 w-5 fill-current transition-colors ${isFavorite ? 'text-pink-500' : 'text-gray-500'}`}
        strokeWidth={0}
      />
    </button>
  );
}
