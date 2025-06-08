"use client";

import { cn } from "@/lib/utils";
import { liveFlyerValidation } from "@/schema/zodValidationSchema";
import { useState, useEffect } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./ui/select";
import PermissionGoogle from "./PermissionGoogle";

const ModelsDropdown: React.FC<ModelsDropdownProps> = ({
  formData,
  setFormData,
  isLoading,
  isFetchingImage,
  webhookData,
  error,
  setFieldErrors,
}) => {
  const [models, setModels] = useState<Model[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);

  useEffect(() => {
    const fetchModels = async () => {
      setLoadingModels(true);
      try {
        const response = await fetch("/api/models");
        const data = await response.json();
        if (Array.isArray(data.models)) {
          setModels(data.models);
        }
      } catch (error) {
        console.error("Error fetching models:", error);
      } finally {
        setLoadingModels(false);
      }
    };

    fetchModels();
  }, []);

  return (
    <PermissionGoogle apiEndpoint="/api/models">
      <div className="flex flex-col">
        <label
          htmlFor="model"
          className="text-sm text-gray-300 font-medium mb-1"
        >
          Select Model
        </label>

        <Select
          value={formData.model}
          onValueChange={(value) => {
            // Update form data first
            setFormData((prev) => ({ ...prev, model: value }));

            // Now validate the updated value
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const fieldSchema = (liveFlyerValidation.shape as any)["model"];
            if (fieldSchema) {
              const result = fieldSchema.safeParse(value);

              setFieldErrors?.((prev) => ({
                ...prev,
                model: result.success ? "" : result.error.errors[0].message,
              }));
            }
          }}
          disabled={
            isLoading || isFetchingImage || !!webhookData || loadingModels
          }
        >
          <SelectTrigger
            className={cn(
              "bg-black/60 cursor-pointer border-white/10 p-2 text-gray-400 rounded-lg w-full",
              { "border-red-500 !text-red-500": error }
            )}
          >
            <SelectValue
              placeholder={loadingModels ? "Loading models..." : "Select Model"}
            />
          </SelectTrigger>
          <SelectContent className="bg-black/90 border-white/10 text-gray-400 max-h-72">
            {models.map((model, index) => (
              <SelectItem
                key={index}
                value={model.name}
                className="flex items-center justify-between py-2"
              >
                {model.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error && (
          <p className="text-red-500 text-[12px] mt-2 ">Select a Model!</p>
        )}
      </div>
    </PermissionGoogle>
  );
};

export default ModelsDropdown;
