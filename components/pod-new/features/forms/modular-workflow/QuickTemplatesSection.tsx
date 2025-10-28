"use client";

import { useState } from "react";
import { UseFormSetValue } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Zap, FileText, Calendar, Gamepad2, BarChart3, Video } from "lucide-react";
import { ModularFormData, FormTemplate } from "./types";

interface QuickTemplatesSectionProps {
  setValue: UseFormSetValue<ModularFormData>;
}

const formTemplates: FormTemplate[] = [
  {
    id: "simple-post",
    name: "Simple Post",
    description: "Basic content with flexible scheduling",
    submissionType: "otp",
    contentStyle: "normal",
    components: ["upload"],
    icon: FileText,
    color: "from-blue-500 to-purple-500"
  },
  {
    id: "priority-release",
    name: "Priority Release",
    description: "Model-scheduled content with specific timing",
    submissionType: "ptr",
    contentStyle: "normal",
    components: ["release", "upload"],
    icon: Calendar,
    color: "from-orange-500 to-red-500"
  },
  {
    id: "paid-game",
    name: "Game Content",
    description: "Interactive game content",
    submissionType: "otp",
    contentStyle: "game",
    components: ["upload"],
    icon: Gamepad2,
    color: "from-pink-500 to-rose-500"
  },
  {
    id: "engagement-poll",
    name: "Engagement Poll",
    description: "Poll with optional monetization",
    submissionType: "otp",
    contentStyle: "poll",
    components: ["upload"],
    icon: BarChart3,
    color: "from-green-500 to-cyan-500"
  },
  {
    id: "live-stream",
    name: "Live Stream",
    description: "Scheduled livestream content",
    submissionType: "ptr",
    contentStyle: "livestream",
    components: ["release", "upload"],
    icon: Video,
    color: "from-red-500 to-pink-500"
  }
];

export function QuickTemplatesSection({ setValue }: QuickTemplatesSectionProps) {
  const [showTemplates, setShowTemplates] = useState(false);

  const applyTemplate = (template: FormTemplate) => {
    setValue("submissionType", template.submissionType);
    setValue("contentStyle", template.contentStyle);
    setValue("selectedComponents", template.components);
    setShowTemplates(false);
  };

  return (
    <>
      {/* Template Quick Actions */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowTemplates(!showTemplates)}
          className="border-purple-200 hover:border-purple-300 hover:bg-purple-50 dark:border-purple-700 dark:hover:bg-purple-950"
        >
          <Zap className="w-4 h-4 mr-2" />
          Quick Templates
        </Button>
      </div>

      {showTemplates && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-lg border border-purple-200 dark:border-purple-700">
          {formTemplates.map((template) => (
            <Button
              key={template.id}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => applyTemplate(template)}
              className="text-left h-auto p-3 flex flex-col items-start space-y-1 hover:bg-white/50 dark:hover:bg-gray-800/50"
            >
              <div className="font-medium text-purple-700 dark:text-purple-300">
                {template.name}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {template.description}
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {template.components.map(comp => (
                  <span key={comp} className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-1 py-0.5 rounded">
                    {comp}
                  </span>
                ))}
              </div>
            </Button>
          ))}
        </div>
      )}
    </>
  );
}

export { formTemplates };
