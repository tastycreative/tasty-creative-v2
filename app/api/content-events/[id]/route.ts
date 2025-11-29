import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

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
        // Use thumbnail endpoint
        return `https://drive.google.com/thumbnail?id=${driveId}&sz=w200`;
      }
    } catch (e) {
      return url;
    }
  }

  return url;
};

// Create an S3 client factory (only if env vars present)
function createS3ClientIfConfigured() {
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_REGION && process.env.AWS_S3_BUCKET) {
    return new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const event = await prisma.contentEvent.findUnique({
      where: { id },
      include: {
        ClientModel: {
          select: {
            clientName: true,
            profileLink: true,
            profilePicture: true,
          },
        },
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Transform event to convert Google Drive links and normalize color
    const transformedEvent = {
      ...event,
      color: event.color ? event.color.toLowerCase() : event.color,
      creator: event.ClientModel ? {
        ...event.ClientModel,
        profilePicture: convertGoogleDriveLink(event.ClientModel.profileLink) || convertGoogleDriveLink(event.ClientModel.profilePicture) || null,
      } : null,
      createdBy: event.User || null,
    };

    return NextResponse.json({ event: transformedEvent }, { status: 200 });
  } catch (error) {
    console.error("Error fetching content event:", error);
    return NextResponse.json(
      { error: "Failed to fetch content event" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      title,
      description,
      date,
      time,
      type,
      status,
      creator,
      tags,
      price,
      color,
      contentLink,
      editedVideoLink,
      flyerLink,
      liveType,
      platform,
      notes,
      attachments,
    } = body;

    // Find creator by clientName if provided
    let creatorId = undefined;
    if (creator !== undefined) {
      if (creator === null || creator === "") {
        creatorId = null;
      } else {
        const clientModel = await prisma.clientModel.findUnique({
          where: { clientName: creator },
          select: { id: true },
        });
        if (clientModel) {
          creatorId = clientModel.id;
        }
      }
    }

    // Build update data object
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (date !== undefined) updateData.date = new Date(date);
    if (time !== undefined) updateData.time = time;
    if (type !== undefined) updateData.type = type;
    if (status !== undefined) {
      updateData.status = status;
      if (status === "COMPLETED" && !updateData.completedAt) {
        updateData.completedAt = new Date();
      }
      if (status === "CANCELLED" && !updateData.cancelledAt) {
        updateData.cancelledAt = new Date();
      }
    }
    if (color !== undefined) updateData.color = color;
    if (creatorId !== undefined) updateData.creatorId = creatorId;
    if (tags !== undefined) updateData.tags = tags;
    if (price !== undefined) updateData.price = price ? parseFloat(price) : null;
    if (contentLink !== undefined) updateData.contentLink = contentLink;
    if (editedVideoLink !== undefined) updateData.editedVideoLink = editedVideoLink;
    if (flyerLink !== undefined) updateData.flyerLink = flyerLink;
    if (liveType !== undefined) updateData.liveType = liveType;
    if (platform !== undefined) updateData.platform = platform;
    if (notes !== undefined) updateData.notes = notes;
    if (attachments !== undefined) updateData.attachments = attachments;

    // Fetch existing event to detect removed attachments
    const existingEvent = await prisma.contentEvent.findUnique({ where: { id } });
    const existingAttachments = (existingEvent?.attachments as any[]) || [];

    // Compute removed attachments (present before, not in incoming attachments list)
    const removedAttachments: any[] = [];
    const incomingAttachments = Array.isArray(attachments) ? attachments : undefined;
    if (incomingAttachments !== undefined) {
      const incomingIds = new Set(incomingAttachments.map((a: any) => a?.id).filter(Boolean));
      const incomingS3Keys = new Set(incomingAttachments.map((a: any) => a?.s3Key).filter(Boolean));
      for (const att of existingAttachments) {
        const hasId = att && att.id && incomingIds.has(att.id);
        const hasKey = att && att.s3Key && incomingS3Keys.has(att.s3Key);
        if (!hasId && !hasKey) {
          removedAttachments.push(att);
        }
      }

      // If client sent attachments array but it has no image attachments, make sure color becomes PINK
      const hasImageInIncoming = incomingAttachments.some((a: any) => a?.type?.startsWith?.('image/'));
      if (!hasImageInIncoming) {
        updateData.color = 'PINK';
      }
    }

    const event = await prisma.contentEvent.update({
      where: { id },
      data: updateData,
      include: {
        ClientModel: {
          select: {
            clientName: true,
            profileLink: true,
            profilePicture: true,
          },
        },
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // After successful update, attempt to delete removed attachments from S3
    if (removedAttachments.length > 0) {
      try {
        const s3Client = createS3ClientIfConfigured();
        if (s3Client) {
          for (const att of removedAttachments) {
            try {
              const key = att?.s3Key;
              if (!key) continue;
              // Basic safety: only delete keys that include the user's id
              if (!key.includes(session.user.id)) {
                console.warn(`Skipping delete of s3 key not owned by user: ${key}`);
                continue;
              }
              const cmd = new DeleteObjectCommand({ Bucket: process.env.AWS_S3_BUCKET!, Key: key });
              await s3Client.send(cmd);
            } catch (innerErr) {
              console.error('Failed to delete S3 object for attachment', att, innerErr);
            }
          }
        } else {
          console.warn('AWS env vars missing; skipping S3 deletions for removed attachments');
        }
      } catch (err) {
        console.error('Error during S3 deletions of removed attachments:', err);
      }
    }

    // Transform event to convert Google Drive links and normalize color
    const transformedEvent = {
      ...event,
      color: event.color ? event.color.toLowerCase() : event.color,
      creator: event.ClientModel ? {
        ...event.ClientModel,
        profilePicture: convertGoogleDriveLink(event.ClientModel.profileLink) || convertGoogleDriveLink(event.ClientModel.profilePicture) || null,
      } : null,
      createdBy: event.User || null,
    };

    return NextResponse.json({ event: transformedEvent }, { status: 200 });
  } catch (error) {
    console.error("Error updating content event:", error);
    return NextResponse.json(
      { error: "Failed to update content event" },
      { status: 500 }
    );
  }
}

// PUT method as alias to PATCH for compatibility
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PATCH(request, { params });
}

// Soft delete - marks event as deleted instead of removing it
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    // Soft delete by setting deletedAt timestamp
    const event = await prisma.contentEvent.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, event }, { status: 200 });
  } catch (error) {
  console.error("Error deleting content event:", error);
  return NextResponse.json({ error: "Failed to delete content event" }, { status: 500 });
  }
}
