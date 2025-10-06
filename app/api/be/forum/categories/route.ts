// src/app/api/be/forum/categories/route.ts
import { ForumCategory } from "../../../../lib/forum-api";

export async function GET() {
  try {
    // Mock forum categories data matching the ForumCategory interface
    const mockCategories: ForumCategory[] = [
      {
        id: 1,
        name: "General Discussion",
        color: "#8B5CF6",
        description: "General topics and discussions",
        sortOrder: 1,
        isActive: true,
        postCount: 234,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 2,
        name: "Model Support",
        color: "#EC4899",
        description: "Support and help for models",
        sortOrder: 2,
        isActive: true,
        postCount: 89,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 3,
        name: "Tips & Tricks",
        color: "#10B981",
        description: "Share your tips and tricks",
        sortOrder: 3,
        isActive: true,
        postCount: 156,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 4,
        name: "Community Events",
        color: "#F59E0B",
        description: "Community events and announcements",
        sortOrder: 4,
        isActive: true,
        postCount: 45,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 5,
        name: "Feature Requests",
        color: "#3B82F6",
        description: "Suggest new features",
        sortOrder: 5,
        isActive: true,
        postCount: 78,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    return Response.json(mockCategories);
  } catch (err) {
    console.error("Forum categories error:", err);
    return new Response("Failed to retrieve forum categories", { status: 500 });
  }
}
