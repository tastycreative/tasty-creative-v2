import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.S3_REGION!,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET || process.env.S3_BUCKET1;

/**
 * Proxy endpoint for S3 images
 * Extracts S3 key from expired presigned URL and generates a fresh one
 * Usage: /api/s3/image?url=<s3-presigned-url>
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const s3Url = searchParams.get('url');

    if (!s3Url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      );
    }

    // Extract S3 key from the URL
    // Supports formats:
    // - https://bucket.s3.region.amazonaws.com/path/to/file.jpg?...
    // - https://s3.region.amazonaws.com/bucket/path/to/file.jpg?...
    let s3Key: string;

    try {
      const urlObj = new URL(s3Url);
      const hostname = urlObj.hostname;

      if (hostname.includes('.s3.') || hostname.includes('.s3-')) {
        // Format: bucket.s3.region.amazonaws.com/path
        s3Key = urlObj.pathname.substring(1); // Remove leading slash
      } else if (hostname.startsWith('s3.')) {
        // Format: s3.region.amazonaws.com/bucket/path
        const parts = urlObj.pathname.substring(1).split('/');
        parts.shift(); // Remove bucket name
        s3Key = parts.join('/');
      } else {
        throw new Error('Invalid S3 URL format');
      }
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid S3 URL format' },
        { status: 400 }
      );
    }

    if (!s3Key) {
      return NextResponse.json(
        { error: 'Could not extract S3 key from URL' },
        { status: 400 }
      );
    }

    // Generate fresh presigned URL (1 hour expiry)
    const getObjectCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });

    const signedUrl = await getSignedUrl(s3Client, getObjectCommand, {
      expiresIn: 3600, // 1 hour
    });

    // Redirect to the fresh presigned URL
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error('Error proxying S3 image:', error);
    return NextResponse.json(
      { error: 'Failed to proxy S3 image' },
      { status: 500 }
    );
  }
}
