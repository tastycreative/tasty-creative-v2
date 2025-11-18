import { useState } from 'react';

interface GalleryFavoriteButtonProps {
  galleryId: string;
  folderName: string;
  isFavorited: boolean;
  onChange?: (favorited: boolean) => void;
}

export default function GalleryFavoriteButton({ galleryId, folderName, isFavorited, onChange }: GalleryFavoriteButtonProps) {
  const [favorited, setFavorited] = useState(isFavorited);
  const [loading, setLoading] = useState(false);

  const toggleFavorite = async () => {
    setLoading(true);
    try {
      if (favorited) {
        await fetch('/api/oftv-gallery/folder-favorite', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ galleryId, folderName }),
        });
        setFavorited(false);
        onChange?.(false);
      } else {
        await fetch('/api/oftv-gallery/folder-favorite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ galleryId, folderName }),
        });
        setFavorited(true);
        onChange?.(true);
      }
    } catch (e) {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      disabled={loading}
      aria-label={favorited ? 'Unfavorite folder' : 'Favorite folder'}
      className={`text-pink-500 ${favorited ? 'font-bold' : 'opacity-50'} transition`}
    >
      {favorited ? '★' : '☆'}
    </button>
  );
}
