"use client";

import React, { useState, useEffect, useCallback } from "react";

interface AnalystSheetViewerProps {
  sheetName: string;
  sheetUrl: string;
  onBack: () => void;
  backText?: string;
}

interface CaptionData {
  caption: string;
  captionCategory: string;
  contentType?: string;
  descriptionExplanation?: string;
}

interface SheetInfo {
  name: string;
  gid: string;
  hidden?: boolean;
}

const AnalystSheetViewer: React.FC<AnalystSheetViewerProps> = ({
  sheetName,
  sheetUrl,
  onBack,
  backText = "Back",
}) => {
  const [activeSubtab, setActiveSubtab] = useState<"top-performing" | "scraped" | "chatter-submitted" | "mm-ideas">("top-performing");

  // State for generated captions
  const [generatedCaptions, setGeneratedCaptions] = useState<string[]>([]);
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);
  const [showGeneratedCaptions, setShowGeneratedCaptions] = useState(false);
  const [copiedCaptionId, setCopiedCaptionId] = useState<string | null>(null);
  
  // State for expandable captions
  const [expandedCaptions, setExpandedCaptions] = useState<{ [key: string]: boolean }>({});

  // State for selected captions for reference
  const [selectedCaptions, setSelectedCaptions] = useState<{ [key: string]: boolean }>({});

  // State for dynamic sheet data
  const [availableSheets, setAvailableSheets] = useState<SheetInfo[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [isLoadingSheets, setIsLoadingSheets] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // Dynamic caption data
  const [dynamicTopPerformingCaptions, setDynamicTopPerformingCaptions] = useState<CaptionData[]>([]);
  const [dynamicScrapedCaptions, setDynamicScrapedCaptions] = useState<CaptionData[]>([]);
  const [dynamicChatterSubmittedCaptions, setDynamicChatterSubmittedCaptions] = useState<CaptionData[]>([]);
  const [dynamicScrapedCaptionsMMIdeas, setDynamicScrapedCaptionsMMIdeas] = useState<CaptionData[]>([]);

  const handleOpenInNewTab = () => {
    if (sheetUrl && sheetUrl.startsWith("http")) {
      window.open(sheetUrl, "_blank");
    }
  };

  // Function to extract spreadsheet ID from URL
  const extractSpreadsheetId = (url: string) => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  // Function to fetch available sheets
  const fetchAvailableSheets = useCallback(async () => {
    if (!sheetUrl) return;
    
    const spreadsheetId = extractSpreadsheetId(sheetUrl);
    if (!spreadsheetId) return;

    setIsLoadingSheets(true);
    try {
      const response = await fetch(`/api/sheets/get-sheets?spreadsheetId=${spreadsheetId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.sheets) {
          // Filter sheets to only include those with "FREE" or "PAID" in their names
          const filteredSheets = data.sheets.filter((sheet: SheetInfo) => {
            const sheetName = sheet.name.toUpperCase();
            return sheetName.includes('FREE') || sheetName.includes('PAID');
          });
          
          setAvailableSheets(filteredSheets);
          
          // Set first sheet as default if any sheets match the filter
          if (filteredSheets.length > 0) {
            setSelectedSheet(filteredSheets[0].name);
          } else {
            setSelectedSheet("");
          }
        }
      }
    } catch (error) {
      console.error("Error fetching sheets:", error);
    } finally {
      setIsLoadingSheets(false);
    }
  }, [sheetUrl]);

  // Function to fetch caption data from specific ranges
  const fetchCaptionData = useCallback(async (sheetName: string) => {
    if (!sheetUrl || !sheetName) return;
    
    const spreadsheetId = extractSpreadsheetId(sheetUrl);
    if (!spreadsheetId) return;

    setIsLoadingData(true);
    try {
      // Define the ranges for each category
      const ranges = {
        topPerforming: `${sheetName}!G8:I`,
        scraped: `${sheetName}!K8:M`,
        chatterSubmitted: `${sheetName}!O8:Q`,
        mmIdeas: `${sheetName}!S8:U`
      };

      // Fetch all ranges in parallel
      const fetchPromises = Object.entries(ranges).map(async ([category, range]) => {
        const response = await fetch(`/api/sheets/get-range?spreadsheetId=${spreadsheetId}&range=${range}`);
        if (response.ok) {
          const data = await response.json();
          return { category, data: data.values || [] };
        }
        return { category, data: [] };
      });

      const results = await Promise.all(fetchPromises);
      
      // Process each category's data
      results.forEach(({ category, data }) => {
        const processedData = data.slice(0).map((row: string[]) => ({
          caption: row[0] || "",
          captionCategory: row[1] || "",
          contentType: row[2] || "",
          descriptionExplanation: category === 'mmIdeas' ? row[2] || "" : undefined
        })).filter((item: CaptionData) => item.caption.trim() !== "");

        switch (category) {
          case 'topPerforming':
            setDynamicTopPerformingCaptions(processedData);
            break;
          case 'scraped':
            setDynamicScrapedCaptions(processedData);
            break;
          case 'chatterSubmitted':
            setDynamicChatterSubmittedCaptions(processedData);
            break;
          case 'mmIdeas':
            setDynamicScrapedCaptionsMMIdeas(processedData);
            break;
        }
      });

    } catch (error) {
      console.error("Error fetching caption data:", error);
    } finally {
      setIsLoadingData(false);
    }
  }, [sheetUrl]);

  // Effect to load sheets on component mount
  useEffect(() => {
    fetchAvailableSheets();
  }, [fetchAvailableSheets]);

  // Effect to load data when sheet selection changes
  useEffect(() => {
    if (selectedSheet) {
      fetchCaptionData(selectedSheet);
    }
  }, [selectedSheet, fetchCaptionData]);

  // Handle sheet selection change
  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName);
  };

  // Function to toggle caption expansion
  const toggleCaptionExpansion = (key: string) => {
    setExpandedCaptions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Function to toggle caption selection
  const toggleCaptionSelection = (key: string) => {
    setSelectedCaptions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Function to select all captions in current category
  const toggleSelectAll = () => {
    const currentData = getCurrentCategoryData();
    const currentKeys = currentData.map((_, index) => `${activeSubtab}-${index}`);
    const allSelected = currentKeys.every(key => selectedCaptions[key]);
    
    setSelectedCaptions(prev => {
      const newState = { ...prev };
      currentKeys.forEach(key => {
        newState[key] = !allSelected;
      });
      return newState;
    });
  };

  // Function to get selected captions for current category
  const getSelectedCaptionsForGeneration = (): CaptionData[] => {
    const currentData = getCurrentCategoryData();
    return currentData.filter((_, index) => {
      const key = `${activeSubtab}-${index}`;
      return selectedCaptions[key];
    });
  };

  // Function to truncate caption text
  const truncateCaption = (caption: string, maxLength: number = 150) => {
    if (caption.length <= maxLength) return caption;
    return caption.substring(0, maxLength) + "...";
  };

  // Function to detect and render clickable links
  const renderCaptionWithLinks = (caption: string) => {
    // Regular expression to detect URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    // Split the caption by URLs
    const parts = caption.split(urlRegex);
    
    return parts.map((part, index) => {
      // Check if this part is a URL
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()} // Prevent row click when clicking link
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline break-all"
          >
            {part}
          </a>
        );
      }
      // Return regular text
      return <span key={index}>{part}</span>;
    });
  };

  // Function to generate captions based on active category
  const handleGenerateCaption = async () => {
    const selectedData = getSelectedCaptionsForGeneration();
    
    let captionDataToUse: CaptionData[];
    
    if (selectedData.length === 0) {
      // Fallback to all captions if none selected
      const allData = getCurrentCategoryData();
      if (allData.length === 0) {
        console.error("No caption data available for generation");
        return;
      }
      // Use all data as fallback
      captionDataToUse = allData;
    } else {
      captionDataToUse = selectedData;
    }

    setIsGeneratingCaptions(true);
    setShowGeneratedCaptions(false);

    // Scroll to the bottom of the page to show where results will appear
    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });
    }, 100);

    try {
      const response = await fetch("/api/generate-analyst-captions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          captionData: captionDataToUse,
          categoryType: activeSubtab,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate captions");
      }

      const data = await response.json();

      if (data.success && data.captions) {
        setGeneratedCaptions(data.captions);
        setShowGeneratedCaptions(true);
        
        // Scroll to the generated captions section after they appear
        setTimeout(() => {
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
          });
        }, 200);
      } else {
        throw new Error(data.message || "Failed to generate captions");
      }
    } catch (error) {
      console.error("Error generating captions:", error);
    } finally {
      setIsGeneratingCaptions(false);
    }
  };

  // Helper function to get current category data
  const getCurrentCategoryData = (): CaptionData[] => {
    switch (activeSubtab) {
      case "top-performing":
        return dynamicTopPerformingCaptions;
      case "scraped":
        return dynamicScrapedCaptions;
      case "chatter-submitted":
        return dynamicChatterSubmittedCaptions;
      case "mm-ideas":
        return dynamicScrapedCaptionsMMIdeas;
      default:
        return [];
    }
  };

  // Enhanced copy function
  const copyToClipboard = async (caption: string, captionId: string) => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopiedCaptionId(captionId);

      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedCaptionId(null);
      }, 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = caption;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);

      setCopiedCaptionId(captionId);
      setTimeout(() => {
        setCopiedCaptionId(null);
      }, 2000);
    }
  };



  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                <span>{backText}</span>
              </button>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {sheetName}
              </h1>
              {availableSheets.length > 0 ? (
                <>
                  <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Sheet:</span>
                    <select
                      value={selectedSheet}
                      onChange={(e) => handleSheetChange(e.target.value)}
                      disabled={isLoadingSheets || isLoadingData}
                      className="text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {availableSheets.map((sheet) => (
                        <option key={sheet.gid} value={sheet.name}>
                          {sheet.name}
                        </option>
                      ))}
                    </select>
                    {(isLoadingSheets || isLoadingData) && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    )}
                  </div>
                </>
              ) : !isLoadingSheets ? (
                <>
                  <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                      No sheets found with "FREE" or "PAID" in the name
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Loading sheets...</span>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={handleOpenInNewTab}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              <span>Open in New Tab</span>
            </button>
          </div>
        </div>
      </div>

      {/* Folder-Style Tab Navigation */}
      {availableSheets.length > 0 ? (
        <div className="max-w-7xl mx-auto">
          <div className="bg-gray-50 dark:bg-gray-900 pt-6">
            <div className="px-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Caption Categories
                </h3>
                <button
                  onClick={handleGenerateCaption}
                  disabled={isGeneratingCaptions}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isGeneratingCaptions
                      ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  }`}
                >
                  {isGeneratingCaptions ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                      <span>Generating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Generate Caption</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          <nav className="flex relative ">
            <button
              onClick={() => setActiveSubtab("top-performing")}
              className={`px-6 py-3 transition-all duration-200 flex items-center space-x-3 font-medium relative border-l border-t border-r ${
                activeSubtab === "top-performing"
                  ? "bg-white dark:bg-gray-800 text-green-700 dark:text-green-300 border-gray-200 dark:border-gray-600 rounded-t-lg -mb-px z-20"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-gray-100 rounded-t-lg border-gray-300 dark:border-gray-600 z-10 border-b border-b-gray-300 dark:border-b-gray-600"
              } -mr-3`}
            >
              <span className="h-3 w-3 bg-green-500 rounded-full flex-shrink-0"></span>
              <span className="text-sm">Top Performing</span>
            </button>
            
            <button
              onClick={() => setActiveSubtab("scraped")}
              className={`px-6 py-3 transition-all duration-200 flex items-center space-x-3 font-medium relative border-l border-t border-r ${
                activeSubtab === "scraped"
                  ? "bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 border-gray-200 dark:border-gray-600 rounded-t-lg -mb-px z-20"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-gray-100 rounded-t-lg border-gray-300 dark:border-gray-600 z-10 border-b border-b-gray-300 dark:border-b-gray-600"
              } -mr-3`}
            >
              <span className="h-3 w-3 bg-blue-500 rounded-full flex-shrink-0"></span>
              <span className="text-sm">Scraped Captions</span>
            </button>
            
            <button
              onClick={() => setActiveSubtab("chatter-submitted")}
              className={`px-6 py-3 transition-all duration-200 flex items-center space-x-3 font-medium relative border-l border-t border-r ${
                activeSubtab === "chatter-submitted"
                  ? "bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-300 border-gray-200 dark:border-gray-600 rounded-t-lg -mb-px z-20"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-gray-100 rounded-t-lg border-gray-300 dark:border-gray-600 z-10 border-b border-b-gray-300 dark:border-b-gray-600"
              } -mr-3`}
            >
              <span className="h-3 w-3 bg-purple-500 rounded-full flex-shrink-0"></span>
              <span className="text-sm">Chatter-submitted</span>
            </button>
            
            <button
              onClick={() => setActiveSubtab("mm-ideas")}
              className={`px-6 py-3 transition-all duration-200 flex items-center space-x-3 font-medium relative border-l border-t border-r ${
                activeSubtab === "mm-ideas"
                  ? "bg-white dark:bg-gray-800 text-orange-700 dark:text-orange-300 border-gray-200 dark:border-gray-600 rounded-t-lg -mb-px z-20"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-gray-100 rounded-t-lg border-gray-300 dark:border-gray-600 z-10 border-b border-b-gray-300 dark:border-b-gray-600"
              }`}
            >
              <span className="h-3 w-3 bg-orange-500 rounded-full flex-shrink-0"></span>
              <span className="text-sm">MM Ideas</span>
            </button>
          </nav>
        </div>

        {/* Main Content Area - Connected to Active Tab */}
        <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 border-t-0 shadow-sm ${
          activeSubtab === "top-performing" 
            ? "rounded-b-lg rounded-tr-lg rounded-tl-0" 
            : activeSubtab === "scraped"
            ? "rounded-b-lg rounded-tr-lg "
            : activeSubtab === "chatter-submitted"
            ? "rounded-b-lg rounded-tr-lg "
            : "rounded-b-lg rounded-tr-lg "
        }`}>
          {activeSubtab === "top-performing" && (
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                <span className="h-3 w-3 bg-green-500 rounded-full mr-3"></span>
                Top Performing Captions
              </h3>
              <div className="overflow-hidden">
                {/* Header */}
                <div className="bg-green-50 dark:bg-green-900/20 px-6 py-4 border-b border-green-200 dark:border-green-500/30">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-sm font-medium text-green-700 dark:text-green-300">
                    <div className="lg:col-span-1 flex items-center">
                      <input
                        type="checkbox"
                        checked={getCurrentCategoryData().length > 0 && getCurrentCategoryData().every((_, index) => {
                          const key = `${activeSubtab}-${index}`;
                          return selectedCaptions[key];
                        })}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                    <div className="lg:col-span-6">Caption</div>
                    <div className="lg:col-span-3">Caption Category</div>
                    <div className="lg:col-span-2">Content Type</div>
                  </div>
                </div>
                {/* Content */}
                <div className="divide-y divide-gray-200 dark:divide-gray-600">
                  {dynamicTopPerformingCaptions.map((caption: CaptionData, index: number) => {
                    const captionKey = `top-performing-${index}`;
                    const isExpanded = expandedCaptions[captionKey];
                    const isLongCaption = caption.caption.length > 150;
                    
                    return (
                      <div 
                        key={index} 
                        className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                        onClick={() => toggleCaptionSelection(captionKey)}
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                          <div className="lg:col-span-1 flex items-start pt-1">
                            <input
                              type="checkbox"
                              checked={selectedCaptions[captionKey] || false}
                              onChange={() => toggleCaptionSelection(captionKey)}
                              className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                          </div>
                          <div className="lg:col-span-6 space-y-1">
                            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 lg:hidden">Caption:</div>
                            <div className="text-sm text-gray-900 dark:text-gray-100">
                              <div className="overflow-hidden">
                                <div 
                                  className={`transition-all duration-500 ease-in-out ${
                                    isExpanded ? 'max-h-none opacity-100' : 'max-h-20 opacity-90'
                                  }`}
                                >
                                  {isExpanded || !isLongCaption 
                                    ? renderCaptionWithLinks(caption.caption)
                                    : renderCaptionWithLinks(truncateCaption(caption.caption))
                                  }
                                </div>
                              </div>
                              {isLongCaption && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleCaptionExpansion(captionKey);
                                  }}
                                  className="ml-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-xs font-medium transition-all duration-200 hover:scale-105 inline-flex items-center gap-1"
                                >
                                  <span>{isExpanded ? "Show less" : "Show more"}</span>
                                  <svg 
                                    className={`h-3 w-3 transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="lg:col-span-3 space-y-1">
                            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 lg:hidden">Caption Category:</div>
                            <div className="text-sm text-gray-700 dark:text-gray-300">
                              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                                {caption.captionCategory}
                              </span>
                            </div>
                          </div>
                          <div className="lg:col-span-2 space-y-1">
                            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 lg:hidden">Content Type:</div>
                            <div className="text-sm text-gray-700 dark:text-gray-300">{caption.contentType}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {isLoadingData && (
                    <div className="p-8 text-center">
                      <div className="inline-flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Loading caption data...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSubtab === "scraped" && (
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                <span className="h-3 w-3 bg-blue-500 rounded-full mr-3"></span>
                Scraped Captions
              </h3>
              <div className="overflow-hidden">
                {/* Header */}
                <div className="bg-blue-50 dark:bg-blue-900/20 px-6 py-4 border-b border-blue-200 dark:border-blue-500/30">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-sm font-medium text-blue-700 dark:text-blue-300">
                    <div className="lg:col-span-1 flex items-center">
                      <input
                        type="checkbox"
                        checked={getCurrentCategoryData().length > 0 && getCurrentCategoryData().every((_, index) => {
                          const key = `${activeSubtab}-${index}`;
                          return selectedCaptions[key];
                        })}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                    <div className="lg:col-span-6">Caption</div>
                    <div className="lg:col-span-3">Caption Category</div>
                    <div className="lg:col-span-2">Content Type</div>
                  </div>
                </div>
                {/* Content */}
                <div className="divide-y divide-gray-200 dark:divide-gray-600">
                  {dynamicScrapedCaptions.map((caption: CaptionData, index: number) => {
                    const captionKey = `scraped-${index}`;
                    const isExpanded = expandedCaptions[captionKey];
                    const isLongCaption = caption.caption.length > 150;
                    
                    return (
                      <div 
                        key={index} 
                        className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                        onClick={() => toggleCaptionSelection(captionKey)}
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                          <div className="lg:col-span-1 flex items-start pt-1">
                            <input
                              type="checkbox"
                              checked={selectedCaptions[captionKey] || false}
                              onChange={() => toggleCaptionSelection(captionKey)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                          </div>
                          <div className="lg:col-span-6 space-y-1">
                            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 lg:hidden">Caption:</div>
                            <div className="text-sm text-gray-900 dark:text-gray-100">
                              <div className="overflow-hidden">
                                <div 
                                  className={`transition-all duration-500 ease-in-out ${
                                    isExpanded ? 'max-h-none opacity-100' : 'max-h-20 opacity-90'
                                  }`}
                                >
                                  {isExpanded || !isLongCaption 
                                    ? renderCaptionWithLinks(caption.caption)
                                    : renderCaptionWithLinks(truncateCaption(caption.caption))
                                  }
                                </div>
                              </div>
                              {isLongCaption && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleCaptionExpansion(captionKey);
                                  }}
                                  className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs font-medium transition-all duration-200 hover:scale-105 inline-flex items-center gap-1"
                                >
                                  <span>{isExpanded ? "Show less" : "Show more"}</span>
                                  <svg 
                                    className={`h-3 w-3 transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="lg:col-span-3 space-y-1">
                            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 lg:hidden">Caption Category:</div>
                            <div className="text-sm text-gray-700 dark:text-gray-300">
                              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                                {caption.captionCategory}
                              </span>
                            </div>
                          </div>
                          <div className="lg:col-span-2 space-y-1">
                            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 lg:hidden">Content Type:</div>
                            <div className="text-sm text-gray-700 dark:text-gray-300">{caption.contentType}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {isLoadingData && (
                    <div className="p-8 text-center">
                      <div className="inline-flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Loading caption data...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSubtab === "chatter-submitted" && (
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                <span className="h-3 w-3 bg-purple-500 rounded-full mr-3"></span>
                Chatter-submitted Captions
              </h3>
              <div className="overflow-hidden">
                {/* Header */}
                <div className="bg-purple-50 dark:bg-purple-900/20 px-6 py-4 border-b border-purple-200 dark:border-purple-500/30">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-sm font-medium text-purple-700 dark:text-purple-300">
                    <div className="lg:col-span-1 flex items-center">
                      <input
                        type="checkbox"
                        checked={getCurrentCategoryData().length > 0 && getCurrentCategoryData().every((_, index) => {
                          const key = `${activeSubtab}-${index}`;
                          return selectedCaptions[key];
                        })}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                    <div className="lg:col-span-6">Caption</div>
                    <div className="lg:col-span-3">Caption Category</div>
                    <div className="lg:col-span-2">Content Type</div>
                  </div>
                </div>
                {/* Content */}
                <div className="divide-y divide-gray-200 dark:divide-gray-600">
                  {dynamicChatterSubmittedCaptions.map((caption: CaptionData, index: number) => {
                    const captionKey = `chatter-submitted-${index}`;
                    const isExpanded = expandedCaptions[captionKey];
                    const isLongCaption = caption.caption.length > 150;
                    
                    return (
                      <div 
                        key={index} 
                        className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                        onClick={() => toggleCaptionSelection(captionKey)}
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                          <div className="lg:col-span-1 flex items-start pt-1">
                            <input
                              type="checkbox"
                              checked={selectedCaptions[captionKey] || false}
                              onChange={() => toggleCaptionSelection(captionKey)}
                              className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                          </div>
                          <div className="lg:col-span-6 space-y-1">
                            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 lg:hidden">Caption:</div>
                            <div className="text-sm text-gray-900 dark:text-gray-100">
                              <div className="overflow-hidden">
                                <div 
                                  className={`transition-all duration-500 ease-in-out ${
                                    isExpanded ? 'max-h-none opacity-100' : 'max-h-20 opacity-90'
                                  }`}
                                >
                                  {isExpanded || !isLongCaption 
                                    ? renderCaptionWithLinks(caption.caption)
                                    : renderCaptionWithLinks(truncateCaption(caption.caption))
                                  }
                                </div>
                              </div>
                              {isLongCaption && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleCaptionExpansion(captionKey);
                                  }}
                                  className="ml-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-xs font-medium transition-all duration-200 hover:scale-105 inline-flex items-center gap-1"
                                >
                                  <span>{isExpanded ? "Show less" : "Show more"}</span>
                                  <svg 
                                    className={`h-3 w-3 transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="lg:col-span-3 space-y-1">
                            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 lg:hidden">Caption Category:</div>
                            <div className="text-sm text-gray-700 dark:text-gray-300">
                              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                                {caption.captionCategory}
                              </span>
                            </div>
                          </div>
                          <div className="lg:col-span-2 space-y-1">
                            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 lg:hidden">Content Type:</div>
                            <div className="text-sm text-gray-700 dark:text-gray-300">{caption.contentType}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {isLoadingData && (
                    <div className="p-8 text-center">
                      <div className="inline-flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Loading caption data...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSubtab === "mm-ideas" && (
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                <span className="h-3 w-3 bg-orange-500 rounded-full mr-3"></span>
                Scraped Captions/MM Ideas
              </h3>
              <div className="overflow-hidden">
                {/* Header */}
                <div className="bg-orange-50 dark:bg-orange-900/20 px-6 py-4 border-b border-orange-200 dark:border-orange-500/30">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-sm font-medium text-orange-700 dark:text-orange-300">
                    <div className="lg:col-span-1 flex items-center">
                      <input
                        type="checkbox"
                        checked={getCurrentCategoryData().length > 0 && getCurrentCategoryData().every((_, index) => {
                          const key = `${activeSubtab}-${index}`;
                          return selectedCaptions[key];
                        })}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 dark:focus:ring-orange-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                    <div className="lg:col-span-6">Caption</div>
                    <div className="lg:col-span-3">Caption Category</div>
                    <div className="lg:col-span-2">Description/Explanation</div>
                  </div>
                </div>
                {/* Content */}
                <div className="divide-y divide-gray-200 dark:divide-gray-600">
                  {dynamicScrapedCaptionsMMIdeas.map((caption: CaptionData, index: number) => {
                    const captionKey = `mm-ideas-${index}`;
                    const isExpanded = expandedCaptions[captionKey];
                    const isLongCaption = caption.caption.length > 150;
                    
                    return (
                      <div 
                        key={index} 
                        className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                        onClick={() => toggleCaptionSelection(captionKey)}
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                          <div className="lg:col-span-1 flex items-start pt-1">
                            <input
                              type="checkbox"
                              checked={selectedCaptions[captionKey] || false}
                              onChange={() => toggleCaptionSelection(captionKey)}
                              className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 dark:focus:ring-orange-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                          </div>
                          <div className="lg:col-span-6 space-y-1">
                            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 lg:hidden">Caption:</div>
                            <div className="text-sm text-gray-900 dark:text-gray-100">
                              <div className="overflow-hidden">
                                <div 
                                  className={`transition-all duration-500 ease-in-out ${
                                    isExpanded ? 'max-h-none opacity-100' : 'max-h-20 opacity-90'
                                  }`}
                                >
                                  {isExpanded || !isLongCaption 
                                    ? renderCaptionWithLinks(caption.caption)
                                    : renderCaptionWithLinks(truncateCaption(caption.caption))
                                  }
                                </div>
                              </div>
                              {isLongCaption && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleCaptionExpansion(captionKey);
                                  }}
                                  className="ml-2 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 text-xs font-medium transition-all duration-200 hover:scale-105 inline-flex items-center gap-1"
                                >
                                  <span>{isExpanded ? "Show less" : "Show more"}</span>
                                  <svg 
                                    className={`h-3 w-3 transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="lg:col-span-3 space-y-1">
                            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 lg:hidden">Caption Category:</div>
                            <div className="text-sm text-gray-700 dark:text-gray-300">
                              <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-xs font-medium">
                                {caption.captionCategory}
                              </span>
                            </div>
                          </div>
                          <div className="lg:col-span-2 space-y-1">
                            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 lg:hidden">Description/Explanation:</div>
                            <div className="text-sm text-gray-700 dark:text-gray-300">{caption.descriptionExplanation}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {isLoadingData && (
                    <div className="p-8 text-center">
                      <div className="inline-flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Loading caption data...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading State for Caption Generation */}
        {isGeneratingCaptions && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
            <div className="p-8 text-center">
              <div className="inline-flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-gray-600 dark:text-gray-400 font-medium">
                  Generating captions for {activeSubtab.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())}...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Generated Captions Section */}
        {showGeneratedCaptions && generatedCaptions.length > 0 && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Generated Captions for {activeSubtab.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())}
                </h3>
                <button
                  onClick={() => setShowGeneratedCaptions(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid gap-4">
                {generatedCaptions.map((caption, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700"
                  >
                    <div className="flex justify-between items-start space-x-3">
                      <div className="flex-1">
                        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                          {caption}
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(caption, `generated-${index}`)}
                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                          copiedCaptionId === `generated-${index}`
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-600"
                            : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/40 border border-blue-200 dark:border-blue-600"
                        }`}
                      >
                        {copiedCaptionId === `generated-${index}` ? (
                          <>
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        </div>
      ) : !isLoadingSheets ? (
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm mt-6 mx-6">
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full mb-4">
                <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No Compatible Sheets Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                This spreadsheet doesn't contain any sheets with "FREE" or "PAID" in their names.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Please ensure your sheet names include "FREE" or "PAID" to use the Analyst Sheet Viewer.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AnalystSheetViewer;
