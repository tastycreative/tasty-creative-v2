"use client";

import React from "react";
import { Archive, DollarSign } from "lucide-react";
import ModelsDropdown from "@/components/ModelsDropdown";

interface VaultSectionProps {
  formData: { model?: string };
  setFormData: (data: { model?: string }) => void;
  modelType: "FREE" | "PAID";
  setModelType: (type: "FREE" | "PAID") => void;
  fieldErrors: Record<string, string>;
  setFieldErrors: (errors: Record<string, string>) => void;
  onOpenVault: () => void;
}

const VaultSection: React.FC<VaultSectionProps> = ({
  formData,
  setFormData,
  modelType,
  setModelType,
  fieldErrors,
  setFieldErrors,
  onOpenVault,
}) => {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium text-slate-300 mb-2">
        OnlyFans Vault
      </h3>

      {/* Model Type Toggle */}
      <div className="flex rounded-lg bg-slate-700 p-1 mb-3">
        <button
          onClick={() => setModelType("FREE")}
          className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-1 ${
            modelType === "FREE"
              ? "bg-blue-600 text-white"
              : "text-slate-300 hover:bg-slate-600"
          }`}
        >
          <span>FREE</span>
        </button>
        <button
          onClick={() => setModelType("PAID")}
          className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-1 ${
            modelType === "PAID"
              ? "bg-rose-600 text-white"
              : "text-slate-300 hover:bg-slate-600"
          }`}
        >
          <DollarSign className="w-3 h-3" />
          <span>PAID</span>
        </button>
      </div>

      {/* Model Dropdown */}
      <div className="mb-3">
        <ModelsDropdown
          formData={formData}
          setFormData={setFormData}
          error={fieldErrors.model}
          setFieldErrors={setFieldErrors}
          isLoading={false}
          isFetchingImage={false}
          webhookData={null}
        />
      </div>

      {/* Vault Access Button */}
      <button
        onClick={onOpenVault}
        disabled={!formData.model}
        className={`w-full px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-center gap-2 ${
          formData.model
            ? "bg-pink-600 hover:bg-pink-700 text-white"
            : "bg-slate-600 text-slate-400 cursor-not-allowed"
        }`}
      >
        <Archive className="w-4 h-4" />
        {formData.model
          ? `Access ${formData.model} Vault`
          : "Select Model First"}
      </button>
    </div>
  );
};

export default VaultSection;