import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    
    if (!url) {
      return NextResponse.json({ error: 'URL parameter required' }, { status: 400 });
    }

    // Validate the URL is from allowed domains
    const allowedDomains = [
      'allthiscash.com',
      'www.allthiscash.com',
      'betterfans.app',
      'www.betterfans.app',
      // Add other trusted domains here
    ];
    
    let urlObj;
    try {
      urlObj = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    const isAllowedDomain = allowedDomains.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
    );

    if (!isAllowedDomain) {
      return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
    }

    // Fetch the media from the external URL with redirect handling
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Gallery Bot)',
        'Accept': 'image/*,*/*',
        'Referer': urlObj.origin,
      },
      redirect: 'follow', // Follow redirects automatically
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentLength = response.headers.get('content-length');
    
    // Check if it's actually an image
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'Not an image' }, { status: 400 });
    }

    // Stream the response
    const imageBuffer = await response.arrayBuffer();
    
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': contentLength || String(imageBuffer.byteLength),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Cross-Origin-Embedder-Policy': 'unsafe-none',
      },
    });

  } catch (error) {
    console.error('Media proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    );
  }
}