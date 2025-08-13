"use client";
import React from "react";

type Props = { open: boolean; text?: string };

const ProgressModal: React.FC<Props> = ({ open, text = "Rendering…" }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-slate-800 text-white rounded-lg p-6 w-72 shadow-xl border border-slate-700">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
          <div className="text-sm">{text}</div>
        </div>
      </div>
    </div>
  );
};

export default ProgressModal;
