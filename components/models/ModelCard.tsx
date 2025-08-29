"use client";
import { useState } from "react";
import { Calendar, User, Instagram, Twitter, MoreVertical, TrendingUp, Users } from "lucide-react";

function ImageWithFallback({ model }: { model: ModelDetails }) {
  const [imageError, setImageError] = useState(false);
  const [backgroundError, setBackgroundError] = useState(false);

  if (imageError) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-24 h-24 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center shadow-2xl shadow-pink-500/25">
          <span className="text-white text-3xl font-bold">
            {model.name.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center relative">
      {/* Blurred background image */}
      {!backgroundError && (
        <div
          className="absolute inset-0 bg-cover bg-center blur-2xl opacity-40 scale-110"
          style={{
            backgroundImage: `url(/api/image-proxy?id=${model.id})`,
          }}
          onError={() => setBackgroundError(true)}
        />
      )}
      {/* Circular image container */}
      <div className="relative w-24 h-24 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 p-1 flex items-center justify-center z-10 shadow-2xl shadow-pink-500/25">
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

export default function ModelCard({ model, index, onClick }: ModelCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative group cursor-pointer
        animate-in slide-in-from-bottom duration-500
        transform transition-all duration-300
        ${isHovered ? 'scale-[1.02] -translate-y-1' : ''}
      `}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Glow effect */}
      <div className={`
        absolute inset-0 bg-gradient-to-r from-pink-600/20 to-rose-600/20 
        rounded-2xl blur-xl transition-all duration-300
        ${isHovered ? 'opacity-100' : 'opacity-0'}
      `} />
      
      {/* Card */}
      <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-pink-200 dark:border-gray-700 overflow-hidden hover:border-pink-300 dark:hover:border-gray-600 transition-all duration-300">
        {/* Header with Image and Status */}
        <div className="relative h-48 bg-gradient-to-br from-pink-600/20 via-rose-600/10 to-pink-600/20 dark:from-pink-400/20 dark:via-rose-400/10 dark:to-pink-400/20 overflow-hidden">
          {/* Animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-60" />
          
          <div className="absolute top-4 right-4 z-10">
            <span
              className={`
                px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm
                ${model.status.toLowerCase() === "active"
                  ? "bg-green-500/20 text-green-400 border border-green-500/30 shadow-lg shadow-green-500/20"
                  : "bg-red-500/20 text-red-400 border border-red-500/30 shadow-lg shadow-red-500/20"
                }
              `}
            >
              {model.status.toLowerCase() === "active" ? "Active" : "Dropped"}
            </span>
          </div>

          {model.id ? (
            <ImageWithFallback model={model} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center shadow-2xl shadow-pink-500/25">
                <span className="text-white text-3xl font-bold">
                  {model.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          )}

          {/* Model name with better positioning */}
          <div className="absolute bottom-0 left-0 right-0 p-4 z-30 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent">
            <h3 className="text-xl font-bold text-white">{model.name}</h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Launch Date and Referrer */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <Calendar className="w-4 h-4 text-pink-500 dark:text-pink-400" />
              <span>{model.launchDate}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <User className="w-4 h-4 text-pink-500 dark:text-pink-400" />
              <span className="truncate max-w-[100px]">
                {model.referrerName || "-"}
              </span>
            </div>
          </div>

          {/* Stats with better styling */}
          {model.stats && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 dark:from-pink-400/10 dark:to-rose-400/10 backdrop-blur-sm rounded-xl p-3 border border-pink-500/20 dark:border-pink-400/20">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-3 h-3 text-pink-500 dark:text-pink-400" />
                  <p className="text-xs text-gray-600 dark:text-gray-300">Monthly</p>
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  ${model.stats.monthlyRevenue.toLocaleString()}
                </p>
              </div>
              <div className="bg-gradient-to-br from-rose-500/10 to-pink-500/10 dark:from-rose-400/10 dark:to-pink-400/10 backdrop-blur-sm rounded-xl p-3 border border-rose-500/20 dark:border-rose-400/20">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-3 h-3 text-pink-500 dark:text-pink-400" />
                  <p className="text-xs text-gray-600 dark:text-gray-300">Subs</p>
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {model.stats.subscribers.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Social Links */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-300 dark:border-gray-600">
            <div className="flex gap-2">
              {model.instagram && (
                <a
                  href={`https://instagram.com/${model.instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-pink-500/20 dark:hover:bg-pink-500/20 rounded-xl transition-all duration-300 group/social"
                >
                  <Instagram className="w-4 h-4 text-pink-500 dark:text-pink-400 group-hover/social:scale-110 transition-transform" />
                </a>
              )}
              {model.twitter && (
                <a
                  href={`https://twitter.com/${model.twitter.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-blue-500/20 dark:hover:bg-blue-500/20 rounded-xl transition-all duration-300 group/social"
                >
                  <Twitter className="w-4 h-4 text-blue-400 group-hover/social:scale-110 transition-transform" />
                </a>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Handle menu click
              }}
              className={`
                p-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-pink-500/20 dark:hover:bg-pink-500/20 rounded-xl 
                transition-all duration-300
                ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}
              `}
            >
              <MoreVertical className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}