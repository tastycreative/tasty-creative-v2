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

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { s3Key } = await request.json();

    if (!s3Key) {
      return NextResponse.json(
        { error: 'S3 key is required' },
        { status: 400 }
      );
    }

    // Basic security check - ensure the key belongs to the user
    if (!s3Key.includes(session.user.id)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Generate signed URL (valid for 7 days)
    const getObjectCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });

    const signedUrl = await getSignedUrl(s3Client, getObjectCommand, {
      expiresIn: 7 * 24 * 60 * 60 // 7 days
    });

    // Validate that we generated a GET URL, not a PUT URL
    if (signedUrl.includes('x-id=PutObject')) {
      console.error('Generated URL is a PUT URL, not a GET URL:', signedUrl);
      throw new Error('Invalid URL type generated');
    }

    return NextResponse.json({
      success: true,
      signedUrl,
    });

  } catch (error) {
    console.error('Error generating signed URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate signed URL' },
      { status: 500 }
    );
  }
}