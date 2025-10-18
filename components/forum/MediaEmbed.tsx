"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Play,
  ExternalLink,
  Github,
  Code,
  FileText,
  Image,
  Video,
  Globe,
  AlertCircle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface MediaEmbedProps {
  url: string;
  className?: string;
  autoEmbed?: boolean;
}

interface EmbedData {
  type: "youtube" | "github" | "codepen" | "twitter" | "image" | "generic";
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  embedUrl?: string;
  author?: string;
  site?: string;
  error?: string;
}

const urlPatterns = {
  youtube: [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  ],
  github: [
    /github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/([^\/]+))?(?:\/blob\/([^\/]+)\/(.+))?/,
    /gist\.github\.com\/([^\/]+)\/([a-zA-Z0-9]+)/,
  ],
  codepen: [
    /codepen\.io\/([^\/]+)\/pen\/([a-zA-Z0-9]+)/,
  ],
  twitter: [
    /(?:twitter\.com|x\.com)\/([^\/]+)\/status\/(\d+)/,
  ],
  image: [
    /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i,
  ],
};

function extractVideoId(url: string): string | null {
  for (const pattern of urlPatterns.youtube) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractGitHubInfo(url: string) {
  const repoMatch = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (repoMatch) {
    return {
      owner: repoMatch[1],
      repo: repoMatch[2],
      isGist: false,
    };
  }
  
  const gistMatch = url.match(/gist\.github\.com\/([^\/]+)\/([a-zA-Z0-9]+)/);
  if (gistMatch) {
    return {
      owner: gistMatch[1],
      gistId: gistMatch[2],
      isGist: true,
    };
  }
  
  return null;
}

function getEmbedType(url: string): EmbedData["type"] {
  if (urlPatterns.youtube.some(pattern => pattern.test(url))) return "youtube";
  if (urlPatterns.github.some(pattern => pattern.test(url))) return "github";
  if (urlPatterns.codepen.some(pattern => pattern.test(url))) return "codepen";
  if (urlPatterns.twitter.some(pattern => pattern.test(url))) return "twitter";
  if (urlPatterns.image.some(pattern => pattern.test(url))) return "image";
  return "generic";
}

export function MediaEmbed({ url, className, autoEmbed = true }: MediaEmbedProps) {
  const [embedData, setEmbedData] = useState<EmbedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmbed, setShowEmbed] = useState(autoEmbed);
  const [error, setError] = useState<string | null>(null);

  const embedType = getEmbedType(url);

  useEffect(() => {
    if (!showEmbed) return;
    
    const fetchEmbedData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        switch (embedType) {
          case "youtube":
            await handleYouTubeEmbed();
            break;
          case "github":
            await handleGitHubEmbed();
            break;
          case "image":
            await handleImageEmbed();
            break;
          case "generic":
            await handleGenericEmbed();
            break;
          default:
            setEmbedData({
              type: embedType,
              title: url,
              description: "Click to view content",
            });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load embed");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmbedData();
  }, [url, embedType, showEmbed]);

  const handleYouTubeEmbed = async () => {
    const videoId = extractVideoId(url);
    if (!videoId) throw new Error("Invalid YouTube URL");

    // Use YouTube oEmbed API
    try {
      const response = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
      );
      
      if (!response.ok) throw new Error("Failed to fetch video data");
      
      const data = await response.json();
      setEmbedData({
        type: "youtube",
        title: data.title,
        author: data.author_name,
        thumbnailUrl: data.thumbnail_url,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
      });
    } catch {
      // Fallback if oEmbed fails
      setEmbedData({
        type: "youtube",
        title: "YouTube Video",
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
      });
    }
  };

  const handleGitHubEmbed = async () => {
    const info = extractGitHubInfo(url);
    if (!info) throw new Error("Invalid GitHub URL");

    if (info.isGist) {
      setEmbedData({
        type: "github",
        title: `Gist by ${info.owner}`,
        description: "GitHub Gist",
        site: "GitHub",
        embedUrl: `https://gist.github.com/${info.owner}/${info.gistId}.js`,
      });
    } else {
      try {
        const response = await fetch(`https://api.github.com/repos/${info.owner}/${info.repo}`);
        if (!response.ok) throw new Error("Repository not found");
        
        const repoData = await response.json();
        setEmbedData({
          type: "github",
          title: repoData.full_name,
          description: repoData.description || "GitHub Repository",
          author: repoData.owner.login,
          site: "GitHub",
        });
      } catch {
        // Fallback
        setEmbedData({
          type: "github",
          title: `${info.owner}/${info.repo}`,
          description: "GitHub Repository",
          site: "GitHub",
        });
      }
    }
  };

  const handleImageEmbed = async () => {
    setEmbedData({
      type: "image",
      title: url.split('/').pop() || "Image",
      thumbnailUrl: url,
    });
  };

  const handleGenericEmbed = async () => {
    try {
      // In a real implementation, you'd use a service like Embedly or custom scraper
      const domain = new URL(url).hostname;
      setEmbedData({
        type: "generic",
        title: domain,
        description: "External Link",
        site: domain,
      });
    } catch {
      setEmbedData({
        type: "generic",
        title: url,
        description: "External Link",
      });
    }
  };

  if (!showEmbed && !autoEmbed) {
    return (
      <div className="inline-flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <Globe className="w-4 h-4 text-gray-500" />
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
        >
          {url}
        </a>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowEmbed(true)}
          className="h-6 px-2 text-xs"
        >
          Show Preview
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <Card className={cn("p-4", className)}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-lg animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-pulse w-1/2" />
          </div>
        </div>
      </Card>
    );
  }

  if (error || !embedData) {
    return (
      <Card className={cn("p-4 border-red-200 dark:border-red-800", className)}>
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Failed to load embed</p>
            <p className="text-xs opacity-75">{error}</p>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
          >
            Open Link
          </a>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("not-prose", className)}
    >
      {embedData.type === "youtube" && (
        <YouTubeEmbed embedData={embedData} originalUrl={url} />
      )}
      {embedData.type === "github" && (
        <GitHubEmbed embedData={embedData} originalUrl={url} />
      )}
      {embedData.type === "image" && (
        <ImageEmbed embedData={embedData} originalUrl={url} />
      )}
      {embedData.type === "generic" && (
        <GenericEmbed embedData={embedData} originalUrl={url} />
      )}
    </motion.div>
  );
}

