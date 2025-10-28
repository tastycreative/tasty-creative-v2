"use client";

import { UseFormRegister, UseFormSetValue } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ModularFormData, CONTENT_TYPE_OPTIONS } from "./types";

interface ContentDetailsSectionProps {
  register: UseFormRegister<ModularFormData>;
  setValue: UseFormSetValue<ModularFormData>;
}

export function ContentDetailsSection({ register, setValue }: ContentDetailsSectionProps) {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-900 dark:text-gray-100">Content Details</h4>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Content Type */}
        <div>
          <Label htmlFor="contentType" className="block mb-2 font-medium">Content Type</Label>
          <Select onValueChange={(value) => setValue("contentType", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select content type..." />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] overflow-y-auto">
              {CONTENT_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-1">
            Select from standard content types
          </p>
        </div>

        {/* Content Length */}
        <div>
          <Label htmlFor="contentLength" className="block mb-2 font-medium">Content Length</Label>
          <Input
            id="contentLength"
            type="text"
            placeholder="8:43 or 8 mins 43 secs"
            {...register("contentLength")}
          />
          <p className="text-xs text-gray-500 mt-1">
            Format: "8:43" or "8 mins 43 secs"
          </p>
        </div>

        {/* Content Count */}
        <div>
          <Label htmlFor="contentCount" className="block mb-2 font-medium">Content Count</Label>
          <Input
            id="contentCount"
            type="text"
            placeholder="1 Video, 3 Photos"
            {...register("contentCount")}
          />
          <p className="text-xs text-gray-500 mt-1">
            Format: "1 Video" or "3 Photos"
          </p>
        </div>
      </div>
    </div>
  );
}
