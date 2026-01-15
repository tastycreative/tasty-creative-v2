import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { clientName } = body;

    if (!clientName || clientName.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Model name is required" },
        { status: 400 }
      );
    }

    // Check if model already exists
    const existingModel = await prisma.clientModel.findFirst({
      where: {
        clientName: clientName.trim(),
      },
    });

    if (existingModel) {
      return NextResponse.json(
        { success: false, error: "A model with this name already exists" },
        { status: 409 }
      );
    }

    // Create new manually added model
    const newModel = await prisma.clientModel.create({
      data: {
        clientName: clientName.trim(),
        status: "active",
        isManuallyAdded: true,
      },
    });

    console.log(`✅ Manually added model: ${newModel.clientName}`);

    return NextResponse.json({
      success: true,
      clientModel: {
        id: newModel.id,
        clientName: newModel.clientName,
        status: newModel.status,
        isManuallyAdded: newModel.isManuallyAdded,
      },
    });
  } catch (error) {
    console.error("❌ Error creating manual model:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create manual model",
      },
      { status: 500 }
    );
  }
}
