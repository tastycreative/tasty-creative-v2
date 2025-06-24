import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Static model data
    const modelData = [
      {
        creator: "Bri",
        totalSets: 64,
        totalScripts: 19,
        personalityType: "Sweet, energetic, submissive, innocent",
        commonTerms: "baby babe love",
        commonEmojis: "🥰☺️😌😋🫶🏻🙈🙊🩷🩵🤍💕💞💘💖",
        restrictedTerms: "i never just come out of the gate with \"hey daddy\""
      },
      {
        creator: "Dan Dangler",
        totalSets: 42,
        totalScripts: 15,
        personalityType: "Confident, flirty, dominant",
        commonTerms: "sexy hot gorgeous",
        commonEmojis: "😈💋🔥💦😍🥵💯",
        restrictedTerms: "no explicit violence references"
      },
      {
        creator: "Autumn",
        totalSets: 38,
        totalScripts: 12,
        personalityType: "Playful, teasing, mysterious",
        commonTerms: "darling sweetie cutie",
        commonEmojis: "🍂🧡💛😘😉🤗",
        restrictedTerms: "avoid overly aggressive language"
      },
      {
        creator: "Coco",
        totalSets: 35,
        totalScripts: 10,
        personalityType: "Sophisticated, elegant, alluring",
        commonTerms: "honey treasure beautiful",
        commonEmojis: "💎✨🖤🤍💋🥂",
        restrictedTerms: "no crude language"
      },
      {
        creator: "Alanna",
        totalSets: 28,
        totalScripts: 8,
        personalityType: "Gentle, caring, romantic",
        commonTerms: "love angel sweetheart",
        commonEmojis: "💕💖💗💝🌸🌹",
        restrictedTerms: "keep it romantic, not explicit"
      }
    ];

    // Static best scripts data
    const bestScripts = {
      bestSeller: [
        {
          title: "Sext 39 (DAY) White Set",
          totalBuy: "$9,381.30"
        },
        {
          title: "Sext 28 (NIGHT) Black Lingerie",
          totalBuy: "$7,652.80"
        },
        {
          title: "Sext 45 (MORNING) Pink Set",
          totalBuy: "$6,234.50"
        }
      ],
      topSent: [
        {
          title: "Sext 34 (Both) White Top/Green Lingerie",
          totalSend: 9672
        },
        {
          title: "Sext 22 (DAY) Red Dress",
          totalSend: 8945
        },
        {
          title: "Sext 51 (NIGHT) Blue Set",
          totalSend: 7823
        }
      ]
    };

    // Static leaderboard data
    const leaderboard = {
      totalSend: [
        { creator: "Alanna", amount: 0, rank: 0 },
        { creator: "Alanna", amount: 0, rank: 1 },
        { creator: "Alanna", amount: 0, rank: 2 },
        { creator: "Alanna", amount: 0, rank: 3 },
        { creator: "Alanna", amount: 0, rank: 4 }
      ],
      totalBuy: [
        { creator: "Sharna", amount: "$10,817", rank: 0 },
        { creator: "Alanna", amount: "$0", rank: 1 },
        { creator: "Alanna", amount: "$0", rank: 2 },
        { creator: "Alanna", amount: "$0", rank: 3 },
        { creator: "Alanna", amount: "$0", rank: 4 }
      ],
      zeroSet: [
        "Fandy", "Kei", "Koaty and Summer", "Lolo", "Rocky"
      ],
      zeroScript: [
        "Alanna", "Ali Patience", "Aspen", "Fandy", "Grace", "Hailey", 
        "Jade Bri", "Julianna", "Kei", "Kelly", "Kiki", "Koaty and Summer", 
        "Laila", "Lolo", "Madison", "Marcie", "Mathilde", "Mia Swan", 
        "Natalie R", "Razz", "Rocky", "Ry", "Sinatra", "Stasia", "Swiggy", 
        "Tara West", "Tayy", "Victoria Lit", "Zoey"
      ],
      highestSet: [
        { creator: "Kenzie", amount: 167, rank: 0 },
        { creator: "Nicole Aniston", amount: 104, rank: 1 },
        { creator: "Autumn", amount: 95, rank: 2 },
        { creator: "Lala", amount: 90, rank: 3 },
        { creator: "Victoria Lit", amount: 74, rank: 4 }
      ],
      lowestSet: [
        { creator: "Mathilde", amount: 2, rank: 4 },
        { creator: "Mathilde", amount: 2, rank: 3 },
        { creator: "Hailey", amount: 3, rank: 2 },
        { creator: "Hailey", amount: 3, rank: 1 },
        { creator: "Hailey", amount: 3, rank: 0 }
      ],
      highestScript: [
        { creator: "Bri", amount: 19, rank: 0 },
        { creator: "Dan Dangler", amount: 15, rank: 1 },
        { creator: "Autumn", amount: 12, rank: 2 },
        { creator: "Coco", amount: 10, rank: 3 },
        { creator: "Coco", amount: 10, rank: 4 }
      ],
      lowestScript: [
        { creator: "Charlotte P", amount: 1, rank: 4 },
        { creator: "Charlotte P", amount: 1, rank: 3 },
        { creator: "Charlotte P", amount: 1, rank: 2 },
        { creator: "Charlotte P", amount: 1, rank: 1 },
        { creator: "Charlotte P", amount: 1, rank: 0 }
      ]
    };

    const response = {
      modelData,
      bestScripts,
      leaderboard
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error("Error returning SWD static data:", error);
    return NextResponse.json(
      { error: "Failed to fetch SWD data", details: error.message },
      { status: 500 }
    );
  }
}