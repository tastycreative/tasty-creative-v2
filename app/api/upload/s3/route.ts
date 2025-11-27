import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
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
function generateS3Key(originalName: string, userId: string, folder: string = 'task-attachments'): string {
  const timestamp = Date.now();
  const uuid = uuidv4();
  const extension = getFileExtension(originalName);
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');

  // Ensure folder is not empty or undefined
  const safeFolder = folder && folder.trim() !== '' ? folder.trim() : 'task-attachments';

  return `${safeFolder}/${userId}/${timestamp}-${uuid}-${sanitizedName}`;
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folderParam = formData.get('folder') as string;
    // Use task-attachments if folder is not provided or is empty/whitespace
    const folder = folderParam && folderParam.trim() !== '' ? folderParam.trim() : 'task-attachments';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
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

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate S3 key
    const s3Key = generateS3Key(file.name, session.user.id, folder);
    const contentType = getContentType(file.name);

    // Sanitize metadata values (remove invalid characters for HTTP headers)
    const sanitizeMetadata = (value: string): string => {
      return value.replace(/[^\x20-\x7E]/g, '').replace(/[\r\n]/g, '');
    };

    // Upload to S3
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: contentType,
      ContentLength: buffer.length,
      // Add metadata (sanitized for HTTP headers)
      Metadata: {
        originalname: sanitizeMetadata(file.name),
        uploadedby: sanitizeMetadata(session.user.id),
        uploadedat: new Date().toISOString(),
      },
    };

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    // Generate presigned URL for immediate viewing (expires in 7 days)
    const getObjectCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });

    const signedUrl = await getSignedUrl(s3Client, getObjectCommand, {
      expiresIn: 7 * 24 * 60 * 60, // 7 days
    });

    // Return file information with both s3Key (permanent) and url (temporary signed URL)
    const attachmentData = {
      id: uuidv4(),
      name: file.name,
      s3Key: s3Key, // Store permanent S3 key
      url: signedUrl, // Signed URL for immediate viewing
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      attachment: attachmentData,
    });

  } catch (error) {
    console.error('Error uploading to S3:', error);
    
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
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// Optional: Add a DELETE endpoint for removing files
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const s3Key = searchParams.get('key');

    if (!s3Key) {
      return NextResponse.json(
        { error: 'S3 key is required' },
        { status: 400 }
      );
    }

    // Verify the file belongs to the user (basic security check)
    if (!s3Key.includes(session.user.id)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete from S3
    const deleteParams = {
      Bucket: BUCKET_NAME,
      Key: s3Key,
    };

    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    const command = new DeleteObjectCommand(deleteParams);
    await s3Client.send(command);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting from S3:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}