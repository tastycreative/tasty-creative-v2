// scripts/migrate-all-accounts.js
import { PrismaClient } from "@prisma/client";
import CryptoJS from "crypto-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// Make sure to set this in your environment variables
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET;

// Legacy hardcoded profiles (from elevenlabs-implementation.js)
const LEGACY_API_KEY_PROFILES = {
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

// Encryption function
function encryptApiKey(apiKey) {
  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY not set in environment variables");
  }
  return CryptoJS.AES.encrypt(apiKey, ENCRYPTION_KEY).toString();
}

// Migration function
async function migrateAllAccounts() {
  console.log("🚀 Starting migration of all ElevenLabs accounts...");

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (let i = 1; i <= 25; i++) {
    const accountKey = `account_${i}`;
    const envKey = `ELEVENLABS_KEY_ACCOUNT_${i}`;
    const apiKey = process.env[envKey];

    console.log(`\n📋 Processing ${accountKey}...`);

    if (!apiKey) {
      console.log(`❌ No API key found in environment for ${accountKey}`);
      errorCount++;
      continue;
    }

    const profile = LEGACY_API_KEY_PROFILES[accountKey];
    if (!profile) {
      console.log(`❌ No profile configuration found for ${accountKey}`);
      errorCount++;
      continue;
    }

    try {
      // Check if already exists in database
      const existingModel = await prisma.voiceModel.findFirst({
        where: {
          accountKey: accountKey,
          isActive: true,
        },
      });

      if (existingModel) {
        console.log(
          `⏭️  ${accountKey} already exists in database, skipping...`
        );
        skippedCount++;
        continue;
      }

      // Encrypt API key
      const encryptedApiKey = encryptApiKey(apiKey);
      const voice = profile.voices[0];

      // Create in database
      const newModel = await prisma.voiceModel.create({
        data: {
          accountKey,
          accountName: profile.name,
          voiceName: voice.name,
          voiceId: voice.voiceId,
          apiKey: encryptedApiKey,
          description: profile.description,
          category: voice.category.toUpperCase(),
        },
      });

      console.log(
        `✅ Successfully migrated ${accountKey} (ID: ${newModel.id})`
      );
      successCount++;
    } catch (error) {
      console.log(`❌ Failed to migrate ${accountKey}: ${error.message}`);
      errorCount++;
    }
  }

  console.log("\n📊 Migration Summary:");
  console.log(`✅ Successfully migrated: ${successCount} accounts`);
  console.log(`⏭️  Skipped (already exists): ${skippedCount} accounts`);
  console.log(`❌ Errors: ${errorCount} accounts`);
  console.log(
    `🎯 Total processed: ${successCount + skippedCount + errorCount}/25 accounts`
  );

  if (successCount > 0) {
    console.log(
      "\n🎉 Migration completed! You can now manage these accounts in the Voice Gen Accounts admin panel."
    );
  }
}

// Run migration
migrateAllAccounts()
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
