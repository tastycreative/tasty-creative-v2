"use client";

import React, { memo, useMemo } from "react";
import { Sequence, Video, Img } from "remotion";
import { TextOverlayComponent } from "../text-overlay";
import { BlurOverlayComponent } from "../blur-overlay";
import { VideoLayout } from "../hooks/useTimeline";
import { getTransformCSS } from "../utils/transformUtils";
import { generateFrameCSS } from "../utils/frameStyles";

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
  // New layout props
  videoLayout?: VideoLayout;
  layerAssignments?: Record<string, number>;
  getClipLayer?: (clipId: string) => number;
  // Frame rendering options
  includeFramesInRender?: boolean;
  isDarkTheme?: boolean;
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
    videoLayout = "single",
    layerAssignments = {},
    getClipLayer,
    includeFramesInRender = false,
    isDarkTheme = false,
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

    // Sort items by row for proper layering (higher rows render first, lower rows on top)
    const sortedVideoClips = useMemo(
      () => [...videoClips].sort((a, b) => b.row - a.row),
      [videoClips]
    );

    const sortedImageClips = useMemo(
      () => [...imageClips].sort((a, b) => b.row - a.row),
      [imageClips]
    );

    const sortedTextOverlays = useMemo(
      () => [...textOverlays].sort((a, b) => b.row - a.row),
      [textOverlays]
    );

    const sortedBlurOverlays = useMemo(
      () => [...blurOverlays].sort((a, b) => b.row - a.row),
      [blurOverlays]
    );

    // Helper function to get layout position and size for a layer
    const getLayerStyle = useMemo(() => {
      return (layer: number): React.CSSProperties => {
        switch (videoLayout) {
          case "single":
            return {
              width: "100%",
              height: "100%",
              top: 0,
              left: 0,
            };
          
          case "2-layer":
            return layer === 0 
              ? { width: "50%", height: "100%", top: 0, left: 0 }
              : { width: "50%", height: "100%", top: 0, left: "50%" };
          
          case "v-triptych":
            return layer === 0
              ? { width: "100%", height: "33.33%", top: 0, left: 0 }
              : layer === 1
                ? { width: "100%", height: "33.33%", top: "33.33%", left: 0 }
                : { width: "100%", height: "33.33%", top: "66.66%", left: 0 };
          
          case "h-triptych":
            return layer === 0
              ? { width: "33.33%", height: "100%", top: 0, left: 0 }
              : layer === 1
                ? { width: "33.33%", height: "100%", top: 0, left: "33.33%" }
                : { width: "33.33%", height: "100%", top: 0, left: "66.66%" };
          
          case "2x2-grid":
            return layer === 0
              ? { width: "50%", height: "50%", top: 0, left: 0 }
              : layer === 1
                ? { width: "50%", height: "50%", top: 0, left: "50%" }
                : layer === 2
                  ? { width: "50%", height: "50%", top: "50%", left: 0 }
                  : { width: "50%", height: "50%", top: "50%", left: "50%" };
          
          default:
            return { width: "100%", height: "100%", top: 0, left: 0 };
        }
      };
    }, [videoLayout]);

    // Group video clips by layer
    const clipsByLayer = useMemo(() => {
      const layerMap: Record<number, Clip[]> = {};
      
      sortedVideoClips.forEach((clip) => {
        const layer = getClipLayer ? getClipLayer(clip.id) : 0;
        if (!layerMap[layer]) {
          layerMap[layer] = [];
        }
        layerMap[layer].push(clip);
      });
      
      return layerMap;
    }, [sortedVideoClips, getClipLayer]);

    // Memoize video sequences for better performance
    const videoSequences = useMemo(() => {
      const sequences: JSX.Element[] = [];
      
      // For single layout, render all video clips without layer complexity
      if (videoLayout === "single") {
        sortedVideoClips.forEach((clip) => {
          // Check if frame should be rendered
          const shouldShowFrame = clip.transform?.frame?.show && 
            (includeFramesInRender ? clip.transform.frame.includeInExport : true);
          
          const frameStyles = shouldShowFrame 
            ? generateFrameCSS(clip.transform.frame, isDarkTheme)
            : {};

          sequences.push(
            <Sequence
              key={clip.id}
              from={clip.start}
              durationInFrames={clip.duration}
            >
              <div
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  top: 0,
                  left: 0,
                  overflow: "hidden",
                  ...frameStyles, // Apply frame styles to container
                }}
              >
                <Video
                  src={clip.src}
                  startFrom={clip.startFrom || 0}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: clip.transform?.fitMode === 'contain' ? 'contain' :
                              clip.transform?.fitMode === 'cover' ? 'cover' :
                              clip.transform?.fitMode === 'fill' ? 'fill' : 'cover',
                    transform: clip.transform ? getTransformCSS(clip.transform) : undefined,
                    transformOrigin: 'center center',
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
          );
        });
      } else {
        // Use layer-based rendering for multi-layer layouts
        Object.entries(clipsByLayer).forEach(([layerStr, layerClips]) => {
          const layer = parseInt(layerStr);
          const layerStyle = getLayerStyle(layer);
          
          layerClips.forEach((clip) => {
            // Check if frame should be rendered
            const shouldShowFrame = clip.transform?.frame?.show && 
              (includeFramesInRender ? clip.transform.frame.includeInExport : true);
            
            const frameStyles = shouldShowFrame 
              ? generateFrameCSS(clip.transform.frame, isDarkTheme)
              : {};

            sequences.push(
              <Sequence
                key={`${clip.id}-layer-${layer}`}
                from={clip.start}
                durationInFrames={clip.duration}
              >
                <div
                  style={{
                    position: "absolute",
                    ...layerStyle,
                    overflow: "hidden",
                    ...frameStyles, // Apply frame styles to layer container
                  }}
                >
                  <Video
                    src={clip.src}
                    startFrom={clip.startFrom || 0}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: clip.transform?.fitMode === 'contain' ? 'contain' :
                                clip.transform?.fitMode === 'cover' ? 'cover' :
                                clip.transform?.fitMode === 'fill' ? 'fill' : 'cover',
                      transform: clip.transform ? getTransformCSS(clip.transform) : undefined,
                      transformOrigin: 'center center',
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
            );
          });
        });
      }
      
      return sequences;
    }, [videoLayout, sortedVideoClips, clipsByLayer, getLayerStyle, clipEffects]);

    // Memoize image sequences
    const imageSequences = useMemo(
      () =>
        sortedImageClips.map((clip) => (
          <Sequence
            key={clip.id}
            from={clip.start}
            durationInFrames={clip.duration}
          >
            <div
              style={{
                position: "absolute",
                left: clip.transform ? "50%" : `${clip.x || 50}%`,
                top: clip.transform ? "50%" : `${clip.y || 50}%`,
                width: clip.transform ? "100%" : `${clip.width || 50}%`,
                height: clip.transform ? "100%" : `${clip.height || 50}%`,
                transform: clip.transform 
                  ? `translate(-50%, -50%) ${getTransformCSS(clip.transform)}`
                  : `translate(-50%, -50%) rotate(${clip.rotation || 0}deg)`,
                zIndex: 2,
              }}
            >
              <Img
                src={clip.src}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: clip.transform?.fitMode === 'contain' ? 'contain' :
                            clip.transform?.fitMode === 'cover' ? 'cover' :
                            clip.transform?.fitMode === 'fill' ? 'fill' : 'contain',
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
      [sortedImageClips, clipEffects]
    );

    // Memoize blur overlay sequences
    const blurSequences = useMemo(
      () =>
        sortedBlurOverlays.map((overlay) => (
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
      [sortedBlurOverlays]
    );

    // Memoize text overlay sequences
    const textSequences = useMemo(
      () =>
        sortedTextOverlays
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
      [sortedTextOverlays, selectedTextOverlayId]
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
