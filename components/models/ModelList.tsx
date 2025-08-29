"use client";
import ModelCard from "./ModelCard";
import { Users } from "lucide-react";

interface ModelsListProps {
  models: ModelDetails[];
  onModelClick: (model: ModelDetails) => void;
  isLoading?: boolean;
}

export default function ModelsList({ models, onModelClick, isLoading }: ModelsListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl border border-pink-200 dark:border-gray-700 overflow-hidden animate-pulse"
          >
            <div className="h-48 bg-pink-100 dark:bg-gray-700" />
            <div className="p-4 space-y-3">
              <div className="h-6 bg-pink-100 dark:bg-gray-700 rounded" />
              <div className="h-4 bg-pink-100 dark:bg-gray-700 rounded w-3/4" />
              <div className="grid grid-cols-2 gap-2">
                <div className="h-12 bg-pink-100 dark:bg-gray-700 rounded" />
                <div className="h-12 bg-pink-100 dark:bg-gray-700 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="animate-in fade-in duration-500">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-600/10 to-rose-600/10 dark:from-pink-400/10 dark:to-rose-400/10 rounded-3xl blur-xl" />
          <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-pink-200 dark:border-gray-700 p-16 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-pink-500/20 to-rose-500/20 dark:from-pink-400/20 dark:to-rose-400/20 rounded-full flex items-center justify-center">
              <Users className="w-10 h-10 text-pink-500 dark:text-pink-400" />
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-lg">No models found</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
          </div>
        </div>
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