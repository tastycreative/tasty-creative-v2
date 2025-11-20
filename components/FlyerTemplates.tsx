/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";



export default function FlyerTemplates({
  flyer,
  type,
  setSelectedTemplate,
  setSelectedTemplateImage,
  preselectedTemplate,
}: {
  flyer: string;
  type: string;
  setSelectedTemplate: (template: string) => void;
  setSelectedTemplateImage: (templateImage: string) => void;
  preselectedTemplate?: string | null;
}) {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFiles, setShowFiles] = useState(false);
  const [isDownloading, startDownloadTransition] = useTransition();
  const [hasAutoSelected, setHasAutoSelected] = useState(false);
  const [isAutoSelecting, setIsAutoSelecting] = useState(false);

  async function fetchFiles() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/google-drive/flyer-templates?type=${type}`);
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setFiles(data.files);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/google-drive/flyer-templates?flyer=${flyer}&type=${type}`
        );
        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }
        const data = await res.json();
        setFiles(data.files);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (type != "LIVE") {
      fetchFiles();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  // Handle preselected template from URL
  useEffect(() => {
    console.log('🎨 FlyerTemplates - preselectedTemplate:', preselectedTemplate);
    console.log('📁 Files loaded:', files.length);
    console.log('✅ Has auto-selected:', hasAutoSelected);

    // Fetch files if preselected template is provided and files haven't been loaded
    if (preselectedTemplate && files.length === 0 && !loading) {
      console.log('🔄 Fetching template files for auto-selection...');
      fetchFiles();
    }

    if (preselectedTemplate && !hasAutoSelected && files.length > 0) {
      console.log('🔍 Searching for template:', preselectedTemplate);
      console.log('📋 All file names:', files.map((f: any) => f.name));

      // Try exact match first
      let matchingFile = files.find((file: any) => file.name === preselectedTemplate);

      // If no exact match, try with .png extension
      if (!matchingFile) {
        matchingFile = files.find((file: any) => file.name === `${preselectedTemplate}.png`);
      }

      // If still no match, try case-insensitive match
      if (!matchingFile) {
        matchingFile = files.find((file: any) =>
          file.name.toLowerCase() === preselectedTemplate.toLowerCase() ||
          file.name.toLowerCase() === `${preselectedTemplate}.png`.toLowerCase()
        );
      }

      console.log('🎯 Matching file:', matchingFile);

      if (matchingFile) {
        setHasAutoSelected(true);
        setIsAutoSelecting(true);
        console.log('⬇️ Downloading template:', matchingFile.name);

        // Auto-download and select the template
        startDownloadTransition(async () => {
          try {
            const response = await fetch(`/api/google-drive/download?id=${matchingFile.id}`);
            if (!response.ok) throw new Error("Failed to fetch file");

            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);

            setSelectedTemplateImage(imageUrl);
            setSelectedTemplate(matchingFile.name);
            setIsAutoSelecting(false);
            console.log('✅ Template auto-selected successfully!');
          } catch (error) {
            console.error('❌ Failed to auto-select template:', error);
            setIsAutoSelecting(false);
          }
        });
      } else {
        console.log('⚠️ No matching template found for:', preselectedTemplate);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedTemplate, files, hasAutoSelected, loading]);

  const handleViewTemplates = () => {
    setShowFiles(true);
    if (files.length === 0) {
      fetchFiles();
    }
  };

  const handleClose = () => {
    setShowFiles(false);
  };

  const handleThumbnailClick = async (file: GoogleDriveFile) => {
    try {
      startDownloadTransition(async () => {
        const response = await fetch(
          `/api/google-drive/download?id=${file.id}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch file");
        }

        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);

        setSelectedTemplateImage(imageUrl);
        setSelectedTemplate(file.name);
        handleClose();
      });
    } catch (error) {
      console.error("Failed to fetch thumbnail:", error);
      alert("Could not load the selected thumbnail.");
    }
  };

  // Handle body scroll and escape key when modals are open
  useEffect(() => {
    if (showFiles || isDownloading) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showFiles, isDownloading]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showFiles) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showFiles]);

  return (
    <div>
      <button
        type="button"
        onClick={handleViewTemplates}
        disabled={isAutoSelecting}
        className="bg-gradient-to-r from-pink-600 to-rose-600 text-white px-6 py-2 rounded-lg font-medium w-full flex items-center justify-center gap-2 hover:from-pink-700 hover:to-rose-700 dark:hover:from-pink-700 dark:hover:to-rose-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isAutoSelecting ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading Template...
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"></path>
              <line x1="16" y1="5" x2="22" y2="5"></line>
              <line x1="16" y1="5" x2="12" y2="9"></line>
            </svg>
            Select Templates (optional)
          </>
        )}
      </button>

      {/* Auto-selecting Template Loading Modal */}
      {isAutoSelecting && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 w-full min-h-screen flex flex-col items-center justify-center bg-black/70 dark:bg-black/80 overflow-hidden z-[99998]" style={{ zIndex: 99998 }}>
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl border border-pink-200 dark:border-pink-500/20 p-8 shadow-2xl">
            <div className="flex flex-col items-center">
              <svg
                className="animate-spin h-12 w-12 text-pink-500 mb-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Loading Template</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">{preselectedTemplate}</p>
              <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></div>
                Downloading from Google Drive...
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Loading Modal - Rendered via Portal */}
      {isDownloading && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 w-full min-h-screen flex flex-col items-center justify-center bg-black/70 dark:bg-black/80 overflow-hidden z-[99997]" style={{ zIndex: 99997 }}>
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl border border-pink-200 dark:border-pink-500/20 p-8 shadow-2xl">
            <div className="flex flex-col items-center">
              <svg
                className="animate-spin h-8 w-8 text-pink-500 mb-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">Downloading Template...</span>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Templates Modal - Rendered via Portal */}
      {showFiles && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[99996] flex items-center justify-center bg-black/70 dark:bg-black/80 overflow-y-auto p-4" style={{ zIndex: 99996 }}>
          <div className="w-full h-full max-w-7xl">
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-pink-200 dark:border-pink-500/20 p-6 max-h-full overflow-auto">
              {/* Header */}
              <div className="flex justify-between items-center mb-8 sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm py-4 -mt-6 -mx-6 px-6 border-b border-pink-200 dark:border-pink-500/20">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                    {flyer} Templates
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Choose a template for your flyer design
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-2 hover:bg-pink-100 dark:hover:bg-pink-500/20 rounded-full transition-colors"
                  aria-label="Close"
                >
                  <X size={24} className="text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Loading state */}
              {loading ? (
                <div className="flex flex-col justify-center items-center h-64">
                  <svg
                    className="animate-spin h-8 w-8 text-pink-500 mb-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <div className="text-gray-600 dark:text-gray-300 font-medium">
                    Loading Google Drive templates...
                  </div>
                </div>
              ) : error ? (
                <div className="flex justify-center items-center h-64">
                  <div className="text-center">
                    <p className="text-red-600 dark:text-red-400 font-medium mb-2">Error loading templates</p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{error}</p>
                  </div>
                </div>
              ) : (
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {files.map((file) => (
                    <li
                      key={file.id}
                      className="border border-pink-200 dark:border-pink-500/30 rounded-xl overflow-hidden bg-white/70 dark:bg-gray-700/50 hover:bg-pink-50/70 dark:hover:bg-pink-500/10 hover:border-pink-300 dark:hover:border-pink-400/50 transition-all group shadow-sm hover:shadow-md dark:hover:shadow-pink-500/20"
                    >
                      {file.thumbnailLink ? (
                        <div
                          className="cursor-pointer relative w-full aspect-[1350/1080] overflow-hidden group"
                          onClick={() => handleThumbnailClick(file)}
                        >
                          <img
                            src={`/api/image-proxy?url=${encodeURIComponent(file.thumbnailLink)}`}
                            alt={`Thumbnail of ${file.name}`}
                            className="absolute inset-0 w-full h-full object-contain transition-transform duration-300 group-hover:scale-105 bg-gray-50 dark:bg-gray-600"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-pink-600/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                            <span className="text-xs text-white font-medium bg-pink-600/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
                              Click to select
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-40 bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 flex items-center justify-center">
                          <div className="text-center">
                            <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs">No thumbnail</span>
                          </div>
                        </div>
                      )}
                      <div className="p-3">
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 block text-center font-medium truncate transition-colors"
                          title={file.name}
                        >
                          {file.name}
                        </a>
                        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-1">
                          {file.mimeType.replace("application/", "")}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {/* Empty state */}
              {!loading && !error && files.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                  <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <p className="font-medium">No templates found</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try refreshing or check back later</p>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
