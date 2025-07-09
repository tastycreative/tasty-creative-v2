// app/api/generate-captions/route.js
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { topMessages, topLeaderboard } = await request.json();

    if (!topMessages && !topLeaderboard) {
      return Response.json(
        {
          success: false,
          message: "Either topMessages or topLeaderboard data is required",
        },
        { status: 400 }
      );
    }

    // Prepare context for GPT
    let contextPrompt = "";

    if (topMessages && topMessages.length > 0) {
      contextPrompt += "Based on these top-performing mass messages:\n\n";
      topMessages.forEach((msg, index) => {
        contextPrompt += `${index + 1}. "${msg.textCropped}" - ${msg.viewedCount} views, ${msg.viewRate.toFixed(1)}% view rate`;
        if (!msg.isFree && msg.revenue) {
          contextPrompt += `, ${msg.revenue.toFixed(2)} revenue`;
        }
        contextPrompt += `\n`;
      });
    }

    if (topLeaderboard && topLeaderboard.length > 0) {
      contextPrompt += "\nAnd these top-performing campaign leaders:\n\n";
      topLeaderboard.forEach((leader, index) => {
        contextPrompt += `${index + 1}. ${leader.name} (@${leader.username}) - ${leader.totalViews.toLocaleString()} total views, ${leader.viewRate.toFixed(1)}% view rate, ${leader.totalRevenue.toLocaleString()} revenue\n`;
      });
    }

    const prompt = `${contextPrompt}

Generate 5 suggestive, engaging captions for OnlyFans mass messaging campaigns. The captions should:
- Be flirty and suggestive but not explicitly sexual
- Create curiosity and encourage responses
- Be around 1-3 sentences each
- Include emojis where appropriate
- Be designed to get high view rates and engagement
- Feel personal and intimate
- Use proven psychological triggers from the top-performing examples above

Focus on elements that made the top messages successful while creating fresh, original content.

Return only the 5 captions, one per line, without numbering or additional text.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are an expert copywriter specializing in OnlyFans marketing and engagement. You create suggestive, compelling captions that drive high engagement rates while maintaining platform compliance.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 1000,
      temperature: 0.8,
    });

    const generatedText = completion.choices[0].message.content;
    const captions = generatedText
      .split("\n")
      .filter((caption) => caption.trim() !== "");

    return Response.json({
      success: true,
      captions: captions.slice(0, 5), // Ensure we only return 5 captions
      usage: completion.usage,
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
