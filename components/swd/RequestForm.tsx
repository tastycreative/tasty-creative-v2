
"use client";

import React, { useState } from "react";
import { Loader2, Users } from 'lucide-react';

interface RequestFormProps {
  onRequestSubmitted: () => void;
  onSuccess: () => void;
}

export const RequestForm = ({ onRequestSubmitted, onSuccess }: RequestFormProps) => {
  const [formData, setFormData] = useState({
    requestedBy: "",
    model: "",
    sextingSet: "",
    specialRequests: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setShowSuccess(false);

    try {
      const response = await fetch("/api/google/swd-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestedBy: formData.requestedBy,
          model: formData.model,
          sextingSet: formData.sextingSet,
          specialRequest: formData.specialRequests,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit request");
      }

      setFormData({
        requestedBy: "",
        model: "",
        sextingSet: "",
        specialRequests: "",
      });

      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);

      onSuccess();
      onRequestSubmitted();
    } catch (error) {
      console.error("Error submitting request:", error);
      alert("There was an error submitting the request. Check console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white/80 border border-pink-200 rounded-lg backdrop-blur-xl overflow-hidden">
      <form onSubmit={handleSubmit} className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-600">Who requested it? *</label>
            <input
              type="text"
              name="requestedBy"
              value={formData.requestedBy}
              onChange={handleInputChange}
              placeholder="Enter requester name"
              className="w-full bg-white border border-pink-300 text-gray-900 px-3 py-2 rounded-lg focus:border-pink-500 focus:outline-none transition-colors"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-600">What model? *</label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleInputChange}
              placeholder="Enter model name"
              className="w-full bg-white border border-pink-300 text-gray-900 px-3 py-2 rounded-lg focus:border-pink-500 focus:outline-none transition-colors"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-600">Which sexting set? *</label>
            <input
              type="text"
              name="sextingSet"
              value={formData.sextingSet}
              onChange={handleInputChange}
              placeholder="Enter sexting set name/number"
              className="w-full bg-white border border-pink-300 text-gray-900 px-3 py-2 rounded-lg focus:border-pink-500 focus:outline-none transition-colors"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-600">Any special requests?</label>
            <textarea
              name="specialRequests"
              value={formData.specialRequests}
              onChange={handleInputChange}
              placeholder="Enter any special requests or notes..."
              rows={4}
              className="w-full bg-white border border-pink-300 text-gray-900 px-3 py-2 rounded-lg focus:border-pink-500 focus:outline-none transition-colors resize-y"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-pink-200">
          <div className="flex items-center gap-2">
            {showSuccess && (
              <div className="flex items-center gap-2 text-green-400 animate-in fade-in duration-300">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Request submitted successfully!</span>
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
                <Users className="w-4 h-4" />
                Submit Request
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
