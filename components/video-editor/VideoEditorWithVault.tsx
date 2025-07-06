/**
 * Example integration of VideoEditor with VaultPicker
 * This shows how to use the combined model from VideoEditor with VaultPicker
 */
import React, { useState } from "react";
import { VideoEditor } from "./VideoEditor";
import { VaultPicker } from "./VaultPicker";
import { Archive } from "lucide-react";

export const VideoEditorWithVault: React.FC = () => {
  const [isVaultOpen, setIsVaultOpen] = useState(false);

  // This would be passed from VideoEditor somehow (you'd need to expose this method)
  const getSelectedModel = (): string => {
    // In a real implementation, you'd get this from VideoEditor's getFinalModelValue()
    // For now, we'll simulate it
    return "AUTUMN_FREE";
  };

  const handleVaultMediaSelected = (files: File[]) => {
    console.log("Selected vault media files:", files);
    // Here you would integrate the selected files with VideoEditor
    // The VaultPicker already downloaded and converted them to File objects
    alert(
      `Successfully imported ${files.length} videos from vault. Integration with VideoEditor in progress.`
    );
    setIsVaultOpen(false);
  };

  const handleOpenVault = () => {
    const selectedModel = getSelectedModel();
    if (!selectedModel) {
      alert("Please select a model in VideoEditor first");
      return;
    }
    setIsVaultOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main VideoEditor */}
      <VideoEditor />

      {/* Floating Vault Button */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={handleOpenVault}
          className="p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg transition-colors flex items-center space-x-2"
          title="Import from OnlyFans Vault"
        >
          <Archive className="w-6 h-6" />
          <span className="hidden sm:inline">Import from Vault</span>
        </button>
      </div>

      {/* VaultPicker Modal */}
      <VaultPicker
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        onMediaSelected={handleVaultMediaSelected}
        combinedModel={getSelectedModel()}
      />
    </div>
  );
};
