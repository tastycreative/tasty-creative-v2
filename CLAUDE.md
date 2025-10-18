# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tasty Creative V2 is a Next.js 15 multi-app platform featuring AI-powered content creation tools, POD (Print on Demand) management, media galleries, and collaborative features. The application serves creative professionals and content creators with tools for image generation, video processing, GIF creation, and team workflow management.

## Tech Stack

- **Framework**: Next.js 15.3.3 with App Router
- **Language**: TypeScript 5 with strict mode enabled
- **Database**: PostgreSQL with Prisma ORM v6.11.1
- **Authentication**: NextAuth v5 (beta.28) with Google OAuth and Credentials providers
- **Storage**: Supabase, AWS S3
- **Styling**: Tailwind CSS v4 with Radix UI components
- **State Management**: Zustand v5, TanStack React Query v5
- **AI Integration**: OpenAI API v5, TensorFlow.js v4
- **Media Processing**: FFmpeg (client-side via @ffmpeg/ffmpeg), Remotion v4, gif.js, Three.js
- **Real-time**: Socket.io v4, Redis for notifications
- **Email**: Nodemailer with React Email templates

## Essential Commands

```bash
# Development
npm run dev              # Start development server on port 3000

# Build & Production
npm run build           # Runs prisma generate && next build
npm run postinstall     # Auto-runs prisma generate after npm install
npm start               # Start production server

# Database
npx prisma generate     # Generate Prisma client (required after schema changes)
npx prisma migrate dev  # Run database migrations in development
npx prisma studio       # Open Prisma Studio GUI for database inspection
npx prisma db push      # Push schema changes directly (dev only)

# Code Quality
npm run lint            # Run ESLint (NOTE: currently ignores TS/TSX files - see eslint.config.mjs)

# Migrations
npm run migrate-accounts # Run account data migration script
```

## Project Architecture

### Routing Structure
The app uses Next.js App Router with route groups:
- `app/(root)/` - Main authenticated application routes
- `app/(auth)/` - Authentication pages (sign-in, sign-up)
- `app/(admin)/` - Admin panel routes
- `app/api/` - API routes and server actions
- `app/actions/` - Server actions for form handling

### POD-NEW Routes (Production System)
Located in `app/(root)/(pod)/`:
- `/dashboard` - Main POD dashboard with onboarding stats and KPIs
- `/board` - Kanban-style task board with drag-and-drop and column management
- `/sheets` - Google Sheets integration for data sync
- `/pricing` - Pricing guide with creator earnings data
- `/gallery` - Media gallery (reference page for design system theme)
- `/my-models` - Model/creator management with advanced filters and search
- `/pod-admin` - Admin dashboard with user management and team analytics
- `/onboarding` - Model onboarding tracking and task checklist
- `/forms` - Modular OTP/PTR content submission forms
- `/generative-ai/voice` - AI voice generation tool
- `/my-models/[modelName]` - Full-screen model profile with sidebar navigation

### Additional Applications
Located in `app/(root)/apps/`:
- `gallery/` - Media gallery with AI-powered features and favorites
- `chatting/` - Real-time chat functionality with Socket.io
- `generative-ai/` - AI content generation tools (Text2Image, Image2Image, Inpainting, voice)
- `vault/` - Secure media storage and organization
- `gif-maker/` - GIF creation tools with effects and customization
- `models/` - AI model management and configuration
- `pod/` - Legacy POD dashboard (backward compatibility only)

### Database Schema (Key Models)
- **User**: Core user model with role-based access (ADMIN, MANAGER, USER, GUEST)
- **Account/Session**: NextAuth authentication tables
- **Task**: Task management with activity tracking, column assignments, and workflow integration
- **ContentSubmission**: OTP/PTR submission system with modular workflow support
- **TaskAttachment**: File attachments linked to tasks and submissions
- **ClientModelDetails**: Creator/model information with custom sheet URLs and pricing data
- **ClientModelSheetLinks**: Google Sheets links associated with models
- **Team/TeamMember**: POD team structure with member assignments
- Relations managed via Prisma with cascade deletes where appropriate

### Authentication Flow
1. NextAuth configuration in `auth.ts`
2. Google OAuth with refresh token handling
3. Credentials-based authentication with bcrypt
4. Session management with Prisma adapter
5. Protected routes using middleware (`middleware.ts`)

### Component Organization
- `components/ui/` - Base Radix UI components
- `components/auth/` - Authentication components
- `components/admin/` - Admin panel components
- `components/pod-dashboard/` - POD-specific components (legacy)
- `components/pod-new/` - New POD dashboard components with virtualized lists
  - `features/` - Feature-specific components (board, forms, admin, models)
  - `layouts/` - Layout components (LeftSidebar, RightSidebar)
  - `shared/` - Shared/reusable components
