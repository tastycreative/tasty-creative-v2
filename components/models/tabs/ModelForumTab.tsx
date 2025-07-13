"use client";

import { Forum } from "../../forum";

interface ModelForumTabProps {
  modelName: string;
}

// Static model list - this should ideally come from a shared config
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

export default function ModelForumTab({ modelName }: ModelForumTabProps) {
  return (
    <Forum
      forum={{ type: "model", name: modelName }}
      models={models}
      title={`${modelName} Forum`}
      subtitle={`Discussions specific to ${modelName}. Share tips, experiences, and connect with other ${modelName} users.`}
      showModelSelector={false} // Hide model selector for dedicated model forums
      showSidebar={true}
      allowModelSwitching={true} // Allow switching to general forum or other models
    />
  );
}

