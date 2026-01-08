"use client";

import { memo } from "react";
import { Instagram, Twitter, Activity, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

type SocialPlatform = "instagram" | "twitter" | "tiktok";

interface SocialLinkButtonProps {
  platform: SocialPlatform;
  username?: string;
  onStopPropagation?: (e: React.MouseEvent) => void;
  size?: "sm" | "md" | "lg";
}

const platformConfigs = {
  instagram: {
    getUrl: (username: string) =>
      `https://instagram.com/${username.replace("@", "")}`,
    icon: Instagram,
    label: "Instagram",
    className:
      "hover:bg-pink-50 hover:text-pink-600 dark:hover:bg-pink-900/20 dark:hover:text-pink-400",
  },
  twitter: {
    getUrl: (username: string) =>
      `https://twitter.com/${username.replace("@", "")}`,
    icon: Twitter,
    label: "Twitter",
    className:
      "hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400",
  },
  tiktok: {
    getUrl: (username: string) =>
      `https://tiktok.com/@${username.replace("@", "")}`,
    icon: Activity,
    label: "TikTok",
    className:
      "hover:bg-gray-50 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-gray-100",
  },
};

const sizeClasses = {
  sm: "p-1.5",
  md: "p-2",
  lg: "p-2.5",
};

const iconSizeClasses = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-5 h-5",
};

export const SocialLinkButton = memo(
  ({
    platform,
    username,
    onStopPropagation,
    size = "md",
  }: SocialLinkButtonProps) => {
    if (!username) return null;

    const config = platformConfigs[platform];
    const Icon = config.icon;

    const handleClick = (e: React.MouseEvent) => {
      onStopPropagation?.(e);
    };

    return (
      <a
        href={config.getUrl(username)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className={cn(
          "relative rounded-lg transition-all duration-200",
          "text-gray-500 dark:text-gray-400",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
          sizeClasses[size],
          config.className
        )}
        aria-label={`View on ${config.label}`}
      >
        <Icon className={iconSizeClasses[size]} />
        <ExternalLink className="w-2 h-2 opacity-0 hover:opacity-50 transition-opacity duration-200 absolute top-1 right-1" />
      </a>
    );
  }
);

SocialLinkButton.displayName = "SocialLinkButton";
