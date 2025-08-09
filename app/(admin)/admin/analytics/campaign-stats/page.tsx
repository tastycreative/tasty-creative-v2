import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { TrendingUp, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default async function CampaignStatsPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <div className="min-h-screen p-6 space-y-6 bg-gradient-to-br from-gray-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="mb-8 p-6 bg-gradient-to-r from-gray-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border dark:border-gray-600">
        <div className="flex items-center space-x-3 mb-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Campaign Stats Analytics</h1>
          <TrendingUp className="h-6 w-6 text-pink-500" />
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          Track campaign performance and conversion metrics
        </p>
      </div>

      {/* Under Construction Section */}
      <Card className="border border-gray-200 dark:border-gray-600 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 dark:hover:border-pink-500 group bg-white dark:bg-gray-700 relative">
        {/* Glass reflection effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-100/25 dark:via-pink-900/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
        </div>
        <CardContent className="p-12 text-center">
          <div className="flex justify-center mb-6">
            <Sparkles className="h-16 w-16 text-pink-500 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Campaign Analytics Under Construction
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-lg mx-auto text-lg">
            We&apos;re building comprehensive campaign analytics including detailed performance metrics, A/B test results, conversion tracking, and ROI analysis. Check back soon!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}