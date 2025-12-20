import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// Helper to validate and sanitize creator name input
function sanitizeCreatorName(name: string | null): string | null {
  if (!name) return null;
  // Remove any potential SQL/NoSQL injection attempts and limit length
  const sanitized = name.trim().slice(0, 100);
  // Basic validation - allow letters, numbers, spaces, and common name characters
  if (!/^[\w\s\-.']+$/i.test(sanitized)) {
    return null;
  }
  return sanitized;
}

// Check if we're in development mode
const isDev = process.env.NODE_ENV === 'development';

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get query parameters with validation
    const { searchParams } = new URL(request.url);
    const rawCreatorName = searchParams.get('creatorName');
    const creatorsParam = searchParams.get('creators');
    
    // Validate and sanitize inputs
    const creatorName = sanitizeCreatorName(rawCreatorName);
    
    // If creators list is provided, only fetch those specific creators
    let whereCondition: any = {};
    if (creatorsParam) {
      const creatorNames = creatorsParam
        .split(',')
        .map(name => sanitizeCreatorName(name.trim()))
        .filter((name): name is string => name !== null)
        .slice(0, 50); // Limit to 50 creators max
      
      if (creatorNames.length === 0) {
        return NextResponse.json({ creators: [], pricingData: [] });
      }
      
      whereCondition = {
        clientName: {
          in: creatorNames,
          mode: 'insensitive'
        }
      };
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
    
    // Debug logging only in development
    if (isDev) {
      const allContentDetails = await prisma.contentDetails.findMany({
        select: {
          clientModelName: true,
          upsell_1: true,
          upsell_2: true,
          upsell_3: true
        }
      });
      console.log('🔍 All ContentDetails with upsells:', allContentDetails.length);
    }

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
        } catch (error) {
          if (isDev) {
            console.error(`Error fetching details for ${model.clientName}:`, error);
          }
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
      },
      {
        id: 'upsells',
        groupName: 'Sexting Scripts',
        items: [
          { id: 'upsell-1', name: 'Upsell 1', description: 'First upsell option' },
          { id: 'upsell-2', name: 'Upsell 2', description: 'Second upsell option' },
          { id: 'upsell-3', name: 'Upsell 3', description: 'Third upsell option' },
          { id: 'upsell-4', name: 'Upsell 4', description: 'Fourth upsell option' },
          { id: 'upsell-5', name: 'Upsell 5', description: 'Fifth upsell option' },
          { id: 'upsell-6', name: 'Upsell 6', description: 'Sixth upsell option' },
          { id: 'upsell-7', name: 'Upsell 7', description: 'Seventh upsell option' },
          { id: 'upsell-8', name: 'Upsell 8', description: 'Eighth upsell option' },
          { id: 'upsell-9', name: 'Upsell 9', description: 'Ninth upsell option' },
          { id: 'upsell-10', name: 'Upsell 10', description: 'Tenth upsell option' },
          { id: 'upsell-11', name: 'Upsell 11', description: 'Eleventh upsell option' },
          { id: 'upsell-12', name: 'Upsell 12', description: 'Twelfth upsell option' },
          { id: 'upsell-13', name: 'Upsell 13', description: 'Thirteenth upsell option' },
          { id: 'upsell-14', name: 'Upsell 14', description: 'Fourteenth upsell option' },
          { id: 'upsell-15', name: 'Upsell 15', description: 'Fifteenth upsell option' },
          { id: 'upsell-16', name: 'Upsell 16', description: 'Sixteenth upsell option' },
          { id: 'upsell-17', name: 'Upsell 17', description: 'Seventeenth upsell option' }
        ],
        pricing: {}
      }
    ];

    // Populate pricing data for each creator - include ALL content details columns
    clientModels.forEach((model: any) => {
      const creatorName = model.clientName;
      // ContentDetails is a singular object
      const content = model.contentDetails;
      
      // Debug: Log content details for first creator in dev mode only
      if (isDev && model === clientModels[0]) {
        console.log(`🔍 ContentDetails for ${creatorName}:`, {
          hasContentDetails: !!content,
          upsellFields: content ? Object.keys(content).filter(key => key.startsWith('upsell_')).length : 0
        });
      }
      
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

      // Upsells group (Group 4)
  (pricingGroups[3].pricing as any)[creatorName] = {
        'Upsell 1': content?.upsell_1 || '',
        'Upsell 2': content?.upsell_2 || '',
        'Upsell 3': content?.upsell_3 || '',
        'Upsell 4': content?.upsell_4 || '',
        'Upsell 5': content?.upsell_5 || '',
        'Upsell 6': content?.upsell_6 || '',
        'Upsell 7': content?.upsell_7 || '',
        'Upsell 8': content?.upsell_8 || '',
        'Upsell 9': content?.upsell_9 || '',
        'Upsell 10': content?.upsell_10 || '',
        'Upsell 11': content?.upsell_11 || '',
        'Upsell 12': content?.upsell_12 || '',
        'Upsell 13': content?.upsell_13 || '',
        'Upsell 14': content?.upsell_14 || '',
        'Upsell 15': content?.upsell_15 || '',
        'Upsell 16': content?.upsell_16 || '',
        'Upsell 17': content?.upsell_17 || ''
      };
    });

    // Return response with cache headers for better performance
    return NextResponse.json(
      { creators, pricingData: pricingGroups },
      {
        headers: {
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
        },
      }
    );

  } catch (error) {
    console.error('Error fetching creators from database:', error);
    return NextResponse.json(
      { error: "Failed to fetch creators from database" },
      { status: 500 }
    );
  }
}