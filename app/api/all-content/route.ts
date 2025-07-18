import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/auth";

interface AllContentItem {
  id: string;
  type: 'video' | 'photo';
  title: string;
  duration?: string;
  timeAgo: string;
  status: 'HAS_GIF' | 'NEEDS_GIF';
  campaignReady: boolean;
  thumbnail: string;
  category?: string;
  featuredEvents?: string;
  caption?: string;
  videoLink?: string;
  creationDate?: string;
  creator?: string;
  results?: string;
  additionalNotes?: string;
  isVaultNew?: boolean;
  driveId?: string | null;
  isFolder?: boolean;
  source: 'vault' | 'sexting' | 'social-media'; // Track which tab the item came from
  // Social media specific properties
  contentType?: string;
  platform?: string;
  description?: string;
  postLink?: string;
  uploadDate?: string;
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

  if (diffInDays > 0) {
    return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
  } else if (diffInHours > 0) {
    return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
  } else if (diffInMinutes > 0) {
    return diffInMinutes === 1 ? '1 minute ago' : `${diffInMinutes} minutes ago`;
  } else {
    return 'Just now';
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const modelName = searchParams.get('modelName');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const getTotalOnly = searchParams.get('getTotalOnly') === 'true';
    
    if (!modelName) {
      return NextResponse.json({ error: 'Model name is required' }, { status: 400 });
    }

    // Validate pagination parameters
    if (page < 1) {
      return NextResponse.json({ error: 'Page must be >= 1' }, { status: 400 });
    }
    if (limit < 1 || limit > 500) {
      return NextResponse.json({ error: 'Limit must be between 1 and 500' }, { status: 400 });
    }

    // Authenticate user session
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (!session.accessToken) {
      return NextResponse.json({ error: "Not authenticated. No access token." }, { status: 401 });
    }

    // Set up OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: session.accessToken,
      refresh_token: session.refreshToken,
      expiry_date: session.expiresAt ? session.expiresAt * 1000 : undefined,
    });

    const sheets = google.sheets({ version: "v4", auth: oauth2Client });
    const SPREADSHEET_ID = '1_BRrKVZbLwnHJCNYsacu5Lx25yJ7eoPpAEsbv1OBwtA';

    console.log(`📊 All Content API: Fetching data for ${modelName}, page ${page}, limit ${limit}`);

    // Fetch counts for all sheets to get total
    const sheetNames = [
      `${modelName.toUpperCase()} - Vault New`,
      `${modelName.charAt(0).toUpperCase() + modelName.slice(1).toLowerCase()} - Sexting Sets`,
      `${modelName.charAt(0).toUpperCase() + modelName.slice(1).toLowerCase()} - SOCIAL MEDIA`
    ];

    // Get total counts from each sheet
    const [vaultCountRes, sextingCountRes, socialCountRes] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetNames[0]}!A4:A`,
        valueRenderOption: 'FORMATTED_VALUE',
      }).catch(() => ({ data: { values: [] } })),
      
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetNames[1]}!B4:B`, // Fixed: use correct range for sexting sets count
        valueRenderOption: 'FORMATTED_VALUE',
      }).catch(() => ({ data: { values: [] } })),
      
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetNames[2]}!B4:B`,
        valueRenderOption: 'FORMATTED_VALUE',
      }).catch(() => ({ data: { values: [] } }))
    ]);

    const vaultCount = (vaultCountRes.data.values || []).filter(row => row[0] && row[0].trim() !== '').length;
    const sextingCount = (sextingCountRes.data.values || []).filter(row => row[0] && row[0].trim() !== '').length;
    const socialCount = (socialCountRes.data.values || []).filter(row => row[0] && row[0].trim() !== '').length;
    
    const totalItems = vaultCount + sextingCount + socialCount;

    console.log(`📊 Sheet counts - Vault: ${vaultCount}, Sexting: ${sextingCount}, Social: ${socialCount}, Total: ${totalItems}`);

    // If only requesting total count, return early
    if (getTotalOnly) {
      return NextResponse.json({ 
        totalItems: totalItems, 
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        itemsPerPage: limit
      });
    }

    // Fetch actual data for the current page
    // For simplicity, let's fetch all data and then paginate (we can optimize this later)
    const [vaultDataRes, sextingDataRes, socialDataRes] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetNames[0]}!A4:M1000`,
        valueRenderOption: 'FORMULA',
      }).catch(() => ({ data: { values: [] } })),
      
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetNames[1]}!B4:K1000`, // Fixed: use correct range for sexting sets
        valueRenderOption: 'FORMULA',
      }).catch(() => ({ data: { values: [] } })),
      
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetNames[2]}!B4:L${Math.min(104 + limit, 1000)}`, // Limit social media for now
        valueRenderOption: 'FORMULA',
      }).catch(() => ({ data: { values: [] } }))
    ]);

    const allItems: AllContentItem[] = [];

    // Process Vault data
    const vaultRows = vaultDataRes.data.values || [];
    vaultRows.forEach((row: string[], index: number) => {
      const [, videoTitle, videoCategory, featuredEvents, , caption, , , additionalNotes, videoLink, creationDate, creatorHandles, videoLength] = row;
      
      if (!videoTitle || videoTitle.trim() === '') return;

      const fileIdMatch = videoLink?.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
      const folderIdMatch1 = videoLink?.match(/\/folders\/([a-zA-Z0-9-_]+)/);
      const folderIdMatch2 = videoLink?.match(/\/drive\/folders\/([a-zA-Z0-9-_]+)/);
      
      let driveId = null;
      let isFolder = false;
      
      if (fileIdMatch) {
        driveId = fileIdMatch[1];
        isFolder = false;
      } else if (folderIdMatch1) {
        driveId = folderIdMatch1[1];
        isFolder = true;
      } else if (folderIdMatch2) {
        driveId = folderIdMatch2[1];
        isFolder = true;
      }
      
      // For folders, don't set thumbnail - let the frontend handle folder icon
      const thumbnail = driveId && !isFolder ? `/api/image-proxy?id=${driveId}` : 
        `https://via.placeholder.com/400x225/374151/9ca3af?text=${encodeURIComponent(videoTitle.substring(0, 20))}`;

      const timeAgo = creationDate ? getTimeAgo(new Date(creationDate)) : 'Unknown';
      
      const vaultItem = {
        id: `vault_${index + 1}`,
        type: 'video' as const,
        title: videoTitle.trim(),
        duration: videoLength || 'Unknown',
        timeAgo,
        status: 'HAS_GIF' as const,
        campaignReady: false,
        thumbnail,
        category: videoCategory,
        featuredEvents,
        caption,
        videoLink,
        creationDate,
        creator: creatorHandles,
        additionalNotes,
        isVaultNew: true,
        driveId,
        isFolder,
        source: 'vault' as const
      };

      if (isFolder) {
        console.log(`📁 Created vault folder item:`, {
          title: vaultItem.title,
          isFolder: vaultItem.isFolder,
          driveId: vaultItem.driveId,
          thumbnail: vaultItem.thumbnail
        });
      }

      allItems.push(vaultItem);
    });

    // Process Sexting data
    const sextingRows = sextingDataRes.data.values || [];
    sextingRows.forEach((row: string[], index: number) => {
      const [
        sextingSetTitle, // Column B - Sexting Set Title
        sextingSetCategory, // Column C - Sexting Set Category  
        featuredEvents, // Column D - Featured Events
        status, // Column E - Status
        additionalNotes, // Column F - Additional Notes
        sextingSetLink, // Column G - Sexting Set Link
        creationDate, // Column H - Creation Date
        creator, // Column I - Creator @'s
        contentCount, // Column J - Content Count
        scriptEditor // Column K - Script Editor
      ] = row;
      
      if (!sextingSetTitle || sextingSetTitle.trim() === '') return;

      const fileIdMatch = sextingSetLink?.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
      const folderIdMatch1 = sextingSetLink?.match(/\/folders\/([a-zA-Z0-9-_]+)/);
      const folderIdMatch2 = sextingSetLink?.match(/\/drive\/folders\/([a-zA-Z0-9-_]+)/);
      
      let driveId = null;
      let isFolder = false;
      
      if (fileIdMatch) {
        driveId = fileIdMatch[1];
        isFolder = false;
      } else if (folderIdMatch1) {
        driveId = folderIdMatch1[1];
        isFolder = true;
      } else if (folderIdMatch2) {
        driveId = folderIdMatch2[1];
        isFolder = true;
      }
      
      console.log(`Processing sexting set link: ${sextingSetLink}`, {
        fileIdMatch: fileIdMatch?.[1],
        folderIdMatch1: folderIdMatch1?.[1],
        folderIdMatch2: folderIdMatch2?.[1],
        driveId,
        isFolder,
        title: sextingSetTitle
      });
      
      // For folders, don't set thumbnail - let the frontend handle folder icon
      const thumbnail = driveId && !isFolder ? `/api/image-proxy?id=${driveId}` : 
        `https://via.placeholder.com/400x225/374151/9ca3af?text=${encodeURIComponent(sextingSetTitle.substring(0, 20))}`;

      const timeAgo = creationDate ? getTimeAgo(new Date(creationDate)) : 'Unknown';
      
      const sextingItem = {
        id: `sexting_${index + 1}`,
        type: 'video' as const,
        title: sextingSetTitle.trim(),
        duration: `${contentCount || 5} items`, // Use actual content count from sheet
        timeAgo,
        status: (status === 'USED' ? 'HAS_GIF' : 'NEEDS_GIF') as 'HAS_GIF' | 'NEEDS_GIF', // Use actual status
        campaignReady: status === 'USED',
        thumbnail,
        category: sextingSetCategory,
        featuredEvents,
        caption: additionalNotes,
        videoLink: sextingSetLink,
        creationDate,
        creator,
        results: scriptEditor,
        additionalNotes,
        driveId,
        isFolder,
        source: 'sexting' as const
      };

      if (isFolder) {
        console.log(`📁 Created sexting FOLDER item:`, {
          title: sextingItem.title,
          isFolder: sextingItem.isFolder,
          driveId: sextingItem.driveId,
          thumbnail: sextingItem.thumbnail,
          type: sextingItem.type
        });
      } else {
        console.log(`📦 Created sexting file item:`, {
          title: sextingItem.title,
          isFolder: sextingItem.isFolder,
          driveId: sextingItem.driveId,
          type: sextingItem.type
        });
      }

      allItems.push(sextingItem);
    });

    // Process Social Media data
    const socialRows = socialDataRes.data.values || [];
    socialRows.forEach((row: string[], index: number) => {
      const [contentCode, contentType, platform, description, caption, postLink, uploadDate, , creator, additionalNotes] = row;
      
      if (!contentCode || contentCode.trim() === '') return;

      let driveId = null;
      let title = contentCode;
      
      if (contentCode.startsWith('=HYPERLINK(')) {
        const hyperlinkMatch = contentCode.match(/=HYPERLINK\("([^"]+)"/);
        const displayTextMatch = contentCode.match(/"([^"]+)"\s*\)$/);
        
        if (hyperlinkMatch) {
          const url = hyperlinkMatch[1];
          const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
          driveId = fileIdMatch ? fileIdMatch[1] : null;
          
          if (displayTextMatch) {
            title = displayTextMatch[1];
          }
        }
      }
      
      // Social media items are typically files (not folders), so always try to get thumbnail
      const thumbnail = driveId ? `/api/image-proxy?id=${driveId}` : 
        `https://via.placeholder.com/400x225/374151/9ca3af?text=${encodeURIComponent(title.substring(0, 20))}`;

      const timeAgo = uploadDate ? getTimeAgo(new Date(uploadDate)) : 'Unknown';
      const itemType = contentType && contentType.toLowerCase().includes('video') ? 'video' : 'photo';
      
      allItems.push({
        id: `social_${index + 1}`,
        type: itemType,
        title: title.trim(),
        duration: itemType === 'video' ? 'Unknown' : undefined,
        timeAgo,
        status: 'HAS_GIF' as const,
        campaignReady: false,
        thumbnail,
        contentType,
        platform,
        description,
        caption,
        postLink,
        uploadDate,
        creator,
        additionalNotes,
        driveId,
        isFolder: false,
        source: 'social-media' as const
      });
    });

    // Sort all items by creation date (newest first)
    allItems.sort((a, b) => {
      const dateA = new Date(a.creationDate || a.uploadDate || '1970-01-01').getTime();
      const dateB = new Date(b.creationDate || b.uploadDate || '1970-01-01').getTime();
      return dateB - dateA;
    });

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = allItems.slice(startIndex, endIndex);

    const folderItems = paginatedItems.filter(item => item.isFolder);
    console.log(`📊 All Content API: Processed ${allItems.length} items, returning ${paginatedItems.length} for page ${page}`);
    console.log(`📁 Folder items in response:`, folderItems.map(item => ({
      title: item.title,
      isFolder: item.isFolder,
      source: item.source,
      type: item.type
    })));

    return NextResponse.json({ 
      contentItems: paginatedItems,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        totalItems: totalItems,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(totalItems / limit),
        hasPreviousPage: page > 1
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching all content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch all content', details: error.message },
      { status: 500 }
    );
  }
}