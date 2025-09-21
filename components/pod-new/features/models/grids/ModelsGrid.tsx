"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Responsive Grid System for POD Models Dashboard
 * Mobile-first design with intelligent breakpoint adaptation
 */

// Grid density configurations
type GridDensity = "compact" | "standard" | "comfortable";

interface ModelsGridProps extends React.HTMLAttributes<HTMLDivElement> {
  density?: GridDensity;
  children: React.ReactNode;
  /**
   * Custom grid columns override
   * Format: { sm: 2, md: 3, lg: 4, xl: 5 }
   */
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    "2xl"?: number;
  };
  /**
   * Whether to enable masonry-like layout for varying card heights
   */
  masonry?: boolean;
}

const DENSITY_CONFIGS: Record<
  GridDensity,
  {
    gap: string;
    padding: string;
    minCardWidth: string;
  }
> = {
  compact: {
    gap: "gap-3",
    padding: "p-3",
    minCardWidth: "280px",
  },
  standard: {
    gap: "gap-4 md:gap-6",
    padding: "p-4 md:p-6",
    minCardWidth: "300px",
  },
  comfortable: {
    gap: "gap-6 md:gap-8",
    padding: "p-6 md:p-8",
    minCardWidth: "320px",
  },
};

const DEFAULT_COLUMNS = {
  sm: 1, // Mobile: Single column
  md: 2, // Tablet: 2 columns
  lg: 3, // Desktop: 3 columns
  xl: 4, // Large desktop: 4 columns
  "2xl": 5, // Ultra-wide: 5 columns
};

const ModelsGrid = forwardRef<HTMLDivElement, ModelsGridProps>(
  (
    {
      density = "standard",
      columns = DEFAULT_COLUMNS,
      masonry = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const config = DENSITY_CONFIGS[density];
    const mergedColumns = { ...DEFAULT_COLUMNS, ...columns };

    // Build responsive grid classes
    const gridClasses = [
      // Base mobile layout (always 1 column on mobile for touch-friendly UX)
      "grid grid-cols-1",

      // Responsive columns
      mergedColumns.sm && mergedColumns.sm > 1
        ? `sm:grid-cols-${mergedColumns.sm}`
        : "",
      mergedColumns.md ? `md:grid-cols-${mergedColumns.md}` : "",
      mergedColumns.lg ? `lg:grid-cols-${mergedColumns.lg}` : "",
      mergedColumns.xl ? `xl:grid-cols-${mergedColumns.xl}` : "",
      mergedColumns["2xl"] ? `2xl:grid-cols-${mergedColumns["2xl"]}` : "",

      // Use auto-fit for masonry-like behavior
      masonry
        ? "lg:grid-cols-[repeat(auto-fit,minmax(var(--min-card-width),1fr))]"
        : "",

      // Apply density-based spacing
      config.gap,
      config.padding,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div
        ref={ref}
        className={cn(
          gridClasses,
          "w-full transition-all duration-200 ease-out",
          className
        )}
        style={
          {
            // CSS custom property for masonry min-width
            "--min-card-width": config.minCardWidth,
          } as React.CSSProperties
        }
        {...props}
      >
        {children}
      </div>
    );
  }
);

ModelsGrid.displayName = "ModelsGrid";

/**
 * Grid Item wrapper for individual model cards
 * Provides consistent spacing and responsive behavior
 */
interface GridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Column span for featured/priority items
   */
  span?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  /**
   * Priority items get special treatment (animation delays, etc.)
   */
  priority?: boolean;
  children: React.ReactNode;
}

const GridItem = forwardRef<HTMLDivElement, GridItemProps>(
  ({ span, priority = false, className, children, ...props }, ref) => {
    const spanClasses = span
      ? [
          span.sm ? `sm:col-span-${span.sm}` : "",
          span.md ? `md:col-span-${span.md}` : "",
          span.lg ? `lg:col-span-${span.lg}` : "",
          span.xl ? `xl:col-span-${span.xl}` : "",
        ]
          .filter(Boolean)
          .join(" ")
      : "";

    return (
      <div
        ref={ref}
        className={cn(
          "relative", // For absolute positioned elements
          spanClasses,
          // Staggered animation entrance
          "animate-in fade-in slide-in-from-bottom-4 duration-500",
          priority ? "animation-delay-75" : "animation-delay-150",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GridItem.displayName = "GridItem";

/**
 * Grid container for different sections/categories
 * Provides semantic structure and spacing
 */
interface GridSectionProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}

const GridSection = forwardRef<HTMLElement, GridSectionProps>(
  ({ title, subtitle, headerAction, className, children, ...props }, ref) => {
    return (
      <section
        ref={ref}
        className={cn("space-y-4 md:space-y-6", className)}
        {...props}
      >
        {(title || subtitle || headerAction) && (
          <header className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              {title && (
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {subtitle}
                </p>
              )}
            </div>
            {headerAction && (
              <div className="flex-shrink-0">{headerAction}</div>
            )}
          </header>
        )}
        {children}
      </section>
    );
  }
);

GridSection.displayName = "GridSection";

/**
 * Empty state component for grid
 */
interface GridEmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

const GridEmptyState = ({
  title = "No models found",
  description = "Try adjusting your search or filters to find models",
  action,
  icon,
}: GridEmptyStateProps) => {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
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

/**
 * Loading skeleton for grid
 */
interface GridSkeletonProps {
  count?: number;
  density?: GridDensity;
}

const GridSkeleton = ({
  count = 8,
  density = "standard",
}: GridSkeletonProps) => {
  const config = DENSITY_CONFIGS[density];

  return (
    <ModelsGrid density={density}>
      {Array.from({ length: count }, (_, i) => (
        <GridItem key={i} className="animate-pulse">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header with image placeholder */}
            <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />

            {/* Content area */}
            <div className="p-4 space-y-4">
              {/* Title and subtitle */}
              <div className="space-y-2">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              </div>

              {/* Social links */}
              <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-600">
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                  <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                </div>
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              </div>
            </div>
          </div>
        </GridItem>
      ))}
    </ModelsGrid>
  );
};

export { ModelsGrid, GridItem, GridSection, GridEmptyState, GridSkeleton };

export type {
  ModelsGridProps,
  GridItemProps,
  GridSectionProps,
  GridEmptyStateProps,
  GridSkeletonProps,
  GridDensity,
};
