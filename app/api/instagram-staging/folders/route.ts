import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadToS3 } from "@/lib/s3";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { folderName } = await request.json();

    if (!folderName || !folderName.trim()) {
      return NextResponse.json({ error: "Folder name is required" }, { status: 400 });
    }

    // Create a placeholder file to create the folder structure in S3
    const placeholderBuffer = Buffer.from("");
    await uploadToS3(
      placeholderBuffer,
      ".placeholder",
      "text/plain",
      session.user.id,
      folderName.trim()
    );

    return NextResponse.json({
      success: true,
      folderName: folderName.trim(),
    });
  } catch (error) {
    console.error("Create folder error:", error);
    return NextResponse.json(
      { error: "Failed to create folder" },
      { status: 500 }
    );
  }
}
