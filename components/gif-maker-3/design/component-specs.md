# Component Specifications: Transform & Layout System

## 1. TransformOverlay Component

### Props Interface
```typescript
interface TransformOverlayProps {
  // Core transform data
  clipId: string;
  transform: ClipTransform;
  contentRect: ContentRect; // From computeContentRect utility
  
  // Interaction handlers
  onTransformChange: (clipId: string, transform: Partial<ClipTransform>) => void;
  onSelectionChange?: (clipId: string | null) => void;
  
  // Visual configuration
  showHandles?: boolean;
  showSnapGuides?: boolean;
  showSafeAreas?: boolean;
  
  // Theme & accessibility
  theme?: 'light' | 'dark';
  reducedMotion?: boolean;
  
  // Container context
  containerRef: React.RefObject<HTMLDivElement>;
  zoom?: number;
  
  // Snap configuration
  snapTargets?: SnapTarget[];
  snapThreshold?: number;
}
```

### Visual Structure
```
┌─────────────────────────────────────────┐
│ TransformOverlay Container              │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ SelectionBorder (2px blue)        │  │
│  │                                   │  │
│  │  🔵 ────────── 🔺 ────────── 🔵   │  │ <- Corner + Rotation handles
│  │  │                           │   │  │
│  │  │                           │   │  │
│  │  🔹     Content Area         🔹   │  │ <- Edge handles  
│  │  │                           │   │  │
│  │  │                           │   │  │
│  │  🔵 ────────────────────────── 🔵   │  │ <- Corner handles
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│ SnapGuides (conditional)                │
│ ┊ ┊ ┊ (dashed lines)                    │
│                                         │
└─────────────────────────────────────────┘

Legend:
🔵 Corner resize handles (10px square)
🔹 Edge resize handles (8px rectangle)  
🔺 Rotation handle (12px circle)
┊ Snap guide lines (1px dashed)
```

### State Management
```typescript
interface TransformState {
  // Interaction state
  isDragging: boolean;
  dragType: 'move' | 'resize' | 'rotate' | null;
  dragStartPos: { x: number; y: number };
  
  // Visual state
  isHovered: boolean;
  hoveredHandle: HandleType | null;
  
  // Snap state
  activeSnaps: SnapResult[];
  showSnapGuides: boolean;
  
  // Transform preview
  previewTransform?: Partial<ClipTransform>;
}
```

## 2. FrameStyle Component

### Props Interface
```typescript
interface FrameStyleProps {
  // Frame configuration
  frame: FrameStyle;
  contentRect: ContentRect;
  
  // Render context
  isPreview?: boolean;        // Preview mode vs export mode
  includeInRender?: boolean;  // Export setting override
  
  // Theme
  theme?: 'light' | 'dark';
  
  // Container
  containerStyle?: React.CSSProperties;
}
```

### Frame Style Examples
```
Border Style (2px solid):
┌──────────────────────┐
│░░░░░░░░░░░░░░░░░░░░░░│ <- Border (2px)
│░┌──────────────────┐░│
│░│    Video Content │░│
│░│                  │░│
│░└──────────────────┘░│
│░░░░░░░░░░░░░░░░░░░░░░│
└──────────────────────┘

Shadow Style (8px blur):
┌──────────────────────┐
│    Video Content     │
│                      │
│                      │
└──────────────────────┘
  ░░░░░░░░░░░░░░░░░░░░ <- Shadow (offset + blur)
   ░░░░░░░░░░░░░░░░░░
    ░░░░░░░░░░░░░░░░

Glow Style (4px spread):
    ░░░░░░░░░░░░░░░░░░ <- Glow (4px spread)
  ░░┌──────────────────┐░░
░░░░│    Video Content │░░░░
░░░░│                  │░░░░
  ░░└──────────────────┘░░
    ░░░░░░░░░░░░░░░░░░
```

## 3. Layout Cell Configuration

