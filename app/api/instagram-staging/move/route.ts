import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { S3Client, CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sourceKey, targetFolder } = await request.json();

    if (!sourceKey) {
      return NextResponse.json({ error: "Source key is required" }, { status: 400 });
    }

    // Verify the file belongs to the user
    const userPrefix = `instagram-staging/${session.user.id}/`;
    if (!sourceKey.startsWith(userPrefix)) {
      return NextResponse.json({ error: "Unauthorized access to file" }, { status: 403 });
    }

    // Extract filename from source key
    const parts = sourceKey.split('/');
    const fileName = parts[parts.length - 1];

    // Build target key
    const targetKey = targetFolder 
      ? `instagram-staging/${session.user.id}/${targetFolder}/${fileName}`
      : `instagram-staging/${session.user.id}/${fileName}`;

    // Copy object to new location
    const copyCommand = new CopyObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET1!,
      CopySource: `${process.env.AWS_S3_BUCKET1}/${sourceKey}`,
      Key: targetKey,
    });

    await s3Client.send(copyCommand);

    // Delete original object
    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET1!,
      Key: sourceKey,
    });

    await s3Client.send(deleteCommand);

    return NextResponse.json({
      success: true,
      newKey: targetKey,
      newUrl: `https://${process.env.AWS_S3_BUCKET1}.s3.${process.env.AWS_REGION}.amazonaws.com/${targetKey}`,
    });
  } catch (error) {
    console.error("Move file error:", error);
    return NextResponse.json(
      { error: "Failed to move file" },
      { status: 500 }
    );
  }
}
