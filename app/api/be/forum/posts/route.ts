// src/app/api/be/forum/posts/route.ts

import { NextRequest } from "next/server";
import { auth } from "../../../../../auth";
import { ForumPost, PostsResponse } from "../../../../lib/forum-api";

// Mock posts storage
let mockPosts: ForumPost[] = [
  {
    id: 1,
    title: "Welcome to the Community Forum!",
    content: "Welcome everyone! This is our new community forum where we can discuss everything related to our platform. Feel free to introduce yourself and share your experiences!",
    author: {
      id: 1,
      username: "admin",
      avatar: "AD"
    },
    upvotes: 15,
    downvotes: 2,
    score: 13,
    comments: [
      {
        id: 1,
        content: "This is awesome! Thanks for creating this space.",
        author: {
          id: 2,
          username: "user123",
          avatar: "U1"
        },
        upvotes: 5,
        downvotes: 0,
        score: 5,
        timestamp: "2025-01-08T14:30:00Z",
        createdAt: "2025-01-08T14:30:00Z",
        updatedAt: "2025-01-08T14:30:00Z"
      },
      {
        id: 2,
        content: "Looking forward to connecting with everyone!",
        author: {
          id: 3,
          username: "creator_pro",
          avatar: "CP"
        },
        upvotes: 3,
        downvotes: 0,
        score: 3,
        timestamp: "2025-01-08T15:45:00Z",
        createdAt: "2025-01-08T15:45:00Z",
        updatedAt: "2025-01-08T15:45:00Z"
      }
    ],
    timestamp: "2025-01-08T12:00:00Z",
    category: {
      id: 1,
      name: "General Discussion",
      color: "#8B5CF6"
    },
    isPinned: true,
    isLocked: false,
    viewCount: 234,
    commentCount: 2,
    awards: [],
    createdAt: "2025-01-08T12:00:00Z",
    updatedAt: "2025-01-08T12:00:00Z"
  },
  {
    id: 2,
    title: "Tips for New Creators",
    content: "Here are some essential tips for anyone just starting their creator journey:\n\n1. **Be authentic** - Your genuine personality is your biggest asset\n2. **Engage with your community** - Respond to comments and messages\n3. **Stay consistent** - Regular posting helps build your audience\n4. **Use good lighting** - It makes a huge difference in content quality\n5. **Don't give up** - Success takes time and patience",
    author: {
      id: 4,
      username: "veteran_creator",
      avatar: "VC"
    },
    upvotes: 32,
    downvotes: 1,
    score: 31,
    comments: [
      {
        id: 3,
        content: "Great advice! The lighting tip especially helped me.",
        author: {
          id: 5,
          username: "newbie_model",
          avatar: "NM"
        },
        upvotes: 8,
        downvotes: 0,
        score: 8,
        timestamp: "2025-01-08T16:20:00Z",
        createdAt: "2025-01-08T16:20:00Z",
        updatedAt: "2025-01-08T16:20:00Z"
      }
    ],
    timestamp: "2025-01-08T13:15:00Z",
    category: {
      id: 3,
      name: "Tips & Tricks",
      color: "#10B981"
    },
    isPinned: false,
    isLocked: false,
    viewCount: 156,
    commentCount: 1,
    awards: [
      {
        id: 1,
        type: "helpful",
        message: "Great tips!",
        givenBy: {
          id: 2,
          username: "user123",
          avatar: "U1"
        },
        createdAt: "2025-01-08T14:00:00Z"
      }
    ],
    createdAt: "2025-01-08T13:15:00Z",
    updatedAt: "2025-01-08T13:15:00Z"
  },
  {
    id: 3,
    title: "Platform Update Coming Soon!",
    content: "We're excited to announce that a major platform update is coming next week! 🚀\n\nNew features include:\n- Enhanced messaging system\n- Better content analytics\n- Improved mobile experience\n- New customization options\n\nStay tuned for more details!",
    author: {
      id: 1,
      username: "admin",
      avatar: "AD"
    },
    upvotes: 45,
    downvotes: 3,
    score: 42,
    comments: [
      {
        id: 4,
        content: "Can't wait for the analytics improvements!",
        author: {
          id: 6,
          username: "data_lover",
          avatar: "DL"
        },
        upvotes: 12,
        downvotes: 0,
        score: 12,
        timestamp: "2025-01-08T17:30:00Z",
        createdAt: "2025-01-08T17:30:00Z",
        updatedAt: "2025-01-08T17:30:00Z"
      },
      {
        id: 5,
        content: "Mobile experience updates are long overdue. Thanks!",
        author: {
          id: 7,
          username: "mobile_user",
          avatar: "MU"
        },
        upvotes: 8,
        downvotes: 0,
        score: 8,
        timestamp: "2025-01-08T18:00:00Z",
        createdAt: "2025-01-08T18:00:00Z",
        updatedAt: "2025-01-08T18:00:00Z"
      }
    ],
    timestamp: "2025-01-08T16:45:00Z",
    category: {
      id: 4,
      name: "Community Events",
      color: "#F59E0B"
    },
    isPinned: true,
    isLocked: false,
    viewCount: 289,
    commentCount: 2,
    awards: [
      {
        id: 2,
        type: "silver",
        givenBy: {
          id: 8,
          username: "supporter",
          avatar: "SP"
        },
        createdAt: "2025-01-08T17:00:00Z"
      }
    ],
    createdAt: "2025-01-08T16:45:00Z",
    updatedAt: "2025-01-08T16:45:00Z"
  }
];

