"use client";

import React from "react";

interface TimelineItemProps {
  item: Clip | TextOverlay;
  type: "clip" | "text";
  index: number;
  totalDuration: number;
}

const TimelineItem: React.FC<TimelineItemProps> = ({
  item,
  type,
  index,
  totalDuration,
}) => {
  const [thumbnail, setThumbnail] = React.useState<string | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  // Generate thumbnail for video/image clips
  React.useEffect(() => {
    if (type === "clip" && "type" in item && "src" in item) {
      generateThumbnail();
    }
  }, [item, type]);

  const generateThumbnail = async () => {
    if (!("src" in item) || !("type" in item)) return;

    try {
      if (item.type === "video") {
        // Generate video thumbnail at the start frame
        const video = document.createElement("video");
        video.crossOrigin = "anonymous";
        video.muted = true;
        
        video.onloadeddata = () => {
          // Calculate the time to seek to (considering startFrom for trimmed clips)
          const seekTime = (item.startFrom || 0);
          video.currentTime = seekTime;
        };

        video.onseeked = () => {
          const canvas = canvasRef.current;
          if (!canvas) return;

          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          canvas.width = 60;
          canvas.height = 34;

          // Draw the video frame
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert to base64
          const thumbnailData = canvas.toDataURL("image/jpeg", 0.8);
          setThumbnail(thumbnailData);
        };

        video.onerror = () => {
          console.warn("Failed to load video for thumbnail:", item.src);
        };

        video.src = item.src;
      } else if (item.type === "image") {
        // Generate image thumbnail
        const img = new Image();
        img.crossOrigin = "anonymous";
        
        img.onload = () => {
          const canvas = canvasRef.current;
          if (!canvas) return;

          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          canvas.width = 60;
          canvas.height = 34;

          // Calculate aspect ratio and crop/fit the image
          const aspectRatio = img.width / img.height;
          const canvasAspectRatio = canvas.width / canvas.height;

          let drawWidth, drawHeight, drawX, drawY;

          if (aspectRatio > canvasAspectRatio) {
            // Image is wider - fit height and crop width
            drawHeight = canvas.height;
            drawWidth = drawHeight * aspectRatio;
            drawX = (canvas.width - drawWidth) / 2;
            drawY = 0;
          } else {
            // Image is taller - fit width and crop height
            drawWidth = canvas.width;
            drawHeight = drawWidth / aspectRatio;
            drawX = 0;
            drawY = (canvas.height - drawHeight) / 2;
          }

          ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
          
          // Convert to base64
          const thumbnailData = canvas.toDataURL("image/jpeg", 0.8);
          setThumbnail(thumbnailData);
        };

        img.onerror = () => {
          console.warn("Failed to load image for thumbnail:", item.src);
        };

        img.src = item.src;
      }
    } catch (error) {
      console.error("Error generating thumbnail:", error);
    }
  };

  // Theme-aware colors for video vs image clips (as fallback)
  let bgColor = "bg-purple-500 dark:bg-purple-600"; // default for text
  if (type === "clip" && "type" in item) {
    bgColor = item.type === "video" 
      ? "bg-blue-500 dark:bg-blue-600" 
      : "bg-green-500 dark:bg-green-600";
  }

  return (
    <>
      {/* Hidden canvas for thumbnail generation */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
      
      <div
        key={item.id}
        className={`absolute h-10 ${bgColor} rounded-md overflow-hidden border border-gray-300 dark:border-gray-600 shadow-sm dark:shadow-gray-800`}
        style={{
          left: `${(item.start / totalDuration) * 100}%`,
          width: `calc(${(item.duration / totalDuration) * 100}% - 4px)`,
          top: `${item.row * 44}px`,
        }}
      >
        {/* Thumbnail background */}
        {thumbnail && type === "clip" && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-80 dark:opacity-75"
            style={{
              backgroundImage: `url(${thumbnail})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        )}
        
        {/* Overlay with label - enhanced contrast for both themes */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/70 dark:bg-black/80 backdrop-blur-sm px-2 py-1 rounded text-xs text-white font-semibold border border-white/20 dark:border-white/10">
            {type === "clip" && "type" in item
              ? item.type === "video"
                ? `Video ${index + 1}`
                : `Image ${index + 1}`
              : `Text ${index + 1}`}
          </div>
        </div>

        {/* Optional: Add a subtle gradient overlay for better text contrast */}
        {thumbnail && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20 dark:from-black/40 dark:to-black/30" />
        )}
      </div>
    </>
  );
};

export default TimelineItem;