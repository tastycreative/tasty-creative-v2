// app/apps/models/page.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import ModelDetailsModal from "@/components/models/ModelDetailsModal";
import ModelsList from "@/components/models/ModelList";
import ModelsHeader from "@/components/models/ModelsHeader";


export default function ModelsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ModelStatus | "all">("all");
  const [selectedModel, setSelectedModel] = useState<ModelDetails | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Mock data - replace with API call
  const [models] = useState<ModelDetails[]>([
    {
      id: "1",
      name: "Model Name 1",
      status: "active",
      launchDate: "2024-01-15",
      referrerName: "John Doe",
      personalityType: "Flirty & Playful",
      commonTerms: ["babe", "honey", "sweetie"],
      commonEmojis: ["😘", "💕", "🔥", "😈"],
      instagram: "@model1",
      twitter: "@model1",
      tiktok: "@model1",
      chattingManagers: ["Manager 1", "Manager 2"],
      profileImage: "/api/placeholder/150/150",
      stats: {
        totalRevenue: 45000,
        monthlyRevenue: 12000,
        subscribers: 1250,
        avgResponseTime: "2.5 mins",
      },
    },
    {
      id: "2",
      name: "Model Name 2",
      status: "dropped",
      launchDate: "2023-11-20",
      referrerName: "Jane Smith",
      personalityType: "Sweet & Innocent",
      commonTerms: ["darling", "love", "cutie"],
      commonEmojis: ["🥰", "💖", "✨", "🌸"],
      instagram: "@model2",
      twitter: "@model2",
      tiktok: "@model2",
      chattingManagers: ["Manager 3"],
      profileImage: "/api/placeholder/150/150",
      stats: {
        totalRevenue: 28000,
        monthlyRevenue: 0,
        subscribers: 0,
        avgResponseTime: "N/A",
      },
    },
  ]);

  const filteredModels = models.filter((model) => {
    const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || model.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleModelClick = (model: Model) => {
    setSelectedModel(model);
    setShowDetailsModal(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-7xl mx-auto p-4 lg:p-6"
    >
      <ModelsHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        totalModels={models.length}
        activeModels={models.filter(m => m.status === "active").length}
      />

      <ModelsList
        models={filteredModels}
        onModelClick={handleModelClick}
      />

      {showDetailsModal && selectedModel && (
        <ModelDetailsModal
          model={selectedModel}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedModel(null);
          }}
        />
      )}
    </motion.div>
  );
}