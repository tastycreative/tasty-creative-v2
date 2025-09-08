import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { google } from 'googleapis';

// GET - Fetch sheet links for a model
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientModelId = searchParams.get('clientModelId');

    if (!clientModelId) {
      return NextResponse.json({ error: "Client model ID is required" }, { status: 400 });
    }

    const sheetLinks = await (prisma as any).clientModelSheetLinks.findMany({
      where: { clientModelId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, sheetLinks });

  } catch (error) {
    console.error('Error fetching sheet links:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sheet links' },
      { status: 500 }
    );
  }
}

// POST - Create a new sheet link or fetch sheet name
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const data = await request.json();
    const { action, clientModelId, sheetUrl, sheetName, sheetType } = data;

    if (action === 'saveSheetLink') {
      if (!clientModelId || !sheetUrl || !sheetType) {
        return NextResponse.json(
          { error: "Client model ID, sheet URL, and sheet type are required" },
          { status: 400 }
        );
      }

      // Check if client model exists
      const clientModel = await (prisma as any).clientModel.findUnique({
        where: { id: clientModelId }
      });

      if (!clientModel) {
        return NextResponse.json({ error: "Client model not found" }, { status: 404 });
      }

      // Create new sheet link
      const sheetLink = await (prisma as any).clientModelSheetLinks.create({
        data: {
          clientModelId,
          sheetUrl,
          sheetName: sheetName || null, // Allow null values - will be populated by n8n
          sheetType
        }
      });

      return NextResponse.json({ success: true, sheetLink });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error('Error processing sheet link:', error);
    return NextResponse.json(
      { error: 'Failed to process sheet link' },
      { status: 500 }
    );
  }
}

// PUT - Update an existing sheet link
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const data = await request.json();
    const { action, id, sheetUrl, sheetName, sheetType } = data;

    if (action === 'updateSheetLink') {
      if (!id || !sheetUrl || !sheetType) {
        return NextResponse.json(
          { error: "Sheet link ID, URL, and type are required" },
          { status: 400 }
        );
      }

      // Update the sheet link
      const sheetLink = await (prisma as any).clientModelSheetLinks.update({
        where: { id },
        data: {
          sheetUrl,
          sheetName: sheetName || null,
          sheetType,
          updatedAt: new Date()
        }
      });

      return NextResponse.json({ success: true, sheetLink });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error('Error updating sheet link:', error);
    return NextResponse.json(
      { error: 'Failed to update sheet link' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a sheet link
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const data = await request.json();
    const { action, id } = data;

    if (action === 'deleteSheetLink') {
      if (!id) {
        return NextResponse.json({ error: "Sheet link ID is required" }, { status: 400 });
      }

      await (prisma as any).clientModelSheetLinks.delete({
        where: { id }
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error('Error deleting sheet link:', error);
    return NextResponse.json(
      { error: 'Failed to delete sheet link' },
      { status: 500 }
    );
  }
}
