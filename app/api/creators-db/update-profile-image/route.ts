import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
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

// Helper function to generate S3 key for profile images (simplified to use just the model name)
function generateProfileImageS3Key(modelName: string, originalName: string): string {
  const extension = getFileExtension(originalName);
  const sanitizedModelName = modelName.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  // Use a consistent filename so we can easily replace it
  return `profile-images/${sanitizedModelName}/profile.${extension}`;
}

// Helper function to delete existing profile images for a model
async function deleteExistingProfileImages(modelName: string): Promise<void> {
  try {
    const sanitizedModelName = modelName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const prefix = `profile-images/${sanitizedModelName}/`;
    
    console.log('🗑️ Checking for existing profile images with prefix:', prefix);
    
    // List all objects in the model's profile images folder
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
    });
    
    const listResponse = await s3Client.send(listCommand);
    
    if (listResponse.Contents && listResponse.Contents.length > 0) {
      console.log(`🗑️ Found ${listResponse.Contents.length} existing image(s) to delete`);
      
      // Delete each existing image
      for (const object of listResponse.Contents) {
        if (object.Key) {
          console.log('🗑️ Deleting existing image:', object.Key);
          const deleteCommand = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: object.Key,
          });
          await s3Client.send(deleteCommand);
        }
      }
      
      console.log('✅ Successfully deleted all existing profile images');
    } else {
      console.log('ℹ️ No existing profile images found');
    }
  } catch (error) {
    console.error('⚠️ Error deleting existing profile images (continuing anyway):', error);
    // Don't throw - we want the upload to continue even if deletion fails
  }
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
  };
  
  return mimeTypes[extension] || 'image/jpeg';
}

// Helper function to update Google Sheets via n8n webhook
async function updateGoogleSheet(creatorName: string, imageUrl: string, rowId: string | null) {
  try {
    const GOOGLE_DRIVE_SHEET_MODEL_NAMES = process.env.GOOGLE_DRIVE_SHEET_MODEL_NAMES;
    
    if (!GOOGLE_DRIVE_SHEET_MODEL_NAMES) {
      console.log('⚠️ GOOGLE_DRIVE_SHEET_MODEL_NAMES not configured, skipping Google Sheets update');
      return;
    }
    
    console.log('🔍 Google Sheets webhook update attempt:', {
      creatorName: creatorName,
      itemName: 'Profile Link',
      newValue: imageUrl,
      rowId: rowId
    });
    
    if (!rowId) {
      console.log('⚠️ No row_id found in ClientModel, cannot update Google Sheet');
      return;
    }

    // Send data to n8n webhook
    const webhookUrl = 'http://n8n.tastycreative.xyz/webhook/1f9c704a-f940-4a02-95aa-20164df19c25';
    const webhookData = {
      spreadsheetId: GOOGLE_DRIVE_SHEET_MODEL_NAMES,
      creatorName: creatorName,
      itemName: 'Profile Link',
      newPrice: imageUrl, // Using newPrice field for the image URL
      rowId: rowId,
      range: `Profile Link${rowId}`,
      timestamp: new Date().toISOString()
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData)
    });

    if (!response.ok) {
      throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`✅ Updated Google Sheet via webhook - Range: Profile Link${rowId}, Value: ${imageUrl}`, result);
    
  } catch (error) {
    console.error('❌ Error updating Google Sheet via webhook:', error);
    // Don't throw - we want the database update to succeed even if Google Sheets fails
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user is admin or moderator
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR') {
      return NextResponse.json({ error: "Not authorized - admin or moderator access required" }, { status: 403 });
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
    const creatorName = formData.get('creatorName') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!creatorName) {
      return NextResponse.json(
        { error: 'Creator name is required' },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit for profile images)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB for profile images.' },
        { status: 400 }
      );
    }

    // Validate file type (only images)
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed. Only JPEG, PNG, GIF, and WebP images are supported.' },
        { status: 400 }
      );
    }

    console.log('🔍 Looking for creator in database:', creatorName);

    // Find the client model by name (case insensitive)
    const clientModel = await prisma.clientModel.findFirst({
      where: {
        clientName: {
          equals: creatorName,
          mode: 'insensitive'
        }
      }
    });

    if (!clientModel) {
      console.log('❌ Creator not found:', creatorName);
      return NextResponse.json({ error: `Creator "${creatorName}" not found` }, { status: 404 });
    }

    console.log('✅ Found creator:', clientModel.clientName);
    console.log('📍 ClientModel row_id:', clientModel.row_id);

    // Delete existing profile images for this model first
    await deleteExistingProfileImages(creatorName);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate S3 key for profile image
    const s3Key = generateProfileImageS3Key(creatorName, file.name);
    const contentType = getContentType(file.name);

    console.log('📤 Uploading to S3:', s3Key);

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
        creatorname: sanitizeMetadata(creatorName),
        imagetype: 'profile'
      },
    };

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    // Generate signed URL for accessing the file (valid for 7 days)
    const getObjectCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });
    const signedUrl = await getSignedUrl(s3Client, getObjectCommand, { expiresIn: 7 * 24 * 60 * 60 }); // 7 days

    console.log('✅ Successfully uploaded to S3, signed URL:', signedUrl);

    // Update the ClientModel profileLink field
    await prisma.clientModel.update({
      where: {
        id: clientModel.id
      },
      data: {
        profileLink: signedUrl
      }
    });

    console.log('✅ Successfully updated ClientModel profileLink in database');

    // Also update Google Sheets using ClientModel's row_id
    await updateGoogleSheet(creatorName, signedUrl, clientModel.row_id);

    return NextResponse.json({
      success: true,
      message: `Updated profile image for ${creatorName}`,
      profileImageUrl: signedUrl,
      s3Key: s3Key
    });

  } catch (error) {
    console.error('❌ Error updating profile image:', error);
    return NextResponse.json(
      { error: "Failed to update profile image" },
      { status: 500 }
    );
  }
}