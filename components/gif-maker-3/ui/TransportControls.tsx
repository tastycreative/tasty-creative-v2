"use client";

import React, { useEffect, useState } from "react";
import { PlayerRef } from "@remotion/player";
import { Play, Pause } from "lucide-react";

interface TransportControlsProps {
  playerRef: React.RefObject<PlayerRef>;
  currentFrame: number;
  totalDuration: number;
  onFrameChange?: (frame: number) => void;
}

const TransportControls: React.FC<TransportControlsProps> = ({
  playerRef,
  currentFrame,
  totalDuration,
  onFrameChange,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // Sync local state with player playback state to toggle icon
  useEffect(() => {
    const player = playerRef.current as any;
    if (!player) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    // Remotion Player exposes play/pause methods; listen to events if available
    player.addEventListener?.("play", handlePlay);
    player.addEventListener?.("pause", handlePause);

    // Derive initial state
    try {
      if (player.isPlaying && typeof player.isPlaying === "function") {
        setIsPlaying(!!player.isPlaying());
      }
    } catch {}

    return () => {
      player.removeEventListener?.("play", handlePlay);
      player.removeEventListener?.("pause", handlePause);
    };
  }, [playerRef]);
  const handlePrevious = () => {
    if (playerRef.current) {
      const newFrame = Math.max(0, currentFrame - 30);
      playerRef.current.seekTo(newFrame);
      onFrameChange?.(newFrame);
    }
  };

  const handlePlayPause = () => {
    if (playerRef.current) {
      if (playerRef.current.isPlaying()) {
        playerRef.current.pause();
      } else {
        playerRef.current.play();
      }
    }
  };

  const handleNext = () => {
    if (playerRef.current) {
      const newFrame = Math.min(totalDuration - 1, currentFrame + 30);
      playerRef.current.seekTo(newFrame);
      onFrameChange?.(newFrame);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Previous Button */}
      <button
        onClick={handlePrevious}
        className="flex items-center justify-center w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 hover:text-white transition-colors border border-slate-600"
        title="Previous"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z"
          />
        </svg>
      </button>

      {/* Play/Pause Button */}
      <button
        onClick={handlePlayPause}
        className="flex items-center justify-center w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 hover:text-white transition-colors border border-slate-600"
        title="Play/Pause"
      >
        {isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4" />
        )}
      </button>

      {/* Next Button */}
      <button
        onClick={handleNext}
        className="flex items-center justify-center w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 hover:text-white transition-colors border border-slate-600"
        title="Next"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z"
          />
        </svg>
      </button>

      {/* Time Display */}
      <div className="bg-slate-900 px-3 py-1 rounded text-sm font-mono text-white border border-slate-600 ml-2">
        {String(Math.floor(currentFrame / 30 / 60)).padStart(2, "0")}:
        {String(Math.floor(currentFrame / 30) % 60).padStart(2, "0")}
        <span className="text-slate-400 mx-1">|</span>
        {String(Math.floor(totalDuration / 30 / 60)).padStart(2, "0")}:
        {String(Math.floor(totalDuration / 30) % 60).padStart(2, "0")}
      </div>
    </div>
  );
};

export default TransportControls;
