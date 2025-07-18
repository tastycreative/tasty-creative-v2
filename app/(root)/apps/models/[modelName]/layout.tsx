"use client";

import { ReactNode, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ModelDetailsNavigation from "@/components/models/ModelDetailsNavigation";
import PermissionGoogle from "@/components/PermissionGoogle";
import { transformRawModel } from "@/lib/utils";

interface ModelAppLayoutProps {
  children: ReactNode;
}

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

  console.log(model.id, 'model id');

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

function ModelLayoutContent({ children, modelName }: { children: ReactNode; modelName: string }) {
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!model && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Model not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <title>{modelName}| Tasty Creative</title>
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
                <p className="text-gray-400 text-lg">
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
