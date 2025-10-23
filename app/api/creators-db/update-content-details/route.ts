import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// Helper function to update Google Sheets via n8n webhook
async function updateGoogleSheet(fieldName: string, newValue: string, rowId: string | null, creatorName: string) {
  // Map UI field names to Google Sheets column names
  const sheetColumnMapping: Record<string, string> = {
    // Platform limitations
    'OnlyFans Wall Limitations': 'OnlyFans Wall Limitations',
    'Twitter Nudity': 'Twitter Nudity',
    'Flyer Censorship Limitations': 'Flyer Censorship Limitations',
    'Open to Livestreams': 'Open to Livestreams',
    // Personal information fields
    'Personality Type': 'Personality Type',
    'Restricted Terms or Emojis': 'Restricted Terms or Emojis',
    'Notes': 'Notes',
    'General Client Notes/Requests': 'General Client Notes/Requests',
    'Common Terms': 'Common Terms',
    'Common Emojis': 'Common Emojis',
    'Main Instagram': 'Main Instagram @',
    'Main Twitter': 'Main Twitter @',
    'Main TikTok': 'Main TikTok @'
    // Note: 'Chatting Managers' intentionally excluded - database only, no sheet update
  };
  
  // Check if this field should be synced to Google Sheets
  if (!sheetColumnMapping[fieldName]) {
    console.log(`⚠️ Field '${fieldName}' is database-only, skipping Google Sheets update`);
    return;
  }
  
  // Use the sheet column name for the webhook
  const sheetColumnName = sheetColumnMapping[fieldName];
  try {
    const GOOGLE_DRIVE_SHEET_MODEL_NAMES = process.env.GOOGLE_DRIVE_SHEET_MODEL_NAMES;
    
    if (!GOOGLE_DRIVE_SHEET_MODEL_NAMES) {
      console.log('⚠️ GOOGLE_DRIVE_SHEET_MODEL_NAMES not configured, skipping Google Sheets update');
      return;
    }
    
    console.log('🔍 Google Sheets webhook update attempt:', {
      creatorName: creatorName,
      uiFieldName: fieldName,
      sheetColumnName: sheetColumnName,
      newValue: newValue,
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
      newPrice: newValue, // Using newPrice field for consistency with webhook
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
    console.log(`✅ Updated Google Sheet via webhook - Range: ${sheetColumnName}${rowId}, Value: ${newValue}`, result);
    
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

    const { creatorName, fieldName, newValue } = await request.json();

    if (!creatorName || !fieldName) {
      return NextResponse.json({ error: "Creator name and field name are required" }, { status: 400 });
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

    console.log('📊 Updating content detail field:', fieldName);

    // Map field names to database fields for platform limitations and personal information
    const contentDetailsFields: Record<string, string> = {
      // Platform limitations
      'OnlyFans Wall Limitations': 'onlyFansWallLimitations',
      'Twitter Nudity': 'twitterNudity',
      'Flyer Censorship Limitations': 'flyerCensorshipLimitations',
      'Open to Livestreams': 'openToLivestreams',
      // Personal information fields
      'Personality Type': 'personalityType',
      'Restricted Terms or Emojis': 'restrictedTerms',
      'Notes': 'notes',
      'General Client Notes/Requests': 'generalClientNotes'
    };

    const clientModelFields: Record<string, string> = {
      // Fields that belong to ClientModel table
      'Common Terms': 'commonTerms',
      'Common Emojis': 'commonEmojis',
      // Social media fields
      'Main Instagram': 'mainInstagram',
      'Main Twitter': 'mainTwitter',
      'Main TikTok': 'mainTiktok',
      // Chatting managers
      'Chatting Managers': 'chattingManagers'
    };

    // Determine which table and field to update
    let dbFieldName: string | undefined;
    let isClientModelField = false;

    if (contentDetailsFields[fieldName]) {
      dbFieldName = contentDetailsFields[fieldName];
      isClientModelField = false;
    } else if (clientModelFields[fieldName]) {
      dbFieldName = clientModelFields[fieldName];
      isClientModelField = true;
    }
    
    if (!dbFieldName) {
      console.log('❌ Unknown field name:', fieldName);
      return NextResponse.json({ error: `Unknown field: "${fieldName}"` }, { status: 400 });
    }

    console.log(`🔄 Updating ${isClientModelField ? 'ClientModel' : 'ContentDetails'} field ${dbFieldName} to "${newValue}"`);

    if (isClientModelField) {
      // Handle array fields specially
      let processedValue;
      if (dbFieldName === 'chattingManagers') {
        // Convert newline-separated string to array
        processedValue = newValue ? newValue.split('\n').filter(Boolean).map(item => item.trim()) : [];
      } else {
        processedValue = newValue || null;
      }

      // Update ClientModel table
      await prisma.clientModel.update({
        where: {
          id: clientModel.id
        },
        data: {
          [dbFieldName]: processedValue
        }
      });
    } else {
      // Update ContentDetails table
      await prisma.contentDetails.update({
        where: {
          id: contentDetails.id
        },
        data: {
          [dbFieldName]: newValue || null
        }
      });
    }

    console.log(`✅ Successfully updated ${isClientModelField ? 'ClientModel' : 'ContentDetails'} in database`);

    // Also update Google Sheets using ClientModel's row_id
    await updateGoogleSheet(fieldName, newValue, clientModel.row_id, creatorName);

    return NextResponse.json({
      success: true,
      message: `Updated ${fieldName} for ${creatorName}`,
      updatedField: dbFieldName,
      newValue: newValue
    });

  } catch (error) {
    console.error('❌ Error updating content details in database:', error);
    return NextResponse.json(
      { error: "Failed to update content details in database" },
      { status: 500 }
    );
  }
}