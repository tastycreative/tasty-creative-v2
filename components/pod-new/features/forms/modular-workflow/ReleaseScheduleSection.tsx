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
import { ModularFormData, TIMEZONE_OPTIONS } from "./types";

interface ReleaseScheduleSectionProps {
  register: UseFormRegister<ModularFormData>;
  setValue: UseFormSetValue<ModularFormData>;
  watch: UseFormWatch<ModularFormData>;
}

export function ReleaseScheduleSection({ register, setValue, watch }: ReleaseScheduleSectionProps) {
  const releaseDate = watch("releaseDate");

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="releaseDate" className="block mb-2 font-medium">
          Release Date (Optional for OTP, Recommended for PTR)
        </Label>
        <Input
          id="releaseDate"
          type="date"
          {...register("releaseDate")}
        />
        <div className="mt-2 flex items-start gap-3 text-xs">
          <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950 px-3 py-2 rounded border border-blue-200 dark:border-blue-800">
            <span className="font-semibold text-blue-700 dark:text-blue-300">Blank = OTP</span>
            <span className="text-blue-600 dark:text-blue-400">Flexible timing</span>
          </div>
          <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-950 px-3 py-2 rounded border border-orange-200 dark:border-orange-800">
            <span className="font-semibold text-orange-700 dark:text-orange-300">Filled = PTR</span>
            <span className="text-orange-600 dark:text-orange-400">Scheduled date</span>
          </div>
        </div>
      </div>

      {/* Conditional rendering: Only show Time/Timezone when Date is filled */}
      {releaseDate && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="releaseTime" className="block mb-2 font-medium">Release Time</Label>
            <Input
              id="releaseTime"
              type="time"
              {...register("releaseTime")}
            />
          </div>
          <div>
            <Label htmlFor="releaseTimezone" className="block mb-2 font-medium">Timezone</Label>
            <Select onValueChange={(value) => setValue("releaseTimezone", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select timezone..." />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONE_OPTIONS.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
