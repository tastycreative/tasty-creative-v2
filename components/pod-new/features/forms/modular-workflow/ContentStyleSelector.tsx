"use client";

import { UseFormRegister } from "react-hook-form";
import { FileText, BarChart3, Gamepad2, Video } from "lucide-react";
import { ModularFormData, ContentStyle, StyleTemplate } from "./types";

interface ContentStyleSelectorProps {
  register: UseFormRegister<ModularFormData>;
  currentValue?: ContentStyle;
}

const styleTemplates: StyleTemplate[] = [
  {
    id: "normal",
    name: "Normal",
    description: "Standard content posting",
    features: ["Wall Posts", "Caption", "Media"],
    icon: FileText,
    requiredComponents: [],
    recommendedComponents: ["upload"],
  },
  {
    id: "poll",
    name: "Poll",
    description: "Engagement content with audience participation",
    features: ["Questions", "Options", "Results"],
    icon: BarChart3,
    requiredComponents: [],
    recommendedComponents: ["upload"],
  },
  {
    id: "game",
    name: "Game",
    description: "Interactive gaming content",
    features: ["Rules", "Rewards", "Interaction"],
    icon: Gamepad2,
    requiredComponents: [],
    recommendedComponents: ["upload"],
  },
  {
    id: "livestream",
    name: "Livestream",
    description: "Live streaming content",
    features: ["Schedule", "Setup", "Promotion"],
    icon: Video,
    requiredComponents: ["release"],
    recommendedComponents: ["release", "upload"],
  },
];

export function ContentStyleSelector({ register, currentValue }: ContentStyleSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
          2
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Select Content Style
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ml-11">
        {styleTemplates.map((style) => (
          <label
            key={style.id}
            className={`relative flex cursor-pointer rounded-lg border p-4 shadow-sm transition-all hover:shadow-md ${
              currentValue === style.id
                ? "border-blue-300 bg-blue-50 dark:border-blue-600 dark:bg-blue-950"
                : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800"
            }`}
          >
            <input
              type="radio"
              value={style.id}
              {...register("contentStyle", { required: "Please select a content style" })}
              className="sr-only"
            />
            <div className="flex w-full flex-col">
              <div className="flex items-center justify-between">
                <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {style.name}
                </div>
                {currentValue === style.id && (
                  <div className="text-blue-600 dark:text-blue-400">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {style.description}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {style.features.map((feature, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-1 text-xs font-medium text-gray-800 dark:text-gray-200"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

export { styleTemplates };
