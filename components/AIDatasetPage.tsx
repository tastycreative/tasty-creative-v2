"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Search,
  Grid,
  List,
  FolderOpen,
  FileImage,
  Check,
  RefreshCw,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Folder,
  LogIn,
  LogOut,
  AlertCircle,
  Eye,
  X,
  Plus,
  Home,
  LayoutGrid,
  Database,
  Settings,
  Archive,
  BarChart3,
  TrendingUp,
  Users,
  HardDrive,
  Sparkles,
  Upload,
  Clock,
  Download,
} from "lucide-react";

// Google OAuth Configuration
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const RESTRICTED_FOLDER_ID = "1rkz_XIQAb1ujr7YM6zJF5leLEYHlFUyI";

const SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

const REDIRECT_URI =
  typeof window !== "undefined"
    ? window.location.origin + "/api/auth/google/callback"
    : "";

// Interfaces
interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webViewLink: string;
  webContentLink?: string;
  size?: string;
  modifiedTime: string;
  isFolder: boolean;
}

interface DatasetItem {
  id: string;
  imageUrl: string;
  filename: string;
  tags: string[];
  category: string;
  description?: string;
  source: "generated" | "imported" | "drive";
  dateAdded: Date;
  driveFileId?: string;
  folderId?: string;
}

interface VaultFolder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: Date;
  description?: string;
  color?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  userInfo: {
    email?: string;
    name?: string;
    picture?: string;
  } | null;
}

