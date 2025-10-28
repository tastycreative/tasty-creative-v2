import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadToS3 } from "@/lib/s3";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const folder = formData.get("folder") as string | null;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploadedFiles = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      const result = await uploadToS3(
        buffer,
        fileName,
        file.type,
        session.user.id,
        folder || undefined
      );

      uploadedFiles.push({
        name: file.name,
        url: result.url,
        key: result.key,
        type: file.type,
        size: file.size,
        folder: folder || null,
      });
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload files" },
      { status: 500 }
    );
  }
}