### Layout Dimensions & Gutters
```
Single Layout (1920×1080):
┌─────────────────────────────────────────┐
│                                         │
│              Video Content              │
│                 100%                    │
│                                         │
└─────────────────────────────────────────┘

2-Layer Split (1920×1080):
┌──────────────────┐ ┌──────────────────┐
│    Video A       │ │    Video B       │
│     50% - 4px    │ │    50% - 4px     │
│                  │8px                  │ <- Gutter
│                  │ │                  │
└──────────────────┘ └──────────────────┘

V-Triptych (1920×1080):
┌─────────────────────────────────────────┐
│              Video A (33%)              │
├─────────────────────────────────────────┤ <- 8px gutter
│              Video B (33%)              │
├─────────────────────────────────────────┤ <- 8px gutter  
│              Video C (33%)              │
└─────────────────────────────────────────┘

2×2 Grid (1920×1080):
┌─────────────────┐ ┌─────────────────┐
│    Video A      │ │    Video B      │
│   50% - 2px     │4px   50% - 2px    │ <- Tight gutter
├─────────────────┤ ├─────────────────┤
│    Video C      │ │    Video D      │
│   50% - 2px     │ │   50% - 2px     │
└─────────────────┘ └─────────────────┘
```

### Cell Props Interface
```typescript
interface LayoutCellProps {
  // Position & size
  layer: number;
  bounds: {
    x: number;      // Left position (%)
    y: number;      // Top position (%)  
    width: number;  // Width (%)
    height: number; // Height (%)
  };
  
  // Styling
  gutter: number;           // Gutter size (px)
  radius: number;           // Corner radius (px)
  separation: SeparationType; // Visual separation method
  
  // Content
  clip?: Clip;
  fitMode: 'contain' | 'cover' | 'fill';
  
  // Frame
  frame?: FrameStyle;
  showFrame?: boolean;
}
```

## 4. Snap Guide System

### Snap Guide Visual
```
Canvas with Snap Guides:
┌─────────────────────────────────────────┐
│┊           ┊           ┊               │ <- Thirds grid
│┊           ┊           ┊               │
│┊           ┊    ┌─────┐┊               │
├┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄├─────┤┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄│ <- Center guide
│┊           ┊    │ Obj │┊               │
│┊           ┊    └─────┘┊               │
│┊           ┊           ┊               │
├─────────────────────────────────────────│ <- Edge guide
│┊           ┊           ┊               │
└─────────────────────────────────────────┘

Legend:
┊ Thirds grid (dotted, amber)
┄ Center guides (dashed, emerald)  
─ Edge guides (solid, gray)
■ Selected object
```

### Snap Target Interface
```typescript
interface SnapTarget {
  id: string;
  type: 'edge' | 'center' | 'thirds' | 'custom';
  orientation: 'horizontal' | 'vertical';
  position: number;           // Pixel position
  threshold: number;          // Snap distance (px)
  priority: number;           // Higher = more important
  color: string;              // Guide line color
  style: 'solid' | 'dashed' | 'dotted';
}

interface SnapResult {
  target: SnapTarget;
  distance: number;           // Distance to target
  snapPosition: number;       // Final snapped position
  shouldShow: boolean;        // Show guide line
}
```

## 5. Keyboard Navigation System

### Focus Ring Specification
```
Focused Clip (keyboard navigation):
┌─────────────────────────────────────────┐
│███                                   ███│ <- Focus outline (3px)
│█ ┌─────────────────────────────────┐ █ │
│█ │                                 │ █ │
│█ │        Video Content           │ █ │
│█ │                                 │ █ │
│█ └─────────────────────────────────┘ █ │
│███                                   ███│
└─────────────────────────────────────────┘

Focus outline:
- Width: 3px
- Color: Blue-500 (#3b82f6)  
- Style: Solid
- Offset: 2px from content
```