const AIDatasetPage = () => {
  // Dataset state
  const [datasetItems, setDatasetItems] = useState<DatasetItem[]>([]);
  const [folders, setFolders] = useState<VaultFolder[]>([]);

  // Auth state
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    accessToken: null,
    userInfo: null,
  });

  // Browse state
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFileType, setSelectedFileType] = useState("all");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [currentFolder, setCurrentFolder] =
    useState<string>(RESTRICTED_FOLDER_ID);
  const [folderPath, setFolderPath] = useState<{ id: string; name: string }[]>(
    []
  );

  // Google Drive state
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);

  // Modal state
  const [selectedImage, setSelectedImage] = useState<GoogleDriveFile | null>(
    null
  );
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

  // Vault management state
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [selectedFolderForAdd, setSelectedFolderForAdd] = useState<
    string | null
  >(null);
  const [pendingVaultItems, setPendingVaultItems] = useState<DatasetItem[]>([]);
  const [newQuickFolderName, setNewQuickFolderName] = useState("");

  // UI state
  const [showStats, setShowStats] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "warning" | "error";
    message: string;
  } | null>(null);

  // Constants
  const fileTypes = ["all", "images", "folders"];
  const supportedImageTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/svg+xml",
  ];

  // Load data from localStorage
  useEffect(() => {
    const savedDataset = localStorage.getItem("ai_dataset_items");
    const savedFolders = localStorage.getItem("ai_vault_folders");

    if (savedDataset) {
      try {
        const parsedDataset = JSON.parse(savedDataset);
        const datasetWithDates = parsedDataset.map((item: any) => ({
          ...item,
          dateAdded: new Date(item.dateAdded),
        }));
        setDatasetItems(datasetWithDates);
      } catch (error) {
        console.error("Error loading saved dataset:", error);
      }
    }

    if (savedFolders) {
      try {
        const parsedFolders = JSON.parse(savedFolders);
        const foldersWithDates = parsedFolders.map((folder: any) => ({
          ...folder,
          createdAt: new Date(folder.createdAt),
        }));
        setFolders(foldersWithDates);
      } catch (error) {
        console.error("Error loading saved folders:", error);
      }
    }

    const token = localStorage.getItem("google_access_token");
    const userInfo = localStorage.getItem("google_user_info");

    if (token) {
      setAuthState({
        isAuthenticated: true,
        accessToken: token,
        userInfo: userInfo ? JSON.parse(userInfo) : null,
      });
    }

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    if (code) {
      handleAuthCallback(code);
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    if (datasetItems.length > 0) {
      localStorage.setItem("ai_dataset_items", JSON.stringify(datasetItems));
    }
  }, [datasetItems]);

  useEffect(() => {
    if (folders.length > 0) {
      localStorage.setItem("ai_vault_folders", JSON.stringify(folders));
    }
  }, [folders]);

  // Auth functions
  const handleLogin = () => {
    if (!GOOGLE_CLIENT_ID) {
      setError(
        "Google Client ID is not configured. Please check your environment variables."
      );
      return;
    }

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams(
      {
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: "code",
        scope: SCOPES,
        access_type: "offline",
        prompt: "consent",
      }
    )}`;

    window.location.href = authUrl;
  };

  const handleAuthCallback = async (code: string) => {
    try {
      const tokenResponse = await fetch("/api/auth/google/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, redirect_uri: REDIRECT_URI }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        throw new Error(errorData.error || "Failed to exchange code for token");
      }

      const tokenData = await tokenResponse.json();

      const userResponse = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        }
      );

      if (!userResponse.ok) throw new Error("Failed to get user info");

      const userInfo = await userResponse.json();

      localStorage.setItem("google_access_token", tokenData.access_token);
      if (tokenData.refresh_token) {
        localStorage.setItem("google_refresh_token", tokenData.refresh_token);
      }
      localStorage.setItem("google_user_info", JSON.stringify(userInfo));

      setAuthState({
        isAuthenticated: true,
        accessToken: tokenData.access_token,
        userInfo,
      });

      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err: any) {
      setError(err.message || "Failed to authenticate. Please try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("google_access_token");
    localStorage.removeItem("google_refresh_token");
    localStorage.removeItem("google_user_info");

    setAuthState({
      isAuthenticated: false,
      accessToken: null,
      userInfo: null,
    });

    setDriveFiles([]);
    setError("");
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    const refreshToken = localStorage.getItem("google_refresh_token");

    if (!refreshToken) {
      return null;
    }

    try {
      const response = await fetch("/api/auth/google/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }

      const tokenData = await response.json();

      localStorage.setItem("google_access_token", tokenData.access_token);

      setAuthState((prev) => ({
        ...prev,
        accessToken: tokenData.access_token,
      }));

      return tokenData.access_token;
    } catch (error) {
      handleLogout();
      return null;
    }
  };

  const checkAndRefreshToken = async (
    token: string
  ): Promise<string | null> => {
    try {
      const response = await fetch(
        "https://www.googleapis.com/oauth2/v1/tokeninfo",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        return token;
      } else {
        return await refreshAccessToken();
      }
    } catch (error) {
      return await refreshAccessToken();
    }
  };

  const verifyAuthentication = async () => {
    if (!authState.accessToken) {
      setError("No access token available");
      return false;
    }

    const validToken = await checkAndRefreshToken(authState.accessToken);

    if (!validToken) {
      setError("Session expired. Please sign in again.");
      return false;
    }

    if (validToken !== authState.accessToken) {
      setAuthState((prev) => ({
        ...prev,
        accessToken: validToken,
      }));
    }

    return true;
  };

  // Drive functions
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const loadFolderContents = async (
    folderId: string = RESTRICTED_FOLDER_ID,
    pageToken?: string
  ) => {
    if (!authState.isAuthenticated || !authState.accessToken) {
      setError("Please sign in to access Google Drive files");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        q: `'${folderId}' in parents and trashed=false`,
        fields:
          "nextPageToken,files(id,name,mimeType,thumbnailLink,webViewLink,webContentLink,size,modifiedTime)",
        pageSize: "50",
        orderBy: "name",
      });

      if (pageToken) {
        params.append("pageToken", pageToken);
      }

      const url = `https://www.googleapis.com/drive/v3/files?${params.toString()}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${authState.accessToken}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleLogout();
          throw new Error("Session expired. Please sign in again.");
        } else if (response.status === 403) {
          throw new Error("You don't have permission to access this folder.");
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      const transformedFiles: GoogleDriveFile[] = data.files.map(
        (file: any) => ({
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          thumbnailLink: file.thumbnailLink,
          webViewLink: file.webViewLink,
          webContentLink: file.webContentLink,
          size: file.size ? formatBytes(parseInt(file.size)) : undefined,
          modifiedTime: file.modifiedTime,
          isFolder: file.mimeType === "application/vnd.google-apps.folder",
        })
      );

      if (pageToken) {
        setDriveFiles((prev) => [...prev, ...transformedFiles]);
      } else {
        setDriveFiles(transformedFiles);
      }

      setNextPageToken(data.nextPageToken || null);
      setCurrentFolder(folderId);
    } catch (err: any) {
      setError(err.message || "Failed to load folder contents");
    } finally {
      setIsLoading(false);
    }
  };

  const loadFolderContentsWithAuth = async (
    folderId: string = RESTRICTED_FOLDER_ID,
    pageToken?: string
  ) => {
    const isAuthenticated = await verifyAuthentication();
    if (!isAuthenticated) {
      return;
    }
    await loadFolderContents(folderId, pageToken);
  };

  useEffect(() => {
    if (authState.isAuthenticated && authState.accessToken) {
      loadFolderContentsWithAuth(RESTRICTED_FOLDER_ID);
    }
  }, [authState.isAuthenticated, authState.accessToken]);

  // Navigation functions
  const navigateToFolder = async (folderId: string, folderName: string) => {
    setFolderPath((prev) => [...prev, { id: currentFolder, name: folderName }]);
    await loadFolderContentsWithAuth(folderId);
  };

  const navigateBack = async () => {
    if (folderPath.length > 0) {
      const newPath = [...folderPath];
      const previousFolder = newPath.pop();
      setFolderPath(newPath);
      const targetId = previousFolder?.id || RESTRICTED_FOLDER_ID;
      await loadFolderContentsWithAuth(targetId);
    }
  };

  const navigateToRoot = async () => {
    setFolderPath([]);
    await loadFolderContentsWithAuth(RESTRICTED_FOLDER_ID);
  };

  // Image handling
  const getImageUrl = useCallback(
    (file: GoogleDriveFile): string => {
      if (
        !file.isFolder &&
        supportedImageTypes.includes(file.mimeType) &&
        authState.accessToken
      ) {
        return `/api/drive/image/${file.id}?token=${encodeURIComponent(authState.accessToken)}`;
      }
      return file.webViewLink;
    },
    [authState.accessToken]
  );

  const isFileInDataset = (fileId: string): boolean => {
    return datasetItems.some((item) => item.id === `drive_${fileId}`);
  };

  // Vault management
  const extractTagsFromFilename = (filename: string): string[] => {
    const tags: string[] = [];
    const name = filename.toLowerCase();

    if (name.includes("portrait")) tags.push("portrait");
    if (name.includes("landscape")) tags.push("landscape");
    if (name.includes("abstract")) tags.push("abstract");
    if (name.includes("anime")) tags.push("anime");
    if (name.includes("realistic")) tags.push("realistic");

    return tags;
  };

  const detectCategoryFromFilename = (filename: string): string => {
    const name = filename.toLowerCase();
    if (name.includes("portrait") || name.includes("face")) return "portraits";
    if (name.includes("landscape") || name.includes("scenery"))
      return "landscapes";
    if (name.includes("abstract")) return "abstract";
    if (name.includes("anime")) return "anime";
    return "objects";
  };

  const handleAddToVault = (items: DatasetItem[]) => {
    setPendingVaultItems(items);
    setShowFolderDialog(true);
  };

  const addFilesToVault = async (fileIds: string[]) => {
    const filesToAdd = driveFiles.filter(
      (file) =>
        fileIds.includes(file.id) &&
        !file.isFolder &&
        supportedImageTypes.includes(file.mimeType)
    );

    if (filesToAdd.length === 0) {
      setNotification({
        type: "warning",
        message: "No valid images selected for vault.",
      });
      return;
    }

    const vaultItems: DatasetItem[] = filesToAdd.map((file) => ({
      id: `drive_${file.id}`,
      imageUrl: getImageUrl(file),
      filename: file.name,
      tags: extractTagsFromFilename(file.name),
      category: detectCategoryFromFilename(file.name),
      description: `Imported from Google Drive: ${file.name}`,
      source: "drive",
      dateAdded: new Date(),
      driveFileId: file.id,
    }));

    handleAddToVault(vaultItems);
  };

  const addSingleFileToVault = (file: GoogleDriveFile) => {
    if (file.isFolder || !supportedImageTypes.includes(file.mimeType)) {
      return;
    }

    const vaultItem: DatasetItem = {
      id: `drive_${file.id}`,
      imageUrl: getImageUrl(file),
      filename: file.name,
      tags: extractTagsFromFilename(file.name),
      category: detectCategoryFromFilename(file.name),
      description: `Imported from Google Drive: ${file.name}`,
      source: "drive",
      dateAdded: new Date(),
      driveFileId: file.id,
    };

    handleAddToVault([vaultItem]);
  };

  const createQuickFolder = () => {
    if (!newQuickFolderName.trim()) return;

    const newFolder: VaultFolder = {
      id: `folder_${Date.now()}`,
      name: newQuickFolderName.trim(),
      parentId: undefined,
      createdAt: new Date(),
      color: "#f97316", // Orange color to match dataset theme
    };

    setFolders((prev) => [...prev, newFolder]);
    setSelectedFolderForAdd(newFolder.id);
    setNewQuickFolderName("");
  };

  const completeVaultAddition = () => {
    const existingIds = new Set(datasetItems.map((item) => item.id));
    const newItems = pendingVaultItems.filter(
      (item) => !existingIds.has(item.id)
    );

    if (newItems.length === 0) {
      cancelVaultAddition();
      return;
    }

    const updatedItems = newItems.map((item) => ({
      ...item,
      folderId: selectedFolderForAdd || undefined,
    }));

    setDatasetItems((prev) => [...updatedItems, ...prev]);
    setSelectedFiles(new Set());

    setNotification({
      type: "success",
      message: `Added ${updatedItems.length} items to vault.`,
    });
    setTimeout(() => setNotification(null), 3000);

    cancelVaultAddition();
  };

  const cancelVaultAddition = () => {
    setShowFolderDialog(false);
    setSelectedFolderForAdd(null);
    setPendingVaultItems([]);
    setNewQuickFolderName("");
  };

  // Statistics
  const getDatasetStats = () => {
    const totalItems = datasetItems.length;
    const sourceStats = datasetItems.reduce(
      (acc, item) => {
        acc[item.source] = (acc[item.source] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const categoryStats = datasetItems.reduce(
      (acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const folderStats = datasetItems.reduce(
      (acc, item) => {
        const folderName = item.folderId
          ? folders.find((f) => f.id === item.folderId)?.name ||
            "Unknown Folder"
          : "Root";
        acc[folderName] = (acc[folderName] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentItems = datasetItems.filter(
      (item) => item.dateAdded >= weekAgo
    ).length;

    return {
      totalItems,
      sourceStats,
      categoryStats,
      folderStats,
      totalFolders: folders.length,
      recentItems,
    };
  };

  // UI handlers
  const filteredFiles = driveFiles.filter((file) => {
    const matchesSearch = file.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType =
      selectedFileType === "all" ||
      (selectedFileType === "images" &&
        !file.isFolder &&
        supportedImageTypes.includes(file.mimeType)) ||
      (selectedFileType === "folders" && file.isFolder);
    return matchesSearch && matchesType;
  });

  const handleSelectAll = () => {
    const selectableFiles = filteredFiles.filter(
      (file) => !file.isFolder && supportedImageTypes.includes(file.mimeType)
    );

    if (selectedFiles.size === selectableFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(selectableFiles.map((file) => file.id)));
    }
  };

  const handleFileSelection = useCallback(
    (fileId: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setSelectedFiles((prev) => {
        const newSelected = new Set(prev);
        if (newSelected.has(fileId)) {
          newSelected.delete(fileId);
        } else {
          newSelected.add(fileId);
        }
        return newSelected;
      });
    },
    []
  );

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "generated":
        return <Sparkles size={16} className="text-purple-400" />;
      case "drive":
        return <HardDrive size={16} className="text-blue-400" />;
      case "imported":
        return <Upload size={16} className="text-green-400" />;
      default:
        return <Database size={16} className="text-gray-400" />;
    }
  };

  const stats = getDatasetStats();

  // Drive Image Component
  const DriveImageComponent = React.memo(
    ({ file }: { file: GoogleDriveFile }) => {
      const [imageError, setImageError] = useState(false);
      const [imageLoading, setImageLoading] = useState(true);
      const [retryCount, setRetryCount] = useState(0);

      const imageUrl = getImageUrl(file);

      const handleImageError = async () => {
        if (retryCount < 2 && authState.accessToken) {
          const newToken = await checkAndRefreshToken(authState.accessToken);
          if (newToken) {
            setRetryCount((prev) => prev + 1);
            setImageLoading(true);
            setImageError(false);
            return;
          }
        }
        setImageError(true);
        setImageLoading(false);
      };

      const handleImageLoad = () => {
        setImageLoading(false);
        setImageError(false);
        setRetryCount(0);
      };

      const handleImageClick = () => {
        if (
          !file.isFolder &&
          supportedImageTypes.includes(file.mimeType) &&
          !imageError
        ) {
          const imageFiles = filteredFiles.filter(
            (f) => !f.isFolder && supportedImageTypes.includes(f.mimeType)
          );
          const imageIndex = imageFiles.findIndex((f) => f.id === file.id);
          setCurrentImageIndex(imageIndex);
          setSelectedImage(file);
        }
      };

      if (file.isFolder) {
        return (
          <div
            className="w-full h-full bg-gradient-to-br from-blue-500/20 to-blue-700/20 flex items-center justify-center cursor-pointer hover:from-blue-500/30 hover:to-blue-700/30 transition-all duration-200 rounded-lg border border-blue-400/20"
            onClick={() => navigateToFolder(file.id, file.name)}
          >
            <Folder
              className="text-blue-400"
              size={viewMode === "grid" ? 48 : 24}
            />
          </div>
        );
      }

      if (!supportedImageTypes.includes(file.mimeType) || imageError) {
        return (
          <div className="w-full h-full bg-gray-600/20 flex items-center justify-center rounded-lg border border-gray-400/20">
            <FileImage
              className="text-gray-400"
              size={viewMode === "grid" ? 32 : 20}
            />
            {imageError && retryCount > 0 && (
              <div className="absolute bottom-1 right-1 text-xs text-red-400">
                ⚠️
              </div>
            )}
          </div>
        );
      }

      return (
        <div className="relative w-full h-full rounded-lg overflow-hidden">
          {imageLoading && (
            <div className="absolute inset-0 bg-gray-600/20 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          )}
          <img
            src={imageUrl}
            alt={file.name}
            className={`w-full h-full object-cover transition-all duration-300 cursor-pointer hover:scale-105 ${
              imageLoading ? "opacity-0" : "opacity-100"
            }`}
            loading="lazy"
            onError={handleImageError}
            onLoad={handleImageLoad}
            onClick={handleImageClick}
          />

          {isFileInDataset(file.id) && (
            <div className="absolute top-2 right-2">
              <div className="bg-green-500/90 rounded-full p-1 shadow-lg">
                <Check size={12} className="text-white" />
              </div>
            </div>
          )}
        </div>
      );
    }
  );

  // Image Modal Component
  const ImageModal = () => {
    if (!selectedImage) return null;

    const imageFiles = filteredFiles.filter(
      (f) => !f.isFolder && supportedImageTypes.includes(f.mimeType)
    );

    const goToPrevious = () => {
      if (currentImageIndex > 0) {
        const newIndex = currentImageIndex - 1;
        setCurrentImageIndex(newIndex);
        setSelectedImage(imageFiles[newIndex]);
      }
    };

    const goToNext = () => {
      if (currentImageIndex < imageFiles.length - 1) {
        const newIndex = currentImageIndex + 1;
        setCurrentImageIndex(newIndex);
        setSelectedImage(imageFiles[newIndex]);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedImage(null);
      } else if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      }
    };

    useEffect(() => {
      if (selectedImage) {
        document.addEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "hidden";
        return () => {
          document.removeEventListener("keydown", handleKeyDown);
          document.body.style.overflow = "unset";
        };
      }
    }, [selectedImage, currentImageIndex]);

    const modalContent = (
      <div className="fixed inset-0 bg-black/95 z-[9999] flex flex-col">
        <div className="absolute top-6 right-6 z-10">
          <button
            onClick={() => setSelectedImage(null)}
            className="text-white hover:text-gray-300 bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="w-full h-full flex items-center justify-center relative">
          {imageFiles.length > 1 && (
            <>
              {currentImageIndex > 0 && (
                <button
                  onClick={goToPrevious}
                  className="absolute left-6 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10 bg-black/50 rounded-full p-3 hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft size={32} />
                </button>
              )}

              {currentImageIndex < imageFiles.length - 1 && (
                <button
                  onClick={goToNext}
                  className="absolute right-6 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10 bg-black/50 rounded-full p-3 hover:bg-black/70 transition-colors"
                >
                  <ChevronRight size={32} />
                </button>
              )}
            </>
          )}

          <img
            src={getImageUrl(selectedImage)}
            alt={selectedImage.name}
            className="max-w-[calc(100vw-8rem)] max-h-[calc(100vh-8rem)] object-contain"
          />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 text-center bg-gradient-to-t from-black/70 to-transparent">
          <h3 className="text-white text-xl font-medium mb-2 truncate">
            {selectedImage.name}
          </h3>
          <div className="flex justify-center space-x-6 text-gray-300 text-sm">
            <span>{selectedImage.size}</span>
            <span>{formatDate(selectedImage.modifiedTime)}</span>
            {imageFiles.length > 1 && (
              <span>
                {currentImageIndex + 1} of {imageFiles.length}
              </span>
            )}
          </div>
        </div>
      </div>
    );

    return typeof window !== "undefined"
      ? createPortal(modalContent, document.body)
      : null;
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-black/30 backdrop-blur-md border-white/10 rounded-xl">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-orange-600/20 to-red-600/20 rounded-lg">
                <Database className="text-orange-400" size={28} />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-white">
                  AI Dataset Management
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Browse and import images from Google Drive to build your AI
                  training datasets
                </CardDescription>
              </div>
            </div>

            {/* Auth Status */}
            {authState.isAuthenticated && authState.userInfo ? (
              <div className="flex items-center space-x-3 bg-black/30 rounded-lg p-3">
                {authState.userInfo.picture && (
                  <img
                    src={authState.userInfo.picture}
                    alt={authState.userInfo.name}
                    className="w-10 h-10 rounded-full ring-2 ring-orange-400/30"
                  />
                )}
                <div className="text-left">
                  <p className="text-white text-sm font-medium">
                    {authState.userInfo.name}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {authState.userInfo.email}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="bg-red-900/30 border-red-500/30 text-red-300 hover:bg-red-900/50"
                >
                  <LogOut size={16} className="mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleLogin}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-6 py-3"
                disabled={!GOOGLE_CLIENT_ID}
              >
                <LogIn size={16} className="mr-2" />
                Sign in with Google
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Configuration Warning */}
      {!GOOGLE_CLIENT_ID && (
        <Alert className="bg-yellow-900/20 border-yellow-500/30 text-yellow-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuration Required</AlertTitle>
          <AlertDescription>
            Google Client ID is not set. Please check your environment
            variables.
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-orange-600/20 to-red-800/20 backdrop-blur-md border-orange-500/20 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Archive size={14} className="text-orange-400" />
              <span className="text-orange-300 text-sm font-medium">
                Total Items
              </span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalItems}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-600/20 to-blue-800/20 backdrop-blur-md border-blue-500/20 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Folder size={14} className="text-blue-400" />
              <span className="text-blue-300 text-sm font-medium">Folders</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {stats.totalFolders}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-600/20 to-green-800/20 backdrop-blur-md border-green-500/20 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp size={14} className="text-green-400" />
              <span className="text-green-300 text-sm font-medium">
                This Week
              </span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.recentItems}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-600/20 to-purple-800/20 backdrop-blur-md border-purple-500/20 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <BarChart3 size={14} className="text-purple-400" />
              <span className="text-purple-300 text-sm font-medium">
                Categories
              </span>
            </div>
            <p className="text-2xl font-bold text-white">
              {Object.keys(stats.categoryStats).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      {showStats && (
        <Card className="bg-black/30 backdrop-blur-md border-white/10 rounded-xl">
          <CardHeader>
            <CardTitle className="text-white">Detailed Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Source Breakdown */}
              <div>
                <h4 className="text-white font-medium mb-3 flex items-center">
                  <Settings size={16} className="mr-2 text-green-400" />
                  Source Distribution
                </h4>
                <div className="space-y-2">
                  {Object.entries(stats.sourceStats).map(([source, count]) => (
                    <div
                      key={source}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        {getSourceIcon(source)}
                        <span className="text-gray-300 capitalize">
                          {source}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="bg-gray-700 rounded-full h-2 w-20">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${(count / stats.totalItems) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-green-400 text-sm font-medium w-8 text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Breakdown */}
              <div>
                <h4 className="text-white font-medium mb-3 flex items-center">
                  <Database size={16} className="mr-2 text-purple-400" />
                  Top Categories
                </h4>
                <div className="space-y-2">
                  {Object.entries(stats.categoryStats)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([category, count]) => (
                      <div
                        key={category}
                        className="flex items-center justify-between"
                      >
                        <span className="text-gray-300 capitalize truncate">
                          {category}
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className="bg-gray-700 rounded-full h-2 w-16">
                            <div
                              className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                              style={{
                                width: `${(count / stats.totalItems) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-purple-400 text-sm font-medium w-8 text-right">
                            {count}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Folder Distribution */}
              <div>
                <h4 className="text-white font-medium mb-3 flex items-center">
                  <Folder size={16} className="mr-2 text-yellow-400" />
                  Folder Usage
                </h4>
                <div className="space-y-2">
                  {Object.entries(stats.folderStats)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([folder, count]) => (
                      <div
                        key={folder}
                        className="flex items-center justify-between"
                      >
                        <span className="text-gray-300 truncate">{folder}</span>
                        <div className="flex items-center space-x-2">
                          <div className="bg-gray-700 rounded-full h-2 w-16">
                            <div
                              className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                              style={{
                                width: `${(count / stats.totalItems) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-yellow-400 text-sm font-medium w-8 text-right">
                            {count}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex items-center space-x-3">
        <Button
          variant="outline"
          size="sm"
          className="bg-blue-900/30 border-blue-500/30 text-blue-300 hover:bg-blue-900/50"
          onClick={() => setShowStats(!showStats)}
        >
          <BarChart3 size={16} className="mr-1" />
          {showStats ? "Hide" : "Show"} Details
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="bg-orange-900/30 border-orange-500/30 text-orange-300 hover:bg-orange-900/50"
          onClick={() => setShowFolderDialog(true)}
        >
          <FolderOpen size={16} className="mr-1" />
          Manage Vault
        </Button>
      </div>

      {/* Notification */}
      {notification && (
        <Alert
          className={`${
            notification.type === "success"
              ? "bg-green-900/20 border-green-500/30 text-green-200"
              : notification.type === "warning"
                ? "bg-yellow-900/20 border-yellow-500/30 text-yellow-200"
                : "bg-red-900/20 border-red-500/30 text-red-200"
          }`}
        >
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="capitalize">{notification.type}</AlertTitle>
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      {/* Drive Browse Section */}
      {authState.isAuthenticated && (
        <>
          {/* Folder Navigation */}
          <Card className="bg-black/30 backdrop-blur-md border-white/10 rounded-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {folderPath.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={navigateBack}
                      disabled={isLoading}
                      className="text-gray-400 hover:text-white hover:bg-white/10"
                    >
                      <ChevronLeft size={16} />
                    </Button>
                  )}

                  <div className="flex items-center space-x-2 text-gray-300">
                    <button
                      onClick={navigateToRoot}
                      disabled={isLoading}
                      className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors bg-black/40 rounded px-3 py-1"
                    >
                      <Home size={16} />
                      <span>Root</span>
                    </button>
                    {folderPath.map((folder, index) => (
                      <React.Fragment key={index}>
                        <ChevronRight size={14} className="text-gray-500" />
                        <button
                          onClick={() => {
                            const targetFolder = folderPath[index];
                            const newPath = folderPath.slice(0, index);
                            setFolderPath(newPath);
                            setCurrentFolder(targetFolder.id);
                            loadFolderContentsWithAuth(targetFolder.id);
                          }}
                          disabled={isLoading}
                          className="text-gray-300 hover:text-white transition-colors bg-black/40 rounded px-3 py-1"
                        >
                          {folder.name}
                        </button>
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadFolderContentsWithAuth(currentFolder)}
                  disabled={isLoading}
                  className="bg-black/60 border-white/10 text-white"
                >
                  <RefreshCw
                    size={16}
                    className={`mr-2 ${isLoading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Controls */}
          <Card className="bg-black/30 backdrop-blur-md border-white/10 rounded-xl">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <Input
                      placeholder="Search files and folders..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-black/60 border-white/10 text-white pl-10"
                    />
                  </div>
                </div>

                {/* Filter */}
                <Select
                  value={selectedFileType}
                  onValueChange={setSelectedFileType}
                >
                  <SelectTrigger className="w-32 bg-black/60 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 border-white/10 text-white">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="images">Images</SelectItem>
                    <SelectItem value="folders">Folders</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Mode */}
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-black/60 border-white/10 text-white"
                  onClick={() =>
                    setViewMode(viewMode === "grid" ? "list" : "grid")
                  }
                >
                  {viewMode === "grid" ? (
                    <List size={16} />
                  ) : (
                    <LayoutGrid size={16} />
                  )}
                </Button>

                {/* Selection Actions */}
                {selectedFiles.size > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-orange-300 text-sm font-medium">
                      {selectedFiles.size} selected
                    </span>
                    <Button
                      onClick={() => addFilesToVault(Array.from(selectedFiles))}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                      size="sm"
                    >
                      <Plus size={16} className="mr-1" />
                      Add to Vault
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedFiles(new Set())}
                      className="bg-black/60 border-white/10 text-white"
                      size="sm"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bulk Selection */}
          {filteredFiles.some(
            (file) =>
              !file.isFolder && supportedImageTypes.includes(file.mimeType)
          ) && (
            <div className="flex items-center justify-between text-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="text-gray-400 hover:text-white"
              >
                {selectedFiles.size ===
                filteredFiles.filter(
                  (f) => !f.isFolder && supportedImageTypes.includes(f.mimeType)
                ).length
                  ? "Deselect All"
                  : "Select All Images"}
              </Button>

              <span className="text-gray-400">
                {filteredFiles.length} items •{" "}
                {
                  filteredFiles.filter(
                    (f) =>
                      !f.isFolder && supportedImageTypes.includes(f.mimeType)
                  ).length
                }{" "}
                images
              </span>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert
              variant="destructive"
              className="bg-red-900/20 border-red-500/30 text-red-200"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Files Display */}
          {isLoading && driveFiles.length === 0 ? (
            <Card className="bg-black/30 backdrop-blur-md border-white/10 rounded-xl">
              <CardContent className="text-center py-12">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-orange-400" />
                <p className="text-gray-300">Loading folder contents...</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-black/30 backdrop-blur-md border-white/10 rounded-xl">
              <CardContent className="pt-6">
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4"
                      : "space-y-2"
                  }
                >
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className={`group relative bg-black/40 rounded-lg overflow-hidden border border-white/10 hover:border-orange-400/50 transition-all duration-200 ${
                        selectedFiles.has(file.id)
                          ? "ring-2 ring-orange-400 shadow-lg shadow-orange-400/20"
                          : ""
                      } ${viewMode === "list" ? "flex items-center space-x-4 p-3" : ""}`}
                    >
                      {/* File Preview */}
                      <div
                        className={`relative ${viewMode === "grid" ? "aspect-square" : "w-16 h-16 flex-shrink-0"}`}
                      >
                        <DriveImageComponent file={file} />

                        {/* Selection Checkbox */}
                        {!file.isFolder &&
                          supportedImageTypes.includes(file.mimeType) && (
                            <div className="absolute top-2 left-2 z-20">
                              <button
                                className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                                  selectedFiles.has(file.id)
                                    ? "bg-orange-600 border-orange-600 shadow-lg"
                                    : "bg-black/70 border-white/40 hover:border-white/80"
                                }`}
                                onClick={(e) => handleFileSelection(file.id, e)}
                              >
                                {selectedFiles.has(file.id) && (
                                  <Check size={14} className="text-white" />
                                )}
                              </button>
                            </div>
                          )}

                        {/* Quick Actions */}
                        {!file.isFolder &&
                          supportedImageTypes.includes(file.mimeType) && (
                            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <div className="flex space-x-1">
                                {!isFileInDataset(file.id) && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-white/20 border-white/30 text-white hover:bg-white/30 h-8 w-8 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      addSingleFileToVault(file);
                                    }}
                                  >
                                    <Plus size={12} />
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                      </div>

                      {/* File Info */}
                      <div
                        className={`${viewMode === "grid" ? "p-3" : "flex-1 min-w-0"}`}
                      >
                        <h4 className="text-white text-sm font-medium truncate mb-1">
                          {file.name}
                        </h4>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span className="capitalize">
                            {file.isFolder
                              ? "Folder"
                              : file.mimeType.split("/")[1]}
                          </span>
                          {!file.isFolder && file.size && (
                            <span>{file.size}</span>
                          )}
                        </div>
                        {viewMode === "list" && (
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDate(file.modifiedTime)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load More */}
                {nextPageToken && !isLoading && (
                  <div className="text-center mt-6">
                    <Button
                      onClick={() =>
                        loadFolderContentsWithAuth(currentFolder, nextPageToken)
                      }
                      variant="outline"
                      className="bg-black/60 border-white/10 text-white"
                    >
                      Load More Files
                    </Button>
                  </div>
                )}

                {/* No Results */}
                {!isLoading && filteredFiles.length === 0 && (
                  <div className="text-center py-12">
                    <FileImage className="w-16 h-16 mx-auto mb-4 text-gray-500 opacity-50" />
                    <p className="text-gray-400 text-lg mb-2">No files found</p>
                    <p className="text-gray-500 text-sm">
                      {searchQuery || selectedFileType !== "all"
                        ? "Try adjusting your search or filter criteria"
                        : "This folder appears to be empty"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Folder Management Dialog */}
      {showFolderDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="bg-black/90 backdrop-blur-md border-white/10 rounded-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-600/20 rounded-lg">
                  <FolderOpen className="text-orange-400" size={20} />
                </div>
                <div>
                  <CardTitle className="text-white text-lg">
                    {pendingVaultItems.length > 0
                      ? `Organize ${pendingVaultItems.length} Items`
                      : "Vault Management"}
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Choose a folder to organize your images
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {pendingVaultItems.length > 0 && (
                <>
                  {/* Items Preview */}
                  <div className="bg-gradient-to-r from-orange-900/20 to-red-900/20 rounded-lg p-4 border border-orange-500/20">
                    <h4 className="text-orange-300 font-medium mb-3 flex items-center">
                      <Archive size={16} className="mr-2" />
                      Items to Add ({pendingVaultItems.length})
                    </h4>
                    <div className="max-h-32 overflow-y-auto">
                      <div className="grid grid-cols-6 gap-2">
                        {pendingVaultItems.slice(0, 12).map((item) => (
                          <div
                            key={item.id}
                            className="aspect-square bg-gray-700 rounded overflow-hidden"
                          >
                            <img
                              src={item.imageUrl}
                              alt={item.filename}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {pendingVaultItems.length > 12 && (
                          <div className="aspect-square bg-gray-700 rounded flex items-center justify-center">
                            <span className="text-xs text-gray-400">
                              +{pendingVaultItems.length - 12}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Folder Selection */}
                  <div>
                    <Label className="text-gray-300 mb-3 block">
                      Choose Destination
                    </Label>
                    <Select
                      value={selectedFolderForAdd || "root"}
                      onValueChange={(value) =>
                        setSelectedFolderForAdd(value === "root" ? null : value)
                      }
                    >
                      <SelectTrigger className="bg-black/60 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black/90 border-white/10 text-white">
                        <SelectItem value="root">
                          <div className="flex items-center">
                            <Home size={16} className="mr-2" />
                            Root Folder
                          </div>
                        </SelectItem>
                        {folders
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((folder) => (
                            <SelectItem key={folder.id} value={folder.id}>
                              <div className="flex items-center">
                                <Folder
                                  size={16}
                                  className="mr-2"
                                  style={{ color: folder.color || "#f97316" }}
                                />
                                <span>{folder.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Quick folder creation */}
              <div className="border-t border-white/10 pt-6">
                <Label className="text-gray-300 mb-3 block">
                  Create New Folder
                </Label>
                <div className="flex space-x-3">
                  <Input
                    placeholder="Folder name..."
                    value={newQuickFolderName}
                    onChange={(e) => setNewQuickFolderName(e.target.value)}
                    className="bg-black/60 border-white/10 text-white flex-1"
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && newQuickFolderName.trim()) {
                        createQuickFolder();
                      }
                    }}
                  />
                  <Button
                    onClick={createQuickFolder}
                    disabled={!newQuickFolderName.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus size={16} className="mr-1" />
                    Create
                  </Button>
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <div className="flex space-x-3 w-full">
                {pendingVaultItems.length > 0 ? (
                  <>
                    <Button
                      onClick={completeVaultAddition}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check size={16} className="mr-2" />
                      Add to{" "}
                      {selectedFolderForAdd
                        ? folders.find((f) => f.id === selectedFolderForAdd)
                            ?.name
                        : "Root"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={cancelVaultAddition}
                      className="flex-1 bg-red-600/20 border-red-500/30 text-red-300 hover:bg-red-600/30"
                    >
                      <X size={16} className="mr-2" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={cancelVaultAddition}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white"
                  >
                    <Check size={16} className="mr-2" />
                    Done
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Image Modal */}
      <ImageModal />
    </div>
  );
};

export default AIDatasetPage;
