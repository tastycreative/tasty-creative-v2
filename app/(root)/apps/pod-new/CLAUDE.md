# POD-NEW Module Documentation

## Overview
POD-NEW is the redesigned Print on Demand (POD) management system for Tasty Creative V3. This module serves as the main dashboard for managing teams, workflows, tasks, and model operations with enhanced performance and user experience.

## Architecture

### Directory Structure
```
app/(root)/apps/pod-new/
├── board/               # Task management kanban board
├── dashboard/           # Main dashboard overview
├── forms/               # Modular workflow forms
├── gallery/             # Media gallery integration
├── gif-maker/           # GIF creation tools
├── my-models/           # Model management system
│   └── [modelName]/     # Dynamic model profiles
│       ├── apps/        # Model-specific applications
│       └── forum/       # Model forum/discussions
├── onboarding/          # User onboarding flow
├── otp-ptr/             # OTP/PTR submission system
├── pricing/             # Pricing guide and calculator
└── sheets/              # Google Sheets integration

components/pod-new/
├── shared/              # Shared/reusable components
│   └── ui/              # UI primitives and utilities
├── features/            # Feature-specific components
│   ├── board/           # Board components
│   ├── forms/           # Form components
│   ├── models/          # Model-related components
│   ├── otp-ptr/         # OTP/PTR components
│   ├── integrations/    # Third-party integrations
│   └── apps/            # App-specific components
└── layouts/             # Layout components
    ├── LeftSidebar.tsx
    ├── RightSidebar.tsx
    └── ModelProfileLayout.tsx
```

## Key Features

### 1. Task Board System
- **Location**: `/board`
- **Components**: `features/board/`
- **Store**: `useBoardStore`, `useBoardTasks`, `useBoardFilters`
- **Features**:
  - Kanban-style task management
  - Drag-and-drop functionality
  - Real-time updates
  - Custom column configuration
  - Task filtering and search
  - Activity history tracking

### 2. Modular Workflow Forms
- **Location**: `/forms`
- **Components**: `features/forms/ModularWorkflowForm.tsx`
- **Purpose**: Dynamic form system for various workflows
- **Features**:
  - Step-by-step workflow guidance
  - File upload with preview
  - Auto-save functionality
  - Validation and error handling
  - Team-specific configurations

### 3. Model Management
- **Location**: `/my-models`
- **Components**: `features/models/`
- **Features**:
  - Model profiles with detailed information
  - Performance metrics and analytics
  - Gallery management
  - Forum/discussion boards
  - Custom applications per model

### 4. Google Sheets Integration
- **Location**: `/sheets`
- **Components**: `features/integrations/SheetsIntegration.tsx`
- **Purpose**: Sync data with Google Spreadsheets
- **Features**:
  - Two-way data synchronization
  - Automated imports/exports
  - Real-time updates
  - Bulk operations

### 5. Responsive Layout System (NEW)
- **Location**: Main layout (`layout.tsx`)
- **Store**: `layoutStore.ts`
- **Purpose**: Dynamic sidebar management and responsive design
- **Features**:
  - **Collapsible Sidebars**: Independent left/right sidebar toggles
  - **Focus Mode**: Hide all sidebars for maximum board space
  - **Auto-Optimization**: Board pages auto-collapse left sidebar on load
  - **Responsive Behavior**: Different layouts for mobile/tablet/desktop
  - **Grid Layout**: Dynamic CSS Grid based on sidebar visibility
    - Both sidebars: `280px | 1fr | 320px`
    - Left only: `280px | 1fr`
    - Right only: `1fr | 320px`
    - No sidebars: `1fr` (full width)
  - **Persistent State**: Layout preferences saved to localStorage
  - **Smooth Transitions**: CSS transitions for all layout changes

### 6. OTP/PTR System
- **Location**: `/otp-ptr`
- **Components**: `features/otp-ptr/`
- **Purpose**: One-Time-Purchase and Pay-To-Reply management
- **Features**:
  - Submission tracking
  - History management
  - Attachment handling
  - Status updates

## State Management

### Primary Stores
1. **podStore** - Team and POD data management
   - `usePodStore()`
   - `usePodData()`
   - `useAvailableTeams()`

2. **boardStore** - Task board state
   - `useBoardStore()`
   - `useBoardTasks()`
   - `useBoardFilters()`
   - `useBoardTaskActions()`
   - `useBoardColumns()`

3. **layoutStore** - Layout and sidebar management (NEW)
   - `useLayoutStore()` - Main layout state management
   - `useResponsiveLayout()` - Responsive breakpoint detection
   - **Features**:
     - Collapsible sidebar states (left/right)
     - Focus mode for maximum board space
     - Responsive behavior handling
     - Persistent localStorage state
     - Auto-optimization for board pages

4. **selectedModelStore** - Model selection state
   - `useSelectedModelStore()`

## Component Guidelines

### Naming Conventions
- **Pages**: PascalCase with "Page" suffix (e.g., `BoardPage`)
- **Components**: PascalCase (e.g., `TaskCard`, `ModelCard`)
- **Hooks**: camelCase with "use" prefix (e.g., `useBoardTasks`)
- **Utilities**: camelCase (e.g., `formatDate`, `validateForm`)

### Component Organization
```typescript
// Standard component structure
"use client"; // If client component

import React from 'react';
// External imports
import { useSession } from 'next-auth/react';
// Internal imports
import { Button } from '@/components/ui/button';
// Feature imports
import TaskCard from '@/components/pod-new/features/board/TaskCard';
// Store imports
import { useBoardStore } from '@/lib/stores/boardStore';

interface ComponentProps {
  // Props definition
}

export default function ComponentName({ ...props }: ComponentProps) {
  // Component logic
  return (
    // JSX
  );
}
```

