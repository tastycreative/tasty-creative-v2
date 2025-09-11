import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get query parameters for filtering/pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type'); // 'otp' or 'ptr'
    const status = searchParams.get('status');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      createdById: session.user.id
    };

    if (type) {
      where.submissionType = type.toUpperCase();
    }

    if (status) {
      where.status = status.toUpperCase();
    }

    // Fetch submissions with related task data
    const submissions = await prisma.contentSubmission.findMany({
      where,
      include: {
        Task: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            podTeam: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        User: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit,
    });

    // Get total count for pagination
    const total = await prisma.contentSubmission.count({ where });

    return NextResponse.json({
      success: true,
      submissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: skip + submissions.length < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('❌ Error fetching content submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content submissions' },
      { status: 500 }
    );
  }
}