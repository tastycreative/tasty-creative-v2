"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import ModelInfoTab from "@/components/models/ModelInfoTab";
import { transformRawModel } from "@/lib/utils";
import Loader from "../../loading";

export default function ModelInfoPage() {
  const params = useParams();
  let modelName = params ? decodeURIComponent(params.modelName as string) : "";
  modelName = modelName.charAt(0).toUpperCase() + modelName.slice(1);

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-900 text-xl">Model not found</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white/50">
      {model && <ModelInfoTab model={model} />}
    </div>
  );
}
