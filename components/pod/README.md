# Board Component Refactoring

This directory contains the refactored Board component that has been broken down into smaller, maintainable components.

## Component Structure

### Main Components

- **`Board.tsx`** - Main container component that orchestrates all other components
- **`BoardHeader.tsx`** - Team selection and board title
- **`BoardFilters.tsx`** - Search, filter, and sort controls
- **`BoardGrid.tsx`** - Main kanban board layout (desktop/mobile responsive)
- **`TaskCard.tsx`** - Individual task card component
- **`TaskColumn.tsx`** - Individual column with tasks
- **`TaskDetailModal.tsx`** - Task detail/edit modal
- **`NewTaskModal.tsx`** - New task creation modal
- **`BoardSkeleton.tsx`** - Loading states and skeleton components

### Supporting Files

- **`index.ts`** - Component exports
- **`Board-original.tsx`** - Backup of original monolithic component

## Component Responsibilities

### Board.tsx (Main Container)

- State management using Zustand stores
- Team management and data fetching
- Event handling and business logic
- Permission checking
- Real-time updates via WebSocket
- Drag and drop coordination

### BoardHeader.tsx

- Team selector dropdown
- Board title and task counts
- Loading indicators
- Responsive layout

### BoardFilters.tsx

- Search input
- Priority, assignee, and due date filters
- Sort controls
- Filter state management
- Clear filters functionality

### BoardGrid.tsx (Layout Container)

- **Unified Column Headers**: Headers and task columns scroll together as a single unit
- **Responsive Design**: Different layouts for mobile and desktop
- **Mobile**: Horizontal scrolling columns with sticky headers
- **Desktop**: Grid layout with integrated headers that scroll with their corresponding columns
- **Scroll Synchronization**: Ensures headers always stay aligned with their task columns
- **Drop Zone Management**: Handles drag-and-drop between columns

**Key Features:**
- Integrated header-body columns for consistent scrolling
- Responsive grid system that adapts to screen size
- Unified scrolling experience across desktop and mobile
- Column headers are part of their respective columns, not separate entities

### TaskCard.tsx

- Task display (title, description, priority, etc.)
- Drag and drop support
- Assignment information
- Attachment indicators
- Mobile/desktop variants

### TaskColumn.tsx

- Column layout and styling
- Task list management
- Empty states
- Drop zones for drag and drop
- New task forms (desktop)

### TaskDetailModal.tsx

- Task viewing and editing
- Attachment management
- Status updates
- Activity timeline
- Responsive modal layout

### NewTaskModal.tsx

- Task creation form
- Field validation
- File attachments
- Priority selection
- User assignment

### BoardSkeleton.tsx

- Loading skeletons for tasks
- Column header skeletons
- Full board skeleton layout
- Maintains structure during loading

## Benefits of Refactoring

1. **Maintainability**: Easier to locate and modify specific functionality
2. **Reusability**: Components can be reused in other parts of the application
3. **Testing**: Individual components can be tested in isolation
4. **Performance**: Smaller components can be optimized individually
5. **Development**: Multiple developers can work on different components simultaneously
6. **Debugging**: Issues are easier to isolate and fix

## Functionality Preserved

All original functionality has been preserved:

- Drag and drop task movement
- Real-time updates
- Mobile responsiveness
- Task filtering and sorting
- Task creation and editing
- File attachments
- User permissions
- Team switching
- Loading states

## Usage

The refactored Board component is a drop-in replacement for the original:

```tsx
import Board from "@/components/pod/Board";
// or
import { Board } from "@/components/pod";

// Usage remains the same
<Board
  teamId={teamId}
  teamName={teamName}
  session={session}
  availableTeams={availableTeams}
  onTeamChange={onTeamChange}
  selectedRow={selectedRow}
/>;
```

## Type Safety

All components maintain strict TypeScript typing:

- Imports types from the centralized boardStore
- Consistent interface definitions
- Proper error handling
- IDE support with IntelliSense
