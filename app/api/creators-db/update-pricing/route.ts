import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// Helper function to update Google Sheets via n8n webhook
async function updateGoogleSheet(itemName: string, newPrice: string, rowId: string | null, creatorName: string) {
  try {
    const GOOGLE_DRIVE_SHEET_MODEL_NAMES = process.env.GOOGLE_DRIVE_SHEET_MODEL_NAMES;
    
    if (!GOOGLE_DRIVE_SHEET_MODEL_NAMES) {
      console.log('⚠️ GOOGLE_DRIVE_SHEET_MODEL_NAMES not configured, skipping Google Sheets update');
      return;
    }
    
    console.log('🔍 Google Sheets webhook update attempt:', {
      creatorName: creatorName,
      itemName: itemName,
      newPrice: newPrice,
      rowId: rowId
    });
    
    if (!rowId) {
      console.log('⚠️ No row_id found in ClientModel, cannot update Google Sheet');
      return;
    }

    // Send data to n8n webhook
    const webhookUrl = 'http://n8n.tastycreative.xyz/webhook/1f9c704a-f940-4a02-95aa-20164df19c25';
    const webhookData = {
      spreadsheetId: GOOGLE_DRIVE_SHEET_MODEL_NAMES,
      creatorName: creatorName,
      itemName: itemName,
      newPrice: newPrice,
      rowId: rowId,
      range: `${itemName}${rowId}`,
      timestamp: new Date().toISOString()
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData)
    });

    if (!response.ok) {
      throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`✅ Updated Google Sheet via webhook - Range: ${itemName}${rowId}, Value: ${newPrice}`, result);
    
  } catch (error) {
    console.error('❌ Error updating Google Sheet via webhook:', error);
    // Don't throw - we want the database update to succeed even if Google Sheets fails
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Not authorized - admin access required" }, { status: 403 });
    }

    const { creatorName, itemName, newPrice, rowId } = await request.json();

    if (!creatorName || !itemName) {
      return NextResponse.json({ error: "Creator name and item name are required" }, { status: 400 });
    }

    console.log('🔍 Looking for creator in database:', creatorName);

    // Find the client model by name (case insensitive)
    const clientModel = await prisma.clientModel.findFirst({
      where: {
        clientName: {
          equals: creatorName,
          mode: 'insensitive'
        }
      },
      include: {
        contentDetails: true
      }
    });

    if (!clientModel) {
      console.log('❌ Creator not found:', creatorName);
      return NextResponse.json({ error: `Creator "${creatorName}" not found` }, { status: 404 });
    }

    console.log('✅ Found creator:', clientModel.clientName);
    console.log('📍 Using rowId from request:', rowId);
    console.log('📍 ClientModel row_id:', clientModel.row_id);
    
    // Use the row_id from the request (which comes from ClientModel via zustand)
    const actualRowId = rowId || clientModel.row_id;

    // Get or create content details
    let contentDetails = clientModel.contentDetails[0];
    
    if (!contentDetails) {
      console.log('📝 Creating new ContentDetails record for:', creatorName);
      contentDetails = await prisma.contentDetails.create({
        data: {
          clientModelName: clientModel.clientName
        }
      });
    }

    console.log('📊 Updating pricing for item:', itemName);

    // Map item names to database fields - updated for new grouping structure
    const fieldMapping: Record<string, string> = {
      // Content Price Ranges group
      'Boob Content': 'boobContent',
      'Pussy Content': 'pussyContent',
      'Solo Squirt Content': 'soloSquirtContent',
      'Solo Finger Content': 'soloFingerContent',
      'Solo Dildo Content': 'soloDildoContent',
      'Solo Vibrator Content': 'soloVibratorContent',
      'JOI Content': 'joiContent',
      'BG Content': 'bgContent',
      'BJ/Handjob Content': 'bjHandjobContent',
      'BGG Content': 'bggContent',
      'BBG Content': 'bbgContent',
      'Orgy Content': 'orgyContent',
      'GG Content': 'ggContent',
      'Anal Content': 'analContent',
      'Livestream Content': 'livestreamContent',
      
      // Custom Content group
      'Custom Video Pricing': 'customVideoPricing',
      'Custom Call Pricing': 'customCallPricing',
      
      // Bundle Contents group
      '$5-10 Bundle Content': 'bundleContent5_10',
      '$10-15 Bundle Content': 'bundleContent10_15',
      '$15-20 Bundle Content': 'bundleContent15_20',
      '$20-25 Bundle Content': 'bundleContent20_25',
      '$25-30 Bundle Content': 'bundleContent25_30',
      '$30+ Bundle Content': 'bundleContent30Plus',
      'Content Options For Games': 'contentOptionsForGames'
    };

    const dbFieldName = fieldMapping[itemName];
    
    if (!dbFieldName) {
      console.log('❌ Unknown item name:', itemName);
      return NextResponse.json({ error: `Unknown item: "${itemName}"` }, { status: 400 });
    }

    console.log(`🔄 Updating field ${dbFieldName} to "${newPrice}"`);

    // Update the content details with the new price
    await prisma.contentDetails.update({
      where: {
        id: contentDetails.id
      },
      data: {
        [dbFieldName]: newPrice || null
      }
    });

    console.log('✅ Successfully updated pricing in database');

    // Also update Google Sheets using ClientModel's row_id
    await updateGoogleSheet(itemName, newPrice, actualRowId, creatorName);

    return NextResponse.json({
      success: true,
      message: `Updated ${itemName} for ${creatorName}`,
      updatedField: dbFieldName,
      newValue: newPrice
    });

  } catch (error) {
    console.error('❌ Error updating pricing in database:', error);
    return NextResponse.json(
      { error: "Failed to update pricing in database" },
      { status: 500 }
    );
  }
}