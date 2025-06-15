// galleryStorage.ts - Shared gallery storage system
// This should be imported by both components

// Types
interface GeneratedImage {
  id: string;
  imageUrl: string;
  filename: string;
  prompt: string;
  negativePrompt?: string;
  settings: any;
  timestamp: Date;
  isBookmarked?: boolean;
  isInVault?: boolean;
  blobUrl?: string;
  type: "image";
}

interface GeneratedVideo {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string;
  filename: string;
  prompt: string;
  negativePrompt?: string;
  settings: any;
  timestamp: Date;
  isBookmarked?: boolean;
  isInVault?: boolean;
  blobUrl?: string;
  duration: number;
  fileSize?: number;
  status: "generating" | "completed" | "failed";
  progress?: number;
  sourceImage?: string;
  type: "video";
}

// Global gallery storage manager (in-memory for Claude artifacts)
class GalleryStorageManager {
  private static instance: GalleryStorageManager;
  private images: GeneratedImage[] = [];
  private videos: GeneratedVideo[] = [];
  private listeners: (() => void)[] = [];

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): GalleryStorageManager {
    if (!GalleryStorageManager.instance) {
      GalleryStorageManager.instance = new GalleryStorageManager();
    }
    return GalleryStorageManager.instance;
  }

  // Image methods
  getImages(): GeneratedImage[] {
    return [...this.images];
  }

  addImages(newImages: GeneratedImage[]) {
    this.images = [...newImages, ...this.images];
    this.notifyUpdate();
  }

  updateImage(id: string, updates: Partial<GeneratedImage>) {
    this.images = this.images.map(img => 
      img.id === id ? { ...img, ...updates } : img
    );
    this.notifyUpdate();
  }

  removeImages(ids: string[]) {
    this.images = this.images.filter(img => !ids.includes(img.id));
    this.notifyUpdate();
  }

  // Video methods
  getVideos(): GeneratedVideo[] {
    return [...this.videos];
  }

  addVideos(newVideos: GeneratedVideo[]) {
    this.videos = [...newVideos, ...this.videos];
    this.notifyUpdate();
  }

  updateVideo(id: string, updates: Partial<GeneratedVideo>) {
    this.videos = this.videos.map(vid => 
      vid.id === id ? { ...vid, ...updates } : vid
    );
    this.notifyUpdate();
  }

  removeVideos(ids: string[]) {
    this.videos = this.videos.filter(vid => !ids.includes(vid.id));
    this.notifyUpdate();
  }

  // General methods
  clearAll() {
    this.images = [];
    this.videos = [];
    this.notifyUpdate();
  }

  // Event system
  addUpdateListener(callback: () => void) {
    this.listeners.push(callback);
  }

  removeUpdateListener(callback: () => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  private notifyUpdate() {
    // Notify all listeners
    this.listeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Gallery storage listener error:', error);
      }
    });

    // Also dispatch window event for backward compatibility
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gallery-storage-updated'));
    }
  }

  // Statistics
  getStats() {
    const totalItems = this.images.length + this.videos.length;
    const totalBookmarks = [...this.images, ...this.videos].filter(
      item => item.isBookmarked
    ).length;

    return {
      totalItems,
      totalImages: this.images.length,
      totalVideos: this.videos.length,
      totalBookmarks,
      storageUsed: `${Math.round((this.images.length * 2.5 + this.videos.length * 15) * 10) / 10} MB`,
    };
  }
}

// Create and expose the global instance
const GalleryStorage = GalleryStorageManager.getInstance();

// Make it globally available
if (typeof window !== 'undefined') {
  (window as any).GalleryStorage = GalleryStorage;
}

// Export for direct imports
export { GalleryStorage, type GeneratedImage, type GeneratedVideo };

// Helper function for saving videos to gallery
export const saveVideosToGallery = (newVideos: GeneratedVideo[]) => {
  try {
    console.log(`✅ Saving ${newVideos.length} video(s) to gallery`);
    GalleryStorage.addVideos(newVideos);
    console.log('✅ Videos saved to gallery storage');
  } catch (error) {
    console.error("Failed to save videos to gallery:", error);
  }
};

// Helper function for saving images to gallery
export const saveImagesToGallery = (newImages: GeneratedImage[]) => {
  try {
    console.log(`✅ Saving ${newImages.length} image(s) to gallery`);
    GalleryStorage.addImages(newImages);
    console.log('✅ Images saved to gallery storage');
  } catch (error) {
    console.error("Failed to save images to gallery:", error);
  }
};