import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET: Get all favorite folders for the current user in a gallery
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const galleryId = searchParams.get('galleryId');
  if (!galleryId) {
    return NextResponse.json({ error: 'Missing galleryId' }, { status: 400 });
  }
  const favorites = await prisma.oFTVGalleryFolderFavorite.findMany({
    where: {
      userId: session.user.id,
      galleryId,
    },
  });
  return NextResponse.json({ favorites });
}

// POST: Add a folder to favorites
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  const { galleryId, folderName } = body;
  if (!galleryId || !folderName) {
    return NextResponse.json({ error: 'Missing galleryId or folderName' }, { status: 400 });
  }
  const favorite = await prisma.oFTVGalleryFolderFavorite.upsert({
    where: {
      userId_galleryId_folderName: {
        userId: session.user.id,
        galleryId,
        folderName,
      },
    },
    update: {},
    create: {
      userId: session.user.id,
      galleryId,
      folderName,
    },
  });
  return NextResponse.json({ favorite });
}

// DELETE: Remove a folder from favorites
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  const { galleryId, folderName } = body;
  if (!galleryId || !folderName) {
    return NextResponse.json({ error: 'Missing galleryId or folderName' }, { status: 400 });
  }
  await prisma.oFTVGalleryFolderFavorite.delete({
    where: {
      userId_galleryId_folderName: {
        userId: session.user.id,
        galleryId,
        folderName,
      },
    },
  });
  return NextResponse.json({ success: true });
}
