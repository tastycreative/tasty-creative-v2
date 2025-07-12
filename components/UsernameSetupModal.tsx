"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, AlertCircle, CheckCircle } from "lucide-react";

interface UsernameSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (username: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export function UsernameSetupModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  error,
}: UsernameSetupModalProps) {
  const [username, setUsername] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");

  const validateUsername = (value: string) => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    
    if (!value) {
      setValidationMessage("");
      setIsValid(false);
      return;
    }

    if (value.length < 3) {
      setValidationMessage("Username must be at least 3 characters");
      setIsValid(false);
      return;
    }

    if (value.length > 20) {
      setValidationMessage("Username must be no more than 20 characters");
      setIsValid(false);
      return;
    }

    if (!usernameRegex.test(value)) {
      setValidationMessage("Username can only contain letters, numbers, and underscores");
      setIsValid(false);
      return;
    }

    setValidationMessage("Looks good!");
    setIsValid(true);
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    validateUsername(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValid || !username.trim()) return;

    const success = await onSubmit(username.trim());
    if (success) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-100/95 dark:bg-gray-900/95 rounded-xl border border-gray-200 dark:border-white/20 p-6 w-full max-w-md backdrop-blur-sm"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                Choose Your Username
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                You need a username to participate in the forum discussions
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="Enter your username..."
                  className="w-full px-3 py-2 bg-gray-100/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-800 dark:text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  disabled={loading}
                />
                
                {validationMessage && (
                  <div className={`flex items-center gap-2 mt-2 text-sm ${
                    isValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {isValid ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    {validationMessage}
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <p className="text-red-600 dark:text-red-400 text-sm">
                    {error}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={!isValid || loading}
                  className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating..." : "Create Username"}
                </button>
                
                <div className="text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Username requirements: 3-20 characters, letters, numbers, and underscores only
                  </p>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
