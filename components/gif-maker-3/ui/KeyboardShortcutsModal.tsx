"use client";

import React from "react";
import { X } from "lucide-react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid gap-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-3">
                Timeline Controls
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">
                    Delete selected clip
                  </span>
                  <div className="bg-slate-700 px-2 py-1 rounded text-xs font-mono text-white">
                    Delete
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">
                    Split clip at playhead
                  </span>
                  <div className="bg-slate-700 px-2 py-1 rounded text-xs font-mono text-white">
                    Ctrl+S
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">
                    Click timeline to scrub
                  </span>
                  <div className="bg-slate-700 px-2 py-1 rounded text-xs font-mono text-white">
                    Click
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-3">
                Clip Operations
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Drag to move clip</span>
                  <div className="bg-slate-700 px-2 py-1 rounded text-xs font-mono text-white">
                    Drag
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">
                    Trim clip start/end
                  </span>
                  <div className="bg-slate-700 px-2 py-1 rounded text-xs font-mono text-white">
                    Drag edges
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Select clip</span>
                  <div className="bg-slate-700 px-2 py-1 rounded text-xs font-mono text-white">
                    Click
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-3">
                Media
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Add text overlay</span>
                  <div className="bg-slate-700 px-2 py-1 rounded text-xs font-mono text-white">
                    + Text button
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Access vault</span>
                  <div className="bg-slate-700 px-2 py-1 rounded text-xs font-mono text-white">
                    Vault button
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Upload videos</span>
                  <div className="bg-slate-700 px-2 py-1 rounded text-xs font-mono text-white">
                    Drag & Drop
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700">
          <p className="text-xs text-slate-500 text-center">
            Hover over clips to see trim handles • Yellow ring indicates
            selected clip
          </p>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;