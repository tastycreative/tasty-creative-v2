# Model-Scoped Forum System

A modern, Context7-inspired forum system with glassmorphism UI design for AI model discussions, built with Next.js 15, TypeScript, Prisma, and Tailwind CSS.

## 🎯 Overview

This forum system provides model-specific discussion spaces with a beautiful, modern interface where users can:
- Create and participate in threaded discussions with real-time updates
- Post replies and interact with like/reaction system
- Ask questions and mark answers as solved
- Share showcases and get community feedback
- Report bugs and track their resolution
- Stay updated with official releases and announcements

Each forum is scoped to a specific AI model, ensuring focused and relevant discussions. Features modern Context7-inspired UI with glassmorphism effects, smooth animations, and intuitive navigation.

## ✨ Recent Updates (Latest Version)

### 🎨 Modern UI Overhaul
- **Context7-Inspired Design**: Implemented modern forum thread list with card-based layout
- **Glassmorphism Effects**: Beautiful blur effects, gradients, and transparency
- **Smooth Animations**: Framer Motion animations for thread interactions
- **Enhanced Typography**: Improved text hierarchy and visual appeal
- **Status Indicators**: Visual badges for pinned, solved, and locked threads
- **Category Colors**: Color-coded category badges with icons

### 🔗 Complete Navigation Flow
- **Sidebar Integration**: Thread view pages maintain consistent sidebar layout  
- **Seamless Navigation**: Click thread → view details → back to forum with proper routing
- **Layout Consistency**: All views use ModelProfileLayout for unified experience

### ⚡ Real Functionality
- **Live Reply System**: Post replies that save to database and appear instantly
- **Working Reactions**: Like (👍) and Helpful (✨) buttons with real-time counts
- **Database Integration**: No more mock data - everything pulls from PostgreSQL
- **Optimistic Updates**: UI updates immediately while syncing with backend

### 🛠 Technical Improvements  
- **API Endpoints**: Complete CRUD operations for threads, posts, and reactions
- **Error Handling**: Proper loading states and error messages
- **Type Safety**: Full TypeScript coverage for all new components
- **Performance**: Efficient data fetching and caching strategies

## 🏗️ Architecture

### Tech Stack
- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript with strict mode
- **Database:** PostgreSQL with Prisma ORM
- **State Management:** Zustand for client state, TanStack Query for server state
- **Styling:** Tailwind CSS with shadcn/ui components
- **Authentication:** NextAuth v5 integration

### Component Structure
```
components/
├── forum/
│   ├── ThreadView.tsx      # Detailed thread display with posts
│   ├── Composer.tsx        # Rich text composer for threads/replies
│   └── ...
├── pod-new/
│   └── model-profile/
│       └── tabs/
│           └── ModelForumTab.tsx  # Main forum interface
└── ui/                     # shadcn/ui components
```

### API Architecture
```
app/api/models/[modelId]/forum/
├── threads/
│   ├── route.ts                    # GET: List threads, POST: Create thread
│   └── [threadId]/
│       ├── route.ts                # GET: Thread details (with posts & reactions)
│       └── posts/
│           └── route.ts            # POST: Create reply/post
├── posts/[postId]/
│   └── reactions/
│       └── route.ts                # POST: Add/remove reaction, GET: Get reactions
├── categories/
│   └── route.ts                    # GET: Forum categories with counts
└── stats/
    └── route.ts                    # GET: Forum statistics
```

### New API Features
- **Thread Details**: Single endpoint returns thread with all posts and reactions
- **Reaction System**: Full CRUD operations for post reactions with counts
- **Statistics**: Real-time forum activity metrics
- **Auto-increment Views**: Thread view counts update automatically
- **Optimistic UI**: Immediate updates while syncing with database

## 🗄️ Database Schema

### Core Models
- **ForumCategory**: Model-scoped categories (General, Q&A, Bugs, Showcase, Releases)
- **Thread**: Discussion threads with metadata (pinned, locked, solved, views)
- **Post**: Individual messages with markdown/HTML content and reactions
- **PostReaction**: Emoji reactions to posts
- **ThreadWatcher**: User subscriptions to threads
- **Attachment**: File attachments for posts
- **ModerationLog**: Audit trail for moderation actions

### Key Features
- **Model Scoping**: All content is scoped by `modelId`
- **Rich Content**: Markdown input with HTML output for performance
- **Reactions**: Emoji-based post reactions with user tracking
- **Moderation**: Pin, lock, solve threads; soft-delete posts
- **Watching**: Subscribe to threads for notifications

## 🚀 Setup Instructions

### 1. Database Migration
First, apply the forum schema changes:

```bash
# Generate Prisma client with new schema
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name add-forum-models

# Open Prisma Studio to verify schema
npx prisma studio
```

### 2. Environment Variables
Add these to your `.env.local`:

```env
# Already configured in your project
DATABASE_URL="your-postgresql-connection-string"
NEXTAUTH_SECRET="your-secret-key"
```

### 3. Seed Demo Data
Populate the forum with sample content:

```bash
# Install ts-node if not already available
npm install -D ts-node

# Run the seed script for a specific model
npx ts-node scripts/seed-forum.ts your-model-id

# Example with a test model
npx ts-node scripts/seed-forum.ts ai-model-x
```

### 4. Install Dependencies
The forum uses existing project dependencies, but verify these are installed:

```bash
npm install zustand @tanstack/react-query lucide-react
```

## 🎨 UI Components

### ForumStats
Displays forum statistics (threads, posts, active users, today's activity) in a responsive grid.

### CategoryChips  
Filter threads by category with visual indicators and post counts.

### ThreadList
Virtualized list of threads with metadata (author, category, replies, views, last activity).

### ThreadRow
Individual thread display with status badges (pinned, locked, solved) and action menu.

### ThreadView
Detailed thread view with:
- Thread metadata and actions
- Virtualized post list
- Reaction system
- Reply composer integration

### Composer
Rich text editor with:
- Markdown toolbar
- Live preview mode
- File upload with drag & drop
- Auto-save drafts
- Form validation

## 🔐 Permissions & Roles

### User Roles
- **GUEST**: Read-only access
- **USER**: Can create threads, posts, and reactions
- **MODERATOR**: User permissions + pin, lock, move threads
- **ADMIN**: All permissions + delete content, manage users

### Permission Checks
- **Create Thread/Post**: Requires username and USER+ role
- **Edit Post**: Author only, 10-minute time limit
- **Delete Post**: Author or MODERATOR+
- **React**: USER+ role
- **Moderation**: MODERATOR+ role

## 📱 Mobile Experience

### Responsive Design
- Mobile-first approach with touch-optimized interactions
- Adaptive layouts that stack vertically on small screens
- Pull-to-refresh on thread lists
- Sticky FAB for quick replies

### Performance Optimizations
- Virtualized scrolling for large thread/post lists
- Cursor-based pagination for efficient loading
- Optimistic updates for reactions and quick actions
- Image lazy loading and compression

## 🎯 Usage Examples

### Basic Forum Navigation
```tsx
// In your model profile page
import ModelForumTab from '@/components/pod-new/model-profile/tabs/ModelForumTab';

<ModelForumTab modelName="AI Model X" />
```

### Modern Thread View with Sidebar
```tsx
// Thread detail page automatically includes sidebar
// Navigate: /apps/pod-new/my-models/[modelName]/forum/thread/[threadId]

// Uses ModelProfileLayout for consistent UI
import { ModelProfileLayout } from "@/components/pod-new/model-profile/ModelProfileLayout";

<ModelProfileLayout modelData={modelData}>
  <ThreadViewContent modelName={modelName} threadId={threadId} />
</ModelProfileLayout>
```

### Real-time Functionality
```tsx
// Reply to thread
const handleReply = async (content: string) => {
  const response = await fetch(`/api/models/${modelId}/forum/threads/${threadId}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  // UI updates automatically with new post
};

// React to post
const handleLike = async (postId: string) => {
  await fetch(`/api/models/${modelId}/forum/posts/${postId}/reactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'LIKE' }),
  });
  // Reaction count updates immediately
};
```

### API Usage Examples
```typescript
// Get thread with all posts and reactions
const response = await fetch(`/api/models/${modelId}/forum/threads/${threadId}`);
const threadData = await response.json();
// Returns: thread details + posts + reactions + author info

// Create new thread
const response = await fetch(`/api/models/${modelId}/forum/threads`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'How to fine-tune this model?',
    categoryKey: 'QA',
    content: 'I need help with fine-tuning...'
  })
});

// Add reaction to post
const response = await fetch(`/api/models/${modelId}/forum/posts/${postId}/reactions`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'HELPFUL' })
});
```

## 🔍 Search & Filtering

### Available Filters
- **Category**: General, Q&A, Bugs, Showcase, Releases
- **Status**: Open, Solved, Pinned
- **Ownership**: My Threads, Watching
- **Content**: Full-text search across titles and posts

### Sort Options
- **Recent Activity**: Threads with latest replies first
- **Newest**: Most recently created threads
- **Most Replied**: Threads with most responses
- **Most Viewed**: Highest view count

## 🛡️ Security Features

### Input Validation
- Zod schemas for all API endpoints
- Content length limits (titles: 200 chars, posts: 50k chars)
- File type and size restrictions for attachments

### Rate Limiting
- Built-in Next.js API rate limiting
- Per-user action throttling for posts/reactions
- Abuse detection for spam prevention

### Content Safety
- Markdown sanitization for XSS prevention
- User-generated content filtering
- Report system for inappropriate content

## 🧪 Testing

### Manual Testing Checklist

#### ✅ Core Functionality (Recently Updated)
- [x] Modern thread list with Context7-inspired design
- [x] Click thread cards to navigate to detail view
- [x] Thread view maintains sidebar layout
- [x] Real reply system that saves to database
- [x] Like/reaction buttons with immediate count updates
- [x] Create new threads through web interface
- [x] All data fetched from PostgreSQL (no mock data)

#### 🔲 Extended Features
- [ ] Pin/lock threads as moderator
- [ ] Mark Q&A threads as solved  
- [ ] Test search and filtering
- [ ] Verify mobile responsiveness on all screen sizes
- [ ] Test error handling (network failures, validation errors)
- [ ] Multiple user interactions simultaneously

#### 🔲 UI/UX Testing
- [ ] Glassmorphism effects render correctly
- [ ] Smooth animations on hover/interactions
- [ ] Category badges display proper colors/icons
- [ ] Status indicators (pinned, solved, locked) work
- [ ] Thread stats (views, replies) update correctly
- [ ] Back navigation preserves forum state

### Performance Testing
- [x] Thread list with real database data
- [x] Individual thread loading with posts
- [ ] Large thread lists (100+ threads)
- [ ] Long threads (50+ posts) 
- [ ] Rapid-fire reactions/replies
- [ ] Mobile device performance
- [ ] Animation performance on low-end devices

## 🐛 Troubleshooting

### Common Issues

**Forum not loading:**
- Check database connection and migration status
- Verify user has proper username set up
- Check console for JavaScript errors

**Empty responses from API:**
- Verify authentication headers
- Check model ID format and permissions
- Review server logs for errors

**Slow performance:**
- Check database indexes on frequent queries
- Verify virtualized scrolling is working
- Monitor bundle size and lazy loading

**Permissions errors:**
- Verify user role in database
- Check session validity
- Review API permission middleware

### Debug Mode
Enable debug logging by setting:
```env
DEBUG=forum:*
```

## 🚧 Future Enhancements

### Planned Features
- [ ] Real-time notifications for watched threads
- [ ] Advanced search with filters and facets  
- [ ] Thread tagging system
- [ ] User reputation and badges
- [ ] Rich media embeds (YouTube, GitHub, etc.)
- [ ] Export thread to PDF/markdown
- [ ] Advanced moderation tools
- [ ] Analytics dashboard

### Integration Opportunities
- [ ] Slack/Discord notifications
- [ ] GitHub issue linking
- [ ] Documentation integration
- [ ] AI-powered content suggestions

## 📊 Analytics & Monitoring

### Key Metrics to Track
- Thread creation rate
- User engagement (replies per thread)
- Time to first response
- Resolution rate for Q&A threads
- User retention and activity

### Monitoring Setup
- API response times
- Database query performance
- User error rates
- Content moderation queue

## 🤝 Contributing

### Development Workflow
1. Create feature branch from main
2. Update database schema if needed
3. Add/update API routes and types
4. Implement UI components
5. Add comprehensive tests
6. Update documentation

### Code Standards
- Follow existing TypeScript/React patterns
- Use Tailwind for styling (no custom CSS)
- Implement proper error handling
- Add loading states for all async operations
- Ensure mobile responsiveness

---

## 📞 Support

For issues or questions about the forum system:
1. Check this README and existing documentation
2. Search existing GitHub issues
3. Create a new issue with detailed reproduction steps
4. Include browser, device, and error console output

---

**Built with ❤️ using Next.js, TypeScript, and modern web technologies.**