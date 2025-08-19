/**
 * Frame Styling Utilities for Per-Clip Visual Separation
 * 
 * Provides design tokens, default styles, and CSS generation
 * for clip frames/borders in multi-layout video editing modes.
 */

export interface FrameStyle {
  show: boolean;
  style: "border" | "outline" | "shadow" | "glow";
  width: number;
  radius: number;
  opacity: number;
  color: string;
  includeInExport: boolean;
}

/**
 * Design Tokens for Frame Styles
 * Based on modern video editor patterns and accessibility guidelines
 */
export const FRAME_TOKENS = {
  // Border widths (px)
  WIDTH: {
    HAIRLINE: 1,
    THIN: 2,
    NORMAL: 3,
    THICK: 4,
  },
  
  // Corner radius (px)
  RADIUS: {
    NONE: 0,
    SMALL: 4,
    MEDIUM: 8,
    LARGE: 12,
    ROUND: 16,
  },
  
  // Opacity levels
  OPACITY: {
    SUBTLE: 0.3,
    NORMAL: 0.6,
    STRONG: 0.8,
    SOLID: 1.0,
  },
  
  // Color scheme for light/dark themes
  COLORS: {
    LIGHT: {
      PRIMARY: '#334155',    // slate-700 - good contrast on light backgrounds
      SECONDARY: '#64748b',  // slate-500 - subtle separation
      ACCENT: '#3b82f6',     // blue-500 - selection/focus
      SUCCESS: '#10b981',    // emerald-500 - positive states
      WARNING: '#f59e0b',    // amber-500 - attention states
      ERROR: '#ef4444',      // red-500 - error states
    },
    DARK: {
      PRIMARY: '#e2e8f0',    // slate-200 - good contrast on dark backgrounds
      SECONDARY: '#94a3b8',  // slate-400 - subtle separation
      ACCENT: '#60a5fa',     // blue-400 - selection/focus
      SUCCESS: '#34d399',    // emerald-400 - positive states
      WARNING: '#fbbf24',    // amber-400 - attention states
      ERROR: '#f87171',      // red-400 - error states
    },
  },
  
  // Shadow presets
  SHADOWS: {
    SUBTLE: '0 1px 3px rgba(0, 0, 0, 0.1)',
    NORMAL: '0 4px 6px rgba(0, 0, 0, 0.1)',
    STRONG: '0 10px 15px rgba(0, 0, 0, 0.1)',
    GLOW: '0 0 0 4px rgba(59, 130, 246, 0.15)', // blue glow
  },
} as const;

/**
 * Default Frame Presets
 * Optimized for different use cases and layout modes
 */
export const FRAME_PRESETS = {
  // No frame (default for single layout)
  NONE: {
    show: false,
    style: 'border' as const,
    width: 0,
    radius: 0,
    opacity: 0,
    color: 'transparent',
    includeInExport: false,
  },
  
  // Subtle hairline border (good for grid layouts)
  HAIRLINE: {
    show: true,
    style: 'border' as const,
    width: FRAME_TOKENS.WIDTH.HAIRLINE,
    radius: FRAME_TOKENS.RADIUS.SMALL,
    opacity: FRAME_TOKENS.OPACITY.SUBTLE,
    color: FRAME_TOKENS.COLORS.LIGHT.SECONDARY,
    includeInExport: false,
  },
  
  // Normal border (good for split/triptych layouts)
  BORDER: {
    show: true,
    style: 'border' as const,
    width: FRAME_TOKENS.WIDTH.NORMAL,
    radius: FRAME_TOKENS.RADIUS.MEDIUM,
    opacity: FRAME_TOKENS.OPACITY.NORMAL,
    color: FRAME_TOKENS.COLORS.LIGHT.PRIMARY,
    includeInExport: false,
  },
  
  // Outline style (non-intrusive, doesn't affect layout)
  OUTLINE: {
    show: true,
    style: 'outline' as const,
    width: FRAME_TOKENS.WIDTH.THIN,
    radius: FRAME_TOKENS.RADIUS.MEDIUM,
    opacity: FRAME_TOKENS.OPACITY.NORMAL,
    color: FRAME_TOKENS.COLORS.LIGHT.ACCENT,
    includeInExport: false,
  },
  
  // Drop shadow (good for overlays and layered content)
  SHADOW: {
    show: true,
    style: 'shadow' as const,
    width: 0, // Shadow doesn't use width
    radius: FRAME_TOKENS.RADIUS.MEDIUM,
    opacity: FRAME_TOKENS.OPACITY.NORMAL,
    color: 'rgba(0, 0, 0, 0.15)',
    includeInExport: true, // Shadows often look good in final renders
  },
  
  // Glow effect (good for selection/focus states)
  GLOW: {
    show: true,
    style: 'glow' as const,
    width: 4,
    radius: FRAME_TOKENS.RADIUS.MEDIUM,
    opacity: FRAME_TOKENS.OPACITY.SUBTLE,
    color: FRAME_TOKENS.COLORS.LIGHT.ACCENT,
    includeInExport: false,
  },
} as const;

/**
 * Generate CSS styles for a frame configuration
 * 
 * @param frame - Frame style configuration
 * @param isDark - Whether using dark theme
 * @returns CSS style object
 */
export function generateFrameCSS(
  frame: FrameStyle,
  isDark: boolean = false
): React.CSSProperties {
  if (!frame.show) {
    return {};
  }
  
  const colorScheme = isDark ? FRAME_TOKENS.COLORS.DARK : FRAME_TOKENS.COLORS.LIGHT;
  
  // Resolve color with opacity
  const resolveColor = (color: string, opacity: number): string => {
    // If it's already an rgba/hsla color, use as-is
    if (color.includes('rgba') || color.includes('hsla')) {
      return color;
    }
    
    // If it's a hex color, convert to rgba with opacity
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    
    // For named colors or other formats, wrap in rgba
    return `color-mix(in srgb, ${color} ${opacity * 100}%, transparent)`;
  };
  
  const finalColor = resolveColor(frame.color, frame.opacity);
  
  switch (frame.style) {
    case 'border':
      return {
        border: `${frame.width}px solid ${finalColor}`,
        borderRadius: `${frame.radius}px`,
      };
      
    case 'outline':
      return {
        outline: `${frame.width}px solid ${finalColor}`,
        outlineOffset: '-1px', // Keep outline inside element
        borderRadius: `${frame.radius}px`,
      };
      
    case 'shadow':
      return {
        boxShadow: `0 ${frame.width || 4}px ${(frame.width || 4) * 2}px ${finalColor}`,
        borderRadius: `${frame.radius}px`,
      };
      
    case 'glow':
      return {
        boxShadow: `0 0 0 ${frame.width}px ${finalColor}`,
        borderRadius: `${frame.radius}px`,
      };
      
    default:
      return {};
  }
}

/**
 * Get recommended frame preset for layout mode
 * 
 * @param layoutMode - Video layout mode
 * @param isDark - Whether using dark theme
 * @returns Recommended frame preset
 */
export function getRecommendedFrame(
  layoutMode: string,
  isDark: boolean = false
): FrameStyle {
  const basePreset = (() => {
    switch (layoutMode) {
      case 'single':
        return FRAME_PRESETS.NONE;
      case '2-layer':
        return FRAME_PRESETS.HAIRLINE;
      case 'v-triptych':
      case 'h-triptych':
        return FRAME_PRESETS.BORDER;
      case '2x2-grid':
        return FRAME_PRESETS.HAIRLINE;
      default:
        return FRAME_PRESETS.NONE;
    }
  })();
  
  // Adjust colors for theme
  if (isDark && basePreset.show) {
    const darkColor = (() => {
      switch (basePreset.style) {
        case 'border':
        case 'outline':
          return FRAME_TOKENS.COLORS.DARK.PRIMARY;
        case 'shadow':
          return 'rgba(0, 0, 0, 0.4)'; // Darker shadow for dark theme
        case 'glow':
          return FRAME_TOKENS.COLORS.DARK.ACCENT;
        default:
          return FRAME_TOKENS.COLORS.DARK.PRIMARY;
      }
    })();
    
    return {
      ...basePreset,
      color: darkColor,
    };
  }
  
  return basePreset;
}

/**
 * Calculate frame-aware content dimensions
 * 
 * Adjusts content rect to account for frame borders that affect layout
 * 
 * @param contentRect - Base content rectangle
 * @param frame - Frame style configuration
 * @returns Adjusted content rectangle
 */
export function adjustRectForFrame(
  contentRect: { x: number; y: number; width: number; height: number },
  frame: FrameStyle
): { x: number; y: number; width: number; height: number } {
  if (!frame.show || frame.style !== 'border') {
    return contentRect;
  }
  
  // Only borders affect layout dimensions
  const borderWidth = frame.width;
  
  return {
    x: contentRect.x - borderWidth,
    y: contentRect.y - borderWidth,
    width: contentRect.width + (borderWidth * 2),
    height: contentRect.height + (borderWidth * 2),
  };
}

/**
 * Validate frame configuration
 * 
 * @param frame - Frame configuration to validate
 * @returns Validated and normalized frame configuration
 */
export function validateFrame(frame: Partial<FrameStyle>): FrameStyle {
  return {
    show: frame.show ?? false,
    style: frame.style ?? 'border',
    width: Math.max(0, Math.min(10, frame.width ?? 2)), // Clamp 0-10px
    radius: Math.max(0, Math.min(50, frame.radius ?? 8)), // Clamp 0-50px  
    opacity: Math.max(0, Math.min(1, frame.opacity ?? 0.6)), // Clamp 0-1
    color: frame.color ?? FRAME_TOKENS.COLORS.LIGHT.PRIMARY,
    includeInExport: frame.includeInExport ?? false,
  };
}