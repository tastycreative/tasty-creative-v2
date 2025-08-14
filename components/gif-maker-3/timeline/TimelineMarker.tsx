"use client";

import React, { useMemo } from "react";

interface TimelineMarkerProps {
  currentFrame: number;
  totalDuration: number;
}

const TimelineMarker: React.FC<TimelineMarkerProps> = React.memo(({ currentFrame, totalDuration }) => {
  const markerPosition = useMemo(() => {
    return `${(currentFrame / totalDuration) * 100}%`;
  }, [currentFrame, totalDuration]);

  return (
    <div
      className="absolute top-0 w-[2px] bg-red-500 pointer-events-none z-50"
      style={{
        left: markerPosition,
        transform: "translateX(-50%)",
        height: "100%",
      }}
    >
      {/* Playhead handle */}
      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-red-500 border-2 border-white rounded-sm shadow-lg" />
      {/* Timeline line */}
      <div className="w-full h-full bg-red-500 shadow-sm" />
    </div>
  );
});

TimelineMarker.displayName = "TimelineMarker";

export default TimelineMarker;