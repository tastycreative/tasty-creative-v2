import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch all posts for the user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const posts = await prisma.instagramPost.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: [
        { position: 'asc' },
        { createdAt: 'desc' }
      ],
    });

    return NextResponse.json({ success: true, posts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// POST - Create a new post
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { imageUrl, caption, scheduledDate, status, postType, folder } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Image URL is required' },
        { status: 400 }
      );
    }

    const post = await prisma.instagramPost.create({
      data: {
        userId: session.user.id,
        imageUrl,
        caption: caption || '',
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        status: status || 'DRAFT',
        postType: postType || 'FEED',
        folder: folder || null,
      },
    });

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create post' },
      { status: 500 }
    );
  }
}

// PATCH - Update a post
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, caption, scheduledDate, status, postType, position } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Post ID is required' },
        { status: 400 }
      );
    }

    // Verify the post belongs to the user
    const existingPost = await prisma.instagramPost.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingPost) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (caption !== undefined) updateData.caption = caption;
    if (scheduledDate !== undefined) updateData.scheduledDate = scheduledDate ? new Date(scheduledDate) : null;
    if (status !== undefined) updateData.status = status;
    if (postType !== undefined) updateData.postType = postType;
    if (position !== undefined) updateData.position = position;

    const post = await prisma.instagramPost.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update post' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a post
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Post ID is required' },
        { status: 400 }
      );
    }

    // Verify the post belongs to the user
    const existingPost = await prisma.instagramPost.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingPost) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    await prisma.instagramPost.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}
