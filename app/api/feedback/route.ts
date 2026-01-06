import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/feedback - Submit new feedback (Anonymous)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();

    const { category, title, message, rating, pageUrl, userAgent, attachments } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Feedback message is required" },
        { status: 400 }
      );
    }

    // Build metadata object with optional userId at the end
    const metadata: Record<string, unknown> = {
      submittedAt: new Date().toISOString(),
      source: "feedback-button",
    };
    
    if (session?.user?.id) {
      metadata.userId = session.user.id;
    }

    // Create feedback entry 
    const feedback = await prisma.feedback.create({
      data: {
        category: category || "GENERAL",
        title: title || null,
        message: message.trim(),
        rating: rating ? parseInt(rating) : null,
        attachments: attachments && attachments.length > 0 ? attachments : null,
        pageUrl: pageUrl || null,
        userAgent: userAgent || null,
        status: "NEW",
        priority: "NORMAL",
        metadata: metadata,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Thank you for your feedback!",
      feedbackId: feedback.id,
    });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}

// GET /api/feedback - Get all feedback (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin (you may need to adjust this based on your role system)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (category) where.category = category;

    const [feedbacks, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.feedback.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: feedbacks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}

// PATCH /api/feedback - Update feedback status/priority (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { id, status, priority, adminNotes } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Feedback ID is required" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    
    if (status) {
      updateData.status = status;
      if (status === "RESOLVED" || status === "CLOSED") {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = session.user.id;
      }
    }
    
    if (priority) updateData.priority = priority;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    const feedback = await prisma.feedback.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    console.error("Error updating feedback:", error);
    return NextResponse.json(
      { error: "Failed to update feedback" },
      { status: 500 }
    );
  }
}