### Keyboard Shortcuts Map
```typescript
const KEYBOARD_SHORTCUTS = {
  // Selection
  'Tab': 'Select next clip',
  'Shift+Tab': 'Select previous clip',
  'Escape': 'Clear selection',
  
  // Movement (normal = 1px)
  'ArrowUp': 'Move up 1px',
  'ArrowDown': 'Move down 1px', 
  'ArrowLeft': 'Move left 1px',
  'ArrowRight': 'Move right 1px',
  
  // Movement (fine = 0.5px)
  'Alt+ArrowUp': 'Move up 0.5px',
  'Alt+ArrowDown': 'Move down 0.5px',
  'Alt+ArrowLeft': 'Move left 0.5px', 
  'Alt+ArrowRight': 'Move right 0.5px',
  
  // Movement (coarse = 10px)
  'Ctrl+ArrowUp': 'Move up 10px',
  'Ctrl+ArrowDown': 'Move down 10px',
  'Ctrl+ArrowLeft': 'Move left 10px',
  'Ctrl+ArrowRight': 'Move right 10px',
  
  // Transform
  'Ctrl+0': 'Reset transform',
  'Ctrl+=': 'Scale up 10%',
  'Ctrl+-': 'Scale down 10%',
  
  // Overlays
  'Ctrl+;': 'Toggle rule of thirds',
  'Ctrl+\'': 'Toggle safe areas',
  'Ctrl+G': 'Toggle snap guides',
}
```

## 6. Performance Optimization

### Memoization Strategy
```typescript
// Component-level memoization
const TransformOverlay = React.memo(({
  clipId,
  transform,
  contentRect,
  ...props
}) => {
  // Memoize expensive calculations
  const handlePositions = useMemo(() => 
    calculateHandlePositions(contentRect, transform),
    [contentRect, transform]
  );
  
  // Memoize snap calculations
  const snapTargets = useMemo(() =>
    generateSnapTargets(containerBounds, otherClips),
    [containerBounds, otherClips]
  );
  
  // Throttle expensive operations
  const throttledUpdate = useCallback(
    throttle((newTransform) => {
      onTransformChange(clipId, newTransform);
    }, 16), // 60fps
    [clipId, onTransformChange]
  );
  
  return (
    <div style={{
      transform: `translate3d(0,0,0)`, // Force GPU layer
      willChange: 'transform',          // Optimization hint
    }}>
      {/* Handle components */}
    </div>
  );
});
```

### Update Batching
```typescript
// Batch multiple updates in single frame
const useBatchedUpdates = () => {
  const [pendingUpdates, setPendingUpdates] = useState<Transform[]>([]);
  
  useEffect(() => {
    if (pendingUpdates.length > 0) {
      // Process all updates in single batch
      requestAnimationFrame(() => {
        const finalTransform = pendingUpdates.reduce(mergeTransforms);
        onTransformChange(clipId, finalTransform);
        setPendingUpdates([]);
      });
    }
  }, [pendingUpdates]);
  
  return (transform: Partial<Transform>) => {
    setPendingUpdates(prev => [...prev, transform]);
  };
};
```

## 7. Accessibility Compliance

### ARIA Labels & Roles
```typescript
const transformOverlayProps = {
  role: 'application',
  'aria-label': `Transform controls for ${clipName}`,
  'aria-describedby': 'transform-instructions',
  
  // Keyboard navigation
  tabIndex: 0,
  onKeyDown: handleKeyboardNavigation,
  
  // Screen reader announcements
  'aria-live': 'polite',
  'aria-atomic': 'true',
};

const handleProps = {
  role: 'button',
  'aria-label': `Resize handle: ${direction}`,
  tabIndex: -1, // Only parent is focusable
  'aria-describedby': 'resize-instructions',
};
```

### Color Contrast Requirements
```typescript
// WCAG AA Compliance (4.5:1 ratio minimum)
const ACCESSIBLE_COLORS = {
  LIGHT_THEME: {
    selection: '#2563eb',     // 4.5:1 on white
    handles: '#1d4ed8',       // 7.1:1 on white  
    text: '#1e293b',          // 16.8:1 on white
  },
  DARK_THEME: {
    selection: '#60a5fa',     // 4.7:1 on dark
    handles: '#93c5fd',       // 7.3:1 on dark
    text: '#f1f5f9',          // 15.8:1 on dark
  },
};
```

## Implementation Notes

1. **Progressive Enhancement**: Start with basic transform functionality, add advanced features incrementally
2. **Performance First**: Use GPU-accelerated properties, memoization, and batched updates
3. **Accessibility**: Full keyboard navigation, screen reader support, high contrast modes
4. **Theme Support**: Design system supports light/dark themes with proper contrast ratios
5. **Testing**: Visual regression tests for handle positioning, interaction tests for drag/snap behavior