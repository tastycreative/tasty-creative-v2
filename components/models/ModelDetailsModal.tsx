// components/models/ModelDetailsModal.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Edit, Save } from "lucide-react";
import ModelAssetsTab from "./ModelAssetTabs";
import ModelDetailsTabs from "./ModelDetailsTab";
import ModelInfoTab from "./ModelInfoTab";
import ModelChattersTab from "./tabs/ModelChattersTab";

interface ModelDetailsModalProps {
  model: ModelDetails;
  isOpen: boolean;
  onClose: () => void;
}

export default function ModelDetailsModal({
  model,
  isOpen,
  onClose,
}: ModelDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<"info" | "assets" | "chatters">(
    "info"
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editedModel, setEditedModel] = useState(model);

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log("Saving model:", editedModel);
    setIsEditing(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            //initial={{ opacity: 0 }}
            //animate={{ opacity: 1 }}
            //exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div
            //initial={{ opacity: 0, scale: 0.9, y: 20 }}
            //animate={{ opacity: 1, scale: 1, y: 0 }}
            //exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-4 lg:inset-10 bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 bg-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">
                      {model.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {model.name}
                    </h2>
                    <p className="text-gray-400">{model.personalityType}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Edit className="w-5 h-5 text-gray-400" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSave}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Save className="w-5 h-5 text-green-400" />
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <ModelDetailsTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === "info" && (
                <ModelInfoTab
                  model={editedModel}
                  isEditing={isEditing}
                  onModelChange={setEditedModel}
                />
              )}
              {activeTab === "assets" && <ModelAssetsTab modelId={model.id} />}
              {activeTab === "chatters" && (
                <ModelChattersTab modelId={model.id} />
              )}
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
