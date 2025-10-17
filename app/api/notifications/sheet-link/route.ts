import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { notifyPodTeamMembers } from '@/lib/notificationUtils';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const {
      clientModelId,
      modelName,
      sheetName,
      sheetUrl,
      sheetType,
    } = await request.json();

    // Validate required fields
    if (!clientModelId || !modelName || !sheetName || !sheetUrl || !sheetType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Send notification emails to POD team members
    const result = await notifyPodTeamMembers({
      clientModelId,
      modelName,
      sheetName,
      sheetUrl,
      sheetType,
      userWhoLinked: session.user.name || session.user.email || 'Unknown User',
    });

    return NextResponse.json({
      success: result.success,
      message: result.message,
      emailsSent: result.emailsSent || 0
    });

  } catch (error) {
    console.error('❌ Error sending sheet link notifications:', error);
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    );
  }
}