/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/hubstaff/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const HUBSTAFF_API_URL = process.env.HUBSTAFF_API_URL || 'https://api.hubstaff.com/v2';

// Helper function to get current access token
async function getAccessToken() {
  const config = await prisma.hubstaffConfig.findFirst();
  
  if (!config || !config.accessToken) {
    throw new Error('No Hubstaff configuration found. Please authenticate first.');
  }

  // Check if token is expired
  if (config.expiresAt && new Date() > config.expiresAt) {
    // Token is expired, need to refresh
    throw new Error('Access token expired. Please refresh the token.');
  }

  return config.accessToken;
}

export async function GET(request: NextRequest) {
  try {
    // Get organization_id from query params
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organization_id');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      );
    }

    // Get access token from database
    const accessToken = await getAccessToken();

    // Make request to Hubstaff API
    const response = await axios.get(
      `${HUBSTAFF_API_URL}/organizations/${organizationId}/projects`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    );

    return NextResponse.json(response.data);

  } catch (error: any) {
    console.error('Failed to fetch projects:', error);

    // Handle specific error cases
    if (error.message?.includes('No Hubstaff configuration')) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    if (error.message?.includes('expired')) {
      return NextResponse.json(
        { error: 'Access token expired. Please re-authenticate.' },
        { status: 401 }
      );
    }

    if (error.response?.status === 401) {
      return NextResponse.json(
        { error: 'Unauthorized. Token may be invalid or expired.' },
        { status: 401 }
      );
    }

    if (error.response?.status === 404) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    if (error.response?.status === 403) {
      return NextResponse.json(
        { error: 'Access denied. You may not have permission to view this organization.' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to fetch projects',
        message: error.response?.data?.error || error.message 
      },
      { status: error.response?.status || 500 }
    );
  }
}

// // POST method to create a new project
// export async function POST(request: NextRequest) {
//   try {
//     // Get organization_id from query params or body
//     const searchParams = request.nextUrl.searchParams;
//     const organizationId = searchParams.get('organization_id');
    
//     const body = await request.json();
//     const { name, description, client_id, billable } = body;

//     if (!organizationId) {
//       return NextResponse.json(
//         { error: 'organization_id is required' },
//         { status: 400 }
//       );
//     }

//     if (!name) {
//       return NextResponse.json(
//         { error: 'Project name is required' },
//         { status: 400 }
//       );
//     }

//     // Get access token from database
//     const accessToken = await getAccessToken();

//     // Prepare project data
//     const projectData: any = {
//       name,
//       description
//     };

//     if (client_id) projectData.client_id = client_id;
//     if (billable !== undefined) projectData.billable = billable;

//     // Make request to Hubstaff API
//     const response = await axios.post(
//       `${HUBSTAFF_API_URL}/organizations/${organizationId}/projects`,
//       projectData,
//       {
//         headers: {
//           'Authorization': `Bearer ${accessToken}`,
//           'Content-Type': 'application/json',
//           'Accept': 'application/json'
//         }
//       }
//     );

//     return NextResponse.json({
//       success: true,
//       project: response.data,
//       message: 'Project created successfully'
//     });

//   } catch (error: any) {
//     console.error('Failed to create project:', error);

//     if (error.message?.includes('No Hubstaff configuration')) {
//       return NextResponse.json(
//         { error: error.message },
//         { status: 401 }
//       );
//     }

//     if (error.response?.status === 401) {
//       return NextResponse.json(
//         { error: 'Unauthorized. Token may be invalid or expired.' },
//         { status: 401 }
//       );
//     }

//     if (error.response?.status === 422) {
//       return NextResponse.json(
//         { 
//           error: 'Validation error',
//           details: error.response.data 
//         },
//         { status: 422 }
//       );
//     }

//     return NextResponse.json(
//       { 
//         error: 'Failed to create project',
//         message: error.response?.data?.error || error.message 
//       },
//       { status: error.response?.status || 500 }
//     );
//   }
// }