let nextPostId = 4;
let nextCommentId = 6;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const modelName = searchParams.get('modelName');
    const generalOnly = searchParams.get('generalOnly');
    const sortBy = searchParams.get('sortBy') || 'hot';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');

    let filteredPosts = [...mockPosts];

    // Apply filters
    if (categoryId) {
      filteredPosts = filteredPosts.filter(post => post.category.id === parseInt(categoryId));
    }

    if (modelName) {
      filteredPosts = filteredPosts.filter(post => post.modelName === modelName);
    }

    if (generalOnly === 'true') {
      filteredPosts = filteredPosts.filter(post => !post.modelName);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredPosts = filteredPosts.filter(post => 
        post.title.toLowerCase().includes(searchLower) ||
        post.content.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'new':
        filteredPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'top':
        filteredPosts.sort((a, b) => b.score - a.score);
        break;
      case 'hot':
      default:
        // Hot algorithm: combine score with recency
        filteredPosts.sort((a, b) => {
          const aHotScore = a.score + (a.isPinned ? 1000 : 0);
          const bHotScore = b.score + (b.isPinned ? 1000 : 0);
          return bHotScore - aHotScore;
        });
        break;
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedPosts = filteredPosts.slice(startIndex, startIndex + limit);

    const response: PostsResponse = {
      posts: paginatedPosts,
      total: filteredPosts.length
    };

    return Response.json(response);
  } catch (err) {
    console.error("Forum posts error:", err);
    return new Response("Failed to retrieve forum posts", { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get session information
    const session = await auth();
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Import and get user data from Prisma to get the username
    const { prisma } = await import("../../../../../lib/prisma");
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { username: true, email: true, name: true }
    });

    if (!user || !user.username) {
      return new Response("Username not found", { status: 400 });
    }

    const body = await request.json();
    
    // Create new post
    const newPost: ForumPost = {
      id: nextPostId++,
      title: body.title,
      content: body.content,
      author: {
        id: parseInt(session.user.id.slice(-3), 36), // Generate a numeric ID from string ID
        username: user.username,
        avatar: user.username.substring(0, 2).toUpperCase()
      },
      upvotes: 0,
      downvotes: 0,
      score: 0,
      comments: [],
      timestamp: new Date().toISOString(),
      category: {
        id: body.categoryId,
        name: getCategoryName(body.categoryId),
        color: getCategoryColor(body.categoryId)
      },
      modelName: body.modelName,
      isPinned: body.isPinned || false,
      isLocked: false,
      viewCount: 0,
      commentCount: 0,
      awards: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add to mock posts
    mockPosts.unshift(newPost);

    return Response.json(newPost);
  } catch (err) {
    console.error("Forum post creation error:", err);
    return new Response("Failed to create forum post", { status: 500 });
  }
}

// Helper functions
function getCategoryName(categoryId: number): string {
  const categories: Record<number, string> = {
    1: "General Discussion",
    2: "Model Support",
    3: "Tips & Tricks",
    4: "Community Events",
    5: "Feature Requests"
  };
  return categories[categoryId] || "General Discussion";
}

function getCategoryColor(categoryId: number): string {
  const colors: Record<number, string> = {
    1: "#8B5CF6",
    2: "#EC4899",
    3: "#10B981",
    4: "#F59E0B",
    5: "#3B82F6"
  };
  return colors[categoryId] || "#8B5CF6";
}