function YouTubeEmbed({ embedData, originalUrl }: { embedData: EmbedData; originalUrl: string }) {
  const [showVideo, setShowVideo] = useState(false);

  if (showVideo && embedData.embedUrl) {
    return (
      <Card className="overflow-hidden bg-black">
        <div className="relative aspect-video">
          <iframe
            src={embedData.embedUrl}
            title={embedData.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowVideo(false)}
            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowVideo(true)}>
      <div className="relative">
        {embedData.thumbnailUrl && (
          <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
            <img
              src={embedData.thumbnailUrl}
              alt={embedData.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                <Play className="w-6 h-6 text-white ml-1" fill="currentColor" />
              </div>
            </div>
          </div>
        )}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
            {embedData.title}
          </h3>
          {embedData.author && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              by {embedData.author}
            </p>
          )}
          <div className="flex items-center gap-2 mt-3">
            <Video className="w-4 h-4 text-red-600" />
            <span className="text-xs text-gray-500">YouTube</span>
            <a
              href={originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-xs text-blue-600 dark:text-blue-400 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </Card>
  );
}

function GitHubEmbed({ embedData, originalUrl }: { embedData: EmbedData; originalUrl: string }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <Github className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              {embedData.title}
            </h3>
            {embedData.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                {embedData.description}
              </p>
            )}
            <div className="flex items-center gap-2">
              <Github className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-500">
                {embedData.site} {embedData.author && `• ${embedData.author}`}
              </span>
              <a
                href={originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-blue-600 dark:text-blue-400 hover:underline text-xs flex items-center gap-1"
              >
                View on GitHub
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function ImageEmbed({ embedData, originalUrl }: { embedData: EmbedData; originalUrl: string }) {
  const [imageError, setImageError] = useState(false);

  if (imageError || !embedData.thumbnailUrl) {
    return (
      <Card className="p-4 border-dashed">
        <div className="flex items-center gap-3 text-gray-500">
          <Image className="w-5 h-5" />
          <div>
            <p className="text-sm font-medium">Image</p>
            <a
              href={originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              View Image
            </a>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="relative group">
        <img
          src={embedData.thumbnailUrl}
          alt={embedData.title}
          className="w-full max-h-96 object-contain bg-gray-50 dark:bg-gray-900"
          onError={() => setImageError(true)}
        />
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <a
            href={originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </Card>
  );
}

function GenericEmbed({ embedData, originalUrl }: { embedData: EmbedData; originalUrl: string }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <Globe className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">
              {embedData.title}
            </h3>
            {embedData.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {embedData.description}
              </p>
            )}
            <p className="text-xs text-gray-500">
              {embedData.site}
            </p>
          </div>
          <a
            href={originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline text-xs flex items-center gap-1"
          >
            Open
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </Card>
  );
}