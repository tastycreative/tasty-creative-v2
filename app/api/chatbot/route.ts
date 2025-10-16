import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { google } from 'googleapis';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt that defines the bot's role and capabilities
const SYSTEM_PROMPT = `You are a helpful assistant for Tasty Creative, a content management platform. You have access to ONLY specific information about client models, their content details, and onboarding progress.

IMPORTANT: You can ONLY help with information that exists in these specific database tables:

1. ClientModel: Basic client information (name, status, launch date, social media links, notes, referrer info)
2. ContentDetails: Content limitations, pricing, content type availability, custom pricing, livestream info
3. ClientModelDetails: Personal details, onboarding progress, background, interests, personality, restrictions

You can help users with:
- Finding information about specific client models
- Understanding content details and limitations for models  
- Checking onboarding progress and model details
- Client social media information
- Content pricing and availability (including pricing guides, custom video pricing, custom call pricing, bundle pricing)
- Client personal details and background
- Birthday information from Google Calendar (upcoming birthdays, specific birthday dates)

You CANNOT help with:
- Technical platform issues
- Account management outside of client data
- Financial information beyond content pricing
- System administration
- Marketing strategies
- Business operations outside of client/content data
- Tasks, workflows, or project management
- Any information not stored in the three main tables above

When users ask about "pricing guide" or "pricing", they are referring to the ContentDetails table which contains pricing information like customVideoPricing, customCallPricing, and bundle pricing.

When users ask about "birthdays", "birthday", "upcoming birthdays", or specific birthday dates, fetch this information from the Google Calendar.

IMPORTANT FOR FOLLOW-UP QUESTIONS: 
- Pay attention to conversation context and pronouns like "her", "his", "their", "them"
- If a user just asked about a specific client and then uses pronouns, they're referring to that same client
- Questions like "all of her pricing guide" or "what about her content details" should use the previously mentioned client name
- Always check the conversation history for client names mentioned in recent messages

If someone asks about information not covered in your available data, politely respond with: "I don't have information about that in my current database. I can only help with client model information, content details, and onboarding data. Is there something specific about a client or their content details you'd like to know?"

Always be helpful and professional, but stay within the scope of your available data.`;

// Helper function to search for relevant client data
async function searchClientData(query: string) {
  try {
    // Simple keyword extraction for searching
    const keywords = query.toLowerCase().split(' ').filter(word => word.length > 2);
    
    // Search across different models
    const [clientModels, contentDetails, clientModelDetails] = await Promise.all([
      // Search ClientModel
      prisma.clientModel.findMany({
        where: {
          OR: [
            { clientName: { contains: keywords.join(' '), mode: 'insensitive' } },
            { name: { contains: keywords.join(' '), mode: 'insensitive' } },
            { status: { contains: keywords.join(' '), mode: 'insensitive' } },
          ]
        },
        select: {
          id: true,
          clientName: true,
          name: true,
          status: true,
          launchDate: true,
          mainInstagram: true,
          mainTwitter: true,
          mainTiktok: true,
          notes: true,
          generalNotes: true,
          createdAt: true,
        },
        take: 5
      }),
      
      // Search ContentDetails
      prisma.contentDetails.findMany({
        where: {
          clientModelName: {
            in: keywords.length > 0 ? undefined : []
          }
        },
        select: {
          id: true,
          clientModelName: true,
          twitterNudity: true,
          openToLivestreams: true,
          onlyFansWallLimitations: true,
          customVideoPricing: true,
          customCallPricing: true,
          bundleContent5_10: true,
          bundleContent10_15: true,
          bundleContent15_20: true,
          bundleContent20_25: true,
          bundleContent25_30: true,
          bundleContent30Plus: true,
          contentOptionsForGames: true,
        },
        take: 5
      }),
      
      // Search ClientModelDetails
      prisma.clientModelDetails.findMany({
        where: {
          OR: [
            { client_name: { contains: keywords.join(' '), mode: 'insensitive' } },
            { model_name: { contains: keywords.join(' '), mode: 'insensitive' } },
            { full_name: { contains: keywords.join(' '), mode: 'insensitive' } },
          ]
        },
        select: {
          id: true,
          client_name: true,
          model_name: true,
          full_name: true,
          age: true,
          ethnicity: true,
          current_city: true,
          background: true,
          interests: true,
          personality: true,
          onboardingCompleted: true,
          status: true,
        },
        take: 5
      })
    ]);

    return {
      clientModels,
      contentDetails,
      clientModelDetails
    };
  } catch (error) {
    console.error('Error searching client data:', error);
    return {
      clientModels: [],
      contentDetails: [],
      clientModelDetails: []
    };
  }
}

// Helper function to get birthdays from Google Calendar
async function getBirthdaysFromCalendar(searchName?: string) {
  console.log('🎂 getBirthdaysFromCalendar called');
  
  try {
    // For public calendars, we can use API key authentication
    const apiKey = process.env.GOOGLE_API_KEY;
    console.log('🔑 API Key available:', !!apiKey);
    
    if (!apiKey) {
      console.log('❌ No Google API key found');
      return { error: 'Google API key not configured for public calendar access' };
    }

    const calendar = google.calendar({ 
      version: 'v3', 
      auth: apiKey
    });
    
    const encodedCalendarId = process.env.GOOGLE_BIRTHDAY_CALENDAR_ID;
    console.log('📅 Encoded Calendar ID available:', !!encodedCalendarId);

    if (!encodedCalendarId) {
      console.log('❌ No birthday calendar ID configured');
      return { error: 'Birthday calendar not configured' };
    }

    // Decode the base64 encoded calendar ID
    let calendarId: string;
    try {
      calendarId = Buffer.from(encodedCalendarId, 'base64').toString('utf-8');
      console.log('📅 Decoded Calendar ID:', calendarId);
    } catch (decodeError) {
      console.error('❌ Error decoding calendar ID:', decodeError);
      return { error: 'Invalid calendar ID format' };
    }

    // Get current date and date range 
    const now = new Date();
    let endDate = new Date();
    
    if (searchName) {
      // If searching for specific person, look in a wider range (1 year)
      endDate.setFullYear(now.getFullYear() + 1);
      console.log('🔍 Searching for specific person:', searchName);
    } else {
      // For general queries, show next 90 days (3 months) for more results
      endDate.setDate(now.getDate() + 90);
    }

    try {
      console.log('📅 Fetching calendar events...');
      console.log('🗓️ Date range:', now.toISOString(), 'to', endDate.toISOString());
      
      const requestParams: any = {
        calendarId: calendarId,
        timeMin: now.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: searchName ? 500 : 100 // More results when searching for specific person
      };
      
      // Add search query if looking for specific person
      if (searchName) {
        requestParams.q = searchName;
        console.log('🔍 Adding search query:', searchName);
      }
      
      const response = await calendar.events.list(requestParams);

      console.log('✅ Calendar API response received');
      const events = response.data.items || [];
      console.log('🎉 Found events:', events.length);
      
      let birthdays = events.map(event => ({
        name: event.summary || 'Unknown',
        date: event.start?.date || event.start?.dateTime,
        description: event.description || ''
      }));

      // If searching for specific name, filter results more precisely
      if (searchName) {
        const searchLower = searchName.toLowerCase();
        birthdays = birthdays.filter(birthday => 
          birthday.name.toLowerCase().includes(searchLower)
        );
        console.log(`🔍 Filtered results for "${searchName}":`, birthdays.length);
      }

      console.log('🎂 Processed birthdays:', birthdays);
      return { birthdays };
    } catch (calendarError: any) {
      console.error('Google Calendar API Error:', calendarError);
      
      if (calendarError.code === 404) {
        return { error: 'Birthday calendar not found or not accessible' };
      } else if (calendarError.code === 403) {
        return { error: 'No permission to access the birthday calendar' };
      } else {
        return { error: `Calendar access failed: ${calendarError.message || 'Unknown error'}` };
      }
    }
  } catch (error) {
    console.error('Error fetching birthdays:', error);
    return { error: 'Failed to fetch birthday information' };
  }
}

