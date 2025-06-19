"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  Download,
  User,
  Image,
  Heart,
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Camera,
  Bot,
  Database,
  X,
  ArrowRight,
  Copy,
  Eye,
  Calendar,
  Wand2,
  Trash2,
  AlertTriangle,
  SkipForward,
  Plus,
  Shield,
  RotateCcw,
  ImageIcon,
} from "lucide-react";

interface ScrapedPost {
  timestamp: string;
  username: string;
  post_url: string;
  caption: string;
  image_url: string;
  local_image: string;
  likes: number;
  ai_analysis: string;
}

interface ScrapingStats {
  total_checked: number;
  new_posts: number;
  skipped_posts: number;
  images_downloaded: number;
  ai_analyses_completed: number;
}

interface ScrapingResult {
  success: boolean;
  message: string;
  data: ScrapedPost[];
  stats: ScrapingStats;
  duplicate_prevention: boolean;
}

interface DownloadedImage {
  filename: string;
  url: string;
  size: string;
  path: string;
}

interface ImageModalData {
  image: DownloadedImage;
  post?: ScrapedPost | null;
}

interface ClearDataResult {
  success: boolean;
  message: string;
  images_deleted: number;
  sheets_cleared: boolean;
  errors: string[];
}

export default function EnhancedAIInstagramScraperPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [results, setResults] = useState<ScrapedPost[]>([]);
  const [images, setImages] = useState<DownloadedImage[]>([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [forceRescrape, setForceRescrape] = useState(false);
  const [stats, setStats] = useState<ScrapingStats>({
    total_checked: 0,
    new_posts: 0,
    skipped_posts: 0,
    images_downloaded: 0,
    ai_analyses_completed: 0,
  });

  // Modal state
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageData, setSelectedImageData] =
    useState<ImageModalData | null>(null);

  // Clear data confirmation modal state
  const [showClearDataModal, setShowClearDataModal] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);

  // Backend connection state
  const [backendStatus, setBackendStatus] = useState({
    connected: false,
    openai_available: false,
    sheets_available: false,
    posts_count: 0,
    existing_urls_count: 0,
  });

  // Enhanced error handling state
  const [connectionHealth, setConnectionHealth] = useState(true);
  const [lastDataRefresh, setLastDataRefresh] = useState<Date | null>(null);
  const [autoRefreshInterval, setAutoRefreshInterval] =
    useState<NodeJS.Timeout | null>(null);

  // Portal mounting state
  const [isMounted, setIsMounted] = useState(false);

  // Updated to use your Cloudflare tunnel URL
  const API_BASE =
    "https://usual-reception-finances-conversion.trycloudflare.com/api";
  const IMAGE_BASE =
    "https://usual-reception-finances-conversion.trycloudflare.com"; // For serving images

  // Prevent background scrolling when modals are open
  useEffect(() => {
    if (showImageModal || showClearDataModal) {
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = "15px";
    } else {
      document.body.style.overflow = "unset";
      document.body.style.paddingRight = "0px";
    }

    return () => {
      document.body.style.overflow = "unset";
      document.body.style.paddingRight = "0px";
    };
  }, [showImageModal, showClearDataModal]);

  // Cleanup intervals when component unmounts
  useEffect(() => {
    return () => {
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
      }
    };
  }, [autoRefreshInterval]);

  // Test API connection and get backend status on component mount
  useEffect(() => {
    testConnection();
    loadImages();
    checkSheetsStatus();
    setIsMounted(true);
  }, []);

  // Enhanced connection health check
  const checkConnectionHealth = async () => {
    try {
      const response = await fetch(`${API_BASE}/test`, {
        method: "GET",
        signal: AbortSignal.timeout(10000), // 10 second timeout for health check
      });
      const isHealthy = response.ok;
      setConnectionHealth(isHealthy);
      return isHealthy;
    } catch (error) {
      console.log("Health check failed:", error);
      setConnectionHealth(false);
      return false;
    }
  };

  const testConnection = async () => {
    try {
      const response = await fetch(`${API_BASE}/test`);
      const data = await response.json();
      if (data.success) {
        setBackendStatus((prev) => ({
          ...prev,
          connected: true,
          openai_available: data.openai_available,
          sheets_available: data.sheets_available,
        }));
        setConnectionHealth(true);
        setStatus(
          "✅ Connected to enhanced scraper backend with duplicate prevention"
        );
      }
    } catch (err) {
      setError(
        "❌ Cannot connect to backend. Make sure the Python server is running on port 5001 with Cloudflare tunnel active"
      );
      setConnectionHealth(false);
      setBackendStatus({
        connected: false,
        openai_available: false,
        sheets_available: false,
        posts_count: 0,
        existing_urls_count: 0,
      });
    }
  };

  const checkSheetsStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/sheets-status`);
      const data = await response.json();
      if (data.success) {
        setBackendStatus((prev) => ({
          ...prev,
          sheets_available: data.sheets_available,
          posts_count: data.posts_count,
          existing_urls_count: data.existing_urls_count || 0,
        }));
      }
    } catch (err) {
      console.log("Could not check Google Sheets status");
    }
  };

  // Enhanced loadImages function with retry logic and better error handling
  const loadImages = async (retryCount = 0) => {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    try {
      setIsLoadingImages(true);
      const response = await fetch(`${API_BASE}/images`);
      const data = await response.json();

      if (data.success) {
        // Check if we got new images compared to current state
        const newImageCount = data.images.length;
        const currentImageCount = images.length;

        setImages(data.images);

        // Show feedback if new images were loaded
        if (newImageCount > currentImageCount && currentImageCount > 0) {
          const newImages = newImageCount - currentImageCount;
          setStatus(
            `✅ Loaded ${newImages} new image${newImages > 1 ? "s" : ""}!`
          );
          setTimeout(() => setStatus(""), 3000);
        }

        setIsLoadingImages(false);
        return true;
      } else {
        throw new Error("Failed to load images");
      }
    } catch (err) {
      console.log(
        `Failed to load images (attempt ${retryCount + 1}/${maxRetries + 1})`
      );

      if (retryCount < maxRetries) {
        // Retry after delay
        setTimeout(
          () => {
            loadImages(retryCount + 1);
          },
          retryDelay * (retryCount + 1)
        ); // Exponential backoff
      } else {
        setIsLoadingImages(false);
        console.log("Could not load existing images after all retries");
        return false;
      }
    }
  };

  // Enhanced function to refresh data after scraping with better timing
  const refreshDataAfterScraping = async (stats: ScrapingStats) => {
    // Only refresh if new images were actually downloaded
    if (stats.images_downloaded > 0) {
      setStatus("🔄 Loading new images...");

      // Wait a bit longer to ensure files are written to disk
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Try to load images with retry logic
      const imageLoadSuccess = await loadImages();

      if (imageLoadSuccess) {
        setStatus(
          `✅ Successfully loaded ${stats.images_downloaded} new image${stats.images_downloaded > 1 ? "s" : ""}!`
        );
      } else {
        setStatus(
          "⚠️ Images may still be processing. Try refreshing in a moment."
        );
      }

      // Clear status after 4 seconds
      setTimeout(() => setStatus(""), 4000);
    }

    // Always refresh sheets status
    await checkSheetsStatus();
  };

  // Manual data refresh function
  const manualDataRefresh = async () => {
    setStatus("🔄 Manually refreshing data...");
    setIsLoadingImages(true);

    try {
      await loadImages();
      await checkSheetsStatus();
      setLastDataRefresh(new Date());
      setStatus(
        `✅ Data refreshed successfully at ${new Date().toLocaleTimeString()}`
      );

      // Clear status after 3 seconds
      setTimeout(() => setStatus(""), 3000);
    } catch (error) {
      console.error("Manual refresh failed:", error);
      setStatus("❌ Manual refresh failed. Check connection.");
    } finally {
      setIsLoadingImages(false);
    }
  };

  // Auto-monitoring function
  const startAutoMonitoring = () => {
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
    }

    let checkCount = 0;
    const maxChecks = 10; // Check for 10 minutes (every 60 seconds)

    const interval = setInterval(async () => {
      checkCount++;
      console.log(`Auto-monitoring check ${checkCount}/${maxChecks}`);

      try {
        const oldImageCount = images.length;
        await loadImages();
        await checkSheetsStatus();

        const newImageCount = images.length;
        if (newImageCount > oldImageCount) {
          const newImages = newImageCount - oldImageCount;
          setStatus(
            `🎉 Found ${newImages} new image${newImages > 1 ? "s" : ""}! Scraping completed successfully.`
          );
          setError(""); // Clear any existing error
          clearInterval(interval);
          setAutoRefreshInterval(null);
          return;
        }
      } catch (error) {
        console.log(`Auto-monitoring check ${checkCount} failed:`, error);
      }

      if (checkCount >= maxChecks) {
        console.log("Auto-monitoring completed without finding new images");
        setStatus(
          "⏹️ Auto-monitoring completed. Try manual refresh if expecting more data."
        );
        clearInterval(interval);
        setAutoRefreshInterval(null);
      }
    }, 60000); // Check every 60 seconds

    setAutoRefreshInterval(interval);
    setStatus(
      "🔍 Auto-monitoring active - checking for new images every minute..."
    );
  };

  // Enhanced handleScrape with robust error handling
  const handleScrape = async () => {
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }

    setIsLoading(true);
    setError("");
    setStatus(
      forceRescrape
        ? "🔄 Starting Instagram scrape (force re-scrape enabled)..."
        : "🚀 Starting Instagram scrape with duplicate prevention..."
    );
    setResults([]);
    setStats({
      total_checked: 0,
      new_posts: 0,
      skipped_posts: 0,
      images_downloaded: 0,
      ai_analyses_completed: 0,
    });

    // Create AbortController for timeout handling
    const controller = new AbortController();
    let timeoutId: NodeJS.Timeout;

    try {
      // Set a longer timeout (5 minutes) for scraping operations
      timeoutId = setTimeout(() => {
        controller.abort();
      }, 300000); // 5 minutes

      setStatus(
        "🤖 Processing posts and analyzing with AI... This may take several minutes."
      );

      const response = await fetch(`${API_BASE}/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.replace("@", ""),
          force_rescrape: forceRescrape,
        }),
        signal: controller.signal,
      });

      // Clear the timeout since request completed
      clearTimeout(timeoutId);

      // Check if response is ok
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If we can't parse the error response, use the status
        }
        throw new Error(errorMessage);
      }

      const data: ScrapingResult = await response.json();

      if (data.success) {
        setResults(data.data);
        setStats(data.stats);
        setStatus(`✅ ${data.message}`);

        // Enhanced auto-refresh after successful scraping
        await refreshDataAfterScraping(data.stats);
      } else {
        setError(data.message || "Scraping failed");
      }
    } catch (err: any) {
      console.error("Scraping error:", err);

      // Clear timeout if it exists
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Handle different types of errors more specifically
      if (err.name === "AbortError") {
        // Request was aborted due to our timeout
        setError(
          "⏱️ Request timed out after 5 minutes. The scraping is likely still running in the background."
        );
        setStatus("⚠️ Checking for completed data...");

        // Auto-refresh data after a delay
        setTimeout(async () => {
          try {
            await loadImages();
            await checkSheetsStatus();
            setStatus("🔄 Data refreshed. Check if new images appeared above.");
          } catch (refreshError) {
            console.error("Error refreshing data:", refreshError);
            setStatus(
              "⚠️ Auto-refresh failed. Try the manual refresh button below."
            );
          }
        }, 3000);
      } else if (
        err.message?.includes("Failed to fetch") ||
        err.name === "TypeError"
      ) {
        // Network/fetch error - most common case
        setError(
          "🌐 Connection lost during scraping. The process is likely still running on the server."
        );
        setStatus("⚠️ Don't worry! Checking for completed data...");

        // Auto-refresh data after a short delay
        setTimeout(async () => {
          try {
            await loadImages();
            await checkSheetsStatus();
            setStatus(
              "🔄 Data refreshed automatically. Check the images section above!"
            );

            // Clear the error after successful refresh
            setTimeout(() => {
              setError("");
            }, 5000);
          } catch (refreshError) {
            console.error("Error during auto-refresh:", refreshError);
            setStatus(
              "⚠️ Auto-refresh had issues. Please try manual refresh below."
            );
          }
        }, 2000);
      } else if (
        err.message?.includes("NetworkError") ||
        err.message?.includes("network")
      ) {
        // Network-specific errors
        setError(
          "📡 Network connectivity issue. The scraping may still be running on the server."
        );
        setStatus("⚠️ Attempting to reconnect and check progress...");

        setTimeout(async () => {
          await loadImages();
          await checkSheetsStatus();
          setStatus("🔄 Reconnected. Check if new images appeared.");
        }, 5000);
      } else if (err.message?.includes("CORS")) {
        // CORS-specific errors
        setError(
          "🔒 CORS error detected. The backend may still be processing your request."
        );
        setStatus("⚠️ Refreshing data...");

        setTimeout(async () => {
          await loadImages();
          await checkSheetsStatus();
          setStatus("🔄 Data refreshed despite CORS issue.");
        }, 3000);
      } else {
        // Generic error handling
        const errorMessage = err.message || "Unknown error occurred";

        if (errorMessage.includes("timeout") || errorMessage.includes("time")) {
          setError(
            `⏱️ Timeout: ${errorMessage}. The scraping might still be running.`
          );
        } else {
          setError(
            `❌ Error: ${errorMessage}. The scraping might still be running.`
          );
        }

        setStatus("⚠️ Checking if any data was processed...");

        // Always try to refresh data on any error
        setTimeout(async () => {
          try {
            await loadImages();
            await checkSheetsStatus();
            setStatus("🔄 Data check complete. Look for new images above.");
          } catch (refreshError) {
            console.error("Final refresh attempt failed:", refreshError);
            setStatus("❌ Unable to check for new data. Try manual refresh.");
          }
        }, 4000);
      }
    } finally {
      // Always set loading to false
      setTimeout(() => {
        setIsLoading(false);
      }, 1000); // Small delay to let status messages show
    }
  };

  // Pre-flight check before scraping
  const handleScrapeWithPreflightCheck = async () => {
    // Check connection health before starting
    setStatus("🔍 Checking backend connection...");
    const isHealthy = await checkConnectionHealth();

    if (!isHealthy) {
      setError(
        "❌ Cannot connect to backend. Please check if the server is running and tunnel is active."
      );
      return;
    }

    setStatus("✅ Backend connection verified. Starting scrape...");

    // Call the main scrape function
    await handleScrape();
  };

  const handleClearData = async () => {
    setIsClearingData(true);
    setError("");
    setStatus("🗑️ Clearing all data...");

    try {
      const response = await fetch(`${API_BASE}/clear-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data: ClearDataResult = await response.json();

      if (data.success) {
        // Reset all local state
        setResults([]);
        setImages([]);
        setStats({
          total_checked: 0,
          new_posts: 0,
          skipped_posts: 0,
          images_downloaded: 0,
          ai_analyses_completed: 0,
        });
        setUsername("");

        // Update backend status
        await checkSheetsStatus();

        setStatus(`✅ ${data.message}`);

        // Auto-clear status after 5 seconds
        setTimeout(() => setStatus(""), 5000);
      } else {
        setError(`❌ ${data.message}`);
        if (data.errors && data.errors.length > 0) {
          console.error("Clear data errors:", data.errors);
        }
      }
    } catch (err) {
      setError("Failed to clear data. Check if Python server is running.");
      console.error("Clear data error:", err);
    } finally {
      setIsClearingData(false);
      setShowClearDataModal(false);
    }
  };

  // Find post data for an image - enhanced with Google Sheets lookup
  const findPostForImage = async (
    image: DownloadedImage
  ): Promise<ScrapedPost | null> => {
    // First, try to find in current session results
    const currentSessionPost = results.find((post) => {
      const postImageName = post.local_image.split("/").pop();
      const match = postImageName === image.filename;
      return match;
    });

    if (currentSessionPost) {
      return currentSessionPost;
    }

    // If not found in current session, try Google Sheets
    try {
      setStatus("🔍 Looking up post data from Google Sheets...");

      const response = await fetch(
        `${API_BASE}/post-by-image/${image.filename}`
      );
      const data = await response.json();

      if (data.success && data.post) {
        setStatus("✅ Found post data in Google Sheets!");
        setTimeout(() => setStatus(""), 2000);
        return data.post;
      } else {
        setStatus("ℹ️ No post data found for this image");
        setTimeout(() => setStatus(""), 2000);
        return null;
      }
    } catch (error) {
      console.error(
        `Error looking up post data for "${image.filename}":`,
        error
      );
      setStatus("❌ Error looking up post data");
      setTimeout(() => setStatus(""), 2000);
      return null;
    }
  };

  // Handle image click to show modal - enhanced with async lookup
  const handleImageClick = async (image: DownloadedImage) => {
    // Show modal immediately with loading state
    setSelectedImageData({ image, post: undefined });
    setShowImageModal(true);

    try {
      // Try to find post data (current session + Google Sheets)
      const post = await findPostForImage(image);

      // Update modal with found data
      setSelectedImageData({ image, post });
    } catch (error) {
      console.error("Error loading post data:", error);
      // Keep modal open with no post data found
      setSelectedImageData({ image, post: null });
    }
  };

  // Handle push to image-to-image
  const handlePushToImageToImage = () => {
    if (!selectedImageData) return;

    const { image, post } = selectedImageData;

    // Determine the best prompt to use
    let prompt = "";
    if (
      post?.ai_analysis &&
      post.ai_analysis !== "No analysis" &&
      post.ai_analysis.trim()
    ) {
      prompt = post.ai_analysis;
    } else if (post?.caption && post.caption.trim()) {
      prompt = post.caption;
    } else {
      prompt = `Transform this image: ${image.filename}`;
    }

    // Prepare data to transfer - Updated to use Cloudflare tunnel URL
    const transferData = {
      imageUrl: `${IMAGE_BASE}${image.url}`, // Updated to use tunnel URL
      prompt: prompt,
      filename: image.filename,
      originalPost: post
        ? {
            username: post.username,
            post_url: post.post_url,
            likes: post.likes,
            timestamp: post.timestamp,
            caption: post.caption,
            ai_analysis: post.ai_analysis,
          }
        : null,
    };

    // Store in localStorage for the image-to-image page to pick up
    localStorage.setItem(
      "instagram_to_image2image",
      JSON.stringify(transferData)
    );

    // Close modal
    setShowImageModal(false);

    // Show feedback
    setStatus(`🚀 Pushing "${image.filename}" to Image-to-Image...`);

    // Navigate to image-to-image page
    router.push("./image2image");
  };

  // Copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setStatus("📋 Copied to clipboard!");
    setTimeout(() => setStatus(""), 2000);
  };

  return (
    <div className="w-full h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500/10 to-orange-500/10 border border-pink-500/20">
            <Download className="w-5 h-5 text-pink-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Enhanced AI-Powered Instagram Scraper with Auto-Refresh
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Smart Instagram Content Analyzer
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Extract images from Instagram profiles with intelligent duplicate
            prevention. Only scrapes new content, analyzes with AI, and
            seamlessly transfers to Image-to-Image generation.
          </p>
        </div>

        {/* Enhanced Status Bar with Connection Health */}
        <div className="bg-white/5 dark:bg-gray-800/20 backdrop-blur-sm border border-white/10 dark:border-gray-700/20 rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Backend Connection */}
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${backendStatus.connected ? "bg-green-400 animate-pulse" : "bg-red-400"}`}
              ></div>
              <div>
                <div
                  className={`font-medium ${backendStatus.connected ? "text-green-400" : "text-red-400"}`}
                >
                  {backendStatus.connected
                    ? "Backend Connected"
                    : "Backend Offline"}
                </div>
                <div className="text-xs text-gray-400">
                  Port 5001 {backendStatus.connected ? "ready" : "unavailable"}
                </div>
              </div>
            </div>

            {/* Connection Health */}
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${connectionHealth ? "bg-green-400 animate-pulse" : "bg-orange-400"}`}
              ></div>
              <div>
                <div
                  className={`font-medium ${connectionHealth ? "text-green-400" : "text-orange-400"}`}
                >
                  Connection {connectionHealth ? "Healthy" : "Issues"}
                </div>
                <div className="text-xs text-gray-400">
                  Network {connectionHealth ? "stable" : "unstable"}
                </div>
              </div>
            </div>

            {/* Duplicate Prevention Status */}
            <div className="flex items-center gap-3">
              <Shield
                className={`w-4 h-4 ${backendStatus.sheets_available ? "text-blue-400" : "text-gray-500"}`}
              />
              <div>
                <div
                  className={`font-medium ${backendStatus.sheets_available ? "text-blue-400" : "text-gray-400"}`}
                >
                  Duplicate Prevention{" "}
                  {backendStatus.sheets_available ? "Active" : "Offline"}
                </div>
                <div className="text-xs text-gray-400">
                  {backendStatus.sheets_available
                    ? `${backendStatus.existing_urls_count} posts tracked`
                    : "No tracking available"}
                </div>
              </div>
            </div>

            {/* OpenAI Status */}
            <div className="flex items-center gap-3">
              <Bot
                className={`w-4 h-4 ${backendStatus.openai_available ? "text-purple-400" : "text-gray-500"}`}
              />
              <div>
                <div
                  className={`font-medium ${backendStatus.openai_available ? "text-purple-400" : "text-gray-400"}`}
                >
                  AI Analysis{" "}
                  {backendStatus.openai_available ? "Ready" : "Unavailable"}
                </div>
                <div className="text-xs text-gray-400">
                  OpenAI GPT-4 Vision{" "}
                  {backendStatus.openai_available ? "connected" : "offline"}
                </div>
              </div>
            </div>

            {/* Google Sheets Status */}
            <div className="flex items-center gap-3">
              <Database
                className={`w-4 h-4 ${backendStatus.sheets_available ? "text-green-400" : "text-gray-500"}`}
              />
              <div>
                <div
                  className={`font-medium ${backendStatus.sheets_available ? "text-green-400" : "text-gray-400"}`}
                >
                  Google Sheets{" "}
                  {backendStatus.sheets_available ? "Connected" : "Offline"}
                </div>
                <div className="text-xs text-gray-400">
                  {backendStatus.sheets_available
                    ? `${backendStatus.posts_count} posts stored`
                    : "No data access"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Input Section with Force Re-scrape Option */}
        <div className="bg-white/5 dark:bg-gray-800/20 backdrop-blur-sm border border-white/10 dark:border-gray-700/20 rounded-2xl p-6">
          <div className="space-y-4">
            {/* Username Input */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Instagram Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username (without @)"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 dark:bg-gray-700/30 border border-white/20 dark:border-gray-600/30 text-gray-800 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="sm:self-end flex gap-3">
                <button
                  onClick={handleScrapeWithPreflightCheck}
                  disabled={
                    isLoading || !username.trim() || !backendStatus.connected
                  }
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : forceRescrape ? (
                    <RotateCcw className="w-5 h-5" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                  {isLoading
                    ? "Scraping..."
                    : forceRescrape
                      ? "Force Scrape"
                      : "Smart Scrape"}
                </button>

                {/* Clear Data Button */}
                <button
                  onClick={() => setShowClearDataModal(true)}
                  disabled={
                    isLoading ||
                    !backendStatus.connected ||
                    (images.length === 0 && results.length === 0)
                  }
                  className="px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
                  title="Clear all downloaded images and Google Sheets data"
                >
                  <Trash2 className="w-5 h-5" />
                  Clear Data
                </button>
              </div>
            </div>

            {/* Force Re-scrape Toggle */}
            <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl">
              <div className="flex items-center gap-3">
                <RotateCcw className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <div>
                  <div className="font-medium text-amber-800 dark:text-amber-200">
                    Force Re-scrape Mode
                  </div>
                  <div className="text-sm text-amber-700 dark:text-amber-300">
                    {forceRescrape
                      ? "Will re-scrape all posts (including existing ones)"
                      : "Smart mode: Only scrapes new posts to avoid duplicates"}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setForceRescrape(!forceRescrape)}
                disabled={isLoading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  forceRescrape
                    ? "bg-amber-500"
                    : "bg-gray-300 dark:bg-gray-600"
                } disabled:opacity-50`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    forceRescrape ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Progress Indicator for Long Operations */}
        {isLoading && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <div className="absolute inset-0 w-8 h-8 border-2 border-blue-500/30 rounded-full animate-pulse"></div>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                    Scraping in Progress
                  </h3>
                  <div className="bg-blue-500/20 px-2 py-1 rounded text-xs text-blue-600 dark:text-blue-400">
                    This may take 3-5 minutes
                  </div>
                </div>

                <div className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  Processing @{username} - Downloading images and analyzing with
                  AI...
                </div>

                {/* Progress Steps */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Connected to Instagram
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {backendStatus.openai_available ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                    )}
                    <span className="text-gray-600 dark:text-gray-400">
                      AI Analysis{" "}
                      {backendStatus.openai_available ? "Active" : "Limited"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                    <span className="text-blue-600 dark:text-blue-400">
                      Processing posts and images...
                    </span>
                  </div>
                </div>

                {/* Helpful Tips */}
                <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-800/30 rounded-lg">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    💡 <strong>Tip:</strong> The process continues even if the
                    page shows an error. Check the "Downloaded Images" section
                    below for real-time updates.
                  </p>
                </div>
              </div>
            </div>

            {/* Cancel Button (Optional) */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setIsLoading(false);
                  setStatus(
                    "⚠️ Scraping may still be running in background. Check images section for updates."
                  );
                }}
                className="px-4 py-2 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Hide Progress (Keep Running)
              </button>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {(status || error) && (
          <div className="space-y-2">
            {status && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-green-700 dark:text-green-400">
                  {status}
                </span>
              </div>
            )}

            {error && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-red-700 dark:text-red-400">
                    {error}
                  </span>
                </div>

                {/* Enhanced Error Recovery Section */}
                {error &&
                  (error.includes("Connection lost") ||
                    error.includes("Failed to fetch") ||
                    error.includes("timeout")) && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800/30 rounded-full flex items-center justify-center">
                            <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                            Background Processing Active
                          </h4>
                          <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2 mb-4">
                            <p>
                              ✅ The scraping is likely still running on the
                              server
                            </p>
                            <p>
                              ✅ Data will be automatically saved to Google
                              Sheets
                            </p>
                            <p>✅ Images will appear as they're processed</p>
                            {lastDataRefresh && (
                              <p>
                                📅 Last refresh:{" "}
                                {lastDataRefresh.toLocaleTimeString()}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={manualDataRefresh}
                              disabled={isLoadingImages}
                              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                            >
                              {isLoadingImages ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <RefreshCw className="w-4 h-4" />
                              )}
                              Check Now
                            </button>

                            <button
                              onClick={() => {
                                startAutoMonitoring();
                                setError(""); // Clear the error to reduce visual clutter
                              }}
                              disabled={autoRefreshInterval !== null}
                              className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              {autoRefreshInterval
                                ? "Monitoring..."
                                : "Start Auto-Monitor"}
                            </button>

                            <button
                              onClick={async () => {
                                setError("");
                                setStatus("");
                                if (autoRefreshInterval) {
                                  clearInterval(autoRefreshInterval);
                                  setAutoRefreshInterval(null);
                                }
                              }}
                              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              Clear Messages
                            </button>
                          </div>

                          {autoRefreshInterval && (
                            <div className="mt-3 p-2 bg-green-100 dark:bg-green-900/30 rounded text-xs text-green-800 dark:text-green-300">
                              🔍 Auto-monitoring active - checking every minute
                              for new images
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}

        {/* Enhanced Stats Section with Duplicate Prevention Stats */}
        {(results.length > 0 || stats.total_checked > 0) && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="bg-white/5 dark:bg-gray-800/20 backdrop-blur-sm border border-white/10 dark:border-gray-700/20 rounded-xl p-4 text-center">
              <Eye className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-800 dark:text-white">
                {stats.total_checked}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Posts Checked
              </div>
            </div>
            <div className="bg-white/5 dark:bg-gray-800/20 backdrop-blur-sm border border-white/10 dark:border-gray-700/20 rounded-xl p-4 text-center">
              <Plus className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-800 dark:text-white">
                {stats.new_posts}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                New Posts
              </div>
            </div>
            <div className="bg-white/5 dark:bg-gray-800/20 backdrop-blur-sm border border-white/10 dark:border-gray-700/20 rounded-xl p-4 text-center">
              <SkipForward className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-800 dark:text-white">
                {stats.skipped_posts}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Skipped (Existing)
              </div>
            </div>
            <div className="bg-white/5 dark:bg-gray-800/20 backdrop-blur-sm border border-white/10 dark:border-gray-700/20 rounded-xl p-4 text-center">
              <Image className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-800 dark:text-white">
                {stats.images_downloaded}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Images Downloaded
              </div>
            </div>
            <div className="bg-white/5 dark:bg-gray-800/20 backdrop-blur-sm border border-white/10 dark:border-gray-700/20 rounded-xl p-4 text-center">
              <Bot className="w-8 h-8 text-cyan-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-800 dark:text-white">
                {stats.ai_analyses_completed}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                AI Analyses
              </div>
            </div>
          </div>
        )}

        {/* Efficiency Banner */}
        {stats.skipped_posts > 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
              <div>
                <div className="font-semibold text-green-800 dark:text-green-200">
                  Duplicate Prevention Active!
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">
                  Saved time by skipping {stats.skipped_posts} posts that were
                  already scraped. Only processed {stats.new_posts} new posts.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Previously Downloaded Images with Auto-Refresh Indicator */}
        {images.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  Downloaded Images ({images.length})
                </h2>
                {backendStatus.sheets_available && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-1 text-xs text-blue-400">
                    Auto-Refresh Active
                  </div>
                )}
                {isLoadingImages && (
                  <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-1 text-xs text-yellow-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Loading new images...
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  loadImages();
                  checkSheetsStatus();
                }}
                disabled={isLoadingImages}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoadingImages ? "animate-spin" : ""}`}
                />
                {isLoadingImages ? "Loading..." : "Refresh"}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {images.map((image, index) => (
                <div
                  key={index}
                  className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer hover:ring-2 hover:ring-pink-500/50 transition-all"
                  onClick={async () => await handleImageClick(image)}
                >
                  <img
                    src={`${IMAGE_BASE}${image.url}`}
                    alt={image.filename}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const parent = e.currentTarget.parentElement;
                      if (
                        parent &&
                        !parent.querySelector(".error-placeholder")
                      ) {
                        const errorDiv = document.createElement("div");
                        errorDiv.className =
                          "error-placeholder w-full h-full flex items-center justify-center flex-col gap-1 p-2";
                        errorDiv.innerHTML = `
                          <div class="w-8 h-8 text-red-400">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">
                              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                              <circle cx="9" cy="9" r="2"/>
                              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                            </svg>
                          </div>
                          <span class="text-xs text-gray-500 text-center">${image.filename}</span>
                        `;
                        parent.appendChild(errorDiv);
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors">
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-pink-500/90 dark:bg-pink-600/90 rounded-lg px-3 py-2 text-sm font-medium text-white">
                        <Eye className="w-4 h-4 inline mr-2" />
                        View Details
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="text-xs text-white bg-black/50 rounded px-2 py-1 truncate">
                        {image.filename} ({image.size})
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clear Data Confirmation Modal */}
        {showClearDataModal &&
          isMounted &&
          createPortal(
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
              onClick={() => setShowClearDataModal(false)}
            >
              <div
                className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center gap-3 p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Clear All Data
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      This action cannot be undone
                    </p>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-6">
                  <div className="space-y-4">
                    <p className="text-gray-700 dark:text-gray-300">
                      This will permanently delete:
                    </p>

                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg p-4">
                      <ul className="space-y-2 text-sm text-red-800 dark:text-red-300">
                        <li className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" />
                          <span>
                            All {images.length} downloaded images from the
                            server
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Database className="w-4 h-4" />
                          <span>
                            All {backendStatus.posts_count} posts from Google
                            Sheets
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Bot className="w-4 h-4" />
                          <span>All AI analysis data</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          <span>Duplicate prevention tracking data</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-lg p-3">
                      <p className="text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span>
                          This action cannot be undone. Make sure you have
                          backups if needed.
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex gap-3 p-6 pt-0">
                  <button
                    onClick={() => setShowClearDataModal(false)}
                    disabled={isClearingData}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClearData}
                    disabled={isClearingData}
                    className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isClearingData ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Clearing...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Delete Everything
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

        {/* Enhanced Full-Screen Image Detail Modal */}
        {showImageModal &&
          selectedImageData &&
          isMounted &&
          createPortal(
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
              onClick={() => setShowImageModal(false)}
            >
              {/* Modal Container */}
              <div
                className="bg-gray-900 rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden relative"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close button */}
                <button
                  onClick={() => setShowImageModal(false)}
                  className="absolute top-4 right-4 z-10 p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>

                {/* Content */}
                <div className="flex h-full max-h-[90vh]">
                  {/* Left side - Image */}
                  <div className="w-3/5 p-6 flex items-center justify-center bg-gray-800">
                    <div className="relative max-w-full max-h-full">
                      <img
                        src={`${IMAGE_BASE}${selectedImageData.image.url}`}
                        alt={selectedImageData.image.filename}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                      />
                    </div>
                  </div>

                  {/* Right side - Details panel */}
                  <div className="w-2/5 bg-gray-850 border-l border-gray-700 overflow-y-auto">
                    <div className="p-6 space-y-6">
                      {/* Header */}
                      <div className="border-b border-gray-700 pb-4">
                        <h3 className="text-2xl font-bold text-white mb-2">
                          Image Details
                        </h3>
                        <p className="text-gray-400 text-sm">
                          Post information and AI analysis
                        </p>
                      </div>

                      {/* Loading State */}
                      {selectedImageData.post === undefined && (
                        <div className="bg-blue-900/30 border border-blue-700/50 rounded-xl p-4">
                          <div className="flex items-center gap-3 text-blue-400 mb-3">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="font-medium">
                              Loading post data...
                            </span>
                          </div>
                          <p className="text-blue-300 text-sm">
                            Searching for associated post information...
                          </p>
                        </div>
                      )}

                      {/* Post Data Found */}
                      {selectedImageData.post &&
                      selectedImageData.post !== null ? (
                        <>
                          {/* Post Info */}
                          <div className="bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-700">
                            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                              <User className="w-5 h-5 text-blue-400" />
                              Post Information
                            </h4>

                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-sm">
                                  Username
                                </span>
                                <span className="bg-gradient-to-r from-pink-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                                  @{selectedImageData.post.username}
                                </span>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-sm flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  Date
                                </span>
                                <span className="text-white text-sm font-medium">
                                  {new Date(
                                    selectedImageData.post.timestamp
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-sm flex items-center gap-1">
                                  <Heart className="w-4 h-4 text-red-400" />
                                  Likes
                                </span>
                                <span className="text-white font-semibold">
                                  {selectedImageData.post.likes.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* AI Analysis */}
                          <div className="bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-700">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Bot className="w-5 h-5 text-purple-400" />
                                AI Analysis
                              </h4>
                              {selectedImageData.post.ai_analysis &&
                                selectedImageData.post.ai_analysis !==
                                  "No analysis" &&
                                selectedImageData.post.ai_analysis.trim() && (
                                  <button
                                    onClick={() =>
                                      copyToClipboard(
                                        selectedImageData.post!.ai_analysis
                                      )
                                    }
                                    className="flex items-center gap-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-400 text-sm transition-colors"
                                  >
                                    <Copy className="w-4 h-4" />
                                    Copy
                                  </button>
                                )}
                            </div>
                            {selectedImageData.post.ai_analysis &&
                            selectedImageData.post.ai_analysis !==
                              "No analysis" &&
                            selectedImageData.post.ai_analysis.trim() ? (
                              <div className="text-gray-300 bg-purple-900/30 rounded-lg p-4 text-sm leading-relaxed max-h-40 overflow-y-auto border border-purple-700/30">
                                {selectedImageData.post.ai_analysis}
                              </div>
                            ) : (
                              <div className="text-gray-400 bg-gray-700/50 rounded-lg p-4 text-sm text-center italic">
                                <Bot className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                                No AI analysis available
                              </div>
                            )}
                          </div>
                        </>
                      ) : selectedImageData.post === null ? (
                        <>
                          {/* No Post Data */}
                          <div className="bg-amber-900/30 border border-amber-700/50 rounded-xl p-5">
                            <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                              <AlertTriangle className="w-5 h-5 text-amber-400" />
                              No Post Data Found
                            </h4>
                            <p className="text-amber-200 text-sm mb-3">
                              This image might be from a previous session or the
                              post data couldn't be matched.
                            </p>
                            <div className="bg-amber-800/30 rounded-lg p-3">
                              <p className="text-amber-300 text-sm font-medium text-center">
                                💡 You can still use this image for
                                transformation!
                              </p>
                            </div>
                          </div>

                          {/* File Info */}
                          <div className="bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-700">
                            <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                              <ImageIcon className="w-5 h-5 text-gray-400" />
                              File Details
                            </h4>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-sm">
                                  Filename
                                </span>
                                <span className="text-white font-mono text-sm bg-gray-700 px-2 py-1 rounded">
                                  {selectedImageData.image.filename}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-sm">
                                  Size
                                </span>
                                <span className="text-white font-medium text-sm">
                                  {selectedImageData.image.size}
                                </span>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : null}

                      {/* Action Buttons */}
                      <div className="space-y-3 pt-4 border-t border-gray-700">
                        <button
                          onClick={handlePushToImageToImage}
                          className="w-full bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white py-3 px-6 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-3 shadow-sm hover:shadow-md"
                        >
                          <ArrowRight className="w-5 h-5" />
                          Push to Image-to-Image
                          {selectedImageData.post?.ai_analysis &&
                            selectedImageData.post.ai_analysis !==
                              "No analysis" &&
                            selectedImageData.post.ai_analysis.trim() && (
                              <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                                with AI prompt
                              </span>
                            )}
                        </button>

                        {selectedImageData.post && (
                          <a
                            href={selectedImageData.post.post_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <ExternalLink className="w-5 h-5" />
                            View Original Post
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}
      </div>
    </div>
  );
}
