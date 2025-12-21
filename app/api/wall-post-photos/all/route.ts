import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch all wall post photos for a specific team with filtering options
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const modelName = searchParams.get('modelName');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    if (!teamId) {
      return NextResponse.json(
        { error: 'Missing required parameter: teamId' },
        { status: 400 }
      );
    }

    // Check user access (ADMIN or team member)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id! },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN' && user?.role !== 'MODERATOR') {
      const teamMember = await prisma.podTeamMember.findUnique({
        where: {
          podTeamId_userId: {
            podTeamId: teamId,
            userId: session.user.id!,
          },
        },
      });

      if (!teamMember) {
        return NextResponse.json(
          { error: 'User does not have access to this team' },
          { status: 403 }
        );
      }
    }

    // Build filter conditions
    const whereConditions: any = {
      wallPostSubmission: {
        podTeamId: teamId,
      },
    };

    // If filtering by model name, we need to handle whitespace variations
    // Get all model names that match when trimmed
    if (modelName) {
      const trimmedModelName = modelName.trim();
      const matchingSubmissions = await prisma.wallPostSubmission.findMany({
        where: {
          podTeamId: teamId,
        },
        select: {
          modelName: true,
        },
        distinct: ['modelName'],
      });

      // Find all model names that match when trimmed
      const matchingModelNames = matchingSubmissions
        .map(s => s.modelName)
        .filter(name => name.trim() === trimmedModelName);

      if (matchingModelNames.length > 0) {
        whereConditions.wallPostSubmission.modelName = {
          in: matchingModelNames,
        };
      } else {
        // No matches found, use exact match as fallback
        whereConditions.wallPostSubmission.modelName = modelName;
      }
    }

    if (status) {
      whereConditions.status = status;
    }

    // Add search filter (searches model name, caption, and task title)
    if (search && search.trim()) {
      const searchTerm = search.trim();
      whereConditions.OR = [
        {
          wallPostSubmission: {
            modelName: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
        },
        {
          caption: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        {
          wallPostSubmission: {
            task: {
              title: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
          },
        },
      ];
    }

    // Fetch photos with pagination
    const photos = await prisma.wallPostPhoto.findMany({
      where: whereConditions,
      include: {
        wallPostSubmission: {
          include: {
            task: {
              select: {
                id: true,
                title: true,
                status: true,
                taskNumber: true,
                podTeam: {
                  select: {
                    projectPrefix: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        { createdAt: 'desc' },
        { position: 'asc' },
      ],
      take: limit ? parseInt(limit) : undefined,
      skip: offset ? parseInt(offset) : undefined,
    });

    // Get total count for pagination
    const totalCount = await prisma.wallPostPhoto.count({
      where: whereConditions,
    });

    // Get unique model names for filtering
    const modelNames = await prisma.wallPostSubmission.findMany({
      where: {
        podTeamId: teamId,
      },
      select: {
        modelName: true,
      },
      distinct: ['modelName'],
      orderBy: {
        modelName: 'asc',
      },
    });

    // Calculate stats
    const stats = await prisma.wallPostPhoto.groupBy({
      by: ['status'],
      where: {
        wallPostSubmission: {
          podTeamId: teamId,
        },
      },
      _count: true,
    });

    const statsMap = stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      photos,
      totalCount,
      modelNames: modelNames.map(m => m.modelName),
      stats: {
        total: totalCount,
        pendingReview: statsMap['PENDING_REVIEW'] || 0,
        readyToPost: statsMap['READY_TO_POST'] || 0,
        posted: statsMap['POSTED'] || 0,
        rejected: statsMap['REJECTED'] || 0,
      },
    });

  } catch (error) {
    console.error('Error fetching wall post photos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wall post photos' },
      { status: 500 }
    );
  }
}
