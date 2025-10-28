import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { listUserFiles, listUserFolders } from "@/lib/s3";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folder = searchParams.get("folder");

    const files = await listUserFiles(session.user.id, folder || undefined);
    const folders = await listUserFolders(session.user.id);

    return NextResponse.json({
      success: true,
      files,
      folders,
    });
  } catch (error) {
    console.error("List files error:", error);
    return NextResponse.json(
      { error: "Failed to list files" },
      { status: 500 }
    );
  }
}