- `components/gallery/` - Gallery and media components
- `components/video-editor/` - Video editing tools
- `components/models/` - AI model components
- `components/gif-maker/` - GIF creation components
- Component files use PascalCase naming

### State & Data Management
- Server components by default
- Client components marked with "use client"
- React Query for server state with custom hooks (`hooks/`)
- Zustand for client state with persistence support
- Prisma for database queries with singleton pattern (`lib/prisma.ts`)

#### Key Zustand Stores
- **podStore** (`lib/stores/podStore.ts`) - Team and POD data management
- **boardStore** (`lib/stores/boardStore.ts`) - Task board state and operations
- **layoutStore** (`lib/stores/layoutStore.ts`) - Layout and sidebar management with:
  - Collapsible sidebar states (left/right navigation)
  - Focus mode for maximum workspace
  - Responsive behavior handling
  - Persistent localStorage state
  - Auto-optimization for specific pages

## Development Guidelines

### Working with Prisma
- Always run `npx prisma generate` after schema changes
- Database URL configured via `DATABASE_URL` environment variable
- Use Prisma Client singleton pattern (see `lib/prisma.ts`)

### Environment Variables
Critical environment variables required for basic functionality:
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_GOOGLE_ID` - Google OAuth client ID
- `AUTH_GOOGLE_SECRET` - Google OAuth client secret
- `NEXTAUTH_URL` - Application URL (e.g., http://localhost:3000)
- `NEXTAUTH_SECRET` - NextAuth encryption secret (generate with `openssl rand -base64 32`)

Additional service integrations:
- `OPENAI_API_KEY` - Required for AI content generation features
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` - For Supabase storage
- `REDIS_URL` - Redis connection for notification system
- AWS S3 credentials for media storage
- Google API credentials for various integrations

### Build Configuration
- TypeScript errors ignored in production builds (`ignoreBuildErrors: true`)
- ESLint errors ignored during builds (`ignoreDuringBuilds: true`)
- Custom webpack config for gif.js worker
- CORS headers configured for API routes
- Allowed dev origins configured for Replit environments

### Media Handling
- Image optimization with Next.js Image component
- Remote patterns configured for external image sources
- FFmpeg integration for video processing (client-side only)
- Gif.js worker copied to public directory during build

## Critical Configuration Details

### TypeScript Configuration
- Strict mode enabled in `tsconfig.json`
- Path alias configured: `@/*` maps to project root
- Build errors ignored via `next.config.ts` (`ignoreBuildErrors: true`)
- Target: ES2017 with ESNext lib features

### Build & Webpack Configuration
- Custom webpack config copies `gif.worker.js` to public directory
- Client-side fallbacks disabled for Node.js modules (fs, path, os, url)
- CORS headers configured for API routes and media proxy
- Cross-Origin policies relaxed for gallery and global routes

### Image Optimization
Remote patterns configured for:
- Google user content (lh3.googleusercontent.com)
- Google Drive
- Various POD platform domains (onlyfans.com, allthiscash.com, betterfans.app)
- SVG support enabled with CSP restrictions

## Important Notes

- **POD-NEW is Production**: POD-NEW (`app/(root)/(pod)/`) is the active production system. Authenticated users are redirected to `/dashboard` which uses POD-NEW components. Legacy POD (`app/(root)/apps/pod/`) is maintained for backward compatibility only.
- **Layout System**: POD-NEW features responsive collapsible sidebar system with focus mode for optimal workspace management
- **Design System**: All POD-NEW pages follow a consistent gallery theme with light gradients (`from-pink-50 via-purple-50 to-blue-50`), radial patterns, decorative circles, and multi-color gradient typography
- **Workflow Integration**: Team routing follows standardized workflow process (Wall Post → PG → Flyer → QA → Deploy)
- **Modular Workflow System**: Component-based form builder (OTP/PTR) with extensible architecture supporting NORMAL, GAME, POLL content styles
- **Admin Dashboard**: Full user management system with analytics and team monitoring capabilities
- **ESLint Configuration**: Currently ignores all TypeScript files to suppress TS errors during lint (`eslint.config.mjs`)
- **Build Warnings**: Both TypeScript and ESLint errors ignored in production builds - manual testing critical
- **React Hooks**: Strict adherence to Rules of Hooks required - all hooks must be called before conditional returns
- **Media Processing**: FFmpeg runs client-side only via WASM, no server-side video processing
- **AI Features**: Require `OPENAI_API_KEY` environment variable
- **Authentication**: Google OAuth requires proper credentials and redirect URIs configured
- **Notification System**: Redis-based real-time notifications with Zustand store for state management
- **No Test Framework**: Project currently has no test setup or test files

## Key Development Patterns

### Data Fetching
- Server Components fetch data directly using Prisma
- Client Components use React Query hooks with API routes
- Server Actions preferred for mutations over API routes
- Custom hooks in `hooks/` for data fetching logic

### Authentication Patterns
- Protected routes checked via middleware
- Session available in Server Components via `auth()` function
- Client-side session access via NextAuth hooks

### File Naming Conventions
- Components: PascalCase (e.g., `UserProfile.tsx`)
- Utilities/Hooks: camelCase (e.g., `useUserData.ts`)
- API routes: kebab-case directories (e.g., `/api/user-profile/`)
- Server actions: camelCase files in `app/actions/`

### Performance Optimizations
- Virtual scrolling for large lists (@tanstack/react-virtual)
- Lazy loading for heavy components
- Image optimization with Next.js Image
- Database query optimization with Prisma select/include

### Layout Management Patterns (POD-NEW)
The POD layout (`app/(root)/(pod)/layout.tsx`) provides a consistent navigation and sidebar system:
- **Responsive Design**: Use `useResponsiveLayout()` hook for breakpoint detection
- **Sidebar State**: Manage via `useLayoutStore()` with persistent localStorage
- **Grid Layouts**: Dynamic CSS Grid columns based on sidebar visibility
- **Focus Mode**: Collapses both sidebars for maximum workspace
- **Auto-optimization**: Board page automatically optimizes layout on mount
- **Model Profile Exception**: Pages matching `/my-models/[name]` render full-screen without layout wrapper
- **Hook Order**: Always call all hooks before any conditional returns
- **Grid Configuration**:
  ```typescript
  // Both sidebars: "xl:grid-cols-[280px_1fr_320px]"
  // Left only: "xl:grid-cols-[280px_1fr]"
  // Right only: "xl:grid-cols-[1fr_320px]"
  // No sidebars: "xl:grid-cols-1"
  ```

## Modular Workflow System

### Architecture Overview
The modular workflow system enables component-based form building for content submissions:

### Content Types
- **OTP (One-Time Post)**: Standard content submissions with flexible scheduling
- **PTR (Pay-To-Release)**: Premium content with scheduled release dates and minimum pricing

### Content Styles
- **NORMAL**: Standard content posting workflow
- **GAME**: Interactive gaming content with custom rules
- **POLL**: Engagement content with audience participation
- **LIVESTREAM**: Future enhancement for live streaming content

### Modular Components
- **BASE Components**: Always included (CONTENT, MODEL, DRIVE)
- **FEATURE Components**: Optional modules (PRICING, RELEASE, UPLOAD, POLL, GAME, PPV)

### Implementation Status
- **Production System**: `/forms` route with ModularWorkflowWizard and ModularWorkflowForm components
- **Legacy System**: `/apps/pod/otp-ptr` - older implementation maintained for reference
- **Database Schema**: ContentSubmission table with attachment support
- **API Integration**: `/api/content-submissions` with team notifications

## Theme System (Gallery Theme)

All POD-NEW pages follow a consistent design system based on the gallery page:

### Core Theme Elements
- **Background**: Light gradient `bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50`
- **Dark Mode**: `dark:from-gray-900 dark:via-purple-900 dark:to-blue-900`
- **Card Background**: `from-white via-pink-50/30 to-purple-50/30` with radial pattern overlay
- **Radial Pattern**: `bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]`
- **Decorative Circles**: White circles positioned top-right and bottom-left with blur

### Typography
- **Page Titles**: `font-black` with multi-color gradient: `from-gray-900 via-pink-600 to-purple-600`
- **Labels**: `font-semibold uppercase tracking-wide` with gradient dots
- **Values**: `font-black text-3xl` for metrics and numbers

### Interactive Elements
- **Stat Cards**: Light gradients (pink, emerald, blue, green) with hover scale and shadow
- **Icon Boxes**: `bg-gradient-to-br from-[color]-500/10 to-[color]-500/10` with rounded-xl borders
- **Buttons**: Pink-to-purple gradients with hover effects
- **Loading States**: Skeleton loaders match actual card colors with decorative patterns

### When Creating New POD Pages
1. Use the gallery gradient background for main container
2. Add radial pattern overlay with low opacity
3. Include decorative white circles for visual interest
4. Apply gradient icon boxes and multi-color gradient titles
5. Ensure stat cards have proper gradients, patterns, and hover effects
6. Make loading states match the actual content structure with correct colors