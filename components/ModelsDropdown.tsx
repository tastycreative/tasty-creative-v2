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
  onPermissionsLoaded,
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
    <PermissionGoogle apiEndpoint="/api/models" onPermissionsLoaded={onPermissionsLoaded}>
      <div className="flex flex-col">
        <label
          htmlFor="model"
          className="text-sm text-gray-700 dark:text-gray-200 font-medium mb-1"
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
              "bg-white/70 dark:bg-gray-700 cursor-pointer border-pink-200 dark:border-pink-500/30 p-2 text-gray-700 dark:text-gray-100 rounded-lg w-full focus:border-pink-400 dark:focus:border-pink-400",
              { "border-red-500 !text-red-500": error }
            )}
          >
            <SelectValue
              placeholder={loadingModels ? "Loading models..." : "Select Model"}
            />
          </SelectTrigger>
          <SelectContent className="bg-white/95 dark:bg-gray-800/95 border-pink-200 dark:border-pink-500/20 text-gray-700 dark:text-gray-100 max-h-72">
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
