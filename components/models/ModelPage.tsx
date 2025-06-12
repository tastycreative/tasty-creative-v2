// app/apps/models/page.tsx
"use client";

import { useEffect, useState } from "react";

import ModelDetailsModal from "@/components/models/ModelDetailsModal";
import ModelsList from "@/components/models/ModelList";
import ModelsHeader from "@/components/models/ModelsHeader";
import PermissionGoogle from "../PermissionGoogle";
import { transformRawModel } from "@/lib/utils";

export default function ModelsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ModelStatus | "all">("all");
  const [selectedModel, setSelectedModel] = useState<ModelDetails | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoadingModels, setLoadingModels] = useState(false);

  const [models, setModels] = useState<ModelDetails[]>([]);

  useEffect(() => {
    const fetchModels = async () => {
      setLoadingModels(true);
      try {
        const res = await fetch("/api/models?all=true");
        const { models: rawModels } = await res.json();
        const transformed = rawModels.map(transformRawModel);
        setModels(transformed);
      } catch (error) {
        console.error("Error fetching models:", error);
      } finally {
        setLoadingModels(false);
      }
    };

    fetchModels();
  }, []);

  const filteredModels = models.filter((model) => {
    if (!model.name || typeof model.name !== "string") {
      return false;
    }

    const matchesSearch =
      searchQuery.trim() === "" ||
      model.name
        .toLowerCase()
        .trim()
        .includes(searchQuery.toLowerCase().trim());

    if (!model.status || typeof model.status !== "string") {
      return statusFilter === "all";
    }

    const matchesStatus =
      statusFilter === "all" ||
      model.status.toLowerCase().trim() === statusFilter.toLowerCase().trim();

    return matchesSearch && matchesStatus;
  });

  const handleModelClick = (model: ModelDetails) => {
    setSelectedModel(model);
    setShowDetailsModal(true);
  };

  return (
    <div
      //initial={{ opacity: 0 }}/
      //animate={{ opacity: 1 }}
      className="w-full max-w-7xl mx-auto p-4 lg:p-6"
    >
      <ModelsHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        totalModels={models.length}
        activeModels={
          models.filter((m) => m.status.toLowerCase() === "active").length
        }
      />

      {!showDetailsModal && !selectedModel && (
        <PermissionGoogle apiEndpoint="/api/models">
          <ModelsList
            key={`${searchQuery}-${statusFilter}-${filteredModels.length}`}
            models={filteredModels}
            onModelClick={handleModelClick}
          />
        </PermissionGoogle>
      )}

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
    </div>
  );
}
