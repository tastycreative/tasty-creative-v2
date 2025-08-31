"use client";

import { ReactNode, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ModelDetailsNavigation from "@/components/models/ModelDetailsNavigation";
import PermissionGoogle from "@/components/PermissionGoogle";
import { transformRawModel } from "@/lib/utils";

// Helper function to get the appropriate image URL
const getImageUrl = (model: any): string => {
  const imageUrl = model?.profileImage || model?.profile;
  
  if (!imageUrl) {
    return '/placeholder-image.jpg';
  }
  
  // Check if it's a Google Drive URL that needs proxying
  if (imageUrl.includes('drive.google.com')) {
    return `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`;
  }
  
  // Return the URL as-is for other image sources
  return imageUrl;
};

interface ModelAppLayoutProps {
  children: ReactNode;
}

function ModelImage({ model }: { model: ModelDetails }) {
  const [imageError, setImageError] = useState(false);

  if (imageError || !model.id) {
    return (
      <div className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center">
        <span className="text-white text-3xl font-bold">
          {model.name.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  console.log(model.id, 'model id');

  return (
    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 p-0.5 flex items-center justify-center">
      <img
        src={getImageUrl(model)}
        alt={model.name}
        className="w-full h-full object-cover rounded-full"
        onError={() => setImageError(true)}
      />
    </div>
  );
}

export function ModelLayoutContent({ children, modelName }: { children: ReactNode; modelName: string }) {
  const router = useRouter();
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-gray-900 dark:text-gray-100 text-xl">Loading...</div>
      </div>
    );
  }

  if (!model && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-gray-900 dark:text-gray-100 text-xl">Model not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:bg-gray-900">
      <title>{modelName}| Tasty Creative</title>
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Models</span>
        </button>

        {/* Main Content */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl border border-pink-200 dark:border-gray-700 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-pink-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-pink-50 dark:from-gray-800 dark:to-emerald-900/20">
            <div className="flex items-center gap-4">
              {model && <ModelImage model={model} />}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{model?.name}</h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  {model?.personalityType}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <ModelDetailsNavigation />

          {/* Content */}
          {children}
        </div>
      </div>
    </div>
  );
}

export default function ModelAppLayout({ children }: ModelAppLayoutProps) {
  const params = useParams();
  let modelName = params ? decodeURIComponent(params.modelName as string) : "";
  modelName = modelName.charAt(0).toUpperCase() + modelName.slice(1);

  return (
    <PermissionGoogle apiEndpoint="/api/models">
      <ModelLayoutContent modelName={modelName}>
        {children}
      </ModelLayoutContent>
    </PermissionGoogle>
  );
}
