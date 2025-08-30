import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get query parameters for specific creator
    const { searchParams } = new URL(request.url);
    const creatorName = searchParams.get('creatorName');

    // Fetch all client models with their content details
    const clientModels = await prisma.clientModel.findMany({
      include: {
        contentDetails: true
      },
      orderBy: {
        clientName: 'asc'
      }
    });

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
        contentDetails: model.contentDetails[0], // Assuming one content detail per model
        modelDetails: modelDetails // Add the client model details
      };
    }));

    // Create pricing groups from content details
    const pricingGroups = [
      {
        id: 'content-pricing',
        groupName: 'Content Pricing',
        items: [
          { id: 'custom-video', name: 'Custom Video', description: 'Personalized video content' },
          { id: 'custom-call', name: 'Custom Call', description: 'Private video/voice calls' },
          { id: 'bundle-5-10', name: '$5-10 Bundle', description: 'Content bundle $5-10 range' },
          { id: 'bundle-10-15', name: '$10-15 Bundle', description: 'Content bundle $10-15 range' },
          { id: 'bundle-15-20', name: '$15-20 Bundle', description: 'Content bundle $15-20 range' },
          { id: 'bundle-20-25', name: '$20-25 Bundle', description: 'Content bundle $20-25 range' },
          { id: 'bundle-25-30', name: '$25-30 Bundle', description: 'Content bundle $25-30 range' },
          { id: 'bundle-30-plus', name: '$30+ Bundle', description: 'Premium content bundle' }
        ],
        pricing: {}
      },
      {
        id: 'content-types',
        groupName: 'Available Content Types',
        items: [
          { id: 'boob-content', name: 'Boob Content', description: 'Topless content availability' },
          { id: 'pussy-content', name: 'Pussy Content', description: 'Explicit content availability' },
          { id: 'solo-content', name: 'Solo Content', description: 'Various solo content types' },
          { id: 'bg-content', name: 'BG Content', description: 'Boy/Girl content' },
          { id: 'anal-content', name: 'Anal Content', description: 'Anal content availability' },
          { id: 'joi-content', name: 'JOI Content', description: 'Jerk Off Instructions' },
          { id: 'livestream-content', name: 'Livestream', description: 'Live streaming availability' }
        ],
        pricing: {}
      }
    ];

    // Populate pricing data for each creator
    clientModels.forEach((model: any) => {
      const creatorName = model.clientName;
      const content = model.contentDetails[0];
      
      if (content) {
        // Content Pricing group
        (pricingGroups[0].pricing as any)[creatorName] = {
          'Custom Video': content.customVideoPricing || '',
          'Custom Call': content.customCallPricing || '',
          '$5-10 Bundle': content.bundleContent5_10 || '',
          '$10-15 Bundle': content.bundleContent10_15 || '',
          '$15-20 Bundle': content.bundleContent15_20 || '',
          '$20-25 Bundle': content.bundleContent20_25 || '',
          '$25-30 Bundle': content.bundleContent25_30 || '',
          '$30+ Bundle': content.bundleContent30Plus || ''
        };

        // Content Types group
        (pricingGroups[1].pricing as any)[creatorName] = {
          'Boob Content': content.boobContent || '',
          'Pussy Content': content.pussyContent || '',
          'Solo Content': [
            content.soloSquirtContent,
            content.soloFingerContent,
            content.soloDildoContent,
            content.soloVibratorContent
          ].filter(Boolean).join(', ') || '',
          'BG Content': content.bgContent || '',
          'Anal Content': content.analContent || '',
          'JOI Content': content.joiContent || '',
          'Livestream': content.livestreamContent || ''
        };
      }
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