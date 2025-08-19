/**
 * Design Tokens for GifVideoEditor Transform & Layout System
 * 
 * Centralized design system based on UX research and modern video editor patterns.
 * Provides consistent spacing, colors, animations, and interaction states.
 */

// ============================================================================
// LAYOUT & SPACING TOKENS
// ============================================================================

export const LAYOUT_TOKENS = {
  // Gutters between clips in multi-layout modes
  GUTTERS: {
    NONE: 0,       // Single layout
    TIGHT: 4,      // 2x2 grid (dense)
    NORMAL: 8,     // Split/triptych (balanced) 
    LOOSE: 12,     // When content needs breathing room
  },
  
  // Corner radius for clip containers
  CORNERS: {
    SHARP: 0,      // Technical/broadcast look
    SUBTLE: 6,     // Modern, friendly (recommended default)
    ROUNDED: 12,   // Consumer/social media
  },
  
  // Visual separation methods
  SEPARATION: {
    HAIRLINE: '1px solid rgba(148, 163, 184, 0.3)',
    BORDER: '2px solid rgba(71, 85, 105, 0.4)', 
    SHADOW: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
} as const;

// Layout-specific configuration
export const LAYOUT_CONFIGS = {
  'single': {
    gutter: LAYOUT_TOKENS.GUTTERS.NONE,
    radius: LAYOUT_TOKENS.CORNERS.SUBTLE,
    separation: 'none',
    fitMode: 'cover',
  },
  '2-layer': {
    gutter: LAYOUT_TOKENS.GUTTERS.NORMAL,
    radius: LAYOUT_TOKENS.CORNERS.SUBTLE,
    separation: 'hairline',
    fitMode: 'contain',
  },
  'v-triptych': {
    gutter: LAYOUT_TOKENS.GUTTERS.NORMAL,
    radius: LAYOUT_TOKENS.CORNERS.SUBTLE,
    separation: 'hairline',
    fitMode: 'contain',
  },
  'h-triptych': {
    gutter: LAYOUT_TOKENS.GUTTERS.NORMAL,
    radius: LAYOUT_TOKENS.CORNERS.SUBTLE,
    separation: 'hairline',
    fitMode: 'contain',
  },
  '2x2-grid': {
    gutter: LAYOUT_TOKENS.GUTTERS.TIGHT,
    radius: LAYOUT_TOKENS.CORNERS.SUBTLE,
    separation: 'hairline',
    fitMode: 'cover',
  },
} as const;

// ============================================================================
// TRANSFORM HANDLE TOKENS
// ============================================================================

export const HANDLE_TOKENS = {
  // Handle sizes (px)
  SIZE: {
    CORNER: 10,     // Primary resize handles
    EDGE: 8,        // Secondary resize handles
    ROTATION: 12,   // Distinctive rotation handle
  },
  
  // Handle shapes
  SHAPE: {
    CORNER: 'square',      // Clear corner indication
    EDGE: 'rectangle',     // Directional indication  
    ROTATION: 'circle',    // Rotation affordance
  },
  
  // Handle colors
  COLORS: {
    DEFAULT: '#3b82f6',    // Blue-500 - clear selection
    HOVER: '#2563eb',      // Blue-600 - hover feedback
    ACTIVE: '#1d4ed8',     // Blue-700 - drag state
    CONTRAST: '#ffffff',   // White border for visibility
    DISABLED: '#9ca3af',   // Gray-400 - disabled state
  },
  
  // Handle interaction states
  STATES: {
    DEFAULT: { scale: 1, opacity: 0.9 },
    HOVER: { scale: 1.1, opacity: 1 },
    ACTIVE: { scale: 1.2, opacity: 1 },
  },
  
  // Handle z-index layers
  Z_INDEX: {
    SELECTION_BORDER: 100,
    HANDLES: 101,
    ROTATION_HANDLE: 102,
    DRAG_PREVIEW: 103,
  },
} as const;

// ============================================================================
// SELECTION & FOCUS TOKENS
// ============================================================================

export const SELECTION_TOKENS = {
  // Selection border
  BORDER: {
    WIDTH: 2,
    COLOR: '#3b82f6',
    STYLE: 'solid',
    OPACITY: 0.8,
  },
  
  // Hover states
  HOVER: {
    BORDER_COLOR: '#60a5fa',
    BORDER_OPACITY: 0.6,
    BACKGROUND_OVERLAY: 'rgba(59, 130, 246, 0.05)',
  },
  
  // Focus states (keyboard navigation)
  FOCUS: {
    OUTLINE_WIDTH: 3,
    OUTLINE_COLOR: '#3b82f6',
    OUTLINE_STYLE: 'solid',
    OUTLINE_OFFSET: 2,
  },
} as const;

// ============================================================================
// CURSOR & INTERACTION TOKENS  
// ============================================================================

export const CURSOR_TOKENS = {
  // Cursor states for different interactions
  STATES: {
    HOVER_SELECTION: 'pointer',
    MOVE: 'move',
    RESIZE_NW_SE: 'nw-resize',
    RESIZE_NE_SW: 'ne-resize', 
    RESIZE_N_S: 'ns-resize',
    RESIZE_E_W: 'ew-resize',
    ROTATE: 'crosshair',
    DISABLED: 'not-allowed',
  },
} as const;

// ============================================================================
// NUDGING & SNAP TOKENS
// ============================================================================

export const NUDGE_TOKENS = {
  // Nudging distances (px)
  DISTANCES: {
    FINE: 0.5,      // Alt + Arrow (sub-pixel precision)
    NORMAL: 1,      // Arrow keys (pixel perfect)
    COARSE: 10,     // Ctrl/Cmd + Arrow (quick positioning)
  },
  
  // Snap system
  SNAP: {
    THRESHOLD: 8,   // Distance for auto-snap
    PREVIEW_SIZE: 1, // Guide line thickness
  },
} as const;

export const SNAP_TOKENS = {
  // Snap target priorities and styling
  LAYER_EDGES: { 
    threshold: 8, 
    priority: 1, 
    color: '#3b82f6',
    style: 'solid',
  },
  CENTER_GUIDES: { 
    threshold: 6, 
    priority: 2, 
    color: '#10b981',
    style: 'dashed',
  },
  THIRDS_GRID: { 
    threshold: 4, 
    priority: 3, 
    color: '#f59e0b',
    style: 'dotted',
  },
  CANVAS_EDGES: { 
    threshold: 10, 
    priority: 4, 
    color: '#6b7280',
    style: 'solid',
  },
} as const;

// ============================================================================
// ANIMATION TOKENS
// ============================================================================

export const ANIMATION_TOKENS = {
  // Animation durations (ms)
  DURATION: {
    INSTANT: 0,     // No animation
    FAST: 100,      // Quick feedback
    NORMAL: 150,    // Default transitions
    SLOW: 300,      // Deliberate animations
  },
  
  // Easing curves
  EASING: {
    LINEAR: 'linear',
    EASE_OUT: 'cubic-bezier(0.0, 0.0, 0.2, 1)',     // Material Design
    EASE_IN: 'cubic-bezier(0.4, 0.0, 1, 1)',        // Material Design
    EASE_IN_OUT: 'cubic-bezier(0.4, 0.0, 0.2, 1)',  // Material Design
    BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Playful bounce
  },
  
  // Animation presets
  PRESETS: {
    SELECTION_APPEAR: {
      duration: 150,
      easing: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      properties: ['opacity', 'transform'],
    },
    SELECTION_DISAPPEAR: {
      duration: 100,
      easing: 'cubic-bezier(0.4, 0.0, 1, 1)',
      properties: ['opacity'],
    },
    HANDLE_HOVER: {
      duration: 100,
      easing: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      properties: ['transform', 'opacity'],
    },
    SNAP_GUIDE: {
      duration: 50,
      easing: 'linear',
      properties: ['opacity'],
    },
  },
} as const;

// ============================================================================
// SAFE AREA & OVERLAY TOKENS
// ============================================================================

export const OVERLAY_TOKENS = {
  // Rule of thirds grid
  RULE_OF_THIRDS: {
    show: true,
    color: 'rgba(255, 255, 255, 0.4)',
    width: 1,
    style: 'dashed',
    opacity: 0.6,
  },
  
  // Safe area guides
  TITLE_SAFE: {
    show: false, // Toggle
    area: 0.9,   // 90% of frame
    color: 'rgba(59, 130, 246, 0.3)',
    style: 'solid',
    width: 2,
  },
  
  ACTION_SAFE: {
    show: false,
    area: 0.8,   // 80% of frame
    color: 'rgba(239, 68, 68, 0.3)',
    style: 'solid', 
    width: 2,
  },
} as const;

// ============================================================================
// THEME TOKENS
// ============================================================================

export const THEME_TOKENS = {
  LIGHT: {
    BACKGROUND: '#f8fafc',      // slate-50
    SURFACE: '#ffffff',         // white
    SELECTION: '#3b82f6',       // blue-500
    BORDERS: '#e2e8f0',         // slate-200
    SHADOWS: 'rgba(0, 0, 0, 0.1)',
    TEXT_PRIMARY: '#1e293b',    // slate-800
    TEXT_SECONDARY: '#64748b',  // slate-500
    TEXT_DISABLED: '#94a3b8',   // slate-400
    CONTRAST_RATIO: 4.5,        // WCAG AA compliant
  },
  
  DARK: {
    BACKGROUND: '#0f172a',      // slate-900
    SURFACE: '#1e293b',         // slate-800
    SELECTION: '#60a5fa',       // blue-400  
    BORDERS: '#334155',         // slate-700
    SHADOWS: 'rgba(0, 0, 0, 0.4)',
    TEXT_PRIMARY: '#f1f5f9',    // slate-100
    TEXT_SECONDARY: '#94a3b8',  // slate-400
    TEXT_DISABLED: '#64748b',   // slate-500
    CONTRAST_RATIO: 4.5,        // WCAG AA compliant
  },
} as const;

// ============================================================================
// PERFORMANCE TOKENS
// ============================================================================

export const PERFORMANCE_TOKENS = {
  // Update throttling (ms)
  THROTTLING: {
    MOUSEMOVE: 16,    // 60fps for smooth dragging
    RESIZE: 8,        // 120fps for ultra-smooth resize
    KEYBOARD: 0,      // Immediate for precision
    SCROLL: 16,       // 60fps for smooth scrolling
  },
  
  // Debouncing (ms)
  DEBOUNCING: {
    SEARCH: 300,      // Wait for user to stop typing
    RESIZE_END: 150,  // Wait for resize to finish
    SAVE: 1000,       // Auto-save delay
  },
  
  // GPU optimization
  GPU_LAYERS: {
    COMPOSITION: 'transform3d(0,0,0)', // Force GPU layer
    HANDLES: 'will-change: transform', // Hint for optimization
  },
} as const;

// ============================================================================
// EXPORTED DESIGN SYSTEM
// ============================================================================

export const DESIGN_SYSTEM = {
  LAYOUT: LAYOUT_TOKENS,
  LAYOUT_CONFIGS,
  HANDLES: HANDLE_TOKENS,
  SELECTION: SELECTION_TOKENS,
  CURSORS: CURSOR_TOKENS,
  NUDGING: NUDGE_TOKENS,
  SNAPPING: SNAP_TOKENS,
  ANIMATIONS: ANIMATION_TOKENS,
  OVERLAYS: OVERLAY_TOKENS,
  THEMES: THEME_TOKENS,
  PERFORMANCE: PERFORMANCE_TOKENS,
} as const;

// Type exports for TypeScript consumers
export type LayoutMode = keyof typeof LAYOUT_CONFIGS;
export type HandleSize = keyof typeof HANDLE_TOKENS.SIZE;
export type CursorState = keyof typeof CURSOR_TOKENS.STATES;
export type AnimationPreset = keyof typeof ANIMATION_TOKENS.PRESETS;
export type ThemeMode = keyof typeof THEME_TOKENS;