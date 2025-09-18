import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({
        success: true,
        users: [],
      });
    }

    // Special case: fetch all POD users when dropdown opens
    if (query === 'POD_USERS_ALL') {
      const users = await prisma.user.findMany({
        where: {
          role: 'POD',
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
        },
        take: 20, // Limit to 20 results for all POD users
        orderBy: [
          { name: 'asc' },
          { email: 'asc' },
        ],
      });

      return NextResponse.json({
        success: true,
        users,
      });
    }

    // Regular search with minimum 2 characters
    if (query.length < 2) {
      return NextResponse.json({
        success: true,
        users: [],
      });
    }

    // Search for users by email or name with POD role
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            role: 'POD', // Only users with POD role
          },
          {
            OR: [
              {
                email: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
              {
                name: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
      },
      take: 10, // Limit to 10 results
      orderBy: [
        { name: 'asc' },
        { email: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      users,
    });

  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
