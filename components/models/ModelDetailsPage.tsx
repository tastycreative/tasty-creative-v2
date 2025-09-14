"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import ModelDetailsTabs from "@/components/models/ModelDetailsTab";
import ModelInfoTab from "@/components/models/ModelInfoTab";

// Helper function to get the appropriate image URL
const getImageUrl = (model: any): string => {
  const imageUrl = model?.profileImage || model?.profile;
  
  if (!imageUrl) {
    return 'null';
  }
  
  // Check if it's a Google Drive URL that needs proxying
  if (imageUrl.includes('drive.google.com')) {
    return `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`;
  }
  
  // Return the URL as-is for other image sources
  return imageUrl;
};
import ModelAssetsTab from "@/components/models/ModelAssetTabs";
import ModelChattersTab from "@/components/models/tabs/ModelChattersTab";
import ModelAppsTab from "@/components/models/tabs/ModelAppsTab";
import { transformRawModel } from "@/lib/utils";
import Loader from "@/app/(root)/apps/models/loading";

function ModelImage({ model }: { model: ModelDetails }) {
  const [imageError, setImageError] = useState(false);

  if (imageError || !model.id) {
    return (
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-300/40 to-rose-400/40 blur-2xl" />
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-r from-pink-400 to-rose-500 flex items-center justify-center shadow-2xl shadow-pink-400/25">
          <span className="text-white text-3xl font-bold">
            {model.name.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-pink-300/40 to-rose-400/40 blur-2xl" />
      <div className="relative w-24 h-24 rounded-full bg-gradient-to-r from-pink-400 to-rose-500 p-0.5 flex items-center justify-center shadow-2xl shadow-pink-400/25">
        <img
          src={getImageUrl(model)}
          alt={model.name}
          className="w-full h-full object-cover rounded-full"
          onError={() => setImageError(true)}
        />
      </div>
    </div>
  );
}

export default function ModelDetailsPage() {
  const params = useParams();
  const router = useRouter();
  let modelName = params ? decodeURIComponent(params.modelName as string) : "";
  modelName = modelName.charAt(0).toUpperCase() + modelName.slice(1);

  const [activeTab, setActiveTab] = useState<
    "info" | "assets" | "chatters" | "apps" | "forum"
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

  console.log(model,'model')

  if (loading) {
    return <Loader />;
  }

  if (!model) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-50">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center border border-pink-200">
            <Sparkles className="w-10 h-10 text-pink-500" />
          </div>
          <div className="text-gray-900 text-xl">Model not found</div>
          <button
            onClick={() => router.back()}
            className="mt-4 px-6 py-3 bg-white hover:bg-pink-50 text-gray-700 rounded-xl font-medium transition-all inline-flex items-center gap-2 border border-pink-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 min-h-screen bg-gradient-to-br from-pink-50 to-rose-50">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 group flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-all"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Models</span>
        </button>

        {/* Main Content */}
        <div className="relative">
          {/* Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-pink-200/30 to-rose-200/30 rounded-3xl blur-3xl" />

          <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl border border-pink-200 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="relative p-8 border-b border-pink-100 bg-gradient-to-r from-pink-50/70 via-rose-50/50 to-pink-50/70">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/50" />
              <div className="relative flex items-center gap-6">
                <ModelImage model={model} />
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    {model.name}
                  </h1>
                  <p className="text-gray-600 text-lg mt-1">
                    {model.personalityType}
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <span
                      className={`
                      px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm
                      ${
                        model.status.toLowerCase() === "active"
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }
                    `}
                    >
                      {model.status}
                    </span>
                    {model.launchDate && (
                      <span className="text-sm text-gray-600">
                        Since {model.launchDate}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <ModelDetailsTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />

            {/* Content */}
            <div className="p-8">
              {activeTab === "info" && model && <ModelInfoTab model={model} />}
              {activeTab === "assets" && (
                <ModelAssetsTab modelName={model.name} />
              )}
              {activeTab === "chatters" && (
                <ModelChattersTab modelName={model.name} />
              )}
              {activeTab === "apps" && <ModelAppsTab modelName={model.name} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
