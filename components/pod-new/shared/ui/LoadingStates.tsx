"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";

/**
 * Loading States and Skeleton Components for POD Models Dashboard
 * Provides smooth loading experiences and micro-interactions
 */

// Base skeleton component
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "shimmer" | "pulse";
}

const Skeleton = ({
  className,
  variant = "shimmer",
  ...props
}: SkeletonProps) => {
  return (
    <div
      className={cn(
        "bg-gray-200 dark:bg-gray-700 rounded",
        variant === "shimmer" &&
          "animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%]",
        variant === "pulse" && "animate-pulse",
        className
      )}
      {...props}
    />
  );
};

// Model card skeleton
interface ModelCardSkeletonProps {
  className?: string;
  variant?: "default" | "compact" | "featured";
}

const ModelCardSkeleton = ({
  className,
  variant = "default",
}: ModelCardSkeletonProps) => {
  const heightClasses = {
    default: "h-auto",
    compact: "h-80",
    featured: "h-96",
  };

  return (
    <div
      className={cn(
        "bg-white/90 dark:bg-gray-800/90 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden",
        heightClasses[variant],
        className
      )}
    >
      {/* Header section with image placeholder */}
      <div className="h-48 relative bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-white/5 dark:to-white/5">
        {/* Status badge */}
        <div className="absolute top-4 left-4 z-10">
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        {/* Action icons */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Skeleton className="w-8 h-8 rounded-full bg-black/30" />
          <Skeleton className="w-8 h-8 rounded-full bg-black/30" />
        </div>
        {/* Circular avatar */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton className="w-20 h-20 rounded-full border-4 border-white/80 dark:border-gray-800/80" />
        </div>
        {/* Name overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
          <Skeleton className="h-6 w-40 mb-2 bg-gray-300/80 dark:bg-gray-600/80" />
          <Skeleton className="h-4 w-28 bg-gray-400/80 dark:bg-gray-500/80" />
        </div>
      </div>

      {/* Content section to match card footer style */}
      <div className="bg-gray-900/90 p-4 space-y-4">
        {/* Meta information */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-5 w-16" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-5 w-14" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-12" />
          </div>
        </div>

        {/* Chips and actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="w-8 h-8 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Grid skeleton for multiple cards
interface ModelsGridSkeletonProps {
  count?: number;
  className?: string;
  density?: "compact" | "standard" | "comfortable";
}

const ModelsGridSkeleton = ({
  count = 8,
  className,
  density = "standard",
}: ModelsGridSkeletonProps) => {
  const gapClasses = {
    compact: "gap-3",
    standard: "gap-4 md:gap-6",
    comfortable: "gap-6 md:gap-8",
  };

  const paddingClasses = {
    compact: "p-3",
    standard: "p-4 md:p-6",
    comfortable: "p-6 md:p-8",
  };

  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        gapClasses[density],
        paddingClasses[density],
        className
      )}
    >
      {Array.from({ length: count }, (_, i) => (
        <ModelCardSkeleton
          key={i}
          className={cn(
            "animate-in slide-in-from-bottom duration-500",
            `animation-delay-${Math.min(i * 75, 500)}ms`
          )}
        />
      ))}
    </div>
  );
};

// Search skeleton
const SearchSkeleton = ({ className }: { className?: string }) => {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Search bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Skeleton className="flex-1 h-12 rounded-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-12 w-20 rounded-lg" />
          <Skeleton className="h-12 w-24 rounded-lg" />
          <Skeleton className="h-12 w-16 rounded-lg" />
        </div>
      </div>

      {/* Quick filters */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-lg" />
        ))}
      </div>

      {/* Results summary */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
};

// Loading spinner component
interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

const LoadingSpinner = ({
  size = "md",
  className,
  text,
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Loader2
        className={cn("animate-spin text-primary-500", sizeClasses[size])}
      />
      {text && (
        <span className="text-sm text-gray-600 dark:text-gray-400">{text}</span>
      )}
    </div>
  );
};

// Refresh button with loading state
interface RefreshButtonProps {
  isLoading?: boolean;
  onClick: () => void;
  className?: string;
  size?: "sm" | "md";
}

const RefreshButton = ({
  isLoading = false,
  onClick,
  className,
  size = "md",
}: RefreshButtonProps) => {
  const sizeClasses = {
    sm: "p-2 w-8 h-8",
    md: "p-2.5 w-10 h-10",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
  };

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        "rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800",
        "hover:border-primary-200 dark:hover:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/10",
        "disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 touch-target",
        sizeClasses[size],
        className
      )}
      aria-label={isLoading ? "Refreshing..." : "Refresh"}
    >
      <RefreshCw
        className={cn(
          "text-gray-600 dark:text-gray-400 transition-colors",
          isLoading && "animate-spin text-primary-500",
          iconSizes[size]
        )}
      />
    </button>
  );
};

// Empty state with loading option
interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}

const EmptyState = ({
  title = "No models found",
  description = "Try adjusting your search or filters",
  action,
  icon,
  isLoading = false,
  className,
}: EmptyStateProps) => {
  if (isLoading) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-16 text-center",
          className
        )}
      >
        <div className="space-y-4 max-w-sm">
          <div className="mx-auto w-16 h-16 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-6 w-32 mx-auto" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        className
      )}
    >
      <div className="space-y-4 max-w-sm">
        {icon && (
          <div className="mx-auto w-16 h-16 text-gray-300 dark:text-gray-600 flex items-center justify-center">
            {icon}
          </div>
        )}
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        </div>
        {action && <div className="pt-2">{action}</div>}
      </div>
    </div>
  );
};

// Page loading state
const PageLoadingState = ({ className }: { className?: string }) => {
  return (
    <div className={cn("space-y-6", className)}>
      <ModelsGridSkeleton count={12} />
    </div>
  );
};

// Success animation component
interface SuccessAnimationProps {
  message?: string;
  duration?: number;
  onComplete?: () => void;
}

const SuccessAnimation = ({
  message = "Success!",
  duration = 2000,
  onComplete,
}: SuccessAnimationProps) => {
  React.useEffect(() => {
    if (onComplete) {
      const timer = setTimeout(onComplete, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onComplete]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-success-100 dark:bg-success-900/20 rounded-full flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-success-500 animate-pulse" />
          </div>
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};

// Export all components
export {
  Skeleton,
  ModelCardSkeleton,
  ModelsGridSkeleton,
  SearchSkeleton,
  LoadingSpinner,
  RefreshButton,
  EmptyState,
  PageLoadingState,
  SuccessAnimation,
};

export type {
  SkeletonProps,
  ModelCardSkeletonProps,
  ModelsGridSkeletonProps,
  LoadingSpinnerProps,
  RefreshButtonProps,
  EmptyStateProps,
  SuccessAnimationProps,
};
