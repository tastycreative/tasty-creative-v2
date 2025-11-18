import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const src = url.searchParams.get('src');
    const size = url.searchParams.get('size');

    if (!src) return new Response('Missing src', { status: 400 });

    // If the src is a Google Drive thumbnail and a size provided, try to replace =sXXX
    let fetchUrl = src;
    if (size) {
      fetchUrl = src.replace(/=s\d+$/, `=s${size}`);
    }

    const res = await fetch(fetchUrl);
    if (!res.ok) return new Response('Failed to fetch image', { status: 502 });

    const contentType = res.headers.get('content-type') || 'image/*';
    const buffer = await res.arrayBuffer();

    return new Response(Buffer.from(buffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err) {
    console.error('thumbnail proxy error', err);
    return new Response('Server error', { status: 500 });
  }
}
