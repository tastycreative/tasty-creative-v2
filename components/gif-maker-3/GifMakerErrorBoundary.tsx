/**
 * Error Boundary for GIF Maker
 * Catches and handles errors gracefully with gallery-themed UI
 */

"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { GalleryTheme } from "./theme/GalleryTheme";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class GifMakerErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details for debugging
    console.error("GIF Maker Error Boundary caught an error:", error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // You can also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = (): void => {
    // Reset the error boundary state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Reload the page to fully reset the GIF maker
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Render fallback UI with gallery theme
      return (
        <div className={`flex h-screen ${GalleryTheme.background.full} text-gray-900 dark:text-white items-center justify-center p-8`}>
          <div className="max-w-2xl w-full">
            {/* Error Card */}
            <div className={`${GalleryTheme.card.full} rounded-2xl shadow-2xl border ${GalleryTheme.border.full} overflow-hidden`}>
              {/* Header with Pattern */}
              <div className={`relative ${GalleryTheme.sidebar.full} p-8 border-b ${GalleryTheme.border.full}`}>
                <div className={`absolute inset-0 ${GalleryTheme.pattern.radial} ${GalleryTheme.pattern.opacity}`}></div>

                {/* Decorative Circle */}
                <div className={GalleryTheme.decorative.topRight}></div>

                <div className="relative flex items-center gap-4">
                  {/* Icon Box */}
                  <div className={`w-16 h-16 rounded-2xl ${GalleryTheme.iconBox.pink} flex items-center justify-center shadow-lg flex-shrink-0`}>
                    <AlertTriangle className="w-8 h-8 text-pink-600 dark:text-pink-400" />
                  </div>

                  {/* Title */}
                  <div>
                    <h1 className={`text-2xl font-bold ${GalleryTheme.title.full}`}>
                      Something Went Wrong
                    </h1>
                    <p className={`text-sm ${GalleryTheme.text.secondary} mt-1`}>
                      The GIF maker encountered an unexpected error
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Details */}
              <div className="p-8">
                <div className={`${GalleryTheme.text.secondary} mb-6`}>
                  <p className="mb-4">
                    Don't worry! Your work may still be recoverable. Try refreshing the page to restart the GIF maker.
                  </p>

                  {this.state.error && (
                    <div className="mt-4">
                      <h3 className={`font-semibold ${GalleryTheme.text.primary} mb-2`}>
                        Error Details:
                      </h3>
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <p className="font-mono text-sm text-red-600 dark:text-red-400 break-all">
                          {this.state.error.message}
                        </p>
                      </div>
                    </div>
                  )}

                  {process.env.NODE_ENV === "development" && this.state.errorInfo && (
                    <details className="mt-4">
                      <summary className={`cursor-pointer font-semibold ${GalleryTheme.text.primary} mb-2 hover:text-pink-600 dark:hover:text-pink-400 transition-colors`}>
                        Stack Trace (Development Only)
                      </summary>
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 mt-2 max-h-64 overflow-y-auto">
                        <pre className="font-mono text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    </details>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={this.handleReset}
                    className={`flex-1 px-6 py-3 ${GalleryTheme.button.primary} text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2`}
                  >
                    <RefreshCw className="w-5 h-5" />
                    Reload GIF Maker
                  </button>

                  <button
                    onClick={() => window.history.back()}
                    className={`px-6 py-3 ${GalleryTheme.button.secondary} ${GalleryTheme.text.primary} font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300`}
                  >
                    Go Back
                  </button>
                </div>

                {/* Help Text */}
                <p className={`text-xs ${GalleryTheme.text.muted} mt-6 text-center`}>
                  If this problem persists, try clearing your browser cache or contact support.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GifMakerErrorBoundary;
