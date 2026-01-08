"use client";

import { useState, useCallback, useEffect } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search models, referrers, or tags...",
  className,
  debounceMs = 300,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  // Debounce the onChange call
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, onChange, value, debounceMs]);

  // Sync with external value changes
  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleClear = useCallback(() => {
    setLocalValue("");
    onChange("");
  }, [onChange]);

  return (
    <div className={cn("relative transition-all duration-300 group", className)}>
      <div
        className={cn(
          "relative rounded-2xl transition-all duration-300",
          isFocused ? "shadow-lg shadow-primary-500/10" : "shadow-sm"
        )}
      >
        <Search
          className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300",
            "w-5 h-5",
            isFocused
              ? "text-pink-500"
              : "text-gray-400 group-hover:text-gray-500"
          )}
        />
        <input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={cn(
            "w-full pl-12 pr-10 py-3.5 rounded-2xl border transition-all duration-300",
            "bg-white/50 dark:bg-black/20 backdrop-blur-md text-gray-900 dark:text-gray-100",
            "border-white/20 dark:border-white/5",
            "placeholder:text-gray-500 dark:placeholder:text-gray-400",
            "focus:outline-none focus:bg-white/80 dark:focus:bg-black/40 focus:border-pink-500/50",
            "hover:bg-white/60 dark:hover:bg-black/30 hover:border-white/40"
          )}
          autoComplete="off"
          spellCheck="false"
        />
        {localValue && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors duration-200"
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
          </button>
        )}
      </div>
    </div>
  );
}
