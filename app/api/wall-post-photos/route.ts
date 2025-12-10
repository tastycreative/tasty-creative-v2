import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// POST - Create a new wall post photo
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { wallPostSubmissionId, s3Key, position, caption, status } = await request.json();

    if (!wallPostSubmissionId || !s3Key || position === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: wallPostSubmissionId, s3Key, and position are required' },
        { status: 400 }
      );
    }

    // Verify the submission exists and user has access
    const submission = await prisma.wallPostSubmission.findUnique({
      where: { id: wallPostSubmissionId },
      include: {
        task: {
          include: {
            podTeam: true,
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Wall Post submission not found' },
        { status: 404 }
      );
    }

    // Check user access (ADMIN or team member)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id! },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      const teamMember = await prisma.podTeamMember.findUnique({
        where: {
          podTeamId_userId: {
            podTeamId: submission.task.podTeamId!,
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

    // Create the photo record
    const photo = await prisma.wallPostPhoto.create({
      data: {
        wallPostSubmissionId,
        s3Key,
        position,
        caption: caption || null,
        status: status || 'PENDING_REVIEW',
      },
    });

    return NextResponse.json({
      success: true,
      photo,
    });

  } catch (error) {
    console.error('Error creating wall post photo:', error);
    return NextResponse.json(
      { error: 'Failed to create wall post photo' },
      { status: 500 }
    );
  }
}
