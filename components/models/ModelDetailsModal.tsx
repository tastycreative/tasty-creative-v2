// components/models/ModelDetailsModal.tsx
"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Maximize2 } from "lucide-react";
import ModelAssetsTab from "./ModelAssetTabs";
import ModelDetailsTabs from "./ModelDetailsTab";
import ModelInfoTab from "./ModelInfoTab";
import ModelChattersTab from "./tabs/ModelChattersTab";
import ModelAppsTab from "./tabs/ModelAppsTab";

function ModelImage({ model }: { model: ModelDetails }) {
  const [imageError, setImageError] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);

  if (imageError || !model.id) {
    return (
      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
        <span className="text-white text-2xl font-bold">
          {model.name.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <>
      <div
        className="relative group cursor-pointer"
        onClick={() => setShowFullscreen(true)}
      >
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 p-0.5 flex items-center justify-center">
          <img
            src={`/api/image-proxy?id=${model.id}`}
            alt={model.name}
            className="w-full h-full object-cover rounded-full"
            onError={() => setImageError(true)}
          />
        </div>
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Maximize2 className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Fullscreen Modal - Rendered at document root using portal */}
      {showFullscreen &&
        typeof document !== "undefined" &&
        createPortal(
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFullscreen(false)}
            className="fixed top-0 left-0 w-screen h-screen bg-black z-[9999] flex items-center justify-center"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100vw",
              height: "100vh",
              margin: 0,
              padding: 0,
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setShowFullscreen(false)}
              className="absolute top-6 right-6 p-3 bg-black/70 hover:bg-black/90 rounded-full transition-colors z-10"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Image */}
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              src={`/api/image-proxy?id=${model.id}`}
              alt={model.name}
              className="w-screen h-screen object-contain"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100vw",
                height: "100vh",
                objectFit: "contain",
              }}
            />
          </motion.div>,
          document.body
        )}
    </>
  );
}

export default function ModelDetailsModal({
  model,
  isOpen,
  onClose,
}: ModelDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<"info" | "assets" | "chatters" | "apps">(
    "info"
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isEditing, setIsEditing] = useState(false);
  const [editedModel, setEditedModel] = useState(model);

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
                  <ModelImage model={model} />
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {model.name}
                    </h2>
                    <p className="text-gray-400">{model.personalityType}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
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
              {activeTab === "assets" && (
                <ModelAssetsTab modelName={model.name} />
              )}
              {activeTab === "chatters" && (
                <ModelChattersTab modelName={model.name} />
              )}
               {activeTab === "apps" && <ModelAppsTab modelName={model.name} />}
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
