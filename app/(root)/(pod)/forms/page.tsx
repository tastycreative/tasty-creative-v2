"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ModularWorkflowForm from "@/components/pod-new/features/forms/ModularWorkflowForm";
import ModularWorkflowWizard from "@/components/pod-new/features/forms/ModularWorkflowWizard";
import { FileText, Layers, Sparkles } from "lucide-react";

export default function FormsPage() {
  const searchParams = useSearchParams();
  const viewParam = searchParams?.get("view");
  const [activeView, setActiveView] = useState(viewParam === "classic" ? "classic" : "wizard");

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      {activeView === "wizard" ? (
        // New Wizard View (Default)
        <ModularWorkflowWizard />
      ) : (
        // Classic View (Original Form)
        <div className="w-full px-6 py-12 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500/10 to-purple-500/10 dark:from-pink-400/20 dark:to-purple-400/20 rounded-xl border border-pink-200/50 dark:border-pink-500/30 flex items-center justify-center shadow-lg">
                  <FileText className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">
                    <span className="bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-gray-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                      OTP/PTR Forms
                    </span>
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">
                    Dynamic content submission with automated workflow routing
                  </p>
                </div>
              </div>

              {/* View Toggle */}
              <Tabs value={activeView} onValueChange={setActiveView} className="w-auto">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="wizard" className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span className="hidden sm:inline">Wizard</span>
                  </TabsTrigger>
                  <TabsTrigger value="classic" className="gap-2">
                    <Layers className="w-4 h-4" />
                    <span className="hidden sm:inline">Classic</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-4xl mx-auto">
            <ModularWorkflowForm />
          </div>
        </div>
      )}
    </div>
  );
}