### Performance Optimization
1. **Dynamic Imports**: Use for heavy components
   ```typescript
   const Board = dynamic(() => import("@/components/pod-new/features/board/Board"), {
     loading: () => <BoardSkeleton />,
     ssr: false,
   });
   ```

2. **Memoization**: For expensive computations
   ```typescript
   const filteredTasks = useMemo(() => {
     return tasks.filter(/* ... */);
   }, [tasks, filters]);
   ```

3. **Virtual Scrolling**: For large lists
   - Use `@tanstack/react-virtual` for model grids
   - Implement pagination for task history

## API Integration

### Endpoints
- `/api/pod/tasks` - Task CRUD operations
- `/api/pod/teams` - Team management
- `/api/pod/models` - Model data
- `/api/pod/sheets` - Google Sheets sync
- `/api/pod/otp-ptr` - OTP/PTR submissions

### Server Actions
Located in `app/actions/pod/`:
- `createTask.ts`
- `updateTaskStatus.ts`
- `syncWithSheets.ts`
- `submitOtpPtr.ts`

## Styling Guidelines

### Color Scheme
- Primary: Purple/Pink gradient
- Success: Green-500
- Warning: Yellow-500
- Error: Red-500
- Background: White (light) / Gray-900 (dark)

### Component Styling
```typescript
// Use cn() for conditional classes
className={cn(
  "base-classes",
  isActive && "active-classes",
  isDisabled && "disabled-classes"
)}
```

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Use Tailwind responsive prefixes

## Testing Checklist

### Before Deployment
- [ ] All forms validate correctly
- [ ] Drag-and-drop works on board
- [ ] Team switching maintains state
- [ ] Google Sheets sync functions
- [ ] File uploads work properly
- [ ] Dark mode displays correctly
- [ ] Mobile responsive layout
- [ ] Performance metrics acceptable

### Layout System Testing (NEW)
- [ ] Left sidebar toggles correctly (show/hide navigation)
- [ ] Right sidebar toggles correctly (show/hide team info)
- [ ] Focus mode hides both sidebars properly
- [ ] Manual sidebar toggle exits focus mode automatically
- [ ] Board auto-optimization works on page load
- [ ] Grid layout transitions smoothly between states
- [ ] Layout preferences persist after page refresh
- [ ] Responsive behavior works on mobile/tablet/desktop
- [ ] No React Hooks order violations in console
- [ ] No layout compression or visual glitches

### Workflow Routing (NEW)
- **Team Workflow Structure**: Wall Post → PG → Flyer → QA → Deploy
- **Content Types**: Wall Post, Story, PPV (Pay-Per-View)
- **Board Columns**: Updated to match workflow process documentation
- **Status Flow**: Tasks progress through defined team workflow stages
- **Team-Specific**: Each team follows the same workflow pattern

### Common Issues
1. **Import Path Errors**: Ensure all imports use new structure
2. **State Synchronization**: Check team ID consistency
3. **Memory Leaks**: Clean up subscriptions in useEffect
4. **Type Errors**: Run TypeScript check before commit
5. **React Hooks Order**: Always call hooks before conditional returns
6. **Layout Grid Issues**: Ensure sidebar visibility logic is consistent
7. **Focus Mode Conflicts**: Manual sidebar toggles should exit focus mode

## Development Workflow

### Adding New Features
1. Create feature folder in `components/pod-new/features/`
2. Add route in `app/(root)/apps/pod-new/`
3. Update navigation in layout
4. Add to this documentation

### Modifying Existing Features
1. Check impact on other components
2. Update types if needed
3. Test with different team contexts
4. Verify mobile responsiveness

## Migration Notes

### From POD to POD-NEW
- POD-NEW replaces the legacy POD system
- Improved performance with virtual scrolling
- Enhanced UI/UX with modern components
- Better state management with Zustand
- Modular architecture for easier maintenance

### Breaking Changes
- Board component structure completely redesigned
- Task data structure enhanced with new fields
- Team switching mechanism improved
- Import paths updated to new structure

## Future Enhancements

### Planned Features
- [ ] Real-time collaboration with Socket.io
- [ ] Advanced analytics dashboard
- [ ] Bulk task operations
- [ ] Custom workflow builder
- [ ] AI-powered task suggestions
- [ ] Enhanced notification system
- [ ] Mobile app integration

### Performance Targets
- Initial load: < 2 seconds
- Task board render: < 100ms
- Form submission: < 500ms
- Sheet sync: < 3 seconds

## Troubleshooting

### Common Problems & Solutions

**Problem**: Board not loading
**Solution**: Check team ID in URL params and store

**Problem**: Forms not submitting
**Solution**: Verify all required fields and file uploads

**Problem**: Sheets not syncing
**Solution**: Check Google API credentials and permissions

**Problem**: Models not displaying
**Solution**: Ensure mock data is properly loaded

## Contact & Support

For questions or issues with POD-NEW:
1. Check this documentation first
2. Review component comments
3. Check console for errors
4. Test in different browsers
5. Verify environment variables

## Code Quality Standards

### Required for All Changes
- TypeScript strict mode compliance
- Proper error handling
- Loading states for async operations
- Accessibility (ARIA labels, keyboard navigation)
- Mobile-responsive design
- Dark mode support

### Best Practices
- Keep components under 200 lines
- Extract reusable logic to hooks
- Use proper semantic HTML
- Implement proper cleanup in useEffect
- Add JSDoc comments for complex functions
- Use proper TypeScript types (avoid 'any')