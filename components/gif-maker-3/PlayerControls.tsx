/**
 * Optimized Player Controls - Separated component to prevent Player re-renders
 * Following Remotion best practices for optimal performance
 */

"use client";

import React, { useEffect, memo } from "react";
import { EDITOR_FPS } from "@/utils/fps";
import { PlayerRef } from "@remotion/player";

interface PlayerControlsProps {
  playerRef: React.RefObject<PlayerRef>;
  currentFrame: number;
  contentDuration: number;
  onFrameChange: (frame: number) => void;
}

const PlayerControls: React.FC<PlayerControlsProps> = memo(
  ({ playerRef, currentFrame, contentDuration, onFrameChange }) => {
    // Note: isUpdatingFromPlayer state available for future seek functionality
    // const [isUpdatingFromPlayer, setIsUpdatingFromPlayer] = useState(false);

    // Poll player at a stable 30fps cadence for smoother and consistent updates
    useEffect(() => {
      let isMounted = true;
      const player = playerRef.current as any;
      if (!player) return;

      const TARGET_FPS = EDITOR_FPS;
      const FRAME_MS = 1000 / TARGET_FPS;
      let lastTime = performance.now();
      let acc = 0;
      let lastFrameSent: number | null = null;

      const tick = (now: number) => {
        if (!isMounted) return;
        acc += now - lastTime;
        lastTime = now;

        while (acc >= FRAME_MS) {
          acc -= FRAME_MS;
          const frame = player.getCurrentFrame?.();
          if (typeof frame === "number" && frame !== lastFrameSent) {
            lastFrameSent = frame;
            onFrameChange(frame);
          }
        }
        requestAnimationFrame(tick);
      };

      const raf = requestAnimationFrame(tick);
      return () => {
        isMounted = false;
        cancelAnimationFrame(raf);
      };
    }, [playerRef, onFrameChange]);

    // Handle manual frame changes - available for future use
    // const handleSeek = (frame: number) => {
    //   setIsUpdatingFromPlayer(true);
    //   playerRef.current?.seekTo(frame);
    //   onFrameChange(frame);
    //
    //   // Reset flag after a short delay
    //   setTimeout(() => {
    //     setIsUpdatingFromPlayer(false);
    //   }, 100);
    // };

    return (
      <>
        {/* Frame counter overlay */}
        <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-sm font-mono">
          {Math.floor(currentFrame / 30)}:
          {String(currentFrame % 30).padStart(2, "0")}
        </div>

        {/* Duration indicator */}
        <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
          {Math.floor(contentDuration / 30)}s
        </div>
      </>
    );
  }
);

PlayerControls.displayName = "PlayerControls";

export default PlayerControls;
