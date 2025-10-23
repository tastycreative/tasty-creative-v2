import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const creatorName = searchParams.get('creatorName');
    const creatorsParam = searchParams.get('creators');
    
    // If creators list is provided, only fetch those specific creators
    let whereCondition: any = {};
    if (creatorsParam) {
      const creatorNames = creatorsParam.split(',').map(name => name.trim());
      whereCondition = {
        clientName: {
          in: creatorNames,
          mode: 'insensitive'
        }
      };
      console.log('🎯 Filtering to specific creators:', creatorNames);
    } else if (creatorName) {
      whereCondition = {
        clientName: {
          equals: creatorName,
          mode: 'insensitive'
        }
      };
    }

    // Fetch client models with filtering
    const clientModels = await prisma.clientModel.findMany({
      where: whereCondition,
      include: {
        // ContentDetails is a 1:1 relation in prisma schema
        contentDetails: true,
      },
      orderBy: {
        clientName: 'asc',
      },
    });
    
    console.log(`📊 Fetched ${clientModels.length} creators from database`);

    // Transform the data to match the expected format for POD
    const creators = await Promise.all(clientModels.map(async (model: any) => {
      let modelDetails = null;
      
      // Only fetch details if we're looking for a specific creator or fetch all
      if (!creatorName || model.clientName.toLowerCase() === creatorName.toLowerCase()) {
        try {
          // Fetch client model details for this specific creator
          modelDetails = await prisma.clientModelDetails.findFirst({
            where: {
              client_name: {
                equals: model.clientName,
                mode: 'insensitive'
              }
            }
          });
          
          console.log(`Fetching details for creator: ${model.clientName}, found: ${!!modelDetails}`);
        } catch (error) {
          console.error(`Error fetching details for ${model.clientName}:`, error);
        }
      }

  return {
        id: model.id,
        name: model.clientName,
        guaranteed: model.guaranteed || null, // Using guaranteed field
        status: model.status,
        launchDate: model.launchDate,
        referrerName: model.referrer,
        instagram: model.mainInstagram,
        twitter: model.mainTwitter,
        tiktok: model.mainTiktok,
        profileLink: model.profileLink,
        personalityType: model.personalityType,
        commonTerms: model.commonTerms,
        commonEmojis: model.commonEmojis,
        restrictedTermsEmojis: model.restrictedTermsEmojis,
        notes: model.notes,
        generalNotes: model.generalNotes,
        chattingManagers: model.chattingManagers, // Add chattingManagers array
  row_id: model.row_id, // Add row_id from ClientModel
  // Use the singular ContentDetails object (not an array)
  contentDetails: model.contentDetails,
  modelDetails: modelDetails, // Add the client model details
      };
    }));

    // Create pricing groups matching the correct Google Sheets structure
    const pricingGroups = [
      {
        id: 'content-price-ranges',
        groupName: 'Content Price Ranges',
        items: [
          { id: 'boob-content', name: 'Boob Content', description: 'Topless content availability' },
          { id: 'pussy-content', name: 'Pussy Content', description: 'Explicit content availability' },
          { id: 'solo-squirt', name: 'Solo Squirt Content', description: 'Solo squirting content' },
          { id: 'solo-finger', name: 'Solo Finger Content', description: 'Solo fingering content' },
          { id: 'solo-dildo', name: 'Solo Dildo Content', description: 'Solo dildo content' },
          { id: 'solo-vibrator', name: 'Solo Vibrator Content', description: 'Solo vibrator content' },
          { id: 'joi-content', name: 'JOI Content', description: 'Jerk Off Instructions' },
          { id: 'bg-content', name: 'BG Content', description: 'Boy/Girl content' },
          { id: 'bj-handjob', name: 'BJ/Handjob Content', description: 'Blowjob and handjob content' },
          { id: 'bgg-content', name: 'BGG Content', description: 'Boy/Girl/Girl content' },
          { id: 'bbg-content', name: 'BBG Content', description: 'Boy/Boy/Girl content' },
          { id: 'orgy-content', name: 'Orgy Content', description: 'Group content' },
          { id: 'gg-content', name: 'GG Content', description: 'Girl/Girl content' },
          { id: 'anal-content', name: 'Anal Content', description: 'Anal content availability' },
          { id: 'livestream-content', name: 'Livestream Content', description: 'Live streaming content' }
        ],
        pricing: {}
      },
      {
        id: 'custom-content',
        groupName: 'Custom Content',
        items: [
          { id: 'custom-video', name: 'Custom Video Pricing', description: 'Personalized video content pricing' },
          { id: 'custom-call', name: 'Custom Call Pricing', description: 'Private video/voice calls pricing' }
        ],
        pricing: {}
      },
      {
        id: 'bundle-contents',
        groupName: 'Bundle Contents',
        items: [
          { id: 'bundle-5-10', name: '$5-10 Bundle Content', description: 'Content bundle $5-10 range' },
          { id: 'bundle-10-15', name: '$10-15 Bundle Content', description: 'Content bundle $10-15 range' },
          { id: 'bundle-15-20', name: '$15-20 Bundle Content', description: 'Content bundle $15-20 range' },
          { id: 'bundle-20-25', name: '$20-25 Bundle Content', description: 'Content bundle $20-25 range' },
          { id: 'bundle-25-30', name: '$25-30 Bundle Content', description: 'Content bundle $25-30 range' },
          { id: 'bundle-30-plus', name: '$30+ Bundle Content', description: 'Premium content bundle' },
          { id: 'content-options-games', name: 'Content Options For Games', description: 'Gaming content options' }
        ],
        pricing: {}
      }
    ];

    // Populate pricing data for each creator - include ALL content details columns
    clientModels.forEach((model: any) => {
      const creatorName = model.clientName;
      // ContentDetails is a singular object
      const content = model.contentDetails;
      
      // Always create pricing entries, even if content is null/empty
      
      // Content Price Ranges group (Group 1)
  (pricingGroups[0].pricing as any)[creatorName] = {
        'Boob Content': content?.boobContent || '',
        'Pussy Content': content?.pussyContent || '',
        'Solo Squirt Content': content?.soloSquirtContent || '',
        'Solo Finger Content': content?.soloFingerContent || '',
        'Solo Dildo Content': content?.soloDildoContent || '',
        'Solo Vibrator Content': content?.soloVibratorContent || '',
        'JOI Content': content?.joiContent || '',
        'BG Content': content?.bgContent || '',
        'BJ/Handjob Content': content?.bjHandjobContent || '',
        'BGG Content': content?.bggContent || '',
        'BBG Content': content?.bbgContent || '',
        'Orgy Content': content?.orgyContent || '',
        'GG Content': content?.ggContent || '',
        'Anal Content': content?.analContent || '',
        'Livestream Content': content?.livestreamContent || ''
      };

      // Custom Content group (Group 2)
  (pricingGroups[1].pricing as any)[creatorName] = {
        'Custom Video Pricing': content?.customVideoPricing || '',
        'Custom Call Pricing': content?.customCallPricing || ''
      };

      // Bundle Contents group (Group 3)
  (pricingGroups[2].pricing as any)[creatorName] = {
        '$5-10 Bundle Content': content?.bundleContent5_10 || '',
        '$10-15 Bundle Content': content?.bundleContent10_15 || '',
        '$15-20 Bundle Content': content?.bundleContent15_20 || '',
        '$20-25 Bundle Content': content?.bundleContent20_25 || '',
        '$25-30 Bundle Content': content?.bundleContent25_30 || '',
        '$30+ Bundle Content': content?.bundleContent30Plus || '',
        'Content Options For Games': content?.contentOptionsForGames || ''
      };
    });

    return NextResponse.json({
      creators,
      pricingData: pricingGroups
    });

  } catch (error) {
    console.error('Error fetching creators from database:', error);
    return NextResponse.json(
      { error: "Failed to fetch creators from database" },
      { status: 500 }
    );
  }
}