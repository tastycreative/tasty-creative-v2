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
- Keep the same structure and tone
- Make it click-baity, attractive, and engaging
- Use emojis where applicable
- Preserve the number of paragraphs and core intent
- Format output with paragraph breaks (double line breaks)
- Output ONLY the new caption, no extras`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are an expert copywriter for OnlyFans models. You specialize in creating engaging and effective mass message captions that drive clicks and revenue. Always preserve structure, tone, and use natural paragraph breaks.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 800,
        temperature: 0.8,
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
      paragraphStructured: true,
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
