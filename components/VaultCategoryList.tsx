import React, { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

type VaultCategoryListProps = {
  clientLoading: boolean;
  selectedClient: { id: number; email: string } | null;
  selectedCategory: { id: number; tag: string } | null;
  setSelectedCategory: (category: { id: number; tag: string } | null) => void;
};

type VaultCategory = {
  id: number;
  tag: string;
  clientId: number;
  client: {
    id: number;
    email: string;
  };
};

const VaultCategoryList = ({
  clientLoading,
  selectedClient,
  selectedCategory,
  setSelectedCategory,
}: VaultCategoryListProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [vaultCategories, setVaultCategories] = useState<VaultCategory[]>([]);
  const lastCheckTimestamp = useRef(0);
  const checkInterval = useRef<NodeJS.Timeout | null>(null);
  const [lastSync, setLastSync] = useState("");
  const [syncing, setIsSyncing] = useState(false);
  const requestId = uuidv4();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState("");

  useEffect(() => {
    if (selectedClient && selectedClient.email !== "Select a client") {
      setIsLoading(true);
      setVaultCategories([]);
      fetch(
        `/api/be/vault-category-list?email=${encodeURIComponent(
          selectedClient.email
        )}`
      )
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch");
          return res.json();
        })
        .then((data) => setVaultCategories(data))
        .catch((err) => setError(err.message))
        .finally(() => setIsLoading(false));
    }
  }, [selectedClient, clientLoading, lastSync]);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      startChecking(requestId);
      const response = await fetch("/api/be/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "list",
          email: selectedClient?.email,
          requestId: requestId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Sync successful:", data);
      } else {
        console.error("Sync failed:", data.error);
      }
    } catch (error) {
      console.error("Error syncing:", error);
    }
  };

  const fetchWebhookData = async (requestId: string) => {
    try {
      const response = await fetch(`/api/webhook?requestId=${requestId}`);

      if (!response.ok) {
        console.error("Webhook data request failed:", response.statusText);
        return;
      }

      const result = await response.json();

      if (!result || !result.data) {
        console.warn("No data found for requestId:", requestId);
        return;
      }

      if (result.timestamp > lastCheckTimestamp.current) {
        stopChecking();
        setLastSync(result.timestamp);
      }
    } catch (error) {
      console.error("Error fetching webhook data:", error);
    }
  };

  const startChecking = (requestId: string) => {
    if (checkInterval.current) {
      clearInterval(checkInterval.current);
      checkInterval.current = null;
    }

    checkInterval.current = setInterval(() => {
      fetchWebhookData(requestId);
    }, 2000);
  };

  const stopChecking = () => {
    if (checkInterval.current) {
      clearInterval(checkInterval.current);
      checkInterval.current = null;
    }
    setIsSyncing(false);
  };

  return (
    <div className="w-80 md:w-96 h-full flex flex-col bg-gradient-to-b from-gray-800 to-gray-900 border-r border-gray-600/50 backdrop-blur-sm">
      {/* Sticky Header */}
      <div className="flex-shrink-0 p-6 bg-gradient-to-r from-gray-800 to-gray-700 border-b border-gray-600/50 flex gap-3 justify-between items-center shadow-lg">
        <h2 className="font-bold text-white text-lg tracking-wide">Categories</h2>
        {selectedClient && selectedClient.email !== "Select a client" && (
          <button
            disabled={syncing}
            onClick={handleSync}
            className="text-sm px-4 py-2 bg-gradient-to-r from-yellow-400/40 to-yellow-500/40 hover:from-yellow-400/60 hover:to-yellow-500/60 rounded-lg cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md font-medium"
          >
            {syncing ? "Syncing..." : "Sync"}
          </button>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {vaultCategories.length > 0 ? (
          <div className="p-2">
            {vaultCategories.map((category) => (
              <div
                key={category.id}
                className={`p-4 m-2 cursor-pointer rounded-lg border-l-4 transition-all duration-200 hover:shadow-lg ${
                  selectedCategory?.id === category.id
                    ? "border-blue-500 bg-gradient-to-r from-blue-500/20 to-blue-600/10 text-white shadow-lg transform scale-[1.02]"
                    : "border-transparent text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-gray-700/50 hover:to-gray-600/30"
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                <span className="text-base truncate font-medium">{category.tag}</span>
              </div>
            ))}
          </div>
        ) : isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-gray-400 italic">Loading categories...</p>
            </div>
          </div>
        ) : selectedClient?.email === "Select a client" ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-8">
              <div className="text-4xl mb-4 opacity-50">📁</div>
              <p className="text-gray-400 italic">Please select a client to view categories</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-8">
              <div className="text-4xl mb-4 opacity-50">📂</div>
              <p className="text-gray-400 italic">No categories found for this client</p>
            </div>
          </div>
        )}

        {/* {error && (
          <div className="p-4 text-red-500 italic text-sm">Error: {error}</div>
        )} */}
      </div>
    </div>
  );
};

export default VaultCategoryList;