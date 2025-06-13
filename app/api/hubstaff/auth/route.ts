/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/hubstaff/auth/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import axios from "axios";

const prisma = new PrismaClient();

interface HubstaffTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from request body
    const body = await request.json();
    const { refresh_token } = body;

    if (!refresh_token) {
      return NextResponse.json(
        { error: "Refresh token is required" },
        { status: 400 }
      );
    }

    // Exchange refresh token for access token
    const tokenResponse = await axios.post<HubstaffTokenResponse>(
      "https://account.hubstaff.com/access_tokens",
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refresh_token,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
      }
    );

    const {
      access_token,
      refresh_token: new_refresh_token,
      expires_in,
    } = tokenResponse.data;

    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);

    // Check if config exists
    const existingConfig = await prisma.hubstaffConfig.findFirst();

    if (existingConfig) {
      // Update existing config
      await prisma.hubstaffConfig.update({
        where: { id: existingConfig.id },
        data: {
          refreshToken: new_refresh_token || refresh_token,
          accessToken: access_token,
          expiresAt,
        },
      });
    } else {
      // Create new config
      await prisma.hubstaffConfig.create({
        data: {
          refreshToken: new_refresh_token || refresh_token,
          accessToken: access_token,
          expiresAt,
        },
      });
    }

    // Test the token by fetching user info
    const userResponse = await axios.get(
      "https://api.hubstaff.com/v2/users/me",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Hubstaff authentication successful",
      user: userResponse.data.user,
      tokenInfo: {
        expiresAt,
        expiresIn: expires_in,
      },
    });
  } catch (error: any) {
    console.error("Hubstaff auth error:", error);

    // Handle specific error cases
    if (error.response?.status === 400) {
      return NextResponse.json(
        {
          error: "Invalid refresh token",
          details: error.response.data,
        },
        { status: 400 }
      );
    }

    if (error.response?.status === 401) {
      return NextResponse.json(
        {
          error: "Unauthorized: Token may be expired or revoked",
          details: error.response.data,
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to authenticate with Hubstaff",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// GET method to check current auth status
export async function GET() {
  try {
    const config = await prisma.hubstaffConfig.findFirst();

    if (!config) {
      return NextResponse.json({
        authenticated: false,
        message: "No Hubstaff configuration found",
      });
    }

    // Check if token is expired
    const now = new Date();
    const isExpired = config.expiresAt ? now > config.expiresAt : true;

    // If expired, try to refresh
    if (isExpired && config.refreshToken) {
      try {
        const tokenResponse = await axios.post<HubstaffTokenResponse>(
          "https://account.hubstaff.com/access_tokens",
          new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: config.refreshToken,
          }),
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Accept: "application/json",
            },
          }
        );

        const {
          access_token,
          refresh_token: new_refresh_token,
          expires_in,
        } = tokenResponse.data;

        // Calculate new expiration time
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);

        // Update config
        await prisma.hubstaffConfig.update({
          where: { id: config.id },
          data: {
            refreshToken: new_refresh_token || config.refreshToken,
            accessToken: access_token,
            expiresAt,
          },
        });

        // Get user info with new token
        const userResponse = await axios.get(
          "https://api.hubstaff.com/v2/users/me",
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          }
        );

        return NextResponse.json({
          authenticated: true,
          tokenRefreshed: true,
          user: userResponse.data.user,
          expiresAt,
        });
      } catch (refreshError) {
        console.error("Failed to refresh token:", refreshError);
        return NextResponse.json({
          authenticated: false,
          message: "Token expired and refresh failed",
        });
      }
    }

    // Token is still valid, get user info
    if (config.accessToken) {
      try {
        const userResponse = await axios.get(
          "https://api.hubstaff.com/v2/users/me",
          {
            headers: {
              Authorization: `Bearer ${config.accessToken}`,
            },
          }
        );

        return NextResponse.json({
          authenticated: true,
          user: userResponse.data.user,
          expiresAt: config.expiresAt,
        });
      } catch {
        return NextResponse.json({
          authenticated: false,
          message: "Access token is invalid",
        });
      }
    }

    return NextResponse.json({
      authenticated: false,
      message: "No access token available",
    });
  } catch (error: any) {
    console.error("Auth status check error:", error);
    return NextResponse.json(
      {
        error: "Failed to check authentication status",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// // DELETE method to remove Hubstaff configuration
// export async function DELETE() {
//   try {
//     const config = await prisma.hubstaffConfig.findFirst();

//     if (!config) {
//       return NextResponse.json(
//         { error: "No Hubstaff configuration found" },
//         { status: 404 }
//       );
//     }

//     await prisma.hubstaffConfig.delete({
//       where: { id: config.id },
//     });

//     return NextResponse.json({
//       success: true,
//       message: "Hubstaff configuration removed successfully",
//     });
//   } catch (error: any) {
//     console.error("Delete config error:", error);
//     return NextResponse.json(
//       {
//         error: "Failed to remove configuration",
//         message: error.message,
//       },
//       { status: 500 }
//     );
//   }
// }
