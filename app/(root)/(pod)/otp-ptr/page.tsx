"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Zap, ArrowRight, FileText } from "lucide-react";

export default function OtpPtrPage() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect after 3 seconds
    const timer = setTimeout(() => {
      router.push("/forms");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  const handleRedirect = () => {
    router.push("/apps/pod-new/forms");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center px-6">
        {/* Icon */}
        <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-400/20 dark:to-purple-400/20 rounded-2xl border border-blue-200/50 dark:border-blue-500/30 flex items-center justify-center shadow-lg">
          <Zap className="h-12 w-12 text-blue-600 dark:text-blue-400" />
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            OTP/PTR Has Moved!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-xl leading-relaxed">
            OTP and PTR submissions are now part of our enhanced <strong>OTP/PTR Forms</strong> system with better templates, guided workflows, and improved user experience.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50">
            <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Template-Based</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Pre-configured templates for OTP and PTR workflows</p>
          </div>
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50">
            <Zap className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Step-by-Step</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Guided wizard for streamlined submissions</p>
          </div>
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50">
            <ArrowRight className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Enhanced UX</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Better interface with form validation and progress tracking</p>
          </div>
        </div>

        {/* Redirect Button */}
        <div className="mb-6">
          <button
            onClick={handleRedirect}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <span>Go to OTP/PTR Forms</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Auto-redirect notice */}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          You will be automatically redirected in a few seconds...
        </p>
      </div>

      {/* Decorative Background Elements */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-br from-pink-500/10 to-orange-500/10 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}