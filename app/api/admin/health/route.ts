import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Check authentication
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Test database connectivity with a simple query
    const userCount = await prisma.user.count();
    
    return NextResponse.json({
      status: "healthy",
      database: "connected",
      userCount,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    // Check if it's a database connection error
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      if (
        errorMessage.includes('connect') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('enotfound') ||
        errorMessage.includes('econnrefused') ||
        errorMessage.includes('prisma')
      ) {
        return NextResponse.json(
          {
            status: "unhealthy",
            database: "disconnected",
            error: "Database connection failed",
            timestamp: new Date().toISOString(),
          },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      {
        status: "unhealthy",
        database: "unknown",
        error: "Internal server error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
