"use client";

import { Forum } from "../../../../components/forum";

// Static model list
const models = [
  { name: "General" },
  { name: "Amber", id: "amber" },
  { name: "Autumn", id: "autumn" },
  { name: "Bri", id: "bri" },
  { name: "Alaya", id: "alaya" },
  { name: "Ava", id: "ava" },
  { name: "Dan Dangler", id: "dan-dangler" },
  { name: "Lala", id: "lala" },
  { name: "Nicole Aniston", id: "nicole-aniston" },
  { name: "Essie", id: "essie" },
  { name: "Kait", id: "kait" },
  { name: "Salah", id: "salah" },
  { name: "Victoria (V)", id: "victoria-v" },
  { name: "Bronwin", id: "bronwin" },
  { name: "Jaileen", id: "jaileen" },
  { name: "Mel", id: "mel" },
  { name: "MJ", id: "mj" },
];

export default function ForumPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50">
      <Forum
        forum={{ type: "general" }}
        models={models}
        title="Community Forum"
        subtitle="Connect, discuss, and share with the community"
        showModelSelector={true}
        showSidebar={true}
        allowModelSwitching={true}
      />
    </div>
  );
}