// services/elevenlabs-implementation.js
import { PrismaClient } from "@prisma/client";
import CryptoJS from "crypto-js";

const prisma = new PrismaClient();

// Make sure to set this in your environment variables
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET;

// Cache for voice models to reduce database queries
let voiceModelsCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Legacy hardcoded profiles (keep for backward compatibility)
export const LEGACY_API_KEY_PROFILES = {
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
  account_2: {
    name: "OF Coco's voice",
    description: "Backup account for high-volume usage",
    voices: [
      {
        name: "OF Coco",
        voiceId: "oT9QD0CuqG8lLK2X4bY3",
        category: "professional",
      },
    ],
  },
  account_3: {
    name: "OF Mel's voice",
    description: "Backup account for high-volume usage",
    voices: [
      {
        name: "OF Mel",
        voiceId: "oPCTXWLNPjuUYQCRVrwA",
        category: "professional",
      },
    ],
  },
  account_4: {
    name: "OF Lala's voice",
    description: "Backup account for high-volume usage",
    voices: [
      {
        name: "OF Lala",
        voiceId: "pFxPgV5pV6WbTBIfVh0M",
        category: "professional",
      },
    ],
  },
  account_5: {
    name: "OF Bronwin's voice",
    description: "Backup account for high-volume usage",
    voices: [
      {
        name: "OF Bronwin",
        voiceId: "bbY4EbJ4diWPBBc5gWZS",
        category: "professional",
      },
    ],
  },
  account_6: {
    name: "OF Nicole's voice",
    description: "Backup account for high-volume usage",
    voices: [
      {
        name: "OF Nicole",
        voiceId: "h29VgKFSX37NZ0jnbcKH",
        category: "professional",
      },
    ],
  },
  account_7: {
    name: "OF Sarah's voice",
    description: "Backup account for high-volume usage",
    voices: [
      {
        name: "OF Sarah",
        voiceId: "ULzbjES9G4G63lk8H4rI",
        category: "professional",
      },
    ],
  },
  account_8: {
    name: "OF Carter Cameron's voice",
    description: "Backup account for high-volume usage",
    voices: [
      {
        name: "OF Carter Cameron",
        voiceId: "VN4OZ3qr3GaFjxvpE11z",
        category: "professional",
      },
    ],
  },
  account_9: {
    name: "OF Sinatra's voice",
    description: "Backup account for high-volume usage",
    voices: [
      {
        name: "OF Sinatra",
        voiceId: "9uOCBpX1fiXU98ucq1oF",
        category: "professional",
      },
    ],
  },
  account_10: {
    name: "OF Michelle G's voice",
    description: "Backup account for high-volume usage",
    voices: [
      {
        name: "OF Michelle G",
        voiceId: "UlQs9FTJdozvn09jdKkY",
        category: "professional",
      },
    ],
  },
  account_11: {
    name: "OF Oakly's voice",
    description: "Backup account for high-volume usage",
    voices: [
      {
        name: "OF Oakly",
        voiceId: "kus39ZcFKueIyzRe8jdP",
        category: "professional",
      },
    ],
  },
  account_12: {
    name: "OF Marcie's voice",
    description: "Backup account for high-volume usage",
    voices: [
      {
        name: "OF Marcie",
        voiceId: "rfMPyyTI0XGJIxsLx836",
        category: "professional",
      },
    ],
  },
  account_13: {
    name: "OF Elle's voice",
    description: "Backup account for high-volume usage",
    voices: [
      {
        name: "OF Elle",
        voiceId: "vBq6XyfxbraeTChltM5K",
        category: "professional",
      },
    ],
  },
  account_14: {
    name: "OF Razz's voice",
    description: "Backup account for high-volume usage",
    voices: [
      {
        name: "OF Razz",
        voiceId: "WyO7e4tsNy8xIiAcVwxH",
        category: "professional",
      },
    ],
  },
  account_15: {
    name: "OF Autumn's voice",
    description: "Backup account for high-volume usage",
    voices: [
      {
        name: "OF Autumn",
        voiceId: "LMYsvr1dCuHX2PE2IB2f",
        category: "professional",
      },
    ],
  },
  account_16: {
    name: "OF Natalie's voice",
    description: "Backup account for high-volume usage",
    voices: [
      {
        name: "OF Natalie",
        voiceId: "eo0IGgzwrR8XLLd5uIbB",
        category: "professional",
      },
    ],
  },
  account_17: {
    name: "OF Dakota's voice",
    description: "Backup account for high-volume usage",
    voices: [
      {
        name: "OF Dakota",
        voiceId: "0yk5Yq3vY0KESRDgMXlR",
        category: "professional",
      },
    ],
  },
  account_18: {
    name: "OF Victoria's voice",
    description: "Backup account for high-volume usage",
    voices: [
      {
        name: "OF Victoria",
        voiceId: "27MfWVzmwIbXIOTAiRVD",
        category: "professional",
      },
    ],
  },
  account_19: {
    name: "OF Essie's voice",
    description: "Backup account for high-volume usage",
    voices: [
      {
        name: "OF Essie",
        voiceId: "MFawT4r4MPZUXGga6duu",
        category: "professional",
      },
    ],
  },
  account_20: {
    name: "OF Sirena's voice",
    description: "Backup account for high-volume usage",
    voices: [
      {
        name: "OF Sirena",
        voiceId: "DTYus8xTdQlf76619B3t",
        category: "professional",
      },
    ],
  },
  account_21: {
    name: "OF Sirena's spanish voice",
    description: "Backup account for high-volume usage",
    voices: [
      {
        name: "OF Sirena Spanish",
        voiceId: "08IHfoaHT82cnaJ31P56",
        category: "professional",
      },
    ],
  },
  account_22: {
    name: "OF Hailey's voice",
    description: "Backup account for high-volume usage",
    voices: [
      {
        name: "OF Hailey",
        voiceId: "5ECfcuOhBwoCon4XujQt",
        category: "professional",
      },
    ],
  },
  account_23: {
    name: "OF Emmie's voice",
    description: "Backup account for high-volume usage",
    voices: [
      {
        name: "OF Emmie",
        voiceId: "xfuhtCthipC9Jmfhe7fG",
        category: "professional",
      },
    ],
  },
  account_24: {
    name: "OF Sharna's voice",
    description: "Backup account for high-volume usage",
    voices: [
      {
        name: "OF Sharna",
        voiceId: "FxNQ5ZfzZG0tTtJVVNS3",
        category: "professional",
      },
    ],
  },
  account_25: {
    name: "OF Forrest's voice",
    description: "Backup account for high-volume usage",
    voices: [
      {
        name: "OF Forrest",
        voiceId: "6guoeJMVrrQwag5L6lJd",
        category: "professional",
      },
    ],
  },
};

