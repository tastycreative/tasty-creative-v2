// Utility script to help migrate legacy accounts
// Run this in your browser console on the /admin/vn-sales/add-model page

console.log("🔍 Checking current database voice models...");

fetch("/api/voice-models")
  .then((response) => response.json())
  .then((data) => {
    if (data.success) {
      console.log("📊 Current database voice models:");
      console.table(
        data.models.map((model) => ({
          ID: model.id,
          AccountKey: model.accountKey,
          AccountName: model.accountName,
          VoiceName: model.voiceName,
          VoiceID: model.voiceId.substring(0, 10) + "...",
          Category: model.category,
          Active: model.isActive,
        }))
      );

      console.log("🎯 Next steps:");
      if (data.models.find((m) => m.accountKey === "account_1")) {
        console.log("⚠️  account_1 already exists in database!");
        console.log("💡 You can either:");
        console.log(
          "   1. Edit the existing account_1 in the Voice Gen Accounts page"
        );
        console.log("   2. Delete it first, then re-add with correct API key");
      } else {
        console.log("✅ account_1 is available for migration");
        console.log("💡 To migrate account_1:");
        console.log("   1. Check 'Migration Mode' checkbox");
        console.log("   2. Select 'account_1 - OF Bri's voice' from dropdown");
        console.log("   3. Enter your ElevenLabs API key");
        console.log("   4. Click 'Add Voice Model'");
      }
    } else {
      console.error("❌ Error fetching models:", data.error);
    }
  })
  .catch((error) => {
    console.error("❌ Network error:", error);
  });
