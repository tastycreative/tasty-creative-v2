"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { io, Socket } from "socket.io-client"; // NEW: Socket.IO client
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
  Wifi,
  WifiOff,
  Zap,
  Activity,
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

// NEW: Real-time update interfaces
interface RealtimeProgress {
  current: number;
  total: number;
  percentage: number;
  message: string;
}

interface RealtimeUpdate {
  type: string;
  message: string;
  timestamp: string;
  data?: any;
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

  // NEW: WebSocket and real-time state
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [realtimeProgress, setRealtimeProgress] =
    useState<RealtimeProgress | null>(null);
  const [realtimeUpdates, setRealtimeUpdates] = useState<RealtimeUpdate[]>([]);
  const [showRealtimePanel, setShowRealtimePanel] = useState(false);
  const [isScrapingActive, setIsScrapingActive] = useState(false);

  // Refs for auto-scrolling
  const realtimeUpdatesRef = useRef<HTMLDivElement>(null);

  // Updated to use your Cloudflare tunnel URL
  const API_BASE =
    "https://grip-terrible-documented-paul.trycloudflare.com/api";
  const IMAGE_BASE = "https://grip-terrible-documented-paul.trycloudflare.com"; // For serving images
  const WEBSOCKET_BASE =
    "https://grip-terrible-documented-paul.trycloudflare.com"; // For WebSocket

  // NEW: Initialize WebSocket connection
  useEffect(() => {
    const initWebSocket = () => {
      console.log("🔌 Initializing WebSocket connection...");

      const newSocket = io(WEBSOCKET_BASE, {
        transports: ["websocket", "polling"],
        upgrade: true,
        rememberUpgrade: true,
      });

      // Connection events
      newSocket.on("connect", () => {
        console.log("✅ WebSocket connected");
        setIsWebSocketConnected(true);
        setSocket(newSocket);

        // Request current status
        newSocket.emit("request_status");

        addRealtimeUpdate({
          type: "connection",
          message: "🔌 Connected to real-time updates",
          timestamp: new Date().toISOString(),
        });
      });

      newSocket.on("disconnect", () => {
        console.log("❌ WebSocket disconnected");
        setIsWebSocketConnected(false);

        addRealtimeUpdate({
          type: "connection",
          message: "🔌 Disconnected from real-time updates",
          timestamp: new Date().toISOString(),
        });
      });

      newSocket.on("connect_error", (error) => {
        console.error("WebSocket connection error:", error);
        setIsWebSocketConnected(false);

        addRealtimeUpdate({
          type: "error",
          message: "❌ WebSocket connection failed",
          timestamp: new Date().toISOString(),
        });
      });

      // Real-time scraping events
      newSocket.on("scraping_started", (data) => {
        console.log("🚀 Scraping started:", data);
        setIsScrapingActive(true);
        setShowRealtimePanel(true);
        setRealtimeProgress(null);
        setRealtimeUpdates([]); // Clear previous updates

        addRealtimeUpdate({
          type: "scraping_started",
          message: `🚀 Started scraping @${data.username}`,
          timestamp: data.timestamp,
          data,
        });
      });

      newSocket.on("apify_request_started", (data) => {
        addRealtimeUpdate({
          type: "apify_request",
          message: `📤 ${data.message}`,
          timestamp: new Date().toISOString(),
          data,
        });
      });

      newSocket.on("apify_actor_attempt", (data) => {
        addRealtimeUpdate({
          type: "apify_actor",
          message: `🔗 ${data.message}`,
          timestamp: new Date().toISOString(),
          data,
        });
      });

      newSocket.on("apify_actor_success", (data) => {
        addRealtimeUpdate({
          type: "apify_success",
          message: `✅ ${data.message}`,
          timestamp: new Date().toISOString(),
          data,
        });
      });

      newSocket.on("posts_found", (data) => {
        addRealtimeUpdate({
          type: "posts_found",
          message: `🎯 ${data.message}`,
          timestamp: new Date().toISOString(),
          data,
        });
      });

      newSocket.on("processing_progress", (data) => {
        setRealtimeProgress(data);

        // Update stats in real-time
        setStats((prevStats) => ({
          ...prevStats,
          total_checked: data.total,
        }));
      });

      newSocket.on("duplicate_skipped", (data) => {
        addRealtimeUpdate({
          type: "duplicate",
          message: `⏭️ ${data.message} (duplicate)`,
          timestamp: new Date().toISOString(),
          data,
        });

        // Update stats
        setStats((prevStats) => ({
          ...prevStats,
          skipped_posts: prevStats.skipped_posts + 1,
        }));
      });

      newSocket.on("image_download_started", (data) => {
        addRealtimeUpdate({
          type: "image_download",
          message: `⬇️ ${data.message}`,
          timestamp: new Date().toISOString(),
          data,
        });
      });

      newSocket.on("image_downloaded", (data) => {
        addRealtimeUpdate({
          type: "image_success",
          message: `${data.message} (${data.image_info?.size})`,
          timestamp: new Date().toISOString(),
          data,
        });

        // Update stats and images list in real-time
        setStats((prevStats) => ({
          ...prevStats,
          images_downloaded: data.total_downloaded,
        }));

        // Add new image to the list
        if (data.image_info) {
          setImages((prevImages) => {
            const newImage: DownloadedImage = {
              filename: data.image_info.filename,
              url: data.image_info.url,
              size: data.image_info.size,
              path: data.filename,
            };

            // Check if image already exists to avoid duplicates
            const exists = prevImages.some(
              (img) => img.filename === newImage.filename
            );
            if (!exists) {
              return [newImage, ...prevImages];
            }
            return prevImages;
          });
        }
      });

      newSocket.on("image_download_failed", (data) => {
        addRealtimeUpdate({
          type: "image_error",
          message: `${data.message}`,
          timestamp: new Date().toISOString(),
          data,
        });
      });

      newSocket.on("ai_analysis_started", (data) => {
        addRealtimeUpdate({
          type: "ai_analysis",
          message: `${data.message}`,
          timestamp: new Date().toISOString(),
          data,
        });
      });

      newSocket.on("ai_analysis_completed", (data) => {
        addRealtimeUpdate({
          type: "ai_success",
          message: `${data.message}`,
          timestamp: new Date().toISOString(),
          data,
        });

        // Update stats
        setStats((prevStats) => ({
          ...prevStats,
          ai_analyses_completed: data.total_completed,
        }));
      });

      newSocket.on("ai_analysis_fallback", (data) => {
        addRealtimeUpdate({
          type: "ai_warning",
          message: `${data.message}`,
          timestamp: new Date().toISOString(),
          data,
        });
      });

      newSocket.on("added_to_sheets", (data) => {
        addRealtimeUpdate({
          type: "sheets",
          message: `${data.message}`,
          timestamp: new Date().toISOString(),
          data,
        });
      });

      newSocket.on("post_completed", (data) => {
        addRealtimeUpdate({
          type: "post_complete",
          message: `${data.message}`,
          timestamp: new Date().toISOString(),
          data,
        });

        // Update stats and results
        setStats(data.stats);

        // Add the new post to results
        setResults((prevResults) => {
          const exists = prevResults.some(
            (post) => post.post_url === data.post_data.post_url
          );
          if (!exists) {
            return [...prevResults, data.post_data];
          }
          return prevResults;
        });
      });

      newSocket.on("scraping_completed", (data) => {
        console.log("🎉 Scraping completed:", data);
        setIsScrapingActive(false);
        setRealtimeProgress(null);
        setIsLoading(false);

        addRealtimeUpdate({
          type: "scraping_complete",
          message: `🎉 ${data.message}`,
          timestamp: data.timestamp,
          data,
        });

        // Final stats update
        setStats(data.stats);
        setStatus(data.message);

        // Auto-close realtime panel after 10 seconds
        setTimeout(() => {
          setShowRealtimePanel(false);
        }, 10000);
      });

      newSocket.on("scraping_failed", (data) => {
        console.log("❌ Scraping failed:", data);
        setIsScrapingActive(false);
        setRealtimeProgress(null);
        setIsLoading(false);
        setError(data.error);

        addRealtimeUpdate({
          type: "scraping_error",
          message: `❌ Scraping failed: ${data.error}`,
          timestamp: data.timestamp,
          data,
        });
      });

      newSocket.on("scraping_warning", (data) => {
        addRealtimeUpdate({
          type: "warning",
          message: `⚠️ ${data.warning}`,
          timestamp: new Date().toISOString(),
          data,
        });
      });

      newSocket.on("scraping_error", (data) => {
        console.log("❌ Scraping error:", data);
        setIsScrapingActive(false);
        setRealtimeProgress(null);
        setIsLoading(false);
        setError(data.error);

        addRealtimeUpdate({
          type: "scraping_error",
          message: `❌ Error: ${data.error}`,
          timestamp: data.timestamp,
          data,
        });
      });

      // Data clearing events
      newSocket.on("clearing_started", (data) => {
        addRealtimeUpdate({
          type: "clearing",
          message: `🗑️ ${data.message}`,
          timestamp: data.timestamp,
          data,
        });
      });

      newSocket.on("image_deleted", (data) => {
        // Remove image from local state
        setImages((prevImages) =>
          prevImages.filter((img) => img.filename !== data.filename)
        );
      });

      newSocket.on("clearing_completed", (data) => {
        addRealtimeUpdate({
          type: "clearing_complete",
          message: `✅ ${data.message}`,
          timestamp: data.timestamp,
          data,
        });

        // Reset all state
        setResults([]);
        setImages([]);
        setStats({
          total_checked: 0,
          new_posts: 0,
          skipped_posts: 0,
          images_downloaded: 0,
          ai_analyses_completed: 0,
        });
      });

      // Status updates
      newSocket.on("status_update", (data) => {
        setBackendStatus((prev) => ({
          ...prev,
          openai_available: data.openai_available,
          sheets_available: data.sheets_available,
        }));
      });

      return newSocket;
    };

    const socketInstance = initWebSocket();

    // Cleanup on unmount
    return () => {
      if (socketInstance) {
        console.log("🔌 Cleaning up WebSocket connection");
        socketInstance.disconnect();
      }
    };
  }, []);

  // NEW: Test WebSocket connection function
  const testWebSocketConnection = async () => {
    console.log("🧪 Testing WebSocket connection...");

    try {
      // Test basic HTTP connection first
      const response = await fetch(`${API_BASE}/test`);
      const data = await response.json();
      console.log("✅ HTTP connection works:", data.success);

      // Test if server supports WebSocket
      if (data.websocket_available) {
        console.log("✅ Server reports WebSocket support available");
      } else {
        console.warn("⚠️ Server doesn't report WebSocket support");
      }

      // Check the specific WebSocket URL
      console.log("🔍 WebSocket URL:", WEBSOCKET_BASE);
      console.log("🔍 Attempting connection with polling first...");
    } catch (error) {
      console.error("❌ HTTP connection test failed:", error);
      setError(
        "Cannot connect to backend. WebSocket connection will also fail."
      );
    }
  };

  // Test connection on mount
  useEffect(() => {
    testWebSocketConnection();
  }, []);

  // NEW: Helper function to add real-time updates
  const addRealtimeUpdate = (update: RealtimeUpdate) => {
    setRealtimeUpdates((prev) => {
      const newUpdates = [update, ...prev];
      // Keep only last 50 updates to prevent memory issues
      return newUpdates.slice(0, 50);
    });
  };

  // NEW: Auto-scroll to bottom of realtime updates
  useEffect(() => {
    if (realtimeUpdatesRef.current) {
      realtimeUpdatesRef.current.scrollTop = 0; // Scroll to top since we're prepending
    }
  }, [realtimeUpdates]);

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
          "✅ Connected to enhanced scraper backend with WebSocket real-time updates"
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

  // Enhanced handleScrape with WebSocket integration (no timeout)
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

    // Show real-time panel
    setShowRealtimePanel(true);
    setRealtimeUpdates([]);

    try {
      setStatus(
        "🤖 Processing posts and analyzing with AI... Watch the real-time panel for live updates!"
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
      });

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
        // Only update if we don't have real-time data already
        if (!isScrapingActive) {
          setResults(data.data);
          setStats(data.stats);
          setStatus(`✅ ${data.message}`);
        }
      } else {
        setError(data.message || "Scraping failed");
      }
    } catch (err: any) {
      console.error("Scraping error:", err);

      // Only show error if WebSocket didn't handle it
      if (!isWebSocketConnected) {
        // Handle different types of errors more specifically
        if (err.name === "AbortError") {
          setError(
            "⏱️ Request was aborted. The scraping might still be running in the background."
          );
          setStatus("⚠️ Checking for completed data...");
        } else if (
          err.message?.includes("Failed to fetch") ||
          err.name === "TypeError"
        ) {
          setError(
            "🌐 Connection lost during scraping. The process is likely still running on the server."
          );
          setStatus("⚠️ Don't worry! Checking for completed data...");
        } else {
          const errorMessage = err.message || "Unknown error occurred";
          setError(
            `❌ Error: ${errorMessage}. The scraping might still be running.`
          );
        }
      }
    } finally {
      // Don't set loading to false immediately if WebSocket is handling updates
      if (!isWebSocketConnected || !isScrapingActive) {
        setTimeout(() => {
          setIsLoading(false);
        }, 1000);
      }
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
        // If WebSocket is not connected, manually reset state
        if (!isWebSocketConnected) {
          setResults([]);
          setImages([]);
          setStats({
            total_checked: 0,
            new_posts: 0,
            skipped_posts: 0,
            images_downloaded: 0,
            ai_analyses_completed: 0,
          });
        }
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

  // NEW: Get update type styling
  const getUpdateTypeStyle = (type: string) => {
    switch (type) {
      case "connection":
        return "text-pink-400 bg-pink-500/10 border-pink-500/20";
      case "scraping_started":
      case "scraping_complete":
        return "text-pink-400 bg-pink-500/10 border-pink-500/20";
      case "apify_success":
      case "image_success":
      case "ai_success":
      case "post_complete":
        return "text-pink-400 bg-pink-500/10 border-pink-500/20";
      case "apify_request":
      case "apify_actor":
      case "image_download":
      case "ai_analysis":
        return "text-pink-400 bg-pink-500/10 border-pink-500/20";
      case "duplicate":
        return "text-pink-400 bg-pink-500/10 border-pink-500/20";
      case "warning":
      case "ai_warning":
        return "text-pink-400 bg-pink-500/10 border-pink-500/20";
      case "scraping_error":
      case "image_error":
        return "text-red-400 bg-red-500/10 border-red-500/20";
      case "sheets":
        return "text-pink-400 bg-pink-500/10 border-pink-500/20";
      case "clearing":
      case "clearing_complete":
        return "text-gray-400 bg-gray-500/10 border-gray-500/20";
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/20";
    }
  };

  return (
    <div className="w-full h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500/10 to-rose-500/10 border border-pink-500/20">
            <Download className="w-5 h-5 text-pink-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Enhanced AI-Powered Instagram Scraper with Real-time Updates
            </span>
            {/* NEW: WebSocket status indicator */}
            <div className="flex items-center gap-1">
              {isWebSocketConnected ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <span
                className={`text-xs ${isWebSocketConnected ? "text-green-500" : "text-red-500"}`}
              >
                {isWebSocketConnected ? "Live" : "Offline"}
              </span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Smart Instagram Content Analyzer
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Extract images from Instagram profiles with intelligent duplicate
            prevention and real-time progress tracking. Only scrapes new
            content, analyzes with AI, and seamlessly transfers to
            Image-to-Image generation.
          </p>
        </div>

        {/* Enhanced Status Bar with WebSocket Connection Health */}
        <div className="bg-white/80 backdrop-blur-sm border border-pink-200 rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Backend Connection */}
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${backendStatus.connected ? "bg-pink-400 animate-pulse" : "bg-red-400"}`}
              ></div>
              <div>
                <div
                  className={`font-medium ${backendStatus.connected ? "text-pink-600" : "text-red-400"}`}
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

            {/* NEW: WebSocket Connection */}
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${isWebSocketConnected ? "bg-pink-400 animate-pulse" : "bg-red-400"}`}
              ></div>
              <div>
                <div
                  className={`font-medium ${isWebSocketConnected ? "text-pink-600" : "text-red-400"}`}
                >
                  Real-time {isWebSocketConnected ? "Active" : "Offline"}
                </div>
                <div className="text-xs text-gray-400">
                  WebSocket{" "}
                  {isWebSocketConnected ? "connected" : "disconnected"}
                </div>
              </div>
            </div>

            {/* Connection Health */}
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${connectionHealth ? "bg-pink-400 animate-pulse" : "bg-orange-400"}`}
              ></div>
              <div>
                <div
                  className={`font-medium ${connectionHealth ? "text-pink-600" : "text-orange-400"}`}
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
                className={`w-4 h-4 ${backendStatus.sheets_available ? "text-pink-400" : "text-gray-500"}`}
              />
              <div>
                <div
                  className={`font-medium ${backendStatus.sheets_available ? "text-pink-600" : "text-gray-400"}`}
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
                className={`w-4 h-4 ${backendStatus.openai_available ? "text-pink-400" : "text-gray-500"}`}
              />
              <div>
                <div
                  className={`font-medium ${backendStatus.openai_available ? "text-pink-600" : "text-gray-400"}`}
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
                className={`w-4 h-4 ${backendStatus.sheets_available ? "text-pink-400" : "text-gray-500"}`}
              />
              <div>
                <div
                  className={`font-medium ${backendStatus.sheets_available ? "text-pink-600" : "text-gray-400"}`}
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
        <div className="bg-white/80 backdrop-blur-sm border border-pink-200 rounded-2xl p-6">
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

                {/* NEW: Real-time Panel Toggle */}
                {(isScrapingActive || realtimeUpdates.length > 0) && (
                  <button
                    onClick={() => setShowRealtimePanel(!showRealtimePanel)}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                      showRealtimePanel
                        ? "bg-pink-500 hover:bg-pink-600 text-white"
                        : "bg-gray-500 hover:bg-gray-600 text-white"
                    }`}
                  >
                    {isScrapingActive ? (
                      <Activity className="w-5 h-5 animate-pulse" />
                    ) : (
                      <Zap className="w-5 h-5" />
                    )}
                    {showRealtimePanel ? "Hide" : "Show"} Live Updates
                  </button>
                )}

                {/* Clear Data Button */}
                <button
                  onClick={() => setShowClearDataModal(true)}
                  disabled={
                    isLoading ||
                    !backendStatus.connected ||
                    (images.length === 0 && results.length === 0)
                  }
                  className="px-6 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
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

        {/* NEW: Real-time Updates Panel */}
        {showRealtimePanel && (
          <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden">
            {/* Panel Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${isScrapingActive ? "bg-green-400 animate-pulse" : "bg-gray-400"}`}
                ></div>
                <h3 className="text-lg font-semibold text-white">
                  Real-time Updates
                </h3>
                {isScrapingActive && (
                  <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-medium">
                    LIVE
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowRealtimePanel(false)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Progress Bar */}
            {realtimeProgress && (
              <div className="p-4 border-b border-gray-700 bg-gray-850">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-300">
                    {realtimeProgress.message}
                  </span>
                  <span className="text-sm font-mono text-blue-400">
                    {realtimeProgress.percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-pink-500 to-rose-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${realtimeProgress.percentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>
                    Processing {realtimeProgress.current} of{" "}
                    {realtimeProgress.total}
                  </span>
                  <span>
                    {realtimeProgress.total - realtimeProgress.current}{" "}
                    remaining
                  </span>
                </div>
              </div>
            )}

            {/* Updates List */}
            <div
              ref={realtimeUpdatesRef}
              className="h-64 overflow-y-auto p-4 space-y-2"
            >
              {realtimeUpdates.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Waiting for real-time updates...</p>
                  <p className="text-xs mt-1">
                    Updates will appear here during scraping
                  </p>
                </div>
              ) : (
                realtimeUpdates.map((update, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border text-sm ${getUpdateTypeStyle(update.type)}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex-1">{update.message}</span>
                      <span className="text-xs opacity-60 whitespace-nowrap">
                        {new Date(update.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Panel Footer */}
            <div className="p-3 border-t border-gray-700 bg-gray-800">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Updates: {realtimeUpdates.length}</span>
                <span>
                  WebSocket:{" "}
                  {isWebSocketConnected ? "🟢 Connected" : "🔴 Disconnected"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Progress Indicator for Long Operations - Updated with WebSocket integration */}
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
                  <div className="bg-green-500/20 px-2 py-1 rounded text-xs text-green-600 dark:text-green-400">
                    Real-time updates enabled
                  </div>
                </div>

                <div className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  Processing @{username} - Watch the real-time panel for live
                  updates...
                </div>

                {/* Progress Steps */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Connected to Instagram via Apify
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {isWebSocketConnected ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                    )}
                    <span className="text-gray-600 dark:text-gray-400">
                      Real-time Updates{" "}
                      {isWebSocketConnected ? "Active" : "Limited"}
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

                {/* Enhanced Tips */}
                <div className="mt-4 p-3 bg-green-100 dark:bg-green-800/30 rounded-lg">
                  <p className="text-xs text-green-700 dark:text-green-300">
                    💡 <strong>Real-time Updates:</strong> Watch the "Real-time
                    Updates" panel above for live progress. Images will appear
                    in the gallery as they're downloaded!
                  </p>
                </div>
              </div>
            </div>

            {/* Cancel Button */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setIsLoading(false);
                  setStatus(
                    "⚠️ Scraping may still be running in background. Check real-time panel for updates."
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

                {/* Enhanced Error Recovery Section - Show only if WebSocket is not handling updates */}
                {error &&
                  !isWebSocketConnected &&
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

        {/* Enhanced Stats Section with Real-time Updates */}
        {(results.length > 0 || stats.total_checked > 0) && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="bg-white/5 dark:bg-gray-800/20 backdrop-blur-sm border border-white/10 dark:border-gray-700/20 rounded-xl p-4 text-center">
              <Eye className="w-8 h-8 text-pink-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-800 dark:text-white">
                {stats.total_checked}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Posts Checked
              </div>
            </div>
            <div className="bg-white/5 dark:bg-gray-800/20 backdrop-blur-sm border border-white/10 dark:border-gray-700/20 rounded-xl p-4 text-center">
              <Plus className="w-8 h-8 text-pink-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-800 dark:text-white">
                {stats.new_posts}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                New Posts
              </div>
            </div>
            <div className="bg-white/5 dark:bg-gray-800/20 backdrop-blur-sm border border-white/10 dark:border-gray-700/20 rounded-xl p-4 text-center">
              <SkipForward className="w-8 h-8 text-pink-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-800 dark:text-white">
                {stats.skipped_posts}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Skipped (Existing)
              </div>
            </div>
            <div className="bg-white/5 dark:bg-gray-800/20 backdrop-blur-sm border border-white/10 dark:border-gray-700/20 rounded-xl p-4 text-center">
              <Image className="w-8 h-8 text-pink-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-800 dark:text-white">
                {stats.images_downloaded}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Images Downloaded
              </div>
            </div>
            <div className="bg-white/5 dark:bg-gray-800/20 backdrop-blur-sm border border-white/10 dark:border-gray-700/20 rounded-xl p-4 text-center">
              <Bot className="w-8 h-8 text-pink-500 mx-auto mb-2" />
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

        {/* Previously Downloaded Images with Real-time Updates */}
        {images.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  Downloaded Images ({images.length})
                </h2>
                {isWebSocketConnected && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-1 text-xs text-green-400 flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    Real-time Updates
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

        {/* Keep all existing modals and other components unchanged... */}

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
