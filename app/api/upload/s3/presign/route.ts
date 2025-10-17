import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

// Configure S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET!;

// Helper function to get file extension
function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

// Helper function to generate S3 key
function generateS3Key(originalName: string, userId: string): string {
  const timestamp = Date.now();
  const uuid = uuidv4();
  const extension = getFileExtension(originalName);
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  return `task-attachments/${userId}/${timestamp}-${uuid}-${sanitizedName}`;
}

// Helper function to get content type
function getContentType(filename: string): string {
  const extension = getFileExtension(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if all required environment variables are set
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION || !process.env.AWS_S3_BUCKET) {
      console.error('Missing required AWS environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const { fileName, fileType, fileSize } = await request.json();

    if (!fileName || !fileType || !fileSize) {
      return NextResponse.json(
        { error: 'File name, type, and size are required' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (fileSize > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { error: 'File type not allowed' },
        { status: 400 }
      );
    }

    // Generate S3 key
    const s3Key = generateS3Key(fileName, session.user.id);
    const contentType = getContentType(fileName);

    // Sanitize metadata values (remove invalid characters for HTTP headers)
    const sanitizeMetadata = (value: string): string => {
      return value.replace(/[^\x20-\x7E]/g, '').replace(/[\r\n]/g, '');
    };

    // Create PutObjectCommand for generating pre-signed URL
    const putObjectCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      ContentType: contentType,
      ContentLength: fileSize,
      // Add metadata (sanitized for HTTP headers)
      Metadata: {
        originalname: sanitizeMetadata(fileName),
        uploadedby: sanitizeMetadata(session.user.id),
        uploadedat: new Date().toISOString(),
      },
    });

    // Generate pre-signed URL (valid for 15 minutes)
    const presignedUrl = await getSignedUrl(s3Client, putObjectCommand, { 
      expiresIn: 15 * 60 // 15 minutes
    });

    // Return pre-signed URL and file metadata
    const attachmentData = {
      id: uuidv4(),
      name: fileName,
      s3Key: s3Key,
      size: fileSize,
      type: fileType,
      uploadedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      presignedUrl,
      attachment: attachmentData,
    });

  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    
    // Handle specific S3 errors
    if (error instanceof Error) {
      if (error.message.includes('credentials')) {
        return NextResponse.json(
          { error: 'AWS credentials error' },
          { status: 500 }
        );
      }
      if (error.message.includes('bucket')) {
        return NextResponse.json(
          { error: 'S3 bucket error' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate pre-signed URL' },
      { status: 500 }
    );
  }
}
