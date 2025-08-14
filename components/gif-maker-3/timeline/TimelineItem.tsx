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
  // Different colors for video vs image clips
  let bgColor = "bg-purple-500"; // default for text
  if (type === "clip" && "type" in item) {
    bgColor = item.type === "video" ? "bg-blue-500" : "bg-green-500";
  }

  return (
    <div
      key={item.id}
      className={`absolute h-10 ${bgColor} rounded-md`}
      style={{
        left: `${(item.start / totalDuration) * 100}%`,
        width: `calc(${(item.duration / totalDuration) * 100}% - 4px)`,
        top: `${item.row * 44}px`,
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-semibold">
        {type === "clip" && "type" in item
          ? item.type === "video"
            ? `Video ${index + 1}`
            : `Image ${index + 1}`
          : `Text ${index + 1}`}
      </div>
    </div>
  );
};

export default TimelineItem;
