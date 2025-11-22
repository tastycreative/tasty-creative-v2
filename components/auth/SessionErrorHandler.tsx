"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  RefreshCw,
  LogOut,
  ShieldAlert,
} from "lucide-react";

/**
 * SessionErrorHandler - Monitors session for authentication errors
 * and prompts users to re-authenticate when refresh tokens expire
 */
export function SessionErrorHandler() {
  const { data: session, status } = useSession();
  const [showModal, setShowModal] = useState(false);
  const [errorType, setErrorType] = useState<string | null>(null);

  useEffect(() => {
    // Check if session has an error
    if (session && (session as any).error) {
      const error = (session as any).error;

      // Handle specific error types
      if (error === "RefreshTokenExpired" || error === "NoRefreshToken" || error === "RefreshAccessTokenError") {
        console.error("🔐 Session error detected:", error);
        setErrorType(error);
        setShowModal(true);
      }
    } else {
      // Clear modal if error is resolved
      setShowModal(false);
      setErrorType(null);
    }
  }, [session]);

  const handleReAuthenticate = async () => {
    // Sign out and redirect to sign-in page
    await signOut({
      callbackUrl: "/sign-in?error=session_expired",
      redirect: true
    });
  };

  const handleDismiss = () => {
    // User dismissed the modal, sign them out
    signOut({
      callbackUrl: "/sign-in?error=session_dismissed",
      redirect: true
    });
  };

  // Don't render anything if there's no error
  if (!showModal || status === "loading") {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]" />

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border-2 border-pink-500/30 dark:border-pink-400/30 overflow-hidden animate-in fade-in zoom-in duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-full">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Session Expired</h2>
                <p className="text-sm text-white/90">Authentication Required</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-500/30 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-medium mb-1">Your session has expired</p>
                <p className="text-yellow-700 dark:text-yellow-300">
                  {errorType === "RefreshTokenExpired"
                    ? "Your login credentials have expired. Please sign in again to continue."
                    : errorType === "NoRefreshToken"
                    ? "Your account needs to be re-authorized. Please sign in again."
                    : "There was an error refreshing your session. Please sign in again."}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p className="font-medium text-gray-900 dark:text-gray-100">
                This happens when:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>You've been logged in for an extended period</li>
                <li>Your login credentials need to be refreshed</li>
                <li>Security settings require re-authentication</li>
              </ul>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <span className="font-medium">💡 Don't worry!</span> Your work is saved.
                Simply sign in again to continue where you left off.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 pt-0 flex gap-3">
            <button
              onClick={handleReAuthenticate}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40 hover:-translate-y-0.5"
            >
              <RefreshCw className="h-4 w-4" />
              Sign In Again
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-3 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6">
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              This is a security measure to protect your account
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
