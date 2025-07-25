"use client";

import React, { useState } from "react";
import { Loader2, FileText } from "lucide-react";

interface QuickDataEntryProps {
  onDataSubmitted: () => void;
  onSuccess: () => void;
}

export const QuickDataEntry = ({
  onDataSubmitted,
  onSuccess,
}: QuickDataEntryProps) => {
  const [formData, setFormData] = useState({
    creator: "",
    dateUpdated: "",
    scriptTitle: "",
    scriptLink: "",
    totalSend: "",
    totalBuy: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const formatNumber = (value: string): string => {
    const cleaned = value.replace(/[^\d]/g, "");
    const number = parseInt(cleaned);
    return isNaN(number) ? "" : number.toLocaleString();
  };

  const handleTotalSendChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumber(e.target.value);
    setFormData((prev) => ({ ...prev, totalSend: formatted }));
  };

  // Updated handleTotalBuyChange function
  const handleTotalBuyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and decimal point
    const value = e.target.value.replace(/[^\d.]/g, "");

    // Prevent multiple decimal points
    const parts = value.split(".");
    let formattedValue = parts[0];
    if (parts.length > 1) {
      formattedValue += "." + parts[1];
    }

    setFormData((prev) => ({ ...prev, totalBuy: formattedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setShowSuccess(false);

    try {
      const response = await fetch("/api/google/swd-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          totalSend: formData.totalSend.replace(/,/g, ""),
          totalBuy: formData.totalBuy,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit");
      }

      setFormData({
        creator: "",
        dateUpdated: "",
        scriptTitle: "",
        scriptLink: "",
        totalSend: "",
        totalBuy: "",
      });

      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);

      onDataSubmitted();
      onSuccess();
    } catch (error) {
      console.error("Error submitting data:", error);
      alert(
        "There was an error submitting the form. Check console for details."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white/80 border border-pink-200 rounded-lg backdrop-blur-xl overflow-hidden">
      <form onSubmit={handleSubmit} className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-600">Creator *</label>
            <input
              type="text"
              name="creator"
              value={formData.creator}
              onChange={handleInputChange}
              placeholder="Creator name"
              className="w-full bg-white border border-pink-300 text-gray-900 px-3 py-2 rounded-lg focus:border-pink-500 focus:outline-none transition-colors"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-600">Date Updated *</label>
            <input
              type="text"
              name="dateUpdated"
              value={formData.dateUpdated}
              onChange={handleInputChange}
              placeholder="Nov 1, 2024"
              className="w-full bg-white border border-pink-300 text-gray-900 px-3 py-2 rounded-lg focus:border-pink-500 focus:outline-none transition-colors"
              required
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm text-gray-600">Script Title *</label>
            <input
              type="text"
              name="scriptTitle"
              value={formData.scriptTitle}
              onChange={handleInputChange}
              placeholder="Sext 9 - Army Green Bikini"
              className="w-full bg-white border border-pink-300 text-gray-900 px-3 py-2 rounded-lg focus:border-pink-500 focus:outline-none transition-colors"
              required
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm text-gray-600">Script Link</label>
            <input
              type="url"
              name="scriptLink"
              value={formData.scriptLink}
              onChange={handleInputChange}
              placeholder="https://docs.google.com/document/d/..."
              className="w-full bg-white border border-pink-300 text-gray-900 px-3 py-2 rounded-lg focus:border-pink-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-600">Total Send *</label>
            <input
              type="text"
              value={formData.totalSend}
              onChange={handleTotalSendChange}
              placeholder="5,870"
              className="w-full bg-white border border-pink-300 text-gray-900 px-3 py-2 rounded-lg focus:border-pink-500 focus:outline-none transition-colors"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-600">Total Buy *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 pointer-events-none">
                $
              </span>
              <input
                type="text"
                value={formData.totalBuy}
                onChange={handleTotalBuyChange}
                placeholder="4672.06"
                className="w-full bg-white border border-pink-300 text-gray-900 pl-8 pr-3 py-2 rounded-lg focus:border-pink-500 focus:outline-none transition-colors"
                required
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-pink-200">
          <div className="flex items-center gap-2">
            {showSuccess && (
              <div className="flex items-center gap-2 text-green-400 animate-in fade-in duration-300">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">
                  Entry added successfully!
                </span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 font-medium"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Add Entry
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
