import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { promises as fs } from "fs";
import path from "path";

const CACHE_DIR = path.join(process.cwd(), "temp", "image-cache");
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "expired";

    let deletedCount = 0;
    let totalSize = 0;

    try {
      const files = await fs.readdir(CACHE_DIR);
      
      for (const file of files) {
        const filePath = path.join(CACHE_DIR, file);
        const stats = await fs.stat(filePath);
        
        let shouldDelete = false;
        
        if (action === "all") {
          shouldDelete = true;
        } else if (action === "expired") {
          const age = Date.now() - stats.mtime.getTime();
          shouldDelete = age > CACHE_DURATION;
        }
        
        if (shouldDelete) {
          totalSize += stats.size;
          await fs.unlink(filePath);
          deletedCount++;
        }
      }
    } catch (error) {
      console.error("Cache cleanup error:", error);
      return NextResponse.json(
        { error: "Failed to clean cache" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedCount} cached images`,
      deletedCount,
      totalSizeMB: Math.round(totalSize / 1024 / 1024 * 100) / 100,
    });
  } catch (error) {
    console.error("Cache cleanup error:", error);
    return NextResponse.json(
      { error: "Failed to clean cache" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let totalFiles = 0;
    let totalSize = 0;
    let expiredFiles = 0;

    try {
      const files = await fs.readdir(CACHE_DIR);
      
      for (const file of files) {
        const filePath = path.join(CACHE_DIR, file);
        const stats = await fs.stat(filePath);
        
        totalFiles++;
        totalSize += stats.size;
        
        const age = Date.now() - stats.mtime.getTime();
        if (age > CACHE_DURATION) {
          expiredFiles++;
        }
      }
    } catch (error) {
      // Cache directory might not exist yet
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error("Cache status error:", error);
      }
    }

    return NextResponse.json({
      totalFiles,
      totalSizeMB: Math.round(totalSize / 1024 / 1024 * 100) / 100,
      expiredFiles,
      cacheDir: CACHE_DIR,
    });
  } catch (error) {
    console.error("Cache status error:", error);
    return NextResponse.json(
      { error: "Failed to get cache status" },
      { status: 500 }
    );
  }
}
