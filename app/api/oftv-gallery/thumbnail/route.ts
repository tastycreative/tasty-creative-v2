import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let fileId = searchParams.get('fileId');
    const thumbnailLink = searchParams.get('thumbnailLink');

    if (!fileId && !thumbnailLink) {
      return NextResponse.json({ error: 'Missing fileId or thumbnailLink' }, { status: 400 });
    }

    // Extract file ID from thumbnail link if provided
    if (thumbnailLink && !fileId) {
      // Extract file ID from Google Drive storage URL
      // Format: https://lh3.googleusercontent.com/drive-storage/...
      // We need to get the file metadata to get the actual file ID
      // For now, we'll skip thumbnailLink and require fileId
      return NextResponse.json({ error: 'thumbnailLink not supported, use fileId instead' }, { status: 400 });
    }

    // Extract file ID from Google Drive URL if full URL is provided
    if (fileId && fileId.includes('drive.google.com')) {
      const match = fileId.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match) {
        fileId = match[1];
      }
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

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Always use Drive API to get file (ignore thumbnailLink as it requires browser auth)
    if (fileId) {
      const response = await drive.files.get(
        {
          fileId,
          alt: 'media',
          supportsAllDrives: true,
        },
        { responseType: 'arraybuffer' }
      );

      const contentType = response.headers['content-type'] || 'image/jpeg';

      return new NextResponse(response.data as ArrayBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    return NextResponse.json({ error: 'No valid file ID provided' }, { status: 400 });
  } catch (error: any) {
    console.error('Error fetching thumbnail:', error);
    return NextResponse.json(
      { error: 'Failed to fetch thumbnail', details: error.message },
      { status: 500 }
    );
  }
}
