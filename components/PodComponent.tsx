"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useSession } from "next-auth/react";
import {
  Users,
  UserPlus,
  Calendar,
  ExternalLink,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Link,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import WorkflowDashboard from "./WorkflowDashboard";
import SheetsIntegration from "./SheetsIntegration";
import SheetViewer from "./SheetViewer";
import PodAdminDashboard from "./PodAdminDashboard";
import Board from "./pod/Board";
import PricingGuide from "./PricingGuide";
import {
  TeamMemberSkeleton,
  CreatorSkeleton,
  SheetLinkSkeleton,
  SheetIntegrationSkeleton,
  TeamSelectorSkeleton,
  WorkflowDashboardSkeleton,
  Skeleton,
} from "./ui/skeleton";

interface TeamMember {
  id: string;
  name: string;
  role: string;
}

interface Creator {
  id: string;
  name: string;
  specialty: string;
  earnings?: string;
}

interface TeamOption {
  row: number;
  name: string;
  label: string;
}

interface PodData {
  teamName: string;
  teamMembers: TeamMember[];
  creators: Creator[];
  schedulerSpreadsheetUrl?: string;
  sheetLinks?: Array<{ name: string; url: string; cellGroup?: string }>;
  rowNumber: number;
  lastUpdated: string;
}

const DEFAULT_SPREADSHEET_URL =
  "https://docs.google.com/spreadsheets/d/1sTp3x6SA4yKkYEwPUIDPNzAPiu0RnaV1009NXZ7PkZM/edit?gid=0#gid=0";
const EARNINGS_SPREADSHEET_URL =
  "https://docs.google.com/spreadsheets/d/1uF-zuML1HgP5b95pbJycVQZj_0Nl1mgkTshOe3lUCSs/edit?gid=591071681#gid=591071681";

const PodComponent = () => {
  const { data: session } = useSession();
  const [schedulerSpreadsheetUrl, setSchedulerSpreadsheetUrl] = useState<
    string | undefined
  >(undefined);
  const [selectedRow, setSelectedRow] = useState<number>(8);
  const [podData, setPodData] = useState<PodData | null>(null);
  const [availableTeams, setAvailableTeams] = useState<TeamOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "sheets" | "board" | "admin" | "pricing"
  >("dashboard");
  const [selectedSheet, setSelectedSheet] = useState<{
    name: string;
    url: string;
  } | null>(null);
  const [viewMode, setViewMode] = useState<"dashboard" | "sheet">("dashboard");
  const [driveSheets, setDriveSheets] = useState<
    Array<{
      id: string;
      name: string;
      url: string;
      lastModified: string;
    }>
  >([]);
  const [isDriveLoading, setIsDriveLoading] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isTasksLoading, setIsTasksLoading] = useState(false);
  const [pricingPreview, setPricingPreview] = useState<
    Array<{
      name: string;
      price: string;
      creator: string;
      totalCombinations?: number;
    }>
  >([]);
  const [isPricingPreviewLoading, setIsPricingPreviewLoading] = useState(false);
  const [pricingRotationProgress, setPricingRotationProgress] = useState(0);
  const [allPricingData, setAllPricingData] = useState<
    Array<{
      name: string;
      price: string;
      creator: string;
      totalCombinations?: number;
    }>
  >([]);
  const lastFetchedCreators = useRef<string>("");
  const [openSheetGroups, setOpenSheetGroups] = useState<
    Record<string, boolean>
  >({});

  const toggleSheetGroup = (groupName: string) => {
    setOpenSheetGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  // Group sheet links by creator names
  const groupedSheetLinks = useMemo(() => {
    if (!podData?.creators) return {};

    // Initialize groups with all creators having empty arrays
    const groups: Record<
      string,
      Array<{ name: string; url: string; cellGroup?: string }>
    > = {};
    podData.creators.forEach((creator) => {
      groups[creator.name] = [];
    });

    // Add Others category
    groups["Others"] = [];

    // Distribute sheet links to creators
    if (podData.sheetLinks) {
      podData.sheetLinks.forEach((link) => {
        let assignedCreator = "Others";

        // Check if any creator name is in the sheet name
        for (const creator of podData.creators || []) {
          if (link.name.toLowerCase().includes(creator.name.toLowerCase())) {
            assignedCreator = creator.name;
            break;
          }
        }

        groups[assignedCreator].push(link);
      });
    }

    return groups;
  }, [podData?.sheetLinks, podData?.creators]);

  // Group drive sheets by creator names
  const groupedDriveSheets = useMemo(() => {
    if (!podData?.creators) return {};

    // Initialize groups with all creators having empty arrays
    const groups: Record<
      string,
      Array<{ id: string; name: string; url: string; lastModified: string }>
    > = {};
    podData.creators.forEach((creator) => {
      groups[creator.name] = [];
    });

    // Add Others category
    groups["Others"] = [];

    // Distribute drive sheets to creators
    if (driveSheets && driveSheets.length > 0) {
      driveSheets.forEach((sheet) => {
        let assignedCreator = "Others";

        // Check if any creator name is in the sheet name
        for (const creator of podData.creators || []) {
          if (sheet.name.toLowerCase().includes(creator.name.toLowerCase())) {
            assignedCreator = creator.name;
            break;
          }
        }

        groups[assignedCreator].push(sheet);
      });
    }

    return groups;
  }, [driveSheets, podData?.creators]);

  const fetchAvailableTeams = async () => {
    setIsLoadingTeams(true);

    try {
      const response = await fetch("/api/pod/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          spreadsheetUrl: DEFAULT_SPREADSHEET_URL,
          startRow: 8,
          endRow: 20,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch teams: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.teams) {
        setAvailableTeams(result.teams);
        // If no teams and no selected row, use the first available team
        if (result.teams.length > 0 && !selectedRow) {
          setSelectedRow(result.teams[0].row);
        }
      }
    } catch (err) {
      console.error("Error fetching available teams:", err);
      // Fallback to basic team options if API fails
      setAvailableTeams([
        { row: 8, name: "Team 8", label: "Team 8" },
        { row: 9, name: "Team 9", label: "Team 9" },
        { row: 10, name: "Team 10", label: "Team 10" },
      ]);
    } finally {
      setIsLoadingTeams(false);
    }
  };

  const fetchCreatorEarnings = async (
    creatorNames: string[],
    retryCount = 0
  ) => {
    try {
      const response = await fetch("/api/pod/earnings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          spreadsheetUrl: EARNINGS_SPREADSHEET_URL,
          creatorNames: creatorNames,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        // Check for quota exceeded error
        if (
          response.status === 429 &&
          errorText.includes("Quota exceeded") &&
          retryCount < 3
        ) {
          console.log(
            `Quota exceeded, retrying in ${(retryCount + 1) * 2} seconds...`
          );
          await new Promise((resolve) =>
            setTimeout(resolve, (retryCount + 1) * 2000)
          );
          return fetchCreatorEarnings(creatorNames, retryCount + 1);
        }
        throw new Error(`Failed to fetch earnings: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.earnings) {
        return result.earnings;
      }
      return {};
    } catch (err) {
      console.error("Error fetching creator earnings:", err);
      // If it's a quota error and we haven't exhausted retries, try again
      if (
        err instanceof Error &&
        err.message.includes("quota") &&
        retryCount < 3
      ) {
        console.log(
          `Retrying earnings fetch after error, attempt ${retryCount + 1}`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, (retryCount + 1) * 2000)
        );
        return fetchCreatorEarnings(creatorNames, retryCount + 1);
      }
      return {};
    }
  };

  const fetchTasks = useCallback(
    async (teamId: string) => {
      if (!teamId) {
        setTasks([]);
        return;
      }

      setIsTasksLoading(true);
      try {
        const response = await fetch(`/api/tasks?teamId=${teamId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch tasks");
        }
        const result = await response.json();
        if (result.success && result.tasks) {
          // Convert database tasks to WorkflowDashboard format
          const formattedTasks = result.tasks.map((task: any) => {
            // If assignedTo is an email, extract the name part or use session name
            let assigneeName = task.assignedTo || "Unassigned";
            if (assigneeName.includes("@")) {
              // Check if it's the current user
              if (session?.user?.email === assigneeName) {
                assigneeName =
                  session?.user?.name ||
                  session?.user?.email?.split("@")[0] ||
                  "Current User";
              } else {
                // Extract username from email
                assigneeName = assigneeName.split("@")[0];
              }
            }

            // Map database status to dashboard format
            const statusMapping: Record<
              string,
              "not-started" | "in-progress" | "completed" | "review"
            > = {
              NOT_STARTED: "not-started",
              IN_PROGRESS: "in-progress",
              COMPLETED: "completed",
              CANCELLED: "review", // Map cancelled to review status for dashboard display
            };

            return {
              id: task.id,
              title: task.title,
              assignee: assigneeName,
              status: statusMapping[task.status] || "not-started",
              progress:
                task.status === "COMPLETED"
                  ? 100
                  : task.status === "IN_PROGRESS"
                    ? 50
                    : task.status === "CANCELLED"
                      ? 0
                      : 0,
              dueDate: task.dueDate
                ? new Date(task.dueDate).toISOString().split("T")[0]
                : new Date().toISOString().split("T")[0],
              priority: task.priority.toLowerCase() as
                | "low"
                | "medium"
                | "high",
            };
          });
          setTasks(formattedTasks);
        } else {
          setTasks([]);
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);
        setTasks([]);
      } finally {
        setIsTasksLoading(false);
      }
    },
    [session]
  );

  const fetchPricingPreview = useCallback(async () => {
    if (!podData?.creators || podData.creators.length === 0) {
      setPricingPreview([]);
      setIsPricingPreviewLoading(false);
      return;
    }

    setIsPricingPreviewLoading(true);

    try {
      const response = await fetch("/api/pricing-data");
      if (!response.ok) {
        // If pricing API fails, show content items with "—" prices
        createFallbackPreview();
        return;
      }

      const data = await response.json();
      if (!data.pricingData || !Array.isArray(data.pricingData)) {
        createFallbackPreview();
        return;
      }

      // Always show content items, even if creators don't have pricing
      const contentItems: Array<{
        name: string;
        price: string;
        creator: string;
      }> = [];

      // Get all available items from pricing data
      const allItems: string[] = [];
      data.pricingData.forEach((group: any) => {
        if (group.items) {
          group.items.forEach((item: any) => {
            if (!allItems.includes(item.name)) {
              allItems.push(item.name);
            }
          });
        }
      });

      // Create all possible item combinations for rotation
      const allCombinations: Array<{
        name: string;
        price: string;
        creator: string;
      }> = [];

      allItems.forEach((itemName) => {
        podData.creators.forEach((creator) => {
          // Try to find actual price for this creator/item combination
          let actualPrice = "—";
          data.pricingData.forEach((group: any) => {
            if (
              group.pricing &&
              group.pricing[creator.name] &&
              group.pricing[creator.name][itemName]
            ) {
              const price = group.pricing[creator.name][itemName];
              if (price && price !== "—" && price.trim()) {
                actualPrice = price;
              }
            }
          });

          allCombinations.push({
            name: itemName,
            price: actualPrice,
            creator: creator.name,
          });
        });
      });

      // Calculate total possible combinations
      const totalItems = allCombinations.length;

      // Store all data for rotation
      const allDataWithTotal = allCombinations.map((item) => ({
        ...item,
        totalCombinations: totalItems,
      }));
      setAllPricingData(allDataWithTotal);

      // Show initial subset
      const itemsToShow = Math.min(
        allCombinations.length,
        podData.creators.length >= 3 ? 5 : podData.creators.length * 2
      );
      const shuffledItems = allCombinations
        .sort(() => 0.5 - Math.random())
        .slice(0, itemsToShow);
      setPricingPreview(
        shuffledItems.map((item) => ({
          ...item,
          totalCombinations: totalItems,
        }))
      );
    } catch (error) {
      createFallbackPreview();
    } finally {
      setIsPricingPreviewLoading(false);
    }
  }, [podData?.creators]);

  const createFallbackPreview = useCallback(() => {
    if (!podData?.creators || podData.creators.length === 0) return;

    // Common content items as fallback
    const commonItems = [
      "Solo Content",
      "Boy Girl",
      "Custom Content",
      "Video Call",
      "Sexting",
      "Live Show",
      "Photos",
      "Videos",
      "Audio",
      "Messages",
      "GFE",
      "Fetish",
      "Dick Rating",
      "Custom Photos",
      "Custom Videos",
      "Live Chat",
      "Voice Notes",
      "Text Chat",
      "Cam Show",
      "Strip Tease",
      "Roleplay",
      "ASMR",
      "JOI",
      "Tribute",
    ];

    // Create all combinations for rotation
    const allCombinations: Array<{
      name: string;
      price: string;
      creator: string;
    }> = [];

    commonItems.forEach((itemName) => {
      podData.creators.forEach((creator) => {
        allCombinations.push({
          name: itemName,
          price: "—",
          creator: creator.name,
        });
      });
    });

    const totalItems = allCombinations.length;

    // Store all data for rotation
    const allDataWithTotal = allCombinations.map((item) => ({
      ...item,
      totalCombinations: totalItems,
    }));
    setAllPricingData(allDataWithTotal);

    // Show initial subset
    const itemsToShow = Math.min(
      allCombinations.length,
      podData.creators.length >= 3 ? 5 : podData.creators.length * 2
    );
    const shuffledItems = allCombinations
      .sort(() => 0.5 - Math.random())
      .slice(0, itemsToShow);

    const fallbackItems = shuffledItems.map((item) => ({
      ...item,
      totalCombinations: totalItems,
    }));

    setPricingPreview(fallbackItems);
    setIsPricingPreviewLoading(false);
  }, [podData?.creators]);

  const fetchDriveSheets = useCallback(async () => {
    if (!podData?.creators || podData.creators.length === 0) {
      setDriveSheets([]);
      return;
    }

    setIsDriveLoading(true);
    setDriveError(null);

    try {
      const creatorNames = podData.creators.map((creator) => creator.name);
      const folderId = "1jV4H9nDmseNL8AdvokY8uAOM5am4YC_c"; // The folder ID from the Google Drive URL

      const response = await fetch("/api/drive/sheets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          folderId: folderId,
          creatorNames: creatorNames,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch sheets from Google Drive");
      }

      const data = await response.json();

      if (data.success) {
        setDriveSheets(data.sheets || []);
      } else {
        throw new Error(data.error || "Failed to fetch sheets");
      }
    } catch (err) {
      console.error("Error fetching drive sheets:", err);
      setDriveError("Failed to load sheets from Google Drive");
      setDriveSheets([]);
    } finally {
      setIsDriveLoading(false);
    }
  }, [podData?.creators]);

  const handleSheetClick = (sheetName: string, sheetUrl: string) => {
    setSelectedSheet({ name: sheetName, url: sheetUrl });
    setViewMode("sheet");

    // Update URL with googleUrl parameter
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("googleUrl", encodeURIComponent(sheetUrl));
      window.history.pushState({}, "", url.toString());
    }
  };

  const handleBackToDashboard = () => {
    setViewMode("dashboard");
    setSelectedSheet(null);
    // Make sure we're on the dashboard tab when going back
    setActiveTab("dashboard");

    // Remove googleUrl parameter from URL and set tab to dashboard
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("googleUrl");
      url.searchParams.set("tab", "dashboard");
      window.history.pushState({}, "", url.toString());
    }
  };

  const fetchPodData = async (rowNumber = selectedRow, retryCount = 0) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/pod/fetch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          spreadsheetUrl: DEFAULT_SPREADSHEET_URL,
          rowNumber: rowNumber,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        // Check for quota exceeded error
        if (
          response.status === 429 &&
          errorText.includes("Quota exceeded") &&
          retryCount < 3
        ) {
          console.log(
            `Quota exceeded, retrying in ${(retryCount + 1) * 2} seconds...`
          );
          await new Promise((resolve) =>
            setTimeout(resolve, (retryCount + 1) * 2000)
          );
          return fetchPodData(rowNumber, retryCount + 1);
        }
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        const basicData = result.data;

        // Update scheduler spreadsheet URL from API response
        if (basicData.schedulerSpreadsheetUrl) {
          setSchedulerSpreadsheetUrl(basicData.schedulerSpreadsheetUrl);
        }

        // Fetch earnings for creators if we have creator names
        if (basicData.creators && basicData.creators.length > 0) {
          const creatorNames = basicData.creators.map(
            (creator: Creator) => creator.name
          );
          const earnings = await fetchCreatorEarnings(creatorNames);

          // Update creators with earnings data
          const creatorsWithEarnings = basicData.creators.map(
            (creator: Creator) => ({
              ...creator,
              earnings: earnings[creator.name] || "$0",
            })
          );

          setPodData({
            ...basicData,
            creators: creatorsWithEarnings,
          });
        } else {
          setPodData(basicData);
        }
      } else {
        throw new Error(result.error || "Failed to fetch data");
      }
    } catch (err) {
      console.error("Error fetching POD data:", err);
      // If it's a quota error and we haven't exhausted retries, try again
      if (
        err instanceof Error &&
        err.message.includes("quota") &&
        retryCount < 3
      ) {
        console.log(
          `Retrying pod data fetch after error, attempt ${retryCount + 1}`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, (retryCount + 1) * 2000)
        );
        return fetchPodData(rowNumber, retryCount + 1);
      }
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle URL parameters for Google Sheets - run after podData is loaded
  useEffect(() => {
    if (typeof window !== "undefined" && podData) {
      const urlParams = new URLSearchParams(window.location.search);
      const googleUrl = urlParams.get("googleUrl");

      if (googleUrl) {
        try {
          const decodedUrl = decodeURIComponent(googleUrl);

          // Find the actual sheet name from podData.sheetLinks
          let sheetName = "Shared Sheet"; // fallback name
          if (podData.sheetLinks) {
            const matchingSheet = podData.sheetLinks.find(
              (link) => link.url === decodedUrl
            );
            if (matchingSheet) {
              sheetName = matchingSheet.name;
            }
          }

          setSelectedSheet({ name: sheetName, url: decodedUrl });
          setViewMode("sheet");
        } catch (error) {
          console.error("Error decoding Google URL parameter:", error);
        }
      }
    }
  }, [podData]); // Run this effect when podData changes

  // Handle tab parameter from URL on component mount
  useEffect(() => {
    const initializeComponent = async () => {
      // Set active tab from URL parameter
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get("tab");

        if (
          tabParam === "dashboard" ||
          tabParam === "sheets" ||
          tabParam === "board" ||
          tabParam === "admin" ||
          tabParam === "pricing"
        ) {
          setActiveTab(tabParam);
        }
      }

      // Always fetch teams data on mount as it's needed for team selection
      await fetchAvailableTeams();
    };

    initializeComponent();
  }, []);

  // Fetch dashboard-specific data when dashboard tab becomes active or team changes
  useEffect(() => {
    if (activeTab === "dashboard") {
      fetchPodData();
    }
  }, [activeTab, selectedRow]);

  // Fetch drive sheets only when sheets tab is active and we have creator data
  useEffect(() => {
    if (
      activeTab === "dashboard" &&
      podData?.creators &&
      podData.creators.length > 0
    ) {
      fetchDriveSheets();
    }
  }, [activeTab, podData?.creators, fetchDriveSheets]);

  // Fetch tasks when selectedRow changes or when dashboard tab is active
  useEffect(() => {
    if (activeTab === "dashboard" && selectedRow) {
      const teamId = `team-${selectedRow}`;
      fetchTasks(teamId);
    }
  }, [activeTab, selectedRow, fetchTasks]);

  // Fetch pricing preview only when podData is fully loaded with creators
  useEffect(() => {
    const creatorsKey =
      podData?.creators
        ?.map((c) => c.name)
        .sort()
        .join(",") || "";

    if (
      activeTab === "dashboard" &&
      podData?.creators &&
      podData.creators.length > 0 &&
      !isLoading && // Wait until POD data is loaded
      podData.lastUpdated && // Ensure POD data has been fetched
      !isPricingPreviewLoading && // Don't start new fetch if already loading
      lastFetchedCreators.current !== creatorsKey // Only fetch if creators changed
    ) {
      lastFetchedCreators.current = creatorsKey;
      fetchPricingPreview();
    } else if (
      activeTab === "dashboard" &&
      (!podData?.creators || podData.creators.length === 0) &&
      !isLoading
    ) {
      // Clear data when no creators
      setPricingPreview([]);
      setAllPricingData([]);
      setPricingRotationProgress(0);
      setIsPricingPreviewLoading(false);
      lastFetchedCreators.current = "";
    }
  }, [
    activeTab,
    podData?.creators,
    podData?.lastUpdated,
    isLoading,
    isPricingPreviewLoading,
  ]);

  // Auto-rotate pricing preview every 5 seconds with progress bar
  useEffect(() => {
    if (
      activeTab === "dashboard" &&
      allPricingData.length > 0 &&
      !isPricingPreviewLoading &&
      podData?.creators &&
      podData.creators.length > 0
    ) {
      const interval = setInterval(() => {
        // Rotate to new random items
        const itemsToShow = Math.min(
          allPricingData.length,
          podData.creators.length >= 3 ? 5 : podData.creators.length * 2
        );
        const shuffledItems = [...allPricingData]
          .sort(() => 0.5 - Math.random())
          .slice(0, itemsToShow);
        setPricingPreview(shuffledItems);
        setPricingRotationProgress(0); // Reset progress
      }, 5000); // 5 seconds

      // Progress bar animation
      const progressInterval = setInterval(() => {
        setPricingRotationProgress((prev) => {
          if (prev >= 100) return 0;
          return prev + 2; // Update every 100ms, reach 100% in 5 seconds
        });
      }, 100);

      return () => {
        clearInterval(interval);
        clearInterval(progressInterval);
      };
    }
  }, [activeTab, allPricingData, isPricingPreviewLoading, podData?.creators]);

  const handleTabChange = (
    tab: "dashboard" | "sheets" | "board" | "admin" | "pricing"
  ) => {
    console.log("Tab change clicked:", tab, "Current viewMode:", viewMode);
    setActiveTab(tab);

    // If we're currently viewing a sheet, exit sheet view mode
    if (viewMode === "sheet") {
      console.log("Exiting sheet view mode");
      setViewMode("dashboard");
      setSelectedSheet(null);
    }

    // Lazy load data for the selected tab
    if (tab === "dashboard" && !podData) {
      fetchPodData();
    } else if (tab === "sheets") {
      // For sheets tab, we need pod data first
      if (!podData) {
        fetchPodData(); // This will trigger drive sheets fetch via useEffect
      } else if (
        podData.creators &&
        podData.creators.length > 0 &&
        driveSheets.length === 0
      ) {
        fetchDriveSheets();
      }
    }

    // Update URL with tab parameter
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      // Remove googleUrl parameter when switching tabs manually
      url.searchParams.delete("googleUrl");
      window.history.pushState({}, "", url.toString());
    }
  };

  const handleSpreadsheetCreated = (url: string) => {
    // Set the new spreadsheet URL
    setSchedulerSpreadsheetUrl(url);

    // Refresh the drive sheets to show the newly created sheet
    if (podData?.creators && podData.creators.length > 0) {
      fetchDriveSheets();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-r from-pink-50/50 to-rose-50/50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-lg border border-pink-200 dark:border-pink-500/30">
          <div className="text-center">
            <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-400 dark:to-rose-400 bg-clip-text text-transparent mb-2">
              POD Management Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg">
              Manage your team, track workflow progress, and sync with Google
              Spreadsheets
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-pink-200 dark:border-pink-500/30">
          <nav className="flex overflow-x-auto scrollbar-hide">
            <div className="flex space-x-2 sm:space-x-8 min-w-max px-2 sm:px-0">
              <button
                onClick={() => handleTabChange("dashboard")}
                className={`py-3 sm:py-4 px-3 sm:px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === "dashboard"
                    ? "border-pink-500 text-pink-600 dark:text-pink-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => handleTabChange("sheets")}
                className={`py-3 sm:py-4 px-3 sm:px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === "sheets"
                    ? "border-pink-500 text-pink-600 dark:text-pink-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <span className="sm:hidden">Sheets</span>
                <span className="hidden sm:inline">Sheets Integration</span>
              </button>
              <button
                onClick={() => handleTabChange("board")}
                className={`py-3 sm:py-4 px-3 sm:px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === "board"
                    ? "border-pink-500 text-pink-600 dark:text-pink-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                Board
              </button>
              <button
                onClick={() => handleTabChange("pricing")}
                className={`py-3 sm:py-4 px-3 sm:px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === "pricing"
                    ? "border-pink-500 text-pink-600 dark:text-pink-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <span className="sm:hidden">Pricing</span>
                <span className="hidden sm:inline">Pricing Guide</span>
              </button>
              {session?.user?.role === "ADMIN" && (
                <button
                  onClick={() => handleTabChange("admin")}
                  className={`py-3 sm:py-4 px-3 sm:px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === "admin"
                      ? "border-pink-500 text-pink-600 dark:text-pink-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  Admin
                </button>
              )}
            </div>
          </nav>
        </div>

        {/* Main Dashboard Layout */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Sidebar - Hidden when admin or board tab is active */}
          {activeTab !== "admin" && activeTab !== "board" && (
            <div className="lg:w-80 w-full">
              {podData ? (
                <div className="w-full space-y-6">
                  {/* Team Selection & Info Combined */}
                  <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-none dark:ring-1 dark:ring-gray-800 overflow-hidden">
                    {/* Team Selection Header */}
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-xl">
                            <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 tracking-tight truncate">
                            {podData.teamName}
                          </h3>
                        </div>
                        <button
                          onClick={() => fetchPodData()}
                          disabled={isLoading}
                          className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                          title="Refresh team data"
                        >
                          <RefreshCw
                            className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Team Selection Dropdown */}
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                      {isLoadingTeams ? (
                        <TeamSelectorSkeleton />
                      ) : (
                        <div className="space-y-4">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Switch Team:
                          </label>
                          <select
                            value={selectedRow || ""}
                            onChange={(e) => {
                              const newRow = parseInt(e.target.value);
                              setSelectedRow(newRow);
                              fetchPodData(newRow);
                            }}
                            disabled={isLoading || isLoadingTeams}
                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all duration-200 disabled:opacity-50"
                          >
                            {availableTeams.length > 0 ? (
                              availableTeams.map((team) => (
                                <option key={team.row} value={team.row}>
                                  {team.name}
                                </option>
                              ))
                            ) : (
                              <option value={selectedRow || ""}>
                                Loading teams...
                              </option>
                            )}
                          </select>
                          {(isLoading || isLoadingTeams) && (
                            <div className="flex items-center text-sm text-purple-600 dark:text-purple-400">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                              {isLoadingTeams
                                ? "Loading teams..."
                                : "Loading data..."}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Team Members */}
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                        <div className="p-1 bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-lg mr-2">
                          <UserPlus className="h-3 w-3 text-pink-600 dark:text-pink-400" />
                        </div>
                        Team Members{" "}
                        {!isLoading &&
                          podData &&
                          `(${podData.teamMembers.length})`}
                      </h4>
                      <div className="space-y-3">
                        {isLoading ? (
                          Array.from({ length: 3 }).map((_, index) => (
                            <TeamMemberSkeleton key={index} />
                          ))
                        ) : podData && podData.teamMembers.length > 0 ? (
                          podData.teamMembers.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white font-medium text-xs">
                                  {member.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {member.name}
                                </span>
                              </div>
                              <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full font-medium">
                                {member.role}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6">
                            <UserPlus className="mx-auto h-8 w-8 text-gray-400 mb-2 opacity-50" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              No team members assigned
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Assigned Creators */}
                    <div className="px-6 py-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                        <div className="p-1 bg-gradient-to-br from-rose-500/20 to-pink-500/20 rounded-lg mr-2">
                          <Users className="h-3 w-3 text-rose-600 dark:text-rose-400" />
                        </div>
                        Assigned Creators{" "}
                        {!isLoading &&
                          podData &&
                          `(${podData.creators.length})`}
                      </h4>
                      <div className="space-y-3">
                        {isLoading ? (
                          Array.from({ length: 3 }).map((_, index) => (
                            <CreatorSkeleton key={index} />
                          ))
                        ) : podData && podData.creators.length > 0 ? (
                          podData.creators.map((creator) => (
                            <div
                              key={creator.id}
                              className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 border border-gray-100 dark:border-gray-800"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white font-medium text-xs">
                                  {creator.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {creator.name}
                                </span>
                              </div>
                              {creator.earnings && (
                                <span className="text-xs px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full font-medium">
                                  {creator.earnings}
                                </span>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6">
                            <Users className="mx-auto h-8 w-8 text-gray-400 mb-2 opacity-50" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              No creators assigned
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sheet Links Accordion */}
                    {podData?.creators && podData.creators.length > 0 && (
                      <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                          <div className="p-1 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-lg mr-2">
                            <FileSpreadsheet className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          Sheet Links
                        </h4>
                        <div className="space-y-2">
                          {Object.entries(groupedSheetLinks).map(
                            ([creatorName, sheets]) => (
                              <div
                                key={creatorName}
                                className="border border-gray-200 dark:border-gray-700 rounded-lg"
                              >
                                {/* Accordion Header */}
                                <button
                                  onClick={() => toggleSheetGroup(creatorName)}
                                  className="w-full px-3 py-2 flex items-center justify-between bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-lg"
                                >
                                  <div className="flex items-center space-x-2">
                                    <div
                                      className={`transition-all duration-300 ${openSheetGroups[creatorName] ? "rotate-180" : ""}`}
                                    >
                                      <ChevronDown className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      {creatorName}
                                    </span>
                                    <span className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full">
                                      {sheets.length}
                                    </span>
                                  </div>
                                </button>

                                {/* Accordion Content */}
                                {openSheetGroups[creatorName] && (
                                  <div className="p-2 space-y-1">
                                    {sheets.map((link, index) => (
                                      <div
                                        key={index}
                                        className="w-full p-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors group cursor-pointer"
                                        onClick={() =>
                                          handleSheetClick(link.name, link.url)
                                        }
                                      >
                                        <div className="flex items-start space-x-2">
                                          <div className="flex-shrink-0 mt-0.5">
                                            <div className="h-6 w-6 rounded bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                                              <FileSpreadsheet className="h-3 w-3 text-white" />
                                            </div>
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p
                                              className="text-xs font-medium text-gray-900 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate"
                                              title={link.name}
                                            >
                                              {link.name}
                                            </p>
                                            {link.url &&
                                              link.url.startsWith("http") && (
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.open(link.url, "_blank");
                                                  }}
                                                  className="flex items-center mt-1 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline transition-colors"
                                                >
                                                  <ExternalLink className="h-2 w-2 mr-1 flex-shrink-0" />
                                                  <span className="truncate">
                                                    Open Sheet
                                                  </span>
                                                </button>
                                              )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Sheet Integrations Accordion */}
                    {(isDriveLoading ||
                      (podData?.creators && podData.creators.length > 0)) && (
                      <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                          <div className="p-1 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-lg mr-2">
                            <Link className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                          </div>
                          Sheet Integrations
                        </h4>

                        {isDriveLoading ? (
                          <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                            Loading drive sheets...
                          </div>
                        ) : driveError ? (
                          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg p-3">
                            <p className="text-xs text-red-700 dark:text-red-300">
                              {driveError}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {Object.entries(groupedDriveSheets).map(
                              ([creatorName, sheets]) => (
                                <div
                                  key={creatorName}
                                  className="border border-gray-200 dark:border-gray-700 rounded-lg"
                                >
                                  {/* Accordion Header */}
                                  <button
                                    onClick={() =>
                                      toggleSheetGroup(
                                        `integration-${creatorName}`
                                      )
                                    }
                                    className="w-full px-3 py-2 flex items-center justify-between bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-lg"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <div
                                        className={`transition-all duration-300 ${openSheetGroups[`integration-${creatorName}`] ? "rotate-180" : ""}`}
                                      >
                                        <ChevronDown className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                                      </div>
                                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {creatorName}
                                      </span>
                                      <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                                        {sheets.length}
                                      </span>
                                    </div>
                                  </button>

                                  {/* Accordion Content */}
                                  {openSheetGroups[
                                    `integration-${creatorName}`
                                  ] && (
                                    <div className="p-2 space-y-1">
                                      {sheets.map((sheet) => (
                                        <div
                                          key={sheet.id}
                                          className="w-full p-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors group cursor-pointer"
                                          onClick={() =>
                                            handleSheetClick(sheet.name, sheet.url)
                                          }
                                        >
                                          <div className="flex items-start space-x-2">
                                            <div className="flex-shrink-0 mt-0.5">
                                              <div className="h-6 w-6 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                                <FileSpreadsheet className="h-3 w-3 text-white" />
                                              </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <p
                                                className="text-xs font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate"
                                                title={sheet.name}
                                              >
                                                {sheet.name}
                                              </p>
                                              {sheet.url &&
                                                sheet.url.startsWith(
                                                  "http"
                                                ) && (
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      window.open(sheet.url, "_blank");
                                                    }}
                                                    className="flex items-center mt-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors"
                                                  >
                                                    <ExternalLink className="h-2 w-2 mr-1 flex-shrink-0" />
                                                    <span className="truncate">
                                                      Open Sheet
                                                    </span>
                                                  </button>
                                                )}
                                              {sheet.lastModified && (
                                                <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                  <Calendar className="h-2 w-2 mr-1 flex-shrink-0" />
                                                  <span className="truncate">
                                                    {new Date(
                                                      sheet.lastModified
                                                    ).toLocaleDateString()}
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Scheduler Link */}
                    {schedulerSpreadsheetUrl && (
                      <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800">
                        <button
                          onClick={() =>
                            window.open(schedulerSpreadsheetUrl, "_blank")
                          }
                          className="flex items-center justify-center w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] text-sm font-medium"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Open Scheduler
                          <ExternalLink className="h-3 w-3 ml-2" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : error ? (
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-red-200 dark:border-red-500/30 rounded-lg p-6 text-center">
                  <div className="text-red-600 dark:text-red-400">
                    <p>Failed to load team data</p>
                    <button
                      onClick={() => fetchPodData()}
                      className="mt-2 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-sm hover:bg-red-200 dark:hover:bg-red-900/50"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : isLoading ? (
                <div className="w-full space-y-6">
                  {/* Team Selection & Info Combined */}
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-pink-200 dark:border-pink-500/30 rounded-lg shadow-lg">
                    {/* Team Selection Header */}
                    <div className="bg-gradient-to-r from-purple-50/50 to-indigo-50/50 dark:from-purple-900/30 dark:to-indigo-900/30 border-b border-purple-200 dark:border-purple-500/30 p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mr-3">
                            <Users className="h-4 w-4 text-white" />
                          </div>
                          <Skeleton className="h-6 w-32" />
                        </h3>
                        <button
                          disabled
                          className="p-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg shadow-md opacity-50"
                          title="Loading..."
                        >
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        </button>
                      </div>
                    </div>

                    {/* Team Selection Dropdown */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-600">
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Switch Team:
                        </label>
                        <Skeleton className="h-10 w-full rounded-lg" />
                      </div>
                    </div>

                    {/* Team Members */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-600">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Team Members
                      </h4>
                      <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <TeamMemberSkeleton key={index} />
                        ))}
                      </div>
                    </div>

                    {/* Assigned Creators */}
                    <div className="p-4">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Assigned Creators
                      </h4>
                      <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <CreatorSkeleton key={index} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-pink-200 dark:border-pink-500/30 rounded-lg p-6 text-center">
                  <span className="text-gray-500 dark:text-gray-400">
                    No team data available
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Main Content */}
          <div
            className={`${activeTab === "admin" || activeTab === "board" ? "w-full" : "flex-1"} space-y-6`}
          >
            {viewMode === "sheet" && selectedSheet ? (
              <SheetViewer
                sheetName={selectedSheet.name}
                sheetUrl={selectedSheet.url}
                onBack={handleBackToDashboard}
              />
            ) : (
              <>
                {activeTab === "dashboard" && (
                  <>
                    {/* Workflow Dashboard */}
                    {isLoading ? (
                      <WorkflowDashboardSkeleton />
                    ) : podData ? (
                      isTasksLoading ? (
                        <WorkflowDashboardSkeleton />
                      ) : (
                        <WorkflowDashboard
                          tasks={tasks}
                          creators={podData?.creators || []}
                          onPricingGuideClick={() => handleTabChange("pricing")}
                          pricingPreview={pricingPreview}
                          pricingRotationProgress={pricingRotationProgress}
                        />
                      )
                    ) : (
                      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-pink-200 dark:border-pink-500/30 rounded-lg p-6 text-center">
                        <span className="text-gray-500 dark:text-gray-400">
                          Select a team to view workflow
                        </span>
                      </div>
                    )}
                  </>
                )}

                {activeTab === "sheets" && (
                  <>
                    {/* Show loading state if pod data is not loaded yet */}
                    {!podData ? (
                      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-pink-200 dark:border-pink-500/30 rounded-lg p-6">
                        <div className="flex items-center space-x-3">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600"></div>
                          <span className="text-gray-700 dark:text-gray-300">
                            Loading team data for sheets integration...
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Google Sheets Integration */
                      <SheetsIntegration
                        onSpreadsheetCreated={handleSpreadsheetCreated}
                        onSheetCreated={() => {
                          // Refresh drive sheets when a new sheet is created
                          if (
                            podData?.creators &&
                            podData.creators.length > 0
                          ) {
                            fetchDriveSheets();
                          }
                        }}
                      />
                    )}
                  </>
                )}

                {activeTab === "board" && (
                  <Board
                    teamId={`team-${selectedRow}`}
                    teamName={
                      availableTeams.find((team) => team.row === selectedRow)
                        ?.name || "Selected Team"
                    }
                    session={session}
                    availableTeams={availableTeams}
                    onTeamChange={setSelectedRow}
                    selectedRow={selectedRow}
                  />
                )}

                {activeTab === "admin" && session?.user?.role === "ADMIN" && (
                  <>
                    {/* Admin Dashboard - loads its own data when rendered */}
                    <PodAdminDashboard />
                  </>
                )}

                {activeTab === "pricing" && (
                  <>
                    {/* Pricing Guide */}
                    <PricingGuide creators={podData?.creators || []} />
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PodComponent;
