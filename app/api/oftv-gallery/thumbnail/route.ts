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
    const size = searchParams.get('size') || 'default'; // 'default', 'large', or pixel size like '1920'

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

    // Get file metadata first to determine type and get thumbnail link
    if (fileId) {
      // Get file metadata
      const metadata = await drive.files.get({
        fileId,
        fields: 'mimeType,thumbnailLink',
        supportsAllDrives: true,
      });

      const mimeType = metadata.data.mimeType || '';
      const thumbnailLinkFromMetadata = metadata.data.thumbnailLink;

      // For videos, use the thumbnail link from metadata with enhanced size
      if (mimeType.startsWith('video/') && thumbnailLinkFromMetadata) {
        // Modify thumbnail URL to request larger size
        // Google Drive thumbnail URLs have format: ...=s220 or =w220-h140
        // We can replace with larger sizes for better quality
        let enhancedThumbnailUrl = thumbnailLinkFromMetadata;
        
        if (size === 'large') {
          // Request 1920px wide thumbnail for high quality
          enhancedThumbnailUrl = thumbnailLinkFromMetadata.replace(/=s\d+/, '=s1920').replace(/=w\d+-h\d+/, '=w1920');
        } else if (size !== 'default' && !isNaN(parseInt(size))) {
          // Custom size specified
          enhancedThumbnailUrl = thumbnailLinkFromMetadata.replace(/=s\d+/, `=s${size}`).replace(/=w\d+-h\d+/, `=w${size}`);
        }

        const thumbnailResponse = await fetch(enhancedThumbnailUrl, {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });

        if (thumbnailResponse.ok) {
          const imageBuffer = await thumbnailResponse.arrayBuffer();
          const contentType = thumbnailResponse.headers.get('content-type') || 'image/jpeg';

          return new NextResponse(imageBuffer, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=86400',
            },
          });
        }
      }

      // For images and other files, get the file content directly
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
