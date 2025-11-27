import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Helper function to convert Google Drive links to direct image URLs
const convertGoogleDriveLink = (url: string | null): string | null => {
  if (!url) return null;

  // Check if it's a Google Drive link
  if (url.includes('drive.google.com')) {
    try {
      // Try to extract file ID from /file/d/ pattern
      const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      let driveId: string | null = null;

      if (fileMatch && fileMatch[1]) {
        driveId = fileMatch[1];
      } else {
        // Try to extract from URL parameters
        const urlObj = new URL(url);
        driveId = urlObj.searchParams.get('id');
      }

      if (driveId) {
        // Use thumbnail endpoint like EnhancedModelCard (more reliable)
        return `https://drive.google.com/thumbnail?id=${driveId}&sz=w200`;
      }
    } catch (e) {
      // If URL parsing fails, return original
      return url;
    }
  }

  // Return as-is if not a Google Drive link (regular image URLs, etc.)
  return url;
};

// Restore a soft-deleted event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    // Restore by clearing deletedAt timestamp
    const event = await prisma.contentEvent.update({
      where: { id },
      data: {
        deletedAt: null,
      },
      include: {
        creator: {
          select: {
            clientName: true,
            profileLink: true,
            profilePicture: true,
          },
        },
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Transform event to convert Google Drive links
    const transformedEvent = {
      ...event,
      creator: event.creator ? {
        ...event.creator,
        profilePicture: convertGoogleDriveLink(event.creator.profileLink) || convertGoogleDriveLink(event.creator.profilePicture) || null,
      } : null,
    };

    return NextResponse.json({ success: true, event: transformedEvent }, { status: 200 });
  } catch (error) {
    console.error("Error restoring content event:", error);
    return NextResponse.json(
      { error: "Failed to restore content event" },
      { status: 500 }
    );
  }
}
