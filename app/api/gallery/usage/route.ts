import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { google } from 'googleapis';

const SHEET_ID = process.env.LIBRARY_SHEET_ID || '1rrRsS69FLFSBodvAq1Loaa90euf2A5gidbiSrJUhFyc';
const GALLERY_RANGE = 'A:F';
const VALID_ACTION_TYPES = ['SEND_DM', 'POST_WALL', 'COPY_CAPTION', 'VIEW_DETAILS', 'PREVIEW_CONTENT'];

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session?.accessToken) {
      return NextResponse.json({ 
        error: 'Google authentication required' 
      }, { status: 401 });
    }

    const body = await request.json();
    const { sheetRowId, actionType, contentType = 'favorites' } = body;

    if (!sheetRowId || !actionType) {
      return NextResponse.json({ 
        error: 'Sheet row ID and action type required' 
      }, { status: 400 });
    }

    if (!VALID_ACTION_TYPES.includes(actionType)) {
      return NextResponse.json({ 
        error: 'Invalid action type' 
      }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: session.accessToken,
      refresh_token: session.refreshToken,
      expiry_date: session.expiresAt ? session.expiresAt * 1000 : undefined,
    });

    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    const galleryWorksheetName = `${contentType}_${session.user.email?.split('@')[0] || session.user.id}`;

    try {
      // Get current worksheet data
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${galleryWorksheetName}!${GALLERY_RANGE}`,
      });

      const rows = response.data.values || [];
      if (rows.length <= 1) {
        return NextResponse.json({ 
          error: 'Gallery item not found' 
        }, { status: 404 });
      }

      // Find and update the row
      let found = false;
      const updatedRows = rows.map((row, index) => {
        if (index === 0) return row; // Keep headers
        
        if (row[0] === sheetRowId) {
          found = true;
          const currentUsageCount = parseInt(row[3]) || 0;
          return [
            row[0],                    // Row_ID
            row[1],                    // Date_Added
            row[2] || '',             // Notes
            (currentUsageCount + 1).toString(), // Usage_Count (increment)
            new Date().toISOString()   // Last_Used (update)
          ];
        }
        
        return row;
      });

      if (!found) {
        return NextResponse.json({ 
          error: 'Gallery item not found' 
        }, { status: 404 });
      }

      // Update the worksheet
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${galleryWorksheetName}!A1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: updatedRows,
        },
      });

      return NextResponse.json({ success: true });
    } catch (worksheetError) {
      return NextResponse.json({ 
        error: 'Gallery worksheet not found' 
      }, { status: 404 });
    }
  } catch (error) {
    console.error('Gallery usage tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track usage' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const galleryItemId = searchParams.get('itemId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {
      userId: session.user.id
    };

    if (galleryItemId) {
      where.galleryItemId = galleryItemId;
    }

    const usage = await prisma.galleryUsage.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Get usage statistics
    const stats = await prisma.galleryUsage.groupBy({
      by: ['actionType'],
      where,
      _count: {
        actionType: true
      }
    });

    return NextResponse.json({
      usage,
      stats: stats.reduce((acc, stat) => {
        acc[stat.actionType] = stat._count.actionType;
        return acc;
      }, {} as Record<string, number>)
    });
  } catch (error) {
    console.error('Gallery usage fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
}