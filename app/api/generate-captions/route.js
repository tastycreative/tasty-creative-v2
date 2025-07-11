// app/api/generate-captions/route.js
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to clean text and strip HTML
function stripHtmlAndClean(text) {
  if (!text) return text;

  let cleaned = text.replace(/<\/p>\s*<p[^>]*>/gi, "\n\n");
  cleaned = cleaned.replace(/<p[^>]*>/gi, "");
  cleaned = cleaned.replace(/<\/p>/gi, "\n\n");
  cleaned = cleaned.replace(/<[^>]*>/g, "");

  cleaned = cleaned
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  cleaned = cleaned.replace(/[ \t]+/g, " ");
  cleaned = cleaned.replace(/\n[ \t]+/g, "\n");
  cleaned = cleaned.replace(/[ \t]+\n/g, "\n");
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  return cleaned.trim();
}

export async function POST(request) {
  try {
    const { topMessages = [], topLeaderboard = [] } = await request.json();

    if (!topMessages || topMessages.length === 0) {
      return Response.json(
        { success: false, message: "topMessages is required" },
        { status: 400 }
      );
    }

    const contextPromptParts = [];

    if (topMessages.length > 0) {
      contextPromptParts.push("Based on these top-performing mass messages:\n");
      topMessages.forEach((msg, index) => {
        const cleanText = stripHtmlAndClean(msg.textCropped);
        contextPromptParts.push(
          `${index + 1}. "${cleanText}" - ${msg.viewedCount} views, ${msg.viewRate.toFixed(1)}% view rate` +
            (!msg.isFree && msg.revenue
              ? `, $${msg.revenue.toFixed(2)} revenue`
              : "")
        );
      });
    }

    if (topLeaderboard.length > 0) {
      contextPromptParts.push("\nTop-performing campaign leaders:\n");
      topLeaderboard.forEach((leader, index) => {
        contextPromptParts.push(
          `${index + 1}. ${leader.name} (@${leader.username}) - ${leader.totalViews.toLocaleString()} views, ${leader.viewRate.toFixed(
            1
          )}% view rate, $${leader.totalRevenue.toLocaleString()} revenue`
        );
      });
    }

    const contextPrompt = contextPromptParts.join("\n");

    const baseCaptions = topMessages
      .slice(0, 5)
      .map((msg) => stripHtmlAndClean(msg.textCropped));

    const generatedCaptions = [];

    for (const baseCaption of baseCaptions) {
      const prompt = `${contextPrompt}

Rephrase this caption into 1 engaging variation:

"${baseCaption}"

Requirements:
- Write like a real person texting, NOT like an AI
- Use simple, everyday words that people actually use in conversations
- AVOID fancy words like: indulge, feast, paradise, engorged, convulses, ecstatic, mesmerizing, tantalizing, divine, exquisite, luscious, sumptuous, etc.
- Write casually and conversationally, like you're messaging a friend
- Keep it sexy but natural - use words people actually say
- Use modern slang and casual language where appropriate
- Make it sound spontaneous and authentic
- Keep the same structure and core message
- Use emojis naturally (not excessively)
- Format with paragraph breaks (double line breaks)

FORMATTING REQUIREMENTS:
- Add **bold** formatting to attractive/sexy/important words
- Use *italics* for emphasis on feelings or emotions
- Add visual appeal with formatting to make key words POP
- Make it visually attractive while keeping natural language
- Focus formatting on: action words, sexy descriptors, calls to action, exclusive terms

Examples of good formatting:
✅ "You're gonna **love** this 🔥"
✅ "I'm *so* turned on right now... **check this out**"
✅ "This is **exactly** what you've been asking for"
✅ "**Holy shit**, wait till you see this"
✅ "*Can't wait* for you to see what I did **just for you**"

Examples of natural vs AI-ish language:
❌ AI-ish: "Indulge in this feast for your eyes"
✅ Natural: "You're gonna **love** this"

❌ AI-ish: "My body convulses with ecstatic pleasure"  
✅ Natural: "I'm *losing my mind* right now"

❌ AI-ish: "A tantalizing paradise awaits"
✅ Natural: "This is **exactly** what you've been waiting for"

Output ONLY the new caption with formatting, no extras`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are a real OnlyFans model writing authentic messages to fans. Write like a genuine person, not an AI. Use simple, natural language that real people use when texting. Avoid flowery, sophisticated, or overly descriptive words. Sound casual, spontaneous, and human. Never use words like 'indulge', 'feast', 'paradise', 'divine', 'exquisite', 'tantalizing', etc. Write like you're actually talking to someone. Use **bold** and *italic* formatting to make attractive words pop and create visual appeal.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 800,
        temperature: 0.7, // Slightly lower temperature for more consistent natural language
      });

      const newCaption = stripHtmlAndClean(
        completion.choices[0].message.content
      );

      if (newCaption && newCaption.length > 0) {
        generatedCaptions.push(newCaption);
      }
    }

    return Response.json({
      success: true,
      captions: generatedCaptions,
      totalGenerated: generatedCaptions.length,
      naturalLanguage: true,
      formattedText: true, // Added flag to indicate formatting improvements
    });
  } catch (error) {
    console.error("Error generating captions:", error);
    return Response.json(
      {
        success: false,
        message: "Failed to generate captions",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
