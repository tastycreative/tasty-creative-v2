import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated session
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { model, voiceNote, sale, soldDate, status, generatedDate, originalHistoryId, source } = body;

    // Validate required fields
    if (!model || !voiceNote || !sale || !soldDate) {
      return NextResponse.json(
        { error: "Missing required fields: model, voiceNote, sale, soldDate" },
        { status: 400 }
      );
    }

    // Validate sale amount
    const saleAmount = parseFloat(sale);
    if (isNaN(saleAmount) || saleAmount <= 0) {
      return NextResponse.json(
        { error: "Sale amount must be a positive number" },
        { status: 400 }
      );
    }

    // Get submitter info from session
    const submittedBy = session.user.name || session.user.email || 'Unknown';
    const submissionSource = source || 'Manual Entry';

    console.log('Submitting sale to database:', {
      model,
      saleAmount,
      soldDate,
      originalHistoryId,
      submittedBy,
      source: submissionSource,
      isHistorySale: !!originalHistoryId,
      timestamp: new Date().toISOString()
    });

    try {
      // If originalHistoryId is provided, verify it exists in the database
      let validHistoryId = null;
      if (originalHistoryId) {
        // @ts-ignore - Prisma Client type generation issue
        const historyRecord = await prisma.voiceNoteHistory.findUnique({
          where: {
            id: originalHistoryId,
          },
        });
        
        if (historyRecord) {
          validHistoryId = originalHistoryId;
          console.log(`✅ Found matching history record: ${originalHistoryId}`);
        } else {
          console.warn(`⚠️ History record not found: ${originalHistoryId}, proceeding without link`);
        }
      }

      // Create voice note sale record in database
      // @ts-ignore - Prisma Client type generation issue
      const saleRecord = await prisma.voiceNoteSale.create({
        data: {
          userId: session.user.id!,
          userName: session.user.name || "Unknown",
          userEmail: session.user.email || "unknown@email.com",
          modelName: model,
          voiceNote,
          saleAmount,
          soldDate: new Date(soldDate),
          status: status || "Completed",
          generatedDate: generatedDate ? new Date(generatedDate) : null,
          source: submissionSource,
          voiceNoteHistoryId: validHistoryId,
        },
      });

      console.log(`✅ Successfully created sale record:`, {
        id: saleRecord.id,
        model,
        sale: saleAmount,
        soldDate,
        originalHistoryId,
        submittedBy,
        source: submissionSource,
      });

      // Return success response
      return NextResponse.json({
        success: true,
        message: "Voice note sale submitted successfully",
        data: {
          id: saleRecord.id,
          model,
          sale: saleAmount,
          soldDate,
          status: status || "Completed",
          originalHistoryId,
          submittedBy,
          source: submissionSource,
          timestamp: new Date().toISOString()
        },
      });

    } catch (dbError: any) {
      console.error(`❌ Error saving to database:`, dbError);
      throw dbError;
    }

  } catch (error: any) {
    console.error("❌ Error submitting VN sale:", error);

    return NextResponse.json(
      {
        error: "Failed to submit voice note sale",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}