import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
) {
  try {
    const { modelId } = await params;
    const body = await request.json();
    const { pricingDescription } = body;

    // Validate modelId
    if (!modelId) {
      return NextResponse.json(
        { success: false, error: 'Model ID is required' },
        { status: 400 }
      );
    }

    // Check if model exists
    const existingModel = await prisma.clientModel.findUnique({
      where: { id: modelId },
    });

    if (!existingModel) {
      return NextResponse.json(
        { success: false, error: 'Model not found' },
        { status: 404 }
      );
    }

    // Update the pricing description
    const updatedModel = await prisma.clientModel.update({
      where: { id: modelId },
      data: {
        pricingDescription: pricingDescription || null,
      },
    });

    return NextResponse.json({
      success: true,
      model: updatedModel,
    });
  } catch (error) {
    console.error('Error updating model pricing description:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update model pricing description',
      },
      { status: 500 }
    );
  }
}
