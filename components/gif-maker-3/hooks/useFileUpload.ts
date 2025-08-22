import { useState, useCallback } from "react";
import { EDITOR_FPS } from "@/utils/fps";

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  file: File;
}

export const useFileUpload = () => {
  const [uploadedVideos, setUploadedVideos] = useState<UploadedFile[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const getVideoDurationInFrames = useCallback(
    (videoElement: HTMLVideoElement): Promise<number> => {
      return new Promise((resolve) => {
        const onLoadedMetadata = () => {
          const durationInSeconds = videoElement.duration;
          const durationInFrames = Math.round(durationInSeconds * EDITOR_FPS);
          videoElement.removeEventListener("loadedmetadata", onLoadedMetadata);
          resolve(durationInFrames);
        };

        if (videoElement.readyState >= 1) {
          const durationInSeconds = videoElement.duration;
          const durationInFrames = Math.round(durationInSeconds * EDITOR_FPS);
          resolve(durationInFrames);
        } else {
          videoElement.addEventListener("loadedmetadata", onLoadedMetadata);
        }
      });
    },
    []
  );

  const handleFileUpload = useCallback(
    async (
      files: FileList | File[],
      clips: Clip[],
      getNextAvailableRow: () => number,
      onClipAdd: (clip: Clip) => void
    ) => {
      const fileArray = Array.from(files);
      
      // Filter for supported video formats
      const supportedVideoTypes = [
        'video/mp4',
        'video/webm',
        'video/quicktime', // .mov files
        'video/x-msvideo', // .avi files
      ];
      
      const videoFiles = fileArray.filter((file) => {
        const isVideo = file.type.startsWith("video/");
        const isSupported = supportedVideoTypes.includes(file.type) || 
                           file.name.toLowerCase().endsWith('.mp4') ||
                           file.name.toLowerCase().endsWith('.webm') ||
                           file.name.toLowerCase().endsWith('.mov');
        
        if (isVideo && !isSupported) {
          alert(`Unsupported video format: ${file.name}\nPlease use MP4, WebM, or MOV files.`);
          return false;
        }
        
        return isVideo;
      });
      const imageFiles = fileArray.filter((file) =>
        file.type.startsWith("image/")
      );

      // Process videos
      const videoPromises = videoFiles.map(async (file) => {
        const url = URL.createObjectURL(file);
        const uploadedVideo = {
          id: `uploaded-${Date.now()}-${Math.random()}`,
          name: file.name,
          url,
          file,
        };

        setUploadedVideos((prev) => [...prev, uploadedVideo]);

        // Get duration and dimensions, then create clip
        const tempVideo = document.createElement("video");
        tempVideo.src = url;

        try {
          // Wait for metadata to load to get dimensions
          await new Promise((resolve, reject) => {
            tempVideo.onloadedmetadata = resolve;
            tempVideo.onerror = reject;
          });

          const actualDuration = await getVideoDurationInFrames(tempVideo);
          const intrinsicWidth = tempVideo.videoWidth;
          const intrinsicHeight = tempVideo.videoHeight;

          const newClip: Clip = {
            id: `clip-${Date.now()}-${Math.random()}`,
            start:
              clips.length > 0
                ? Math.max(...clips.map((c) => c.start + c.duration))
                : 0,
            duration: actualDuration,
            src: url,
            row: getNextAvailableRow(),
            type: "video",
            fileName: file.name,
            intrinsicWidth,
            intrinsicHeight,
            autoFit: true, // Enable auto-fit by default
          };
          onClipAdd(newClip);
        } catch (error) {
          console.error(`Error loading video ${file.name}:`, error);
          
          // Check if it's a format error
          if (error instanceof Event && error.type === 'error') {
            alert(`Failed to load video: ${file.name}\nThis video format may not be supported. Please try converting to MP4 with H.264 encoding.`);
            URL.revokeObjectURL(url); // Clean up the blob URL
            return; // Don't add the clip if it failed to load
          }
          
          // For other errors, create fallback clip with warning
          console.warn(`Using fallback dimensions for ${file.name}`);
          const newClip: Clip = {
            id: `clip-${Date.now()}-${Math.random()}`,
            start:
              clips.length > 0
                ? Math.max(...clips.map((c) => c.start + c.duration))
                : 0,
            duration: 300, // 10 seconds fallback
            src: url,
            row: getNextAvailableRow(),
            type: "video",
            fileName: file.name,
            intrinsicWidth: 1920, // Default HD dimensions
            intrinsicHeight: 1080,
            autoFit: true, // Enable auto-fit by default
          };
          onClipAdd(newClip);
        }
      });

      // Process images
      imageFiles.forEach((file) => {
        const url = URL.createObjectURL(file);
        const uploadedImage = {
          id: `uploaded-img-${Date.now()}-${Math.random()}`,
          name: file.name,
          url,
          file,
        };
        setUploadedImages((prev) => [...prev, uploadedImage]);
      });

      await Promise.all(videoPromises);
    },
    [getVideoDurationInFrames]
  );

  const removeUploadedVideo = useCallback((id: string) => {
    setUploadedVideos((prev) => {
      const video = prev.find((v) => v.id === id);
      if (video) {
        URL.revokeObjectURL(video.url);
      }
      return prev.filter((v) => v.id !== id);
    });
  }, []);

  const removeUploadedImage = useCallback((id: string) => {
    setUploadedImages((prev) => {
      const image = prev.find((i) => i.id === id);
      if (image) {
        URL.revokeObjectURL(image.url);
      }
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  // Drag handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (
      e: React.DragEvent,
      clips: Clip[],
      getNextAvailableRow: () => number,
      onClipAdd: (clip: Clip) => void
    ) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileUpload(files, clips, getNextAvailableRow, onClipAdd);
      }
    },
    [handleFileUpload]
  );

  return {
    uploadedVideos,
    uploadedImages,
    isDragOver,
    handleFileUpload,
    removeUploadedVideo,
    removeUploadedImage,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
};
