import { useState, useCallback } from "react";

interface ExportProgressEvent {
  type: "progress" | "complete" | "error";
  progress?: number;
  blob?: Blob;
  error?: string;
}

export const useGifExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const exportToGif = useCallback(
    async (
      clips: Clip[],
      textOverlays: TextOverlay[],
      blurOverlays: BlurOverlay[],
      clipEffects: Record<string, any>,
      contentDuration: number,
      opts?: { playbackSpeed?: number }
    ) => {
      try {
        setIsExporting(true);
        setExportProgress(0);

        // Try server-side rendering first
        const serverResp = await fetch("/api/render-gif", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clips,
            textOverlays,
            blurOverlays,
            clipEffects,
            fps: 30,
            width: 1920,
            height: 1080,
            durationInFrames: Math.max(1, Math.round(contentDuration || 1)),
          }),
        });

        if (serverResp.ok) {
          const data = await serverResp.json();
          const url = data.gifUrl as string;
          downloadGif(url, `export_${Date.now()}.gif`);
          return;
        }

        // Fallback to optimized client-side export
        await exportClientSide(
          clips,
          textOverlays,
          blurOverlays,
          clipEffects,
          contentDuration,
          opts
        );
      } catch (error: any) {
        console.error("GIF export failed:", error);
        throw new Error(error?.message || "Export failed");
      } finally {
        setIsExporting(false);
        setExportProgress(0);
      }
    },
    []
  );

  const exportClientSide = useCallback(
    async (
      clips: Clip[],
      textOverlays: TextOverlay[],
      blurOverlays: BlurOverlay[],
      clipEffects: Record<string, any>,
      contentDuration: number,
      opts?: { playbackSpeed?: number }
    ) => {
      // Optimized settings for performance
      const playbackSpeed = Math.max(
        0.25,
        Math.min(4, Number(opts?.playbackSpeed || 1))
      );
      const fps = 15; // Reduced from 30 for faster processing
      const outWidth = 480; // Reduced resolution
      const outHeight = Math.round((outWidth * 1080) / 1920);
      const totalFrames = Math.max(
        1,
        Math.round((((contentDuration || 1) / 30) * fps) / playbackSpeed)
      );

      // Create canvas
      const canvas = document.createElement("canvas");
      canvas.width = outWidth;
      canvas.height = outHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      // Preload video clips
      const videoClips = clips
        .filter((c) => c.type === "video")
        .sort((a, b) => a.start - b.start);
      if (videoClips.length === 0) throw new Error("No video clips to export.");

      const videos: Record<string, HTMLVideoElement> = {};

      // Batch load videos with concurrent loading
      await Promise.all(
        videoClips.map(async (clip, index) => {
          return new Promise<void>((resolve, reject) => {
            const video = document.createElement("video");
            video.src = clip.src;
            video.muted = true;
            video.crossOrigin = "anonymous";
            video.preload = "metadata";

            const timeout = setTimeout(() => {
              reject(new Error(`Video ${index} load timeout`));
            }, 10000);

            video.onloadeddata = () => {
              clearTimeout(timeout);
              videos[clip.id] = video;
              resolve();
            };

            video.onerror = () => {
              clearTimeout(timeout);
              reject(new Error(`Failed to load video ${index}`));
            };
          });
        })
      );

      // Preload image clips
      const imageClips = clips.filter((c) => c.type === "image");
      const images: Record<string, HTMLImageElement> = {};

      await Promise.all(
        imageClips.map(
          (clip) =>
            new Promise<void>((resolve) => {
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.onload = () => {
                images[clip.id] = img;
                resolve();
              };
              img.onerror = () => resolve(); // Continue even if image fails
              img.src = clip.src;
            })
        )
      );

      // Initialize GIF encoder with optimized settings
      const { default: GIF } = await import("gif.js");
      const gif = new GIF({
        workers: Math.min(navigator.hardwareConcurrency || 2, 4), // Use available CPU cores
        quality: 15, // Slightly reduced quality for speed
        width: outWidth,
        height: outHeight,
        workerScript: "/gif.worker.js",
        background: "#000000",
        transparent: null,
        repeat: 0,
        dither: false, // Disable dithering for speed
      });

      const delay = Math.round(1000 / fps);

      // Render frames with progress updates
      for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
        const timelineFrame = Math.round(
          ((frameIndex * 30) / fps) * playbackSpeed
        );

        // Clear canvas
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, outWidth, outHeight);

        // Render active video clip
        const activeVideoClip = videoClips.find(
          (c) =>
            timelineFrame >= c.start && timelineFrame < c.start + c.duration
        );

        if (activeVideoClip) {
          const video = videos[activeVideoClip.id];
          if (video) {
            const localFrame =
              timelineFrame -
              activeVideoClip.start +
              (activeVideoClip.startFrom || 0);
            // Map timeline frames to source video time (no per-clip speed)
            let videoTime = Math.max(0, localFrame / 30 - 0.01);
            if (!Number.isNaN(video.duration) && video.duration > 0) {
              const maxTime = Math.max(0, video.duration - 0.05);
              videoTime = Math.min(videoTime, maxTime);
            }

            try {
              video.currentTime = videoTime;
              await new Promise<void>((resolve) => {
                const handleSeeked = () => {
                  video.removeEventListener("seeked", handleSeeked);
                  resolve();
                };
                video.addEventListener("seeked", handleSeeked);
                if (video.readyState >= 2) resolve();
              });

              // Draw video with cover fit
              drawVideoCover(ctx, video, outWidth, outHeight);
            } catch (e) {
              console.warn("Video seek failed:", e);
            }
          }
        }

        // Render active image clips
        const activeImages = imageClips.filter(
          (c) =>
            timelineFrame >= c.start && timelineFrame < c.start + c.duration
        );

        for (const imageClip of activeImages) {
          const img = images[imageClip.id];
          if (img) {
            renderImageClip(ctx, img, imageClip, outWidth, outHeight);
          }
        }

        // Render blur overlays (simplified for performance)
        const activeBlurs = blurOverlays.filter(
          (b) =>
            timelineFrame >= b.start && timelineFrame < b.start + b.duration
        );

        if (activeBlurs.length > 0) {
          renderBlurOverlays(ctx, activeBlurs, outWidth, outHeight);
        }

        // Render text overlays
        const activeTexts = textOverlays.filter(
          (t) =>
            timelineFrame >= t.start && timelineFrame < t.start + t.duration
        );

        for (const textOverlay of activeTexts) {
          renderTextOverlay(ctx, textOverlay, outWidth, outHeight);
        }

        // Add frame to GIF
        gif.addFrame(canvas, { delay, copy: true });

        // Update progress
        const progress = Math.round((frameIndex / totalFrames) * 100);
        setExportProgress(progress);

        // Yield to browser every few frames
        if (frameIndex % 3 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }

      // Generate GIF
      const blob: Blob = await new Promise((resolve) => {
        gif.on("finished", (blob: Blob) => resolve(blob));
        gif.render();
      });

      // Download
      const url = URL.createObjectURL(blob);
      downloadGif(url, `export_${Date.now()}.gif`);
      URL.revokeObjectURL(url);
    },
    []
  );

  // Helper functions
  const drawVideoCover = (
    ctx: CanvasRenderingContext2D,
    video: HTMLVideoElement,
    targetW: number,
    targetH: number
  ) => {
    const canvasAspect = targetW / targetH;
    const videoAspect =
      video.videoWidth && video.videoHeight
        ? video.videoWidth / video.videoHeight
        : 16 / 9;

    let drawW = targetW;
    let drawH = targetH;

    if (videoAspect > canvasAspect) {
      drawH = targetH;
      drawW = drawH * videoAspect;
    } else {
      drawW = targetW;
      drawH = drawW / videoAspect;
    }

    const offsetX = (targetW - drawW) / 2;
    const offsetY = (targetH - drawH) / 2;
    ctx.drawImage(video, offsetX, offsetY, drawW, drawH);
  };

  const renderImageClip = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    clip: Clip,
    outWidth: number,
    outHeight: number
  ) => {
    const x = ((clip.x || 50) / 100) * outWidth;
    const y = ((clip.y || 50) / 100) * outHeight;
    const w = ((clip.width || 50) / 100) * outWidth;
    const h = ((clip.height || 50) / 100) * outHeight;
    const rot = (clip.rotation || 0) * (Math.PI / 180);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  };

  const renderBlurOverlays = (
    ctx: CanvasRenderingContext2D,
    blurs: BlurOverlay[],
    outWidth: number,
    outHeight: number
  ) => {
    // True blur rendering: blur the already-drawn frame within each region
    for (const blur of blurs) {
      const x = ((blur.x || 50) / 100) * outWidth;
      const y = ((blur.y || 50) / 100) * outHeight;
      const w = ((blur.width || 30) / 100) * outWidth;
      const h = ((blur.height || 30) / 100) * outHeight;
      const shape = (blur as any).shape || "rect";
      const intensity = Math.max(
        1,
        Math.min(50, Number((blur as any).intensity) || 10)
      );

      // Snapshot current frame to offscreen canvas
      const offscreen = document.createElement("canvas");
      offscreen.width = outWidth;
      offscreen.height = outHeight;
      const offCtx = offscreen.getContext("2d");
      if (!offCtx) continue;
      offCtx.drawImage(
        ctx.canvas as HTMLCanvasElement,
        0,
        0,
        outWidth,
        outHeight
      );

      // Clip and draw blurred snapshot back onto the main canvas
      ctx.save();
      if (shape === "circle") {
        const radius = Math.min(w, h) / 2;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.clip();
      } else {
        ctx.beginPath();
        ctx.rect(x - w / 2, y - h / 2, w, h);
        ctx.clip();
      }
      ctx.filter = `blur(${intensity}px)`;
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(offscreen, 0, 0, outWidth, outHeight);
      ctx.filter = "none";
      ctx.restore();
    }
  };

  const renderTextOverlay = (
    ctx: CanvasRenderingContext2D,
    textOverlay: TextOverlay,
    outWidth: number,
    outHeight: number
  ) => {
    const x = ((textOverlay.x || 50) / 100) * outWidth;
    const y = ((textOverlay.y || 50) / 100) * outHeight;
    const fontSize = Math.max(10, Math.round((textOverlay.fontSize || 5) * 16));
    const rot = (textOverlay.rotation || 0) * (Math.PI / 180);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillText(textOverlay.text || "", 0, 0);
    ctx.restore();
  };

  const downloadGif = (url: string, filename: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return {
    isExporting,
    exportProgress,
    exportToGif,
  };
};
