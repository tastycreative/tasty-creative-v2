// Create this file: app/api/voice-gen-accounts/route.js
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - Fetch all accounts
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";

    const where = {
      AND: [
        search
          ? {
              OR: [
                { clientName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        status !== "all" ? { voiceStatus: status } : {},
      ].filter((condition) => Object.keys(condition).length > 0),
    };

    const accounts = await prisma.voiceGenAccount.findMany({
      where: Object.keys(where.AND).length > 0 ? where : {},
      orderBy: { clientName: "asc" },
    });

    return NextResponse.json(accounts);
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}

// POST - Create new account
export async function POST(request) {
  try {
    const data = await request.json();

    const account = await prisma.voiceGenAccount.create({
      data: {
        clientName: data.clientName || "New Client",
        email: data.email || null,
        password: data.password || null,
        voiceStatus: data.voiceStatus || "NA",
        accountType: data.accountType || "ELEVENLABS",
        dataFolder: data.dataFolder || null,
        feedback: data.feedback || null,
        rating: data.rating || null,
      },
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error("Error creating account:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}

// PUT - Update account
export async function PUT(request) {
  try {
    const data = await request.json();
    const { id, ...updateData } = data;

    const account = await prisma.voiceGenAccount.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error("Error updating account:", error);
    return NextResponse.json(
      { error: "Failed to update account" },
      { status: 500 }
    );
  }
}

// DELETE - Delete account
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    await prisma.voiceGenAccount.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
