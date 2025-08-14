// app/api/generate-analyst-captions/route.js
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { captionData = [], categoryType = "general" } = await request.json();

    if (!captionData || captionData.length === 0) {
      return Response.json(
        { success: false, message: "captionData is required" },
        { status: 400 }
      );
    }

    // Generate 5 captions based on the provided data
    const generatedCaptions = [];
    
    for (let i = 0; i < Math.min(5, captionData.length); i++) {
      const baseCaption = captionData[i].caption;
      
      const prompt = `Rephrase this caption into 1 engaging variation:

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
            content: "You are a real OnlyFans model writing authentic messages to fans. Write like a genuine person, not an AI. Use simple, natural language that real people use when texting. Avoid flowery, sophisticated, or overly descriptive words. Sound casual, spontaneous, and human. Never use words like 'indulge', 'feast', 'paradise', 'divine', 'exquisite', 'tantalizing', etc. Write like you're actually talking to someone. Use **bold** and *italic* formatting to make attractive words pop and create visual appeal.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 800,
        temperature: 0.7, // Slightly lower temperature for more consistent natural language
      });

      const generatedText = completion.choices[0]?.message?.content?.trim();
      
      if (generatedText) {
        generatedCaptions.push(generatedText);
      }
    }

    // If we have fewer than 5 captions, generate additional ones based on random selections
    while (generatedCaptions.length < 5 && captionData.length > 0) {
      const randomCaption = captionData[Math.floor(Math.random() * captionData.length)];
      
      const prompt = `Rephrase this caption into 1 engaging variation:

"${randomCaption.caption}"

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

Output ONLY the new caption with formatting, no extras`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a real OnlyFans model writing authentic messages to fans. Write like a genuine person, not an AI. Use simple, natural language that real people use when texting. Avoid flowery, sophisticated, or overly descriptive words. Sound casual, spontaneous, and human. Never use words like 'indulge', 'feast', 'paradise', 'divine', 'exquisite', 'tantalizing', etc. Write like you're actually talking to someone. Use **bold** and *italic* formatting to make attractive words pop and create visual appeal.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 800,
        temperature: 0.7,
      });

      const generatedText = completion.choices[0]?.message?.content?.trim();
      
      if (generatedText) {
        generatedCaptions.push(generatedText);
      }
    }

    return Response.json({
      success: true,
      captions: generatedCaptions,
      categoryType: categoryType,
      totalGenerated: generatedCaptions.length
    });

  } catch (error) {
    console.error("Error generating analyst captions:", error);
    return Response.json(
      { 
        success: false, 
        message: error.message || "Failed to generate captions" 
      },
      { status: 500 }
    );
  }
}
