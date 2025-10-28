"use client";

import { AlertCircle } from "lucide-react";

interface ValidationErrorsProps {
  errors: string[];
}

export function ValidationErrors({ errors }: ValidationErrorsProps) {
  if (errors.length === 0) return null;

  return (
    <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950 dark:to-pink-950 border border-red-200 dark:border-red-800 rounded-lg">
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-500 text-white rounded-full flex items-center justify-center mt-0.5">
          <AlertCircle className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
            ⚠️ Please fix the following errors:
          </h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-300">
            {errors.map((error, index) => (
              <li key={index}>
                {error}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
