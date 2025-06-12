// components/models/ModelCard.tsx
"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import {
  Calendar,
  User,
  DollarSign,
  Users,
  Clock,
  Instagram,
  Twitter,
  MoreVertical,
} from "lucide-react";

interface ModelCardProps {
  model: ModelDetails;
  index: number;
  onClick: () => void;
}

function ImageWithFallback({ model }: { model: ModelDetails }) {
  const [imageError, setImageError] = useState(false);
  const [backgroundError, setBackgroundError] = useState(false);

  if (imageError) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
          <span className="text-white text-3xl font-bold">
            {model.name.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center relative">
      {/* Blurred background image - contained within header only */}
      {!backgroundError && (
        <div
          className="absolute inset-0 bg-cover bg-center blur-xl opacity-30"
          style={{
            backgroundImage: `url(/api/image-proxy?id=${model.id})`,
          }}
          onError={() => setBackgroundError(true)}
        />
      )}

      {/* Circular image container */}
      <div className="relative w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 p-1 flex items-center justify-center z-10">
        <img
          src={`/api/image-proxy?id=${model.id}`}
          alt={model.name}
          className="w-full h-full object-cover rounded-full"
          loading="lazy"
          onError={() => setImageError(true)}
        />
      </div>
    </div>
  );
}

interface ModelCardProps {
  model: ModelDetails;
  index: number;
  onClick: () => void;
}

export default function ModelCard({ model, onClick }: ModelCardProps) {
  return (
    <div
      //initial={{ opacity: 0, y: 20 }}
      //animate={{ opacity: 1, y: 0 }}
      //transition={{ delay: index * 0.1 }}
      //whileHover={{ y: -5 }}
      onClick={onClick}
      className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-md rounded-2xl border border-white/20 dark:border-gray-700/30 overflow-hidden cursor-pointer hover:shadow-xl transition-all group"
    >
      {/* Header with Image and Status */}
      <div className="relative h-48 bg-gradient-to-br from-purple-500/20 to-pink-500/20 overflow-hidden">
        <div className="absolute top-4 right-4 z-10">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              model.status.toLowerCase() === "active"
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-red-500/20 text-red-400 border border-red-500/30"
            }`}
          >
            {model.status.toLowerCase() === "active" ? "Active" : "Dropped"}
          </span>
        </div>

        {model.id ? (
          <ImageWithFallback model={model} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white text-3xl font-bold">
                {model.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-20" />

        {/* Model name */}
        <div className="absolute bottom-4 left-4 right-4 z-30">
          <h3 className="text-xl font-bold text-white">{model.name}</h3>
          {/* <p className="text-sm text-white/80">{model.personalityType}</p> */}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Launch Date and Referrer */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>{new Date(model.launchDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <User className="w-4 h-4" />
            <span className="truncate max-w-[100px]">{model.referrerName}</span>
          </div>
        </div>

        {/* Stats */}
        {model.stats && (
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Monthly
              </p>
              <p className="text-sm font-semibold text-gray-800 dark:text-white">
                ${model.stats.monthlyRevenue.toLocaleString()}
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Subs</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-white">
                {model.stats.subscribers.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Social Links */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="flex gap-2">
            {model.instagram && (
              <a
                href={`https://instagram.com/${model.instagram.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Instagram className="w-4 h-4 text-pink-500" />
              </a>
            )}
            {model.twitter && (
              <a
                href={`https://twitter.com/${model.twitter.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Twitter className="w-4 h-4 text-blue-400" />
              </a>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              // Handle menu click
            }}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
