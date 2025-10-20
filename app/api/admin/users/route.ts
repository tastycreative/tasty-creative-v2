import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await auth();

    // Check if user is admin
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = searchParams.get("limit");
    const search = searchParams.get("search") || "";
    const roleFilter = searchParams.get("role") || "";

    // Validate pagination parameters
    const pageSize = limit === "all" ? undefined : parseInt(limit || "10");
    const offset = pageSize ? (page - 1) * pageSize : 0;

    // Build where clause for filtering
    const where: any = {};
    
    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Role filter
    if (roleFilter && roleFilter !== "all") {
      where.role = roleFilter;
    }

    try {
      // Get total count for pagination
      const totalUsers = await prisma.user.count({ where });

      // Fetch users with pagination
      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          image: true,
          createdAt: true,
          emailVerified: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: offset,
        take: pageSize,
      });

      // Calculate pagination info
      const totalPages = pageSize ? Math.ceil(totalUsers / pageSize) : 1;
      const hasNextPage = pageSize ? page < totalPages : false;
      const hasPrevPage = page > 1;

      return NextResponse.json({ 
        success: true,
        users,
        pagination: {
          page,
          limit: limit || "10",
          totalUsers,
          totalPages,
          hasNextPage,
          hasPrevPage,
          showing: users.length,
        }
      });
    } catch (dbError) {
      console.error("Database connection error in users API:", dbError);
      
      // Return fallback response when database is unavailable
      return NextResponse.json({ 
        success: true,
        users: [], // Empty array when DB is down
        pagination: {
          page,
          limit: limit || "10",
          totalUsers: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
          showing: 0,
        },
        error: "Database temporarily unavailable. Please try again later.",
      });
    }

  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}