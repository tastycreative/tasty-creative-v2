import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Configure S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET!;

/**
 * Generate a fresh presigned URL for an existing S3 object
 * This allows us to store only the s3Key in the database and generate URLs on-demand
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { s3Key, expiresIn = 3600 } = await request.json(); // Default 1 hour

    if (!s3Key) {
      return NextResponse.json(
        { error: 'S3 key is required' },
        { status: 400 }
      );
    }

    // Validate expiresIn (max 7 days)
    const maxExpiry = 7 * 24 * 60 * 60; // 7 days
    const validExpiresIn = Math.min(expiresIn, maxExpiry);

    // Generate signed URL
    const getObjectCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });
    
    const signedUrl = await getSignedUrl(s3Client, getObjectCommand, {
      expiresIn: validExpiresIn
    });

    // Validate that we generated a GET URL, not a PUT URL
    if (signedUrl.includes('x-id=PutObject')) {
      console.error('Generated URL is a PUT URL, not a GET URL:', signedUrl);
      throw new Error('Invalid URL type generated');
    }

    return NextResponse.json({
      success: true,
      url: signedUrl,
      expiresIn: validExpiresIn,
    });

  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate presigned URL' },
      { status: 500 }
    );
  }
}
