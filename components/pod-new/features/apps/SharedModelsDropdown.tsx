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
} from "@/components/ui/select";
import PermissionGoogle from "@/components/PermissionGoogle";

const SharedModelsDropdown: React.FC<ModelsDropdownProps> = ({
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
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    const fetchModels = async () => {
      setLoadingModels(true);
      try {
        const response = await fetch("/api/models");

        // Check if response is ok and content-type is JSON
        if (!response.ok) {
          if (response.status === 401) {
            setAuthError(true);
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          // Check if this is a redirect response (HTML page)
          if (response.url.includes("/?from=") || (contentType && contentType.includes("text/html"))) {
            setAuthError(true);
            return;
          }
          throw new Error("Response is not JSON - received HTML or other content");
        }

        const data = await response.json();
        if (Array.isArray(data.models)) {
          // Filter out duplicate model names to prevent React key warnings
          const uniqueModels = data.models.filter((model: any, index: number, self: any[]) =>
            index === self.findIndex((m: any) => m.name === model.name)
          );

          setModels(uniqueModels);
        }
      } catch (error) {
        // Set empty models array on error
        setModels([]);
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
              { "border-red-500 !text-red-500": error || authError }
            )}
          >
            <SelectValue
              placeholder={
                authError
                  ? "Please log in to load models"
                  : loadingModels
                    ? "Loading models..."
                    : "Select Model"
              }
            />
          </SelectTrigger>
          <SelectContent className="bg-white/95 dark:bg-gray-800/95 border-pink-200 dark:border-pink-500/20 text-gray-700 dark:text-gray-100 max-h-72">
            {models.map((model, index) => (
              <SelectItem
                key={`${model.name}-${index}`}
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
        {authError && (
          <p className="text-red-500 text-[12px] mt-2">
            Authentication required. Please sign in to load models.
          </p>
        )}
      </div>
    </PermissionGoogle>
  );
};

export default SharedModelsDropdown;