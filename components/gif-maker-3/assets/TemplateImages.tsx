"use client";

import React from "react";
import { Clip } from "@/types/types";

interface TemplateImagesProps {
  clips: Clip[];
  getNextAvailableRow: () => number;
  onAddTemplate: (templateClip: Clip) => void;
}

const TemplateImages: React.FC<TemplateImagesProps> = ({
  clips,
  getNextAvailableRow,
  onAddTemplate,
}) => {
  // Template images from your templates folder
  const templateImages = [
    {
      id: 1,
      type: "image",
      name: "Live Placeholder",
      thumbnail: "/templates/live_placeholder.png",
      src: "/templates/live_placeholder.png",
    },
    {
      id: 2,
      type: "image",
      name: "Template Right",
      thumbnail: "/templates/TEMPLATE_RIGHT.png",
      src: "/templates/TEMPLATE_RIGHT.png",
    },
    {
      id: 3,
      type: "image",
      name: "Template Left",
      thumbnail: "/templates/TEMPLATE_LEFT.png",
      src: "/templates/TEMPLATE_LEFT.png",
    },
    {
      id: 4,
      type: "image",
      name: "Template Bottom",
      thumbnail: "/templates/TEMPLATE_BOTTOM.png",
      src: "/templates/TEMPLATE_BOTTOM.png",
    },
    {
      id: 5,
      type: "image",
      name: "Sexting Script Template",
      thumbnail: "/templates/SextingScriptTemplate.png",
      src: "/templates/SextingScriptTemplate.png",
    },
  ];

  const handleTemplateClick = (image: (typeof templateImages)[0]) => {
    const newClip: Clip = {
      id: `clip-${Date.now()}`,
      start:
        clips.length > 0
          ? Math.max(...clips.map((c) => c.start + c.duration))
          : 0,
      duration: 150,
      src: image.src,
      row: getNextAvailableRow(), // Assign unique row
      type: "image", // Template images
    };
    onAddTemplate(newClip);
  };

  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium text-slate-300 mb-2">Images</h3>
      <div className="grid grid-cols-2 gap-2">
        {templateImages.map((image) => (
          <div
            key={image.id}
            className="group relative bg-slate-700 rounded-lg p-2 cursor-pointer hover:bg-slate-600 transition-colors"
            onClick={() => handleTemplateClick(image)}
          >
            <div className="aspect-video bg-slate-600 rounded mb-1 overflow-hidden">
              <img
                src={image.thumbnail}
                alt={image.name}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-xs text-slate-300 truncate">{image.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateImages;
