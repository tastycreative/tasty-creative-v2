"use client";

import React from "react";

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
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200">Template Images</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {templateImages.map((image) => (
          <div
            key={image.id}
            className="group relative bg-white dark:bg-slate-800 rounded-xl p-3 cursor-pointer hover:shadow-lg hover:shadow-purple-500/10 dark:hover:shadow-purple-400/10 transition-all duration-300 border border-gray-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 hover:scale-105"
            onClick={() => handleTemplateClick(image)}
          >
            <div className="aspect-video bg-gray-100 dark:bg-slate-700 rounded-lg mb-2 overflow-hidden relative group-hover:shadow-md transition-shadow">
              <img
                src={image.thumbnail}
                alt={image.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                onError={(e) => {
                  // Fallback for missing images
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04NS41IDQ1SDExNC41Vjc1SDg1LjVWNDVaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K';
                }}
              />
              
              {/* Modern overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
              
              {/* Add to timeline indicator */}
              <div className="absolute top-2 right-2 w-6 h-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100">
                <svg className="w-3 h-3 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>
            
            <p className="text-xs font-medium text-gray-700 dark:text-slate-300 truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              {image.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateImages;