// Helper function to get specific client information
async function getClientInfo(clientName: string) {
  try {
    const [clientModel, contentDetails, clientModelDetails] = await Promise.all([
      prisma.clientModel.findFirst({
        where: {
          OR: [
            { clientName: { equals: clientName, mode: 'insensitive' } },
            { name: { equals: clientName, mode: 'insensitive' } }
          ]
        },
        include: {
          sheetLinks: {
            select: {
              sheetName: true,
              sheetType: true,
              createdAt: true
            }
          }
        }
      }),
      
      prisma.contentDetails.findFirst({
        where: {
          clientModelName: { equals: clientName, mode: 'insensitive' }
        }
      }),
      
      prisma.clientModelDetails.findFirst({
        where: {
          OR: [
            { client_name: { equals: clientName, mode: 'insensitive' } },
            { model_name: { equals: clientName, mode: 'insensitive' } }
          ]
        }
      })
    ]);

    return {
      clientModel,
      contentDetails,
      clientModelDetails
    };
  } catch (error) {
    console.error('Error getting client info:', error);
    return {
      clientModel: null,
      contentDetails: null,
      clientModelDetails: null
    };
  }
}

// Helper function to get or create conversation session
async function getOrCreateConversation(userId: string, sessionId?: string) {
  try {
    if (sessionId) {
      // Try to find existing conversation
      const existing = await prisma.chatbotConversation.findFirst({
        where: {
          userId,
          sessionId
        }
      });
      
      if (existing) {
        return existing;
      }
    }
    
    // Create new conversation
    const newSessionId = sessionId || randomUUID();
    const conversation = await prisma.chatbotConversation.create({
      data: {
        userId,
        sessionId: newSessionId,
        messages: []
      }
    });
    
    return conversation;
  } catch (error) {
    console.error('Error managing conversation:', error);
    
    // Fallback: return a mock conversation object when database is unavailable
    const newSessionId = sessionId || randomUUID();
    return {
      id: 'fallback-' + newSessionId,
      userId,
      sessionId: newSessionId,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}

// Helper function to save conversation
async function saveConversation(conversationId: string, messages: any[]) {
  try {
    // Skip saving if this is a fallback conversation (database unavailable)
    if (conversationId.startsWith('fallback-')) {
      console.log('Skipping database save for fallback conversation');
      return;
    }
    
    await prisma.chatbotConversation.update({
      where: { id: conversationId },
      data: {
        messages: messages,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error saving conversation:', error);
    // Don't throw error, just log it so chatbot continues to work
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { message, sessionId } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Get or create conversation session
    const conversation = await getOrCreateConversation(session.user.id!, sessionId);
    // Note: conversation will never be null now due to fallback

    // Get existing messages from database
    const existingMessages = Array.isArray(conversation.messages) ? conversation.messages : [];

    // Check if the query is clearly out of scope (but exclude birthday queries)
    const outOfScopeKeywords = [
      'task', 'workflow', 'project', 'admin', 'system', 'server', 'database admin',
      'marketing', 'business strategy', 'revenue', 'profit', 'account management',
      'billing', 'payment', 'subscription', 'technical support', 'bug', 'error',
      'deployment', 'hosting', 'domain', 'ssl', 'security', 'backup'
    ];
    
    const isOutOfScope = outOfScopeKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
    
    // Don't reject birthday queries even if they might seem out of scope
    const isBirthdayQuery = /\b(birthday|birthdays|upcoming birthday|when.*birthday|when's.*birthday)\b/i.test(message);
    
    if (isOutOfScope && !isBirthdayQuery) {
      return NextResponse.json({
        response: "I don't have information about that in my current database. I can only help with client model information, content details, and onboarding data. Is there something specific about a client or their content details you'd like to know?"
      });
    }

    // Analyze the message to determine if we need to search for specific data
    const needsClientSearch = /\b(client|model|creator)\b/i.test(message) || 
                             /\b(who is|tell me about|find|search)\b/i.test(message) ||
                             /\b(pricing|price|cost|bundle|custom|video|call)\b/i.test(message) ||
                             /\b(her|his|their|them|she|he|this|that)\b/i.test(message);

    const needsBirthdayInfo = /\b(birthday|birthdays|upcoming birthday|when.*birthday|when's.*birthday)\b/i.test(message);
    
    console.log('🔍 Message analysis:');
    console.log('📝 Message:', message);
    console.log('🎂 Needs birthday info:', needsBirthdayInfo);
    
    let contextData = '';
    
    // Handle birthday queries
    if (needsBirthdayInfo) {
      console.log('🎂 Processing birthday query...');
      
      // Try to extract a specific name from the query
      let searchName = null;
      
      // Check for specific name patterns
      const namePatterns = [
        /when.*is ([a-zA-Z\s]+)'?s?\s*birthday/i,  // "when is Sarah's birthday"
        /when.*'s ([a-zA-Z\s]+)'?s?\s*birthday/i,  // "when's Sarah's birthday"  
        /([a-zA-Z\s]+)'?s?\s*birthday/i,           // "Sarah's birthday"
        /birthday.*of ([a-zA-Z\s]+)/i               // "birthday of Sarah"
      ];
      
      for (const pattern of namePatterns) {
        const match = message.match(pattern);
        if (match && match[1]) {
          searchName = match[1].trim();
          break;
        }
      }
      
      // Also check conversation history for context (like "her" referring to previously mentioned person)
      if (!searchName && /\b(her|his|their|them|she|he)\b/i.test(message)) {
        // Look for names in recent conversation
        const recentMessages = existingMessages.slice(-6);
        for (const msg of recentMessages.reverse()) {
          if (msg.role === 'user' || msg.role === 'assistant') {
            // Look for names that might have been mentioned
            const nameMatch = msg.content.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g);
            if (nameMatch) {
              // Filter to likely person names (2-20 characters, not common words)
              const possibleNames = nameMatch.filter(name => 
                name.length >= 2 && name.length <= 20 && 
                !['Autumn', 'Content', 'Details', 'Model', 'Client', 'Google', 'Calendar'].includes(name)
              );
              if (possibleNames.length > 0) {
                searchName = possibleNames[0];
                console.log('🔍 Found name from context:', searchName);
                break;
              }
            }
          }
        }
      }
      
      console.log('🔍 Search name extracted:', searchName);
      
      const birthdayData = await getBirthdaysFromCalendar(searchName);
      if (birthdayData.birthdays) {
        contextData += `\n\nBirthday information from calendar:\n${JSON.stringify(birthdayData.birthdays, null, 2)}`;
        console.log('✅ Added birthday data to context');
      } else if (birthdayData.error) {
        contextData += `\n\nBirthday calendar information: ${birthdayData.error}. Let the user know about this specific issue.`;
        console.log('❌ Added birthday error to context:', birthdayData.error);
      }
    }
    
    if (needsClientSearch) {
      // Extract potential client name from the message
      const clientNameMatch = message.match(/(?:about|find|search|who is|pricing guide of|pricing for|price of|cost of)\s+([a-zA-Z\s]+)/i);
      
      let potentialClientName = null;
      
      if (clientNameMatch) {
        potentialClientName = clientNameMatch[1].trim();
      } else if (/\b(her|his|their|them|she|he|this|that|all of)\b/i.test(message)) {
        // This is likely a follow-up question - search recent messages for client names
        const recentMessages = existingMessages.slice(-6); // Look at last 6 messages
        for (const msg of recentMessages.reverse()) {
          if (msg.role === 'user') {
            // Look for client names in recent user messages
            const nameMatch = msg.content.match(/(?:about|find|search|who is|pricing guide of|pricing for|price of|cost of)\s+([a-zA-Z\s]+)/i);
            if (nameMatch) {
              potentialClientName = nameMatch[1].trim();
              break;
            }
          } else if (msg.role === 'assistant') {
            // Look for client names mentioned in bot responses
            const responseNameMatch = msg.content.match(/(?:for|about)\s+([A-Z][a-zA-Z]+)(?:\s|:|\.)/);
            if (responseNameMatch) {
              potentialClientName = responseNameMatch[1].trim();
              break;
            }
          }
        }
      }
      
      if (potentialClientName) {
        const clientInfo = await getClientInfo(potentialClientName);
        
        if (clientInfo.clientModel || clientInfo.contentDetails || clientInfo.clientModelDetails) {
          contextData = `\n\nRelevant client information found:\n${JSON.stringify(clientInfo, null, 2)}`;
        }
      } else {
        // General search
        const searchResults = await searchClientData(message);
        if (searchResults.clientModels.length > 0 || searchResults.contentDetails.length > 0 || searchResults.clientModelDetails.length > 0) {
          contextData = `\n\nRelevant search results:\n${JSON.stringify(searchResults, null, 2)}`;
        }
      }
    }

    // Add user message to conversation
    const userMessage = {
      role: 'user' as const,
      content: message,
      timestamp: new Date().toISOString()
    };
    
    const updatedMessages = [...existingMessages, userMessage];

    // Prepare the conversation for OpenAI (keep last 20 messages for context)
    const contextMessages = updatedMessages.slice(-20).map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT + contextData },
      ...contextMessages
    ];

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using the faster, cheaper model for general assistance
      messages,
      max_tokens: 500,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    const response = completion.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response.';

    // Add bot response to conversation
    const botMessage = {
      role: 'assistant' as const,
      content: response,
      timestamp: new Date().toISOString()
    };
    
    const finalMessages = [...updatedMessages, botMessage];
    
    // Save conversation to database
    await saveConversation(conversation.id, finalMessages);

    return NextResponse.json({
      response,
      sessionId: conversation.sessionId,
      usage: completion.usage
    });

  } catch (error: any) {
    console.error('Chatbot API error:', error);
    
    // Handle OpenAI specific errors
    if (error?.error?.type === 'insufficient_quota') {
      return NextResponse.json({
        response: 'I\'m temporarily unavailable due to API limits. Please try again later.'
      }, { status: 200 });
    }
    
    if (error?.error?.type === 'invalid_api_key') {
      return NextResponse.json({
        response: 'There\'s a configuration issue. Please contact support.'
      }, { status: 200 });
    }

    return NextResponse.json({
      response: 'I\'m having trouble processing your request right now. Please try again.'
    }, { status: 200 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    // Delete the conversation from database
    try {
      await prisma.chatbotConversation.deleteMany({
        where: {
          userId: session.user.id!,
          sessionId: sessionId
        }
      });
      
      return NextResponse.json({
        success: true,
        message: "Conversation deleted successfully"
      });
    } catch (dbError) {
      console.error('Database error during deletion:', dbError);
      
      // Even if database deletion fails, return success since chatbot should work
      return NextResponse.json({
        success: true,
        message: "Conversation cleared (database unavailable)"
      });
    }

  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json({
      error: "Failed to delete conversation"
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const sessionId = url.searchParams.get('sessionId');

    if (action === 'new') {
      // Create new conversation session
      const newSessionId = randomUUID();
      const defaultMessage = {
        role: 'assistant',
        content: 'Hello! I\'m your Tasty Creative assistant. I can help you with information about client models, content details, and more. What would you like to know?',
        timestamp: new Date().toISOString()
      };
      
      try {
        const conversation = await prisma.chatbotConversation.create({
          data: {
            userId: session.user.id!,
            sessionId: newSessionId,
            messages: [defaultMessage]
          }
        });

        return NextResponse.json({
          sessionId: conversation.sessionId,
          messages: conversation.messages
        });
      } catch (dbError) {
        console.error('Database error creating conversation:', dbError);
        
        // Fallback: return conversation without database persistence
        return NextResponse.json({
          sessionId: newSessionId,
          messages: [defaultMessage]
        });
      }
    }

    if (action === 'load' && sessionId) {
      // Load existing conversation
      try {
        const conversation = await prisma.chatbotConversation.findFirst({
          where: {
            userId: session.user.id!,
            sessionId: sessionId
          }
        });

        if (conversation) {
          return NextResponse.json({
            sessionId: conversation.sessionId,
            messages: conversation.messages || []
          });
        }
      } catch (dbError) {
        console.error('Database error loading conversation:', dbError);
        // Fall through to default response when database is unavailable
      }
    }

    // Default API info
    return NextResponse.json({
      message: 'Tasty Creative Chatbot API',
      description: 'Endpoints for chatbot conversation management',
      endpoints: {
        'POST /api/chatbot': 'Send a message to the chatbot',
        'GET /api/chatbot?action=new': 'Start a new conversation',
        'GET /api/chatbot?action=load&sessionId=xxx': 'Load existing conversation', 
        'DELETE /api/chatbot': 'Delete a conversation (provide sessionId in body)'
      }
    });

  } catch (error) {
    console.error('Chatbot GET error:', error);
    return NextResponse.json({
      error: "Failed to process request"
    }, { status: 500 });
  }
}