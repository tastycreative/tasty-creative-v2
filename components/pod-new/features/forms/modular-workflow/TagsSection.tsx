"use client";

import { UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { ModularFormData, Model } from "./types";

interface TagsSectionProps {
  register: UseFormRegister<ModularFormData>;
  setValue: UseFormSetValue<ModularFormData>;
  watch: UseFormWatch<ModularFormData>;
  models: Model[];
}

export function TagsSection({ register, setValue, watch, models }: TagsSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* External Creator Tags */}
      <div>
        <Label htmlFor="externalCreatorTags" className="block mb-2 font-medium">
          Tags - External Creators
        </Label>
        <Input
          id="externalCreatorTags"
          type="text"
          placeholder="@johndoe @janedoe @creator3"
          {...register("externalCreatorTags")}
        />
        <p className="text-xs text-gray-500 mt-1">
          Enter @usernames separated by spaces (e.g., "@user1 @user2")
        </p>
      </div>

      {/* Internal Model Tags */}
      <div>
        <Label htmlFor="internalModelTags" className="block mb-2 font-medium">
          Tags - Internal Models
        </Label>
        <Select onValueChange={(value) => {
          const currentTags = watch("internalModelTags") || [];
          if (!currentTags.includes(value)) {
            setValue("internalModelTags", [...currentTags, value]);
          }
        }}>
          <SelectTrigger>
            <SelectValue placeholder="Select internal models..." />
          </SelectTrigger>
          <SelectContent className="max-h-[300px] overflow-y-auto">
            {models.map((model, index) => (
              <SelectItem key={`internal-model-${index}`} value={model.name}>
                {model.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500 mt-1">
          Select models from your roster
        </p>
        {watch("internalModelTags") && watch("internalModelTags").length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {watch("internalModelTags").map((tag: string, index: number) => (
              <span
                key={`tag-${index}`}
                className="inline-flex items-center gap-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded text-xs"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => {
                    const currentTags = watch("internalModelTags") || [];
                    setValue("internalModelTags", currentTags.filter((_: string, i: number) => i !== index));
                  }}
                  className="hover:text-purple-900 dark:hover:text-purple-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
