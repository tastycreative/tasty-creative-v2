
"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SWDDashboard } from "./swd/SWDDashboard";
import { SWDRequestsTab } from "./swd/SWDRequestsTab";
import { ScriptWritingTab } from "./swd/ScriptWritingTab";

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

  return (
    <div className="min-h-screen bg-gray-950 bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Animated Header */}
        <div className="text-center space-y-4 py-8">
          <div className="relative inline-block">
            <div className="absolute inset-0 blur-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 opacity-50 animate-pulse"></div>
            <h1 className="relative text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
              Script Writing Dashboard
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Manage and track script performance in real-time
          </p>
        </div>

        {/* Updated Tabs with theme styling */}
        <div className="relative">
          <Tabs defaultValue="dashboard" className="w-full space-y-6">
            <div className="flex justify-center">
              <TabsList className="bg-gray-900/50 border border-gray-800 backdrop-blur-xl rounded-2xl p-2 shadow-2xl">
                <TabsTrigger 
                  value="dashboard" 
                  className="relative px-8 py-3 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25 text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium"
                >
                  <span className="relative z-10">Dashboard</span>
                </TabsTrigger>
                {(userRole === "SWD" || userRole === "ADMIN") && (
                  <>
                    <TabsTrigger
                      value="requests"
                      className="relative px-8 py-3 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium"
                    >
                      <span className="relative z-10">Requests</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="writing"
                      className="relative px-8 py-3 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-green-500/25 text-gray-400 hover:text-white hover:bg-gray-800/50 font-medium"
                    >
                      <span className="relative z-10">Script Writing</span>
                    </TabsTrigger>
                  </>
                )}
              </TabsList>
            </div>

            <TabsContent value="dashboard" className="space-y-4 mt-8">
              <SWDDashboard />
            </TabsContent>

            {(userRole === "SWD" || userRole === "ADMIN") && (
              <>
                <TabsContent value="requests" className="space-y-4 mt-8">
                  {requestsLoading ? (
                    <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
                      <div className="relative">
                        <div className="absolute inset-0 blur-xl bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full animate-pulse"></div>
                        <Loader2 className="relative w-12 h-12 text-white animate-spin" />
                      </div>
                      <h3 className="text-xl font-semibold text-white">
                        Loading requests...
                      </h3>
                      <p className="text-gray-400">
                        Fetching the latest script requests
                      </p>
                    </div>
                  ) : requestsError ? (
                    <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-8 max-w-md">
                        <h3 className="text-xl font-semibold text-red-400 mb-2">
                          Error Loading Requests
                        </h3>
                        <p className="text-gray-400 mb-4">{requestsError}</p>
                        <button
                          onClick={fetchRequests}
                          className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
                        >
                          Retry
                        </button>
                      </div>
                    </div>
                  ) : (
                    <SWDRequestsTab requests={requests} />
                  )}
                </TabsContent>

                <TabsContent value="writing" className="space-y-4 mt-8">
                  <ScriptWritingTab />
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