// Available ElevenLabs models
export const ELEVEN_LABS_MODELS = [
  {
    name: "Multilingual v2",
    id: "eleven_multilingual_v2",
    description: "High-quality multilingual model with natural voice",
  },
  {
    name: "Eleven v3 (Latest)",
    id: "eleven_v3",
    description: "Human-like and expressive speech generation - 70+ languages",
  },
];

// Encryption functions
function encryptApiKey(apiKey) {
  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY not set in environment variables");
  }
  return CryptoJS.AES.encrypt(apiKey, ENCRYPTION_KEY).toString();
}

function decryptApiKey(encryptedApiKey) {
  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY not set in environment variables");
  }
  const bytes = CryptoJS.AES.decrypt(encryptedApiKey, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// Get all voice models from database
export async function getAllVoiceModels(forceRefresh = false) {
  const now = Date.now();

  if (
    !forceRefresh &&
    voiceModelsCache &&
    now - cacheTimestamp < CACHE_DURATION
  ) {
    return voiceModelsCache;
  }

  try {
    const models = await prisma.voiceModel.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });

    voiceModelsCache = models;
    cacheTimestamp = now;

    return models;
  } catch (error) {
    console.error("Error fetching voice models from database:", error);
    // Fallback to legacy profiles if database fails
    return Object.entries(LEGACY_API_KEY_PROFILES).map(([key, profile]) => ({
      id: key,
      accountKey: key,
      accountName: profile.name,
      voiceName: profile.voices[0]?.name || "Unknown",
      voiceId: profile.voices[0]?.voiceId || "",
      category: profile.voices[0]?.category?.toUpperCase() || "PROFESSIONAL",
      description: profile.description,
      isActive: true,
      apiKey: null, // Legacy profiles don't have stored API keys
    }));
  }
}

// Get API key for a profile (now supports both database and legacy)
export async function getApiKey(profileKey) {
  try {
    // First try to get from database
    const models = await getAllVoiceModels();
    const model = models.find((m) => m.accountKey === profileKey);

    if (model && model.apiKey) {
      return decryptApiKey(model.apiKey);
    }

    // Fallback to environment variables for legacy accounts
    const legacyEnvMap = {
      account_1: process.env.ELEVENLABS_KEY_ACCOUNT_1,
      account_2: process.env.ELEVENLABS_KEY_ACCOUNT_2,
      account_3: process.env.ELEVENLABS_KEY_ACCOUNT_3,
      account_4: process.env.ELEVENLABS_KEY_ACCOUNT_4,
      account_5: process.env.ELEVENLABS_KEY_ACCOUNT_5,
      account_6: process.env.ELEVENLABS_KEY_ACCOUNT_6,
      account_7: process.env.ELEVENLABS_KEY_ACCOUNT_7,
      account_8: process.env.ELEVENLABS_KEY_ACCOUNT_8,
      account_9: process.env.ELEVENLABS_KEY_ACCOUNT_9,
      account_10: process.env.ELEVENLABS_KEY_ACCOUNT_10,
      account_11: process.env.ELEVENLABS_KEY_ACCOUNT_11,
      account_12: process.env.ELEVENLABS_KEY_ACCOUNT_12,
      account_13: process.env.ELEVENLABS_KEY_ACCOUNT_13,
      account_14: process.env.ELEVENLABS_KEY_ACCOUNT_14,
      account_15: process.env.ELEVENLABS_KEY_ACCOUNT_15,
      account_16: process.env.ELEVENLABS_KEY_ACCOUNT_16,
      account_17: process.env.ELEVENLABS_KEY_ACCOUNT_17,
      account_18: process.env.ELEVENLABS_KEY_ACCOUNT_18,
      account_19: process.env.ELEVENLABS_KEY_ACCOUNT_19,
      account_20: process.env.ELEVENLABS_KEY_ACCOUNT_20,
      account_21: process.env.ELEVENLABS_KEY_ACCOUNT_21,
      account_22: process.env.ELEVENLABS_KEY_ACCOUNT_22,
      account_23: process.env.ELEVENLABS_KEY_ACCOUNT_23,
      account_24: process.env.ELEVENLABS_KEY_ACCOUNT_24,
      account_25: process.env.ELEVENLABS_KEY_ACCOUNT_25,
    };

    return legacyEnvMap[profileKey] || null;
  } catch (error) {
    console.error("Error getting API key:", error);
    return null;
  }
}

// Get voices for a specific profile
export async function getVoicesForProfile(profileKey) {
  try {
    const models = await getAllVoiceModels();
    const model = models.find((m) => m.accountKey === profileKey);

    if (model) {
      return [
        {
          name: model.voiceName,
          voiceId: model.voiceId,
          category: model.category.toLowerCase(),
        },
      ];
    }

    // Fallback to legacy profiles
    return LEGACY_API_KEY_PROFILES[profileKey]?.voices || [];
  } catch (error) {
    console.error("Error getting voices for profile:", error);
    return LEGACY_API_KEY_PROFILES[profileKey]?.voices || [];
  }
}

// Get all available API key profiles (combines database and legacy)
export async function getAllApiKeyProfiles() {
  try {
    const models = await getAllVoiceModels();
    const profiles = {};

    // Add database models
    models.forEach((model) => {
      profiles[model.accountKey] = {
        name: model.accountName,
        description: model.description,
        voices: [
          {
            name: model.voiceName,
            voiceId: model.voiceId,
            category: model.category.toLowerCase(),
          },
        ],
      };
    });

    // Add legacy profiles that aren't in database
    Object.entries(LEGACY_API_KEY_PROFILES).forEach(([key, profile]) => {
      if (!profiles[key]) {
        profiles[key] = profile;
      }
    });

    return profiles;
  } catch (error) {
    console.error("Error getting all profiles:", error);
    return LEGACY_API_KEY_PROFILES;
  }
}

// Database management functions
export async function addVoiceModel(modelData) {
  try {
    // Check if we're trying to migrate a legacy account or create a new one
    let accountKey;

    if (modelData.accountKey && modelData.accountKey.startsWith("account_")) {
      // User wants to use a specific account key (like migrating legacy accounts)
      accountKey = modelData.accountKey;

      // Check if this account key already exists in database
      const existingModel = await prisma.voiceModel.findFirst({
        where: {
          accountKey: accountKey,
          isActive: true,
        },
      });

      if (existingModel) {
        return {
          success: false,
          error: `Account key ${accountKey} already exists in database. Use update instead.`,
        };
      }
    } else {
      // Generate next available account key
      const existingModels = await prisma.voiceModel.findMany({
        where: { isActive: true },
      });

      const accountNumbers = existingModels
        .map((m) => parseInt(m.accountKey.replace("account_", "")))
        .filter((n) => !isNaN(n));

      // Only check legacy numbers if we're not migrating them
      const legacyNumbers = Object.keys(LEGACY_API_KEY_PROFILES)
        .map((k) => parseInt(k.replace("account_", "")))
        .filter((n) => !isNaN(n));

      const allNumbers = [...accountNumbers, ...legacyNumbers];
      const nextNumber =
        allNumbers.length > 0 ? Math.max(...allNumbers) + 1 : 1;
      accountKey = `account_${nextNumber}`;
    }

    // Encrypt API key
    const encryptedApiKey = encryptApiKey(modelData.apiKey);

    // Create in database
    const newModel = await prisma.voiceModel.create({
      data: {
        accountKey,
        accountName: modelData.accountName,
        voiceName: modelData.voiceName,
        voiceId: modelData.voiceId,
        apiKey: encryptedApiKey,
        description:
          modelData.description || "Backup account for high-volume usage",
        category: modelData.category?.toUpperCase() || "PROFESSIONAL",
      },
    });

    // Clear cache
    voiceModelsCache = null;

    return { success: true, model: newModel };
  } catch (error) {
    console.error("Error adding voice model:", error);
    return { success: false, error: error.message };
  }
}

export async function updateVoiceModel(id, updateData) {
  try {
    const data = { ...updateData };

    // Convert category to uppercase for enum
    if (data.category) {
      data.category = data.category.toUpperCase();
    }

    // Encrypt API key if provided
    if (data.apiKey) {
      data.apiKey = encryptApiKey(data.apiKey);
    }

    const updatedModel = await prisma.voiceModel.update({
      where: { id },
      data,
    });

    // Clear cache
    voiceModelsCache = null;

    return { success: true, model: updatedModel };
  } catch (error) {
    console.error("Error updating voice model:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteVoiceModel(id) {
  try {
    // Hard delete - actually remove the record from the database
    await prisma.voiceModel.delete({
      where: { id },
    });

    // Clear cache
    voiceModelsCache = null;

    return { success: true };
  } catch (error) {
    console.error("Error deleting voice model:", error);
    return { success: false, error: error.message };
  }
}

// Function to migrate a legacy account to database
export async function migrateLegacyAccount(legacyAccountKey, apiKey) {
  try {
    const legacyProfile = LEGACY_API_KEY_PROFILES[legacyAccountKey];
    if (!legacyProfile) {
      return {
        success: false,
        error: `Legacy account ${legacyAccountKey} not found`,
      };
    }

    // Check if already migrated
    const existingModel = await prisma.voiceModel.findFirst({
      where: {
        accountKey: legacyAccountKey,
        isActive: true,
      },
    });

    if (existingModel) {
      return {
        success: false,
        error: `Account ${legacyAccountKey} already migrated to database`,
      };
    }

    const voice = legacyProfile.voices[0];
    const modelData = {
      accountKey: legacyAccountKey,
      accountName: legacyProfile.name,
      voiceName: voice.name,
      voiceId: voice.voiceId,
      apiKey: apiKey,
      description: legacyProfile.description,
      category: voice.category,
    };

    return await addVoiceModel(modelData);
  } catch (error) {
    console.error("Error migrating legacy account:", error);
    return { success: false, error: error.message };
  }
}

// Cache for history audio URLs
const audioUrlCache = new Map();

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

// Load parameters from localStorage on initialization
export function initVoiceParametersCache() {
  if (typeof window !== "undefined") {
    try {
      const allParams = JSON.parse(
        localStorage.getItem("voiceParametersCache") || "{}"
      );
      Object.entries(allParams).forEach(([historyItemId, parameters]) => {
        voiceParametersCache.set(historyItemId, parameters);
      });
    } catch (error) {
      console.error("Error loading parameters from localStorage:", error);
    }
  }
}

// Last fetched history items cache to prevent ElevenLabs rate limiting
let lastFetchedHistoryCache = {
  apiKey: null,
  timestamp: 0,
  data: null,
};

// Function to get history from ElevenLabs API via API route
export async function fetchHistoryFromElevenLabs(
  apiKeyProfile,
  voiceId,
  pageSize = 20,
  pageIndex = 1,
  forceRefresh = false
) {
  if (!apiKeyProfile) {
    throw new Error("Invalid API key profile");
  }

  // Check if we can use cached history (within 5 seconds and same API key)
  const now = Date.now();
  const canUseCachedHistory =
    !forceRefresh &&
    lastFetchedHistoryCache.apiKey === apiKeyProfile &&
    now - lastFetchedHistoryCache.timestamp < 5000 &&
    lastFetchedHistoryCache.data;

  if (canUseCachedHistory) {
    // Use the cached data
    return lastFetchedHistoryCache.data;
  } else {
    try {
      // Use the API route instead of direct ElevenLabs API call
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
        const error = await response.json();
        throw new Error(
          error.error || `Failed to fetch history: ${response.status}`
        );
      }

      const data = await response.json();

      // Update cache
      lastFetchedHistoryCache = {
        apiKey: apiKeyProfile,
        timestamp: now,
        data: data,
      };

      return data;
    } catch (error) {
      console.error("Error fetching history from ElevenLabs:", error);
      throw error;
    }
  }
}

// Function to manually add a new history item
export async function forceRefreshHistory() {
  // Invalidate the cache to force a refresh on next fetch
  lastFetchedHistoryCache.timestamp = 0;
}

// Function to get audio for a specific history item
export async function getHistoryAudio(apiKeyProfile, historyItemId) {
  // Check cache first
  if (audioUrlCache.has(historyItemId)) {
    return audioUrlCache.get(historyItemId);
  }

  if (!apiKeyProfile) {
    throw new Error("Invalid API key profile");
  }

  try {
    // Use the API route instead of direct ElevenLabs API call
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
      const error = await response.text();
      throw new Error(
        error || `Failed to fetch history audio: ${response.status}`
      );
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    // Cache the URL
    audioUrlCache.set(historyItemId, {
      audioUrl,
      audioBlob,
    });

    return {
      audioUrl,
      audioBlob,
    };
  } catch (error) {
    console.error("Error fetching history audio from ElevenLabs:", error);
    throw error;
  }
}

// Function to generate voice using API route
export async function generateVoice(
  apiKeyProfileKey,
  voiceId,
  text,
  modelId,
  settings
) {
  if (!apiKeyProfileKey) {
    throw new Error("Invalid API key profile");
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
        modelId,
        settings,
      }),
    });

    if (!response.ok) {
      // Try to parse error response as JSON
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate voice");
      } catch {
        // If not JSON, use status text
        throw new Error(`Failed to generate voice: ${response.statusText}`);
      }
    }

    // Get the audio blob directly
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    // Find the voice details
    const voice = await getVoicesForProfile(apiKeyProfileKey);
    const voiceData = voice.find((v) => v.voiceId === voiceId);

    // Force refresh the history cache to ensure new item is picked up
    lastFetchedHistoryCache.timestamp = 0;

    // After a successful generation, wait a moment to get the history item ID
    setTimeout(async () => {
      try {
        const history = await fetchHistoryFromElevenLabs(
          apiKeyProfileKey,
          voiceId,
          1,
          1,
          true
        );
        if (history?.items?.length > 0) {
          const latestItem = history.items[0];
          // Store the parameters with the history item ID
          storeVoiceParameters(latestItem.history_item_id, {
            stability: settings.stability,
            clarity: settings.clarity,
            modelId: modelId,
            speed: settings.speed,
            styleExaggeration: settings.styleExaggeration,
            speakerBoost: settings.speakerBoost,
          });
        }
      } catch (error) {
        console.error("Failed to store parameters:", error);
      }
    }, 1000); // Wait 1 second to ensure the history item is available

    const profiles = await getAllApiKeyProfiles();
    const profile = profiles[apiKeyProfileKey];

    return {
      audioUrl,
      audioBlob,
      profile: profile?.name || "Unknown Profile",
      voiceName: voiceData?.name || "Unknown Voice",
    };
  } catch (error) {
    console.error("Error generating voice:", error);
    throw error;
  }
}

// Function to check API key credit balance
export async function checkApiKeyBalance(apiKeyProfileKey) {
  if (!apiKeyProfileKey) {
    throw new Error("Invalid API key profile");
  }

  try {
    const response = await fetch("/api/elevenlabs/check-balance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apiKeyProfileKey,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch subscription info");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error checking balance:", error);
    // Return mock data instead of throwing error
    return {
      character: {
        limit: 0,
        remaining: 0,
        used: 0,
      },
      status: "error",
    };
  }
}

// Function to download the audio file
export function downloadAudio(audioBlob, filename) {
  const url = URL.createObjectURL(audioBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "generated-voice.mp3";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// Helper function to clear audio URL cache
export function clearAudioUrlCache() {
  audioUrlCache.clear();
}

// Legacy exports for backward compatibility
export const API_KEY_PROFILES = LEGACY_API_KEY_PROFILES;

// Function to get the appropriate API key profile (legacy compatibility)
export function getApiKeyProfile(profileKey) {
  return API_KEY_PROFILES[profileKey] ? profileKey : "";
}
