"use client";

import React, { memo, useMemo } from "react";
import { Sequence, Video, Img } from "remotion";
import { TextOverlayComponent } from "../text-overlay";
import { BlurOverlayComponent } from "../blur-overlay";

interface VideoCompositionProps {
  clips: Clip[];
  textOverlays: TextOverlay[];
  blurOverlays: BlurOverlay[];
  clipEffects: Record<
    string,
    {
      brightness?: number;
      contrast?: number;
      saturation?: number;
      blur?: number;
    }
  >;
  selectedTextOverlayId?: string | null;
  selectedBlurOverlayId?: string | null;
  onTextOverlayUpdate?: (
    overlayId: string,
    updates: Partial<TextOverlay>
  ) => void;
  onBlurOverlayUpdate?: (
    overlayId: string,
    updates: Partial<BlurOverlay>
  ) => void;
}

const VideoComposition: React.FC<VideoCompositionProps> = memo(
  ({
    clips,
    textOverlays,
    blurOverlays,
    clipEffects,
    selectedTextOverlayId,
    selectedBlurOverlayId,
    onTextOverlayUpdate,
    onBlurOverlayUpdate,
  }) => {
    // Memoize filtered clips to prevent unnecessary re-renders
    const videoClips = useMemo(
      () => clips.filter((clip) => clip.type === "video"),
      [clips]
    );

    const imageClips = useMemo(
      () => clips.filter((clip) => clip.type === "image"),
      [clips]
    );

    // Memoize video sequences for better performance
    const videoSequences = useMemo(
      () =>
        videoClips.map((clip) => (
          <Sequence
            key={clip.id}
            from={clip.start}
            durationInFrames={clip.duration}
          >
            <Video
              src={clip.src}
              startFrom={clip.startFrom || 0}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                position: "absolute",
                top: 0,
                left: 0,
                zIndex: 1,
                filter: clipEffects[clip.id]
                  ? `brightness(${clipEffects[clip.id]?.brightness || 100}%) 
               contrast(${clipEffects[clip.id]?.contrast || 100}%) 
               saturate(${clipEffects[clip.id]?.saturation || 100}%) 
               blur(${clipEffects[clip.id]?.blur || 0}px)`
                  : "none",
              }}
            />
          </Sequence>
        )),
      [videoClips, clipEffects]
    );

    // Memoize image sequences
    const imageSequences = useMemo(
      () =>
        imageClips.map((clip) => (
          <Sequence
            key={clip.id}
            from={clip.start}
            durationInFrames={clip.duration}
          >
            <div
              style={{
                position: "absolute",
                left: `${clip.x || 50}%`,
                top: `${clip.y || 50}%`,
                width: `${clip.width || 50}%`,
                height: `${clip.height || 50}%`,
                transform: `translate(-50%, -50%) rotate(${clip.rotation || 0}deg)`,
                zIndex: 2,
              }}
            >
              <Img
                src={clip.src}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  filter: clipEffects[clip.id]
                    ? `brightness(${clipEffects[clip.id]?.brightness || 100}%) 
                 contrast(${clipEffects[clip.id]?.contrast || 100}%) 
                 saturate(${clipEffects[clip.id]?.saturation || 100}%) 
                 blur(${clipEffects[clip.id]?.blur || 0}px)`
                    : "none",
                }}
              />
            </div>
          </Sequence>
        )),
      [imageClips, clipEffects]
    );

    // Memoize blur overlay sequences
    const blurSequences = useMemo(
      () =>
        blurOverlays.map((overlay) => (
          <Sequence
            key={overlay.id}
            from={overlay.start}
            durationInFrames={overlay.duration}
          >
            <div
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                zIndex: 3,
              }}
            >
              <BlurOverlayComponent
                x={overlay.x}
                y={overlay.y}
                width={overlay.width}
                height={overlay.height}
                blurIntensity={overlay.blurIntensity}
                rotation={overlay.rotation}
                blurType={overlay.blurType}
                shape={overlay.shape}
                isInteractive={false}
                onUpdate={undefined}
              />
            </div>
          </Sequence>
        )),
      [blurOverlays]
    );

    // Memoize text overlay sequences
    const textSequences = useMemo(
      () =>
        textOverlays
          .filter((overlay) => overlay.id !== (selectedTextOverlayId || ""))
          .map((overlay) => (
            <Sequence
              key={overlay.id}
              from={overlay.start}
              durationInFrames={overlay.duration}
            >
              <div
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  zIndex: 4,
                }}
              >
                <TextOverlayComponent
                  text={overlay.text}
                  x={overlay.x}
                  y={overlay.y}
                  width={overlay.width}
                  height={overlay.height}
                  fontSize={overlay.fontSize}
                  rotation={overlay.rotation}
                  isInteractive={false}
                  animate={true}
                  color={overlay.color}
                  fontWeight={overlay.fontWeight as any}
                  textAlign={overlay.textAlign as any}
                  onUpdate={undefined}
                />
              </div>
            </Sequence>
          )),
      [textOverlays, selectedTextOverlayId]
    );

    return (
      <>
        {/* Layer 1: Videos (bottom layer - background) */}
        {videoSequences}

        {/* Layer 2: Images (middle layer - overlays on videos) */}
        {imageSequences}

        {/* Layer 3: Blur overlays (middle overlay layer) */}
        {blurSequences}

        {/* Layer 4: Text overlays (top layer) */}
        {textSequences}
      </>
    );
  }
);

VideoComposition.displayName = "VideoComposition";

export default VideoComposition;
