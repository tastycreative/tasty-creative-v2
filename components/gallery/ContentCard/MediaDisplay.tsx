"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { Play, ImageOff } from "lucide-react";
import { MediaDisplayProps } from "@/types/gallery";

const MediaDisplay: React.FC<MediaDisplayProps> = ({
  content,
  mediaUrl,
  isGif,
  onLoad,
  onError,
}) => {
  const [mediaError, setMediaError] = useState(false);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [useVideo, setUseVideo] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaLoadedRef = useRef(false);

  const handleImageError = () => {
    if (!useVideo && isGif) {
      setUseVideo(true);
      setMediaError(false);
    } else {
      setMediaError(true);
      onError?.();
    }
  };

  const handleImageLoad = () => {
    if (!mediaLoadedRef.current) {
      mediaLoadedRef.current = true;
      setMediaLoaded(true);
      onLoad?.();
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  }, [useVideo]);

  useEffect(() => {
    return () => {
      mediaLoadedRef.current = false;
    };
  }, [mediaUrl]);

  // If there's no valid media URL or media error, show "No Preview"
  if (mediaError || !mediaUrl || mediaUrl === "/api/placeholder-image") {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-black/90 backdrop-blur-sm rounded-full px-6 py-3">
          <p className="text-white text-sm font-medium">No Preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      {!mediaLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-pulse bg-gray-200/20 dark:bg-gray-700/20 w-full h-full" />
        </div>
      )}

      {isGif && !useVideo ? (
        <>
          <Image
            ref={imageRef}
            src={mediaUrl}
            alt={content.title}
            fill
            className={`object-cover transition-opacity duration-300 ${
              mediaLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            unoptimized
          />
          <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded backdrop-blur-sm">
            GIF
          </div>
        </>
      ) : isGif && useVideo ? (
        <>
          <video
            ref={videoRef}
            src={mediaUrl}
            className="w-full h-full object-cover"
            loop
            muted
            playsInline
            autoPlay
            onLoadedData={handleImageLoad}
            onError={handleImageError}
          />
          <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded backdrop-blur-sm">
            GIF
          </div>
        </>
      ) : (content.gifUrl || content.previewUrl || content.mediaUrl)?.includes(
          ".mp4"
        ) ||
        (content.gifUrl || content.previewUrl || content.mediaUrl)?.includes(
          ".mov"
        ) ? (
        <>
          <video
            ref={videoRef}
            src={mediaUrl}
            className="w-full h-full object-cover"
            loop
            muted
            playsInline
            onLoadedData={handleImageLoad}
            onError={handleImageError}
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/50 rounded-full p-3 backdrop-blur-sm">
              <Play className="w-6 h-6 text-white fill-white" />
            </div>
          </div>
        </>
      ) : (
        <Image
          ref={imageRef}
          src={mediaUrl}
          alt={content.title}
          fill
          className={`object-cover transition-opacity duration-300 ${
            mediaLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          unoptimized
        />
      )}
    </div>
  );
};

export default MediaDisplay;
