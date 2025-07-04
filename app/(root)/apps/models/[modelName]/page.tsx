"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ModelDetailsTabs from "@/components/models/ModelDetailsTab";
import ModelInfoTab from "@/components/models/ModelInfoTab";
import ModelAssetsTab from "@/components/models/ModelAssetTabs";
import ModelChattersTab from "@/components/models/tabs/ModelChattersTab";
import ModelAppsTab from "@/components/models/tabs/ModelAppsTab";
import { transformRawModel } from "@/lib/utils";
import Loader from "../loading";

function ModelImage({ model }: { model: ModelDetails }) {
  const [imageError, setImageError] = useState(false);

  if (imageError || !model.id) {
    return (
      <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
        <span className="text-white text-3xl font-bold">
          {model.name.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 p-0.5 flex items-center justify-center">
      <img
        src={`/api/image-proxy?id=${model.id}`}
        alt={model.name}
        className="w-full h-full object-cover rounded-full"
        onError={() => setImageError(true)}
      />
    </div>
  );
}

export default function ModelDetailsPage() {
  const params = useParams();
  const router = useRouter();
  let modelName = params ? decodeURIComponent(params.modelName as string) : "";
  modelName = modelName.charAt(0).toUpperCase() + modelName.slice(1);

  const [activeTab, setActiveTab] = useState<
    "info" | "assets" | "chatters" | "apps"
  >("info");

  const [model, setModel] = useState<ModelDetails | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModel = async () => {
      if (!modelName) return;

      setLoading(true);
      try {
        const res = await fetch("/api/models?all=true");
        const { models: rawModels } = await res.json();
        const transformed = rawModels.map(transformRawModel);
        const foundModel = transformed.find(
          (m: ModelDetails) => m.name === modelName
        );

        if (foundModel) {
          setModel(foundModel);
        }
      } catch (error) {
        console.error("Error fetching model:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchModel();
  }, [modelName]);

  if (loading) {
    return <Loader />;
  }

  if (!model && !loading) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="text-white text-xl">Model not found</div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Models</span>
        </button>

        {/* Main Content */}
        <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-4">
              {model && <ModelImage model={model} />}
              <div>
                <h1 className="text-3xl font-bold text-white">{model?.name}</h1>
                <p className="text-gray-400 text-lg">{model?.personalityType}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <ModelDetailsTabs activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Content */}
          <div className="p-6">
            {activeTab === "info" && model && <ModelInfoTab model={model} />}
            {activeTab === "assets" && model?.name && (
              <ModelAssetsTab modelName={model.name} />
            )}
            {activeTab === "chatters" && model?.name && (
              <ModelChattersTab modelName={model.name} />
            )}
            {activeTab === "apps" && model?.name && <ModelAppsTab modelName={model.name} />}
          </div>
        </div>
      </div>
    </div>
  );
}
