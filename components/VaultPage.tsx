"use client";
import React, { useEffect, useState } from "react";
import VaultClientList from "./VaultClientList";
import VaultCategoryItems from "./VaultCategoryItems";
import VaultCategoryList from "./VaultCategoryList";
import VaultFullScreenItem from "./VaultFullScreenItem";

const VaultPage = () => {
  const [clients, setClients] = useState<{ id: number; email: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedClient, setSelectedClient] = useState<{
    id: number;
    email: string;
  }>({
    id: clients[0]?.id ?? 1,
    email: clients[0]?.email ?? "Select a client",
  });
  const [selectedCategory, setSelectedCategory] = useState<{
    id: number;
    tag: string;
  } | null>(null);

  const [fullscreenItem, setFullscreenItem] = useState<{
    id: number;
    name: string;
    src: string;
    poster?: string;
    type: "image" | "video";
  } | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetch("/api/be/client-list")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        setClients(data);
        setSelectedClient(data[0]);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="w-full h-full flex overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-lg text-white shadow-2xl">
      <VaultClientList
        clientLoading={isLoading}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        clients={clients}
        setSelectedClient={setSelectedClient}
        selectedClient={selectedClient}
        setSelectedCategory={setSelectedCategory}
      />
      <VaultCategoryList
        clientLoading={isLoading}
        selectedClient={selectedClient}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />
      <VaultCategoryItems
        selectedClient={selectedClient}
        selectedCategory={selectedCategory}
        setFullscreenItem={setFullscreenItem}
      />

      {fullscreenItem && (
        <VaultFullScreenItem
          setFullscreenItem={setFullscreenItem}
          fullscreenItem={fullscreenItem}
        />
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 text-red-500 backdrop-blur-sm">
          <div className="text-center p-8 bg-red-500/20 rounded-lg border border-red-500">
            <p className="text-xl">{error}</p>
            <p className="text-sm mt-2 opacity-75">Please try again later.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VaultPage;
