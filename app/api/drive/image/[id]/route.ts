// app/api/drive/image/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const { id } = params;

    console.log('Image proxy request:', { id, hasToken: !!token });

    if (!id || !token) {
      console.error('Missing parameters:', { id: !!id, token: !!token });
      return NextResponse.json(
        { error: 'File ID and token are required' },
        { status: 400 }
      );
    }

    // First, get the file metadata to check if it's an image
    const metadataResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${id}?fields=mimeType,name`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!metadataResponse.ok) {
      console.error('Metadata fetch failed:', metadataResponse.status, metadataResponse.statusText);
      return NextResponse.json(
        { error: 'Failed to get file metadata' },
        { status: metadataResponse.status }
      );
    }

    const metadata = await metadataResponse.json();
    
    // Check if it's an image
    if (!metadata.mimeType.startsWith('image/')) {
      console.error('File is not an image:', metadata.mimeType);
      return NextResponse.json(
        { error: 'File is not an image' },
        { status: 400 }
      );
    }

    // Get the actual file content
    const fileResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${id}?alt=media`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!fileResponse.ok) {
      console.error('File fetch failed:', fileResponse.status, fileResponse.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch image' },
        { status: fileResponse.status }
      );
    }

    // Get the image data
    const imageBuffer = await fileResponse.arrayBuffer();
    
    console.log('Image fetched successfully:', { 
      id, 
      mimeType: metadata.mimeType, 
      size: imageBuffer.byteLength 
    });
    
    // Return the image with appropriate headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': metadata.mimeType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Content-Length': imageBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('Drive image proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}