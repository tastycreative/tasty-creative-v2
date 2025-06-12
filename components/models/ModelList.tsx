// components/models/ModelsList.tsx
"use client";

import ModelCard from "./ModelCard";

export default function ModelsList({ models, onModelClick }: ModelsListProps) {
  if (models.length === 0) {
    return (
      <div
        //initial={{ opacity: 0 }}
        //animate={{ opacity: 1 }}
        className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-md rounded-2xl border border-white/20 dark:border-gray-700/30 p-12 text-center"
      >
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          No models found
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {models.map((model, index) => (
        <ModelCard
          key={model.id}
          model={model}
          index={index}
          onClick={() => onModelClick(model)}
        />
      ))}
    </div>
  );
}
