import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// Helper function to update Google Sheets via n8n webhook
async function updateGoogleSheet(itemName: string, newPrice: string, rowId: string | null, creatorName: string) {
  // Map UI item names to Google Sheets column names
  const sheetColumnMapping: Record<string, string> = {
    // Core Pricing section mappings - use sheet column names
    'Standard Content': 'Boob Content',
    'Custom Videos': 'Custom Video Pricing',
    'Custom Calls': 'Custom Call Pricing',
    
    // Content Price Ranges group - these should match exactly
    'Boob Content': 'Boob Content',
    'Pussy Content': 'Pussy Content',
    'Solo Squirt Content': 'Solo Squirt Content',
    'Solo Finger Content': 'Solo Finger Content',
    'Solo Dildo Content': 'Solo Dildo Content',
    'Solo Vibrator Content': 'Solo Vibrator Content',
    'JOI Content': 'JOI Content',
    'BG Content': 'BG Content',
    'BJ/Handjob Content': 'BJ/Handjob Content',
    'BGG Content': 'BGG Content',
    'BBG Content': 'BBG Content',
    'Orgy Content': 'Orgy Content',
    'GG Content': 'GG Content',
    'Anal Content': 'Anal Content',
    'Livestream Content': 'Livestream Content',
    
    // Custom Content group - use sheet column names
    'Custom Video Pricing': 'Custom Video Pricing',
    'Custom Call Pricing': 'Custom Call Pricing',
    
    // Bundle Contents group - use sheet column names
    '$5-10 Bundle Content': '$5-10 Bundle Content',
    '$10-15 Bundle Content': '$10-15 Bundle Content',
    '$15-20 Bundle Content': '$15-20 Bundle Content',
    '$20-25 Bundle Content': '$20-25 Bundle Content',
    '$25-30 Bundle Content': '$25-30 Bundle Content',
    '$30+ Bundle Content': '$30+ Bundle Content',
    'Content Options For Games': 'Content Options For Games',
    
    // Upsell group - use sheet column names
    'Upsell 1': 'Upsell 1',
    'Upsell 2': 'Upsell 2',
    'Upsell 3': 'Upsell 3',
    'Upsell 4': 'Upsell 4',
    'Upsell 5': 'Upsell 5',
    'Upsell 6': 'Upsell 6',
    'Upsell 7': 'Upsell 7',
    'Upsell 8': 'Upsell 8',
    'Upsell 9': 'Upsell 9',
    'Upsell 10': 'Upsell 10',
    'Upsell 11': 'Upsell 11',
    'Upsell 12': 'Upsell 12',
    'Upsell 13': 'Upsell 13',
    'Upsell 14': 'Upsell 14',
    'Upsell 15': 'Upsell 15',
    'Upsell 16': 'Upsell 16',
    'Upsell 17': 'Upsell 17'
  };
  
  // Use the sheet column name for the webhook
  const sheetColumnName = sheetColumnMapping[itemName] || itemName;
  try {
    const GOOGLE_DRIVE_SHEET_MODEL_NAMES = process.env.GOOGLE_DRIVE_SHEET_MODEL_NAMES;
    
    if (!GOOGLE_DRIVE_SHEET_MODEL_NAMES) {
      console.log('⚠️ GOOGLE_DRIVE_SHEET_MODEL_NAMES not configured, skipping Google Sheets update');
      return;
    }
    
    console.log('🔍 Google Sheets webhook update attempt:', {
      creatorName: creatorName,
      uiItemName: itemName,
      sheetColumnName: sheetColumnName,
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
      itemName: sheetColumnName, // Use the mapped sheet column name
      newPrice: newPrice,
      rowId: rowId,
      range: `${sheetColumnName}${rowId}`, // Use the mapped sheet column name
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
    console.log(`✅ Updated Google Sheet via webhook - Range: ${sheetColumnName}${rowId}, Value: ${newPrice}`, result);
    
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

    // Get or create content details using upsert to handle existing records
    console.log('📝 Getting or creating ContentDetails record for:', creatorName);
    const contentDetails = await prisma.contentDetails.upsert({
      where: {
        clientModelName: clientModel.clientName
      },
      update: {
        // No updates needed during upsert, we'll update the specific field later
      },
      create: {
        clientModelName: clientModel.clientName
      }
    });

    console.log('📊 Updating pricing for item:', itemName);

    // Map item names to database fields - updated for new grouping structure
    const fieldMapping: Record<string, string> = {
      // Core Pricing section mappings
      'Standard Content': 'boobContent',
      'Custom Videos': 'customVideoPricing',
      'Custom Calls': 'customCallPricing',
      
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
      'Content Options For Games': 'contentOptionsForGames',
      
      // Sexting Scripts group (Upsells)
      'Upsell 1': 'upsell_1',
      'Upsell 2': 'upsell_2',
      'Upsell 3': 'upsell_3',
      'Upsell 4': 'upsell_4',
      'Upsell 5': 'upsell_5',
      'Upsell 6': 'upsell_6',
      'Upsell 7': 'upsell_7',
      'Upsell 8': 'upsell_8',
      'Upsell 9': 'upsell_9',
      'Upsell 10': 'upsell_10',
      'Upsell 11': 'upsell_11',
      'Upsell 12': 'upsell_12',
      'Upsell 13': 'upsell_13',
      'Upsell 14': 'upsell_14',
      'Upsell 15': 'upsell_15',
      'Upsell 16': 'upsell_16',
      'Upsell 17': 'upsell_17'
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