/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/hubstaff/user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const HUBSTAFF_API_URL = process.env.HUBSTAFF_API_URL || 'https://api.hubstaff.com/v2';

// Helper function to get access token
async function getAccessToken() {
  const config = await prisma.hubstaffConfig.findFirst();

  if (!config || !config.accessToken) {
    throw new Error('No Hubstaff configuration found. Please authenticate first.');
  }

  if (config.expiresAt && new Date() > config.expiresAt) {
    throw new Error('Access token expired. Please refresh the token.');
  }

  return config.accessToken;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    const accessToken = await getAccessToken();

    const response = await axios.get(
      `${HUBSTAFF_API_URL}/users/${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Failed to fetch user details:', error);

    if (error.message?.includes('No Hubstaff configuration')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error.message?.includes('expired')) {
      return NextResponse.json({ error: 'Access token expired. Please re-authenticate.' }, { status: 401 });
    }

    if (error.response?.status === 401) {
      return NextResponse.json({ error: 'Unauthorized. Token may be invalid or expired.' }, { status: 401 });
    }

    if (error.response?.status === 404) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (error.response?.status === 403) {
      return NextResponse.json({ error: 'Access denied. You may not have permission to view this user.' }, { status: 403 });
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch user details',
        message: error.response?.data?.error || error.message
      },
      { status: error.response?.status || 500 }
    );
  }
}
