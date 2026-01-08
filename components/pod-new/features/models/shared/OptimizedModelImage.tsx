"use client";

import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import Image from "next/image";
import { isOptimizable } from "@/lib/image-optimization";
import { cn } from "@/lib/utils";

interface ModelImageProps {
  name: string;
  profileImage?: string;
}

interface OptimizedModelImageProps {
  model: ModelImageProps;
  priority?: boolean;
}

/**
 * Optimized model image component with lazy loading, skeleton states, and fallback
 */
export const OptimizedModelImage = memo(
  ({ model, priority }: OptimizedModelImageProps) => {
    const [imageState, setImageState] = useState<"loading" | "loaded" | "error">(
      "loading"
    );
    const [isIntersecting, setIsIntersecting] = useState(false);
    const imageRef = useRef<HTMLDivElement>(null);

    // Intersection Observer for lazy loading
    useEffect(() => {
      if (priority) {
        setIsIntersecting(true);
        return;
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsIntersecting(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1, rootMargin: "50px" }
      );

      if (imageRef.current) {
        observer.observe(imageRef.current);
      }

      return () => observer.disconnect();
    }, [priority]);

    const imageUrl = useMemo(() => {
      const url = model.profileImage || "";
      if (!url) return null;

      // Google Drive handling
      if (url.includes("drive.google.com")) {
        try {
          const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
          let driveId: string | null = null;
          if (fileMatch && fileMatch[1]) {
            driveId = fileMatch[1];
          } else {
            const urlObj = new URL(url);
            driveId = urlObj.searchParams.get("id");
          }
          if (driveId) {
            return `https://drive.google.com/thumbnail?id=${driveId}&sz=w400`;
          }
        } catch {
          // fall through
        }
      }
      return url;
    }, [model.profileImage]);

    const handleImageLoad = useCallback(() => {
      setImageState("loaded");
    }, []);

    const handleImageError = useCallback(() => {
      setImageState("error");
    }, []);

    // Fallback avatar
    const FallbackAvatar = useMemo(
      () => (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-white/30 dark:bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-700 dark:text-primary-200">
                {model.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="absolute inset-0 rounded-full ring-2 ring-white/20 ring-offset-2 ring-offset-transparent" />
          </div>
        </div>
      ),
      [model.name]
    );

    if (imageState === "error" || !imageUrl) {
      return FallbackAvatar;
    }

    return (
      <div ref={imageRef} className="relative w-full h-full">
        {/* Skeleton loader */}
        {imageState === "loading" && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 animate-pulse" />
        )}

        {/* Main image */}
        {isIntersecting && (
          <Image
            src={imageUrl}
            alt={model.name}
            fill
            className={cn(
              "object-cover transition-opacity duration-300",
              imageState === "loaded" ? "opacity-100" : "opacity-0"
            )}
            onLoad={handleImageLoad}
            onError={handleImageError}
            priority={priority}
            unoptimized={!isOptimizable(imageUrl)}
            quality={85}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        )}

        {/* Gradient overlay for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      </div>
    );
  }
);

OptimizedModelImage.displayName = "OptimizedModelImage";
