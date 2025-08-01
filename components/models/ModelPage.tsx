"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ModelsList from "@/components/models/ModelList";
import ModelsHeader from "@/components/models/ModelsHeader";
import PermissionGoogle from "../PermissionGoogle";
import { transformRawModel } from "@/lib/utils";

export default function ModelsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ModelStatus | "all">("all");
  const router = useRouter();
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
    router.push(`/apps/models/${encodeURIComponent(model.name.toLowerCase())}/info`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50 w-full max-w-7xl mx-auto p-4 lg:p-6 animate-in fade-in duration-500">
      <ModelsHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        totalModels={models.length}
        activeModels={
          models.filter((m) => m.status.toLowerCase() === "active").length
        }
        isLoading={isLoadingModels}
      />
      <PermissionGoogle apiEndpoint="/api/models">
        <ModelsList
          key={`${searchQuery}-${statusFilter}-${filteredModels.length}`}
          models={filteredModels}
          onModelClick={handleModelClick}
          isLoading={isLoadingModels}
        />
      </PermissionGoogle>
    </div>
  );
}