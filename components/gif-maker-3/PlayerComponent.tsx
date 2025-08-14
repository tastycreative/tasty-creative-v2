/**
 * Optimized Player Component - Separated for better performance
 * Following Remotion best practices to prevent unnecessary re-renders
 */

"use client";

import React, { memo, useEffect } from "react";
import { Player, PlayerRef } from "@remotion/player";
import { VideoComposition } from "./player";
import { EDITOR_FPS } from "@/utils/fps";

interface PlayerComponentProps {
  playerRef: React.RefObject<PlayerRef>;
  compositionInputProps: Record<string, unknown>;
  contentDuration: number;
  previewQuality: "LOW" | "MED" | "HIGH";
  onPlayerClick: (e: React.MouseEvent) => void;
}

const PlayerComponent: React.FC<PlayerComponentProps> = memo(
  ({
    playerRef,
    compositionInputProps,
    contentDuration,
    previewQuality,
    onPlayerClick,
  }) => {
    const compositionWidth =
      previewQuality === "LOW" ? 960 : previewQuality === "MED" ? 1280 : 1920;

    const compositionHeight =
      previewQuality === "LOW" ? 540 : previewQuality === "MED" ? 720 : 1080;

    // Attach a runtime error handler since current Player types don't expose onError
    useEffect(() => {
      const player = playerRef.current as any;
      if (!player?.addEventListener) return;
      const handleError = (e: any) => {
        const err = e?.detail ?? e;
        // Swallow AUDIO_RENDERER_ERROR as it's non-critical for GIF workflows
        if (
          typeof err?.message === "string" &&
          err.message.includes("AUDIO_RENDERER_ERROR")
        ) {
          console.warn("Remotion Player audio renderer error (ignored):", err);
          return;
        }
        console.warn("Remotion Player error:", err);
      };
      player.addEventListener("error", handleError);
      return () => player.removeEventListener("error", handleError);
    }, [playerRef]);

    return (
      <div className="relative w-full h-full bg-black" onClick={onPlayerClick}>
        <div className="w-full h-full">
          <Player
            ref={playerRef}
            component={
              VideoComposition as unknown as React.ComponentType<
                Record<string, unknown>
              >
            }
            durationInFrames={Math.max(30, Math.round(contentDuration || 30))}
            compositionWidth={compositionWidth}
            compositionHeight={compositionHeight}
            controls={false}
            fps={EDITOR_FPS}
            playbackRate={1}
            allowFullscreen={false}
            showVolumeControls={false}
            clickToPlay={false}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              pointerEvents: "auto",
            }}
            renderLoading={() => (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                <div className="flex flex-col items-center space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  <div className="text-white text-sm">Loading...</div>
                </div>
              </div>
            )}
            inputProps={compositionInputProps}
          />
        </div>
      </div>
    );
  }
);

PlayerComponent.displayName = "PlayerComponent";

export default PlayerComponent;
