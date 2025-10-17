// services/elevenlabs-client.js
// Client-side service that calls API routes instead of direct database access

// Export constants that don't require server-side logic
export { ELEVEN_LABS_MODELS, downloadAudio } from "./elevenlabs-implementation";

// Store for voice generation parameters
const voiceParametersCache = new Map();

// Function to store voice parameters with the historyItemId
export function storeVoiceParameters(historyItemId, parameters) {
  voiceParametersCache.set(historyItemId, parameters);

  // Also save to localStorage for persistence (with browser check)
  if (typeof window !== "undefined") {
    try {
      const allParams = JSON.parse(
        localStorage.getItem("voiceParametersCache") || "{}"
      );
      allParams[historyItemId] = parameters;
      localStorage.setItem("voiceParametersCache", JSON.stringify(allParams));
    } catch (error) {
      console.error("Error saving parameters to localStorage:", error);
    }
  }
}

// Function to get stored parameters for a history item
export function getVoiceParameters(historyItemId) {
  // Try from memory cache first
  if (voiceParametersCache.has(historyItemId)) {
    return voiceParametersCache.get(historyItemId);
  }

  // Try from localStorage next (with browser check)
  if (typeof window !== "undefined") {
    try {
      const allParams = JSON.parse(
        localStorage.getItem("voiceParametersCache") || "{}"
      );
      if (allParams[historyItemId]) {
        // Also update in-memory cache
        voiceParametersCache.set(historyItemId, allParams[historyItemId]);
        return allParams[historyItemId];
      }
    } catch (error) {
      console.error("Error retrieving parameters from localStorage:", error);
    }
  }

  return null;
}

// Legacy API key profiles for backward compatibility
export const API_KEY_PROFILES = {
  account_1: {
    name: "OF Bri's voice",
    description: "Main account with professional voice access",
    voices: [
      {
        name: "OF Bri",
        voiceId: "XtrZA2v40BnLkNsO4MbN",
        category: "professional",
      },
    ],
  },
  // Add other legacy profiles as fallback...
};

// Client-side function to get voice models from API
export async function getAllVoiceModels() {
  try {
    const response = await fetch("/api/voice-models/public");
    const data = await response.json();

    if (data.success) {
      return data.models;
    } else {
      console.error("Failed to fetch voice models:", data.error);
      // Fallback to legacy profiles
      return Object.entries(API_KEY_PROFILES).map(([key, profile]) => ({
        id: key,
        accountKey: key,
        accountName: profile.name,
        voiceName: profile.voices[0]?.name || "Unknown",
        voiceId: profile.voices[0]?.voiceId || "",
        category: profile.voices[0]?.category?.toUpperCase() || "PROFESSIONAL",
        description: profile.description,
        isActive: true,
        apiKey: null,
      }));
    }
  } catch (error) {
    console.error("Error fetching voice models:", error);
    // Fallback to legacy profiles on error
    return Object.entries(API_KEY_PROFILES).map(([key, profile]) => ({
      id: key,
      accountKey: key,
      accountName: profile.name,
      voiceName: profile.voices[0]?.name || "Unknown",
      voiceId: profile.voices[0]?.voiceId || "",
      category: profile.voices[0]?.category?.toUpperCase() || "PROFESSIONAL",
      description: profile.description,
      isActive: true,
      apiKey: null,
    }));
  }
}

// Client-side function to get voices for a profile
export async function getVoicesForProfile(profileKey) {
  try {
    const voiceModels = await getAllVoiceModels();
    const model = voiceModels.find(
      (m) => (m.accountKey || m.id) === profileKey
    );

    if (model && model.voiceId && model.voiceName) {
      return [
        {
          name: model.voiceName,
          voiceId: model.voiceId,
          category: model.category || "professional",
        },
      ];
    }

    // Fallback to legacy if not found in dynamic models
    const legacyProfile = API_KEY_PROFILES[profileKey];
    if (legacyProfile) {
      return legacyProfile.voices || [];
    }

    return [];
  } catch (error) {
    console.error("Error getting voices for profile:", error);
    return [];
  }
}

// Client-side function to generate voice via API
export async function generateVoice(
  apiKeyProfileKey,
  voiceId,
  text,
  modelId,
  settings
) {
  if (!apiKeyProfileKey) {
    throw new Error("API key profile is required");
  }

  try {
    const response = await fetch("/api/elevenlabs/generate-voice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apiKeyProfileKey,
        voiceId,
        text,
        modelId: modelId || "eleven_multilingual_v2",
        settings: settings || {},
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    // Check if the response is audio data
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("audio")) {
      // Get the history_item_id from response headers
      const historyItemId = response.headers.get("x-history-item-id");
      console.log("Received history_item_id from API:", historyItemId);

      // Handle audio blob response
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      return {
        audioBlob,
        audioUrl,
        profile: apiKeyProfileKey,
        voiceId: voiceId,
        historyItemId: historyItemId || null, // Include the history_item_id
      };
    } else {
      // Handle JSON response
      const data = await response.json();
      return data.result || data;
    }
  } catch (error) {
    console.error("Voice generation error:", error);
    throw error;
  }
}

// Client-side function to check API key balance via API
export async function checkApiKeyBalance(apiKeyProfileKey) {
  if (!apiKeyProfileKey) {
    throw new Error("API key profile is required");
  }

  try {
    const response = await fetch("/api/elevenlabs/check-balance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apiKeyProfileKey: apiKeyProfileKey,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      // Return the error data as expected by the component
      return {
        error: errorData.error || `HTTP error! status: ${response.status}`,
        character: { limit: 0, remaining: 0, used: 0 },
        status: "error",
      };
    }

    const data = await response.json();

    // Return the balance data directly
    return data;
  } catch (error) {
    console.error("Balance check error:", error);
    return {
      error: error.message || "Network error",
      character: { limit: 0, remaining: 0, used: 0 },
      status: "error",
    };
  }
}

// Client-side function to fetch history via API
export async function fetchHistoryFromElevenLabs(
  apiKeyProfile,
  voiceId,
  pageSize = 20,
  pageIndex = 1,
  forceRefresh = false
) {
  if (!apiKeyProfile) {
    throw new Error("API key profile is required");
  }

  try {
    const response = await fetch("/api/elevenlabs/fetch-history", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apiKeyProfileKey: apiKeyProfile,
        voiceId,
        pageSize,
        pageIndex,
        forceRefresh,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();

    // The API already returns the expected format with items and pagination
    return data;
  } catch (error) {
    console.error("History fetch error:", error);
    throw error;
  }
}

// Client-side function to get history audio via API
export async function getHistoryAudio(apiKeyProfile, historyItemId) {
  if (!apiKeyProfile || !historyItemId) {
    throw new Error("API key profile and history item ID are required");
  }

  try {
    const response = await fetch("/api/elevenlabs/history-audio", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apiKeyProfileKey: apiKeyProfile,
        historyItemId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    // Handle audio blob response
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("audio")) {
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      return {
        audioBlob,
        audioUrl,
        historyItemId,
      };
    } else {
      // Handle JSON response
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.error("History audio error:", error);
    throw error;
  }
}
