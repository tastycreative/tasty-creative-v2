import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

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

    const { creatorName, itemName, newPrice } = await request.json();

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
    const updatedContentDetails = await prisma.contentDetails.update({
      where: {
        id: contentDetails.id
      },
      data: {
        [dbFieldName]: newPrice || null
      }
    });

    console.log('✅ Successfully updated pricing in database');

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