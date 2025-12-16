import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');
    const filename = searchParams.get('filename') || 'photo.jpg';

    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    // Validate that the URL is from an allowed domain (security)
    const allowedDomains = [
      'amazonaws.com',
      's3.us-east-1.amazonaws.com',
      'tastycreative-site.s3.us-east-1.amazonaws.com',
      'drive.google.com',
    ];

    const urlObj = new URL(url);
    const isAllowed = allowedDomains.some(domain => urlObj.hostname.includes(domain));

    if (!isAllowed) {
      return NextResponse.json({ error: 'URL domain not allowed' }, { status: 403 });
    }

    // Fetch the image from S3 or other source
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'image/*',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    // Get the image data as a buffer
    const imageBuffer = await response.arrayBuffer();

    // Determine content type from the response or use default
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Sanitize filename to prevent path traversal
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

    // Return the image with download headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${sanitizedFilename}"`,
        'Cache-Control': 'no-cache', // Don't cache downloads
        'Access-Control-Allow-Origin': '*', // Allow CORS
      },
    });
  } catch (error) {
    console.error('Error downloading photo:', error);
    return NextResponse.json(
      {
        error: 'Failed to download photo',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
