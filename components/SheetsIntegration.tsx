"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  FileSpreadsheet,
  Copy,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ArrowLeftRight,
} from "lucide-react";

interface SheetsIntegrationProps {
  onSpreadsheetCreated?: (url: string) => void;
  onSheetCreated?: () => void;
}

const SheetsIntegration: React.FC<SheetsIntegrationProps> = ({
  onSpreadsheetCreated,
  onSheetCreated,
}) => {
  const [spreadsheetUrl, setSpreadsheetUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fromType, setFromType] = useState("POD Scheduler Sheet");
  const [toType, setToType] = useState("Betterfans Sheet");
  const [status, setStatus] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [newSpreadsheetUrl, setNewSpreadsheetUrl] = useState<string | null>(
    null
  );
  const [rotationCount, setRotationCount] = useState(0);

  const handleSwapTypes = () => {
    setRotationCount((prev) => prev + 1);
    const temp = fromType;
    setFromType(toType);
    setToType(temp);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!spreadsheetUrl.trim()) {
      setStatus({
        type: "error",
        message: "Please enter a valid spreadsheet URL",
      });
      return;
    }

    setIsLoading(true);
    setNewSpreadsheetUrl(null);
    setStatus({
      type: "info",
      message: "Processing spreadsheet data...",
    });

    try {
      const response = await fetch("/api/pod", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceUrl: spreadsheetUrl,
          fromType,
          toType,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        const successMessage =
          result.scheduleSheets && result.sheetsCount > 1
            ? `Successfully processed ${result.sheetsCount} Schedule #1 sheets with real-time sync!`
            : `Successfully set up real-time sync for your spreadsheet!`;

        setStatus({
          type: "success",
          message: successMessage,
        });
        setNewSpreadsheetUrl(result.spreadsheetUrl);
        setSpreadsheetUrl("");

        // Notify parent component
        if (onSpreadsheetCreated && result.spreadsheetUrl) {
          onSpreadsheetCreated(result.spreadsheetUrl);
        }

        // Refresh the sheet integrations dashboard
        if (onSheetCreated) {
          onSheetCreated();
        }
      } else {
        if (
          result.error === "GoogleAuthExpired" ||
          result.error === "GoogleAuthInvalid"
        ) {
          setStatus({
            type: "error",
            message: `${result.message || "Authentication error occurred."} Please refresh the page and try again.`,
          });
        } else if (result.error === "GooglePermissionDenied") {
          setStatus({
            type: "error",
            message:
              result.message ||
              "Permission denied. Please ensure you have access to the spreadsheet.",
          });
        } else {
          setStatus({
            type: "error",
            message:
              result.error || result.message || "Failed to process spreadsheet",
          });
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setStatus({
        type: "error",
        message: "Network error. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isValidGoogleSheetsUrl = (url: string) => {
    return url.includes("docs.google.com/spreadsheets") && url.includes("/d/");
  };

  return (
    <Card className="border border-pink-200 dark:border-pink-500/30 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm relative group overflow-hidden">
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-100/25 dark:via-pink-900/25 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>

      <CardHeader className="bg-gradient-to-r from-pink-50/50 to-rose-50/50 dark:from-pink-900/30 dark:to-rose-900/30 border-b border-pink-200 dark:border-pink-500/30 relative">
        <CardTitle className="text-gray-900 dark:text-gray-100 font-bold flex items-center text-xl">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mr-3">
            <FileSpreadsheet className="h-4 w-4 text-white" />
          </div>
          Google Sheets Integration
        </CardTitle>
      </CardHeader>

      {/* Conversion Selector */}
      <div className="px-8 py-6 bg-gradient-to-r from-purple-50/50 to-indigo-50/50 dark:from-purple-900/20 dark:to-indigo-900/20 border-b border-purple-200 dark:border-purple-500/30">
        <div className="flex items-center justify-center space-x-4">
          {/* From Type */}
          <div className="px-4 py-3 bg-white dark:bg-gray-700 border-2 border-purple-300 dark:border-purple-600 rounded-lg min-w-[180px] text-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {fromType}
            </span>
          </div>

          {/* Swap Icon */}
          <button
            type="button"
            onClick={handleSwapTypes}
            className="p-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          >
            <ArrowLeftRight
              className="h-5 w-5 transition-transform duration-300"
              style={{ transform: `rotate(${rotationCount * 180}deg)` }}
            />
          </button>

          {/* To Type */}
          <div className="px-4 py-3 bg-white dark:bg-gray-700 border-2 border-purple-300 dark:border-purple-600 rounded-lg min-w-[180px] text-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {toType}
            </span>
          </div>
        </div>

        {/* Conversion Direction Indicator */}
        <div className="mt-4 text-center">
          <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
            Converting from <span className="font-bold">{fromType}</span> to{" "}
            <span className="font-bold">{toType}</span>
          </p>
        </div>
      </div>

      <CardContent className="p-8 relative">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* URL Input */}
          <div className="space-y-3">
            <label
              htmlFor="spreadsheet-url"
              className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center"
            >
              <div className="h-2 w-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 mr-2"></div>
              Source Spreadsheet URL
            </label>
            <Input
              id="spreadsheet-url"
              type="url"
              value={spreadsheetUrl}
              onChange={(e) => setSpreadsheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/your-spreadsheet-id/edit?gid=123456#gid=123456"
              className="w-full h-12 text-base border-2 border-gray-200 dark:border-gray-600 focus:border-pink-500 dark:focus:border-pink-400 transition-colors duration-300 rounded-lg bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-gray-100"
              disabled={isLoading}
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-200 dark:border-blue-700">
              <strong>💡 Tip:</strong> Enter the Google Sheets URL to sync all
              Schedule #1 sheets with real-time updates!
            </p>
          </div>

          {/* URL Validation */}
          {spreadsheetUrl && (
            <div className="space-y-3">
              <div
                className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all duration-300 ${
                  isValidGoogleSheetsUrl(spreadsheetUrl)
                    ? "bg-green-50 dark:bg-green-900/30 border-green-500 dark:border-green-400"
                    : "bg-red-50 dark:bg-red-900/30 border-red-500 dark:border-red-400"
                }`}
              >
                {isValidGoogleSheetsUrl(spreadsheetUrl) ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <span className="text-green-700 dark:text-green-300 font-medium">
                      Valid Google Sheets URL ✨
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <span className="text-red-700 dark:text-red-300 font-medium">
                      Please enter a valid Google Sheets URL
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Status Alert */}
          {status && (
            <div
              className={`p-6 rounded-xl border-2 transition-all duration-500 ${
                status.type === "success"
                  ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-green-300 dark:border-green-600 shadow-lg shadow-green-100 dark:shadow-green-900/20"
                  : status.type === "error"
                    ? "bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 border-red-300 dark:border-red-600 shadow-lg shadow-red-100 dark:shadow-red-900/20"
                    : "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-blue-300 dark:border-blue-600 shadow-lg shadow-blue-100 dark:shadow-blue-900/20"
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {status.type === "success" ? (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  ) : status.type === "error" ? (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 text-white" />
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <Loader2 className="h-4 w-4 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${
                      status.type === "success"
                        ? "text-green-800 dark:text-green-200"
                        : status.type === "error"
                          ? "text-red-800 dark:text-red-200"
                          : "text-blue-800 dark:text-blue-200"
                    }`}
                  >
                    {status.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Success URL Display */}
          {newSpreadsheetUrl && status?.type === "success" && (
            <div className="space-y-4 p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border-2 border-green-300 dark:border-green-600 shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <FileSpreadsheet className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-green-800 dark:text-green-200">
                  🎉 Sync Spreadsheet Created!
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-700 rounded-lg border border-green-300 dark:border-green-600 shadow-sm">
                  <Input
                    value={newSpreadsheetUrl}
                    readOnly
                    className="flex-1 text-sm bg-transparent border-none focus:ring-0 text-blue-600 dark:text-blue-400 font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      navigator.clipboard.writeText(newSpreadsheetUrl)
                    }
                    className="shrink-0 border-green-400 dark:border-green-500 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-800"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                </div>
                <div className="flex space-x-3">
                  <Button
                    type="button"
                    size="lg"
                    onClick={() => window.open(newSpreadsheetUrl, "_blank")}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Spreadsheet
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setNewSpreadsheetUrl(null);
                      setStatus(null);
                    }}
                    className="border-green-400 dark:border-green-500 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-800"
                  >
                    Process Another
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            className="w-full h-14 text-lg bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            disabled={
              isLoading ||
              !spreadsheetUrl ||
              !isValidGoogleSheetsUrl(spreadsheetUrl)
            }
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                Processing Your Request...
              </>
            ) : (
              <>
                <Copy className="w-5 h-5 mr-3" />✨ Create Sync Spreadsheet
              </>
            )}
          </Button>
        </form>

        {/* Info Section */}
        <div className="mt-8 p-6 bg-gradient-to-r from-pink-50/50 to-rose-50/50 dark:from-pink-900/30 dark:to-rose-900/30 rounded-xl border border-pink-200 dark:border-pink-500/30 shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center text-lg">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-3">
              <span className="text-white text-xs">?</span>
            </div>
            How it works:
          </h3>
          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
            <p className="flex items-center">
              <span className="text-pink-500 dark:text-pink-400 mr-2">•</span>{" "}
              Automatically detects all Schedule #1 sheets in your spreadsheet
            </p>
            <p className="flex items-center">
              <span className="text-pink-500 dark:text-pink-400 mr-2">•</span>{" "}
              Creates a copy of the destination template for each sheet
            </p>
            <p className="flex items-center">
              <span className="text-purple-500 dark:text-purple-400 mr-2">
                •
              </span>{" "}
              Maps columns with intelligent data transformation
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SheetsIntegration;
