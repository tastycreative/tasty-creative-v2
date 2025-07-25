"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SWDDashboard } from "./swd/SWDDashboard";
import { SWDRequestsTab } from "./swd/SWDRequestsTab";
import { ScriptWritingTab } from "./swd/ScriptWritingTab";
import { ScriptListTab } from "./swd/ScriptListTab";


interface Request {
  timestamp: string;
  user: string;
  requestedBy: string;
  model: string;
  sextingSet: string;
  specialRequest: string;
}

const SWDPage = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [scriptToLoad, setScriptToLoad] = useState<string | null>(null);

  const { data: session } = useSession();
  const userRole = session?.user?.role || "GUEST";

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setRequestsLoading(true);
      setRequestsError(null);

      const response = await fetch("/api/google/swd-requests");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch requests");
      }

      const json = await response.json();
      setRequests(json.requests);
    } catch (err) {
      console.error("Error fetching requests:", err);
      setRequestsError(
        err instanceof Error ? err.message : "An error occurred"
      );
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleScriptClick = (scriptLink: string) => {
    // Open the Google Docs link directly in a new tab
    if (scriptLink) {
      window.open(scriptLink, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Animated Header */}
        <div className="text-center space-y-4 py-8">
          <div className="relative inline-block">
            <div className="absolute inset-0 blur-2xl bg-gradient-to-r from-pink-500 to-rose-500 opacity-50 animate-pulse"></div>
            <h1 className="relative text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">
              Script Writing Dashboard
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Manage and track script performance in real-time
          </p>
        </div>

        {/* Updated Tabs with theme styling */}
        <div className="relative">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full space-y-6"
          >
            {(userRole === "SWD" || userRole === "ADMIN") && (
              <div className="flex justify-center">
                <TabsList className="bg-white/80 border border-pink-200 backdrop-blur-xl rounded-2xl p-2 shadow-2xl">
                  <TabsTrigger
                    value="dashboard"
                    className="relative px-8 py-3 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-pink-500/25 text-gray-600 hover:text-gray-900 hover:bg-pink-50 font-medium"
                  >
                    <span className="relative z-10">Dashboard</span>
                  </TabsTrigger>

                  <>
                    <TabsTrigger
                      value="requests"
                      className="relative px-8 py-3 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-pink-500/25 text-gray-600 hover:text-gray-900 hover:bg-pink-50 font-medium"
                    >
                      <span className="relative z-10">Requests</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="scripts"
                      className="relative px-8 py-3 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-pink-500/25 text-gray-600 hover:text-gray-900 hover:bg-pink-50 font-medium"
                    >
                      <span className="relative z-10">Script List</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="writing"
                      className="relative px-8 py-3 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-pink-500/25 text-gray-600 hover:text-gray-900 hover:bg-pink-50 font-medium"
                    >
                      <span className="relative z-10">Script Writing</span>
                    </TabsTrigger>
                  </>
                </TabsList>
              </div>
            )}

            <TabsContent value="dashboard" className="space-y-4 mt-8">
              <SWDDashboard onScriptClick={handleScriptClick} />
            </TabsContent>

            {(userRole === "SWD" || userRole === "ADMIN") && (
              <>
                <TabsContent value="requests" className="space-y-4 mt-8">
                  {requestsLoading ? (
                    <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
                      <div className="relative">
                        <div className="absolute inset-0 blur-xl bg-gradient-to-r from-pink-500 to-rose-500 rounded-full animate-pulse"></div>
                        <Loader2 className="relative w-12 h-12 text-pink-500 animate-spin" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        Loading requests...
                      </h3>
                      <p className="text-gray-600">
                        Fetching the latest script requests
                      </p>
                    </div>
                  ) : requestsError ? (
                    <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md">
                        <h3 className="text-xl font-semibold text-red-600 mb-2">
                          Error Loading Requests
                        </h3>
                        <p className="text-gray-600 mb-4">{requestsError}</p>
                        <button
                          onClick={fetchRequests}
                          className="px-4 py-2 bg-red-100 border border-red-300 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          Retry
                        </button>
                      </div>
                    </div>
                  ) : (
                    <SWDRequestsTab requests={requests} />
                  )}
                </TabsContent>

                <TabsContent value="scripts" className="space-y-4 mt-8">
                  <ScriptListTab />
                </TabsContent>

                <TabsContent value="writing" className="space-y-4 mt-8">
                  <ScriptWritingTab
                    scriptToLoad={scriptToLoad}
                    onScriptLoaded={() => setScriptToLoad(null)}
                  />
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default SWDPage;
