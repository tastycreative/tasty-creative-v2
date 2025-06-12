import { cn } from "@/lib/utils";

import React, { useEffect, useState } from "react";
import CountUp from "react-countup";
import { Checkbox } from "./ui/checkbox";
import Link from "next/link";

type LaunchPrepDetailsProps = {
  dashboard?: boolean;
  modelDataLoading: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectedModelData: any; // Replace with the actual type if known
  selectedModel?: string | null;
  timestamp?: string | null;
  editedBy?: string | null;
  className?: string;
  triggerTabChange?: (value: string, model: string) => void;
};

const LaunchPrepDetails = ({
  modelDataLoading,
  selectedModelData,
  selectedModel,
  timestamp,
  editedBy,
  className,
  dashboard = false,
  triggerTabChange,
}: LaunchPrepDetailsProps) => {
  const [animatedWidth, setAnimatedWidth] = useState(0);
  const prepItems = selectedModelData
    ? Object.entries(selectedModelData)
        .filter(([key]) => key !== "Model" && key !== "Status")
        .map(([key, value]) => ({
          item: key,
          status: value === "TRUE" ? "Done" : "Pending",
        }))
    : [];

  const completedCount = prepItems.filter(
    (item) => item.status === "Done"
  ).length;
  const totalCount = prepItems.length;
  const completionRate =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  useEffect(() => {
    const timeout = setTimeout(() => {
      setAnimatedWidth(completionRate);
    }, 200);

    return () => clearTimeout(timeout);
  }, [completionRate]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatRelativeTime = (timestamp: any) => {
    const currentTime = new Date();
    const parsedTimestamp = new Date(timestamp).getTime();
    const timeDifference = currentTime.getTime() - parsedTimestamp; // Difference in milliseconds

    const seconds = Math.floor(timeDifference / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    // Use the relative time formatter
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

    if (days > 0) {
      return rtf.format(-days, "day");
    } else if (hours > 0) {
      return rtf.format(-hours, "hour");
    } else if (minutes > 0) {
      return rtf.format(-minutes, "minute");
    } else {
      return rtf.format(-seconds, "second");
    }
  };

  return (
    <div
      className={cn(
        "w-full bg-transparent backdrop-blur-sm border border-white/10 dark:border-gray-700/30 rounded-xl px-4 sm:px-6 pt-5 transition-all duration-300 shadow-lg hover:shadow-xl",
        className
      )}
    >
      {modelDataLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500/30 border-t-blue-500"></div>
              <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-pulse"></div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
              Loading latest data...
            </p>
          </div>
        </div>
      ) : selectedModelData ? (
        <>
          {/* Update notification */}
          {timestamp && (
            <div className="mb-6 p-3 rounded-lg bg-gradient-to-r from-emerald-50/50 to-blue-50/50 dark:from-emerald-900/20 dark:to-blue-900/20 border border-emerald-200/30 dark:border-emerald-800/30">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                    NEW!
                  </span>
                </div>
                <span className="text-gray-600 dark:text-gray-300 text-sm">
                  Updated {formatRelativeTime(timestamp)} by{" "}
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {editedBy}
                  </span>
                </span>
              </div>
            </div>
          )}

          {/* Header with model info and progress */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
                  {selectedModel || selectedModelData.Model}
                </h1>

                <div className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 rounded-full border border-blue-200/50 dark:border-blue-700/50">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                    <CountUp end={completionRate} />% Complete
                  </span>
                </div>
              </div>

              {dashboard && (
                <Link
                  href={`/apps/onboarding?model=${selectedModelData.Model}`}
                  className="inline-flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300  duration-200 group"
                >
                  <span className="underline decoration-dotted underline-offset-2 group-hover:decoration-solid">
                    Click here for more details
                  </span>
                  <svg
                    className="w-4 h-4 transition-transform group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              )}
            </div>

            {/* Progress section */}
            <div className="lg:w-80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Progress
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  <CountUp end={completedCount} /> of {totalCount} tasks
                </span>
              </div>

              <div className="relative h-3 bg-gray-200/50 dark:bg-gray-700/50 rounded-full overflow-hidden backdrop-blur-sm">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 rounded-full transition-all duration-700 ease-out shadow-sm"
                  style={{ width: `${animatedWidth}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Task grid */}
          {!dashboard && (
            <>
              <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent mb-6"></div>

              <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {prepItems.map((item, index) => (
                  <div
                    key={index}
                    className={cn(
                      "group relative overflow-hidden rounded-lg p-4 transition-all duration-300 hover:scale-105 hover:shadow-md",
                      item.status === "Done"
                        ? "bg-gradient-to-br from-emerald-50/70 to-green-50/70 dark:from-emerald-900/30 dark:to-green-900/30 border border-emerald-200/50 dark:border-emerald-700/50"
                        : "bg-gradient-to-br from-red-50/70 to-orange-50/70 dark:from-red-900/30 dark:to-orange-900/30 border border-red-200/50 dark:border-red-700/50"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Checkbox
                          id={`item-${index}`}
                          className={cn(
                            "w-5 h-5 transition-all duration-200",
                            item.status === "Done"
                              ? "data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 shadow-sm"
                              : "border-red-400 dark:border-red-500"
                          )}
                          disabled
                          checked={item.status === "Done"}
                        />
                        {item.status === "Done" && (
                          <div className="absolute -inset-1 bg-emerald-400/20 rounded-full animate-ping"></div>
                        )}
                      </div>

                      <label
                        htmlFor={`item-${index}`}
                        className={cn(
                          "flex-1 text-sm font-medium leading-relaxed duration-200",
                          item.status === "Pending"
                            ? "text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300"
                            : "text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300"
                        )}
                      >
                        {item.item}
                      </label>
                    </div>

                    {/* Status indicator */}
                    <div
                      className={cn(
                        "absolute top-2 right-2 w-2 h-2 rounded-full",
                        item.status === "Done" ? "bg-emerald-400" : "bg-red-400"
                      )}
                    ></div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-40 space-y-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            Select a client to view details
          </p>
        </div>
      )}
    </div>
  );
};

export default LaunchPrepDetails;
