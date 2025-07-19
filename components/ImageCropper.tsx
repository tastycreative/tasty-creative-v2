/* eslint-disable @next/next/no-img-element */
"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useTransition,
} from "react";
import { createPortal } from "react-dom";
import ReactCrop, {
  Crop,
  PixelCrop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import PermissionGoogle from "./PermissionGoogle";
import VaultSelector from "./VaultSelector";

interface GoogleDriveFile {
  id: string;
  name: string;
  thumbnailLink?: string;
  isFolder: boolean;
}

interface ImageCropperProps {
  onCropComplete: (croppedImage: string) => void;
  aspectRatio?: number;
  model?: string;
  customRequest?: boolean;
  setFormData?: React.Dispatch<React.SetStateAction<ModelFormData>>;
  className?: string;
  id?: string;
  error?: string;
  imageOnly?: boolean;
}

export default function ImageCropper({
  onCropComplete,
  aspectRatio = 4 / 5, // 1080:1350 ratio (width:height)
  model,
  customRequest,
  setFormData,
  className,
  id = "default",
  error,
  imageOnly = false,
}: ImageCropperProps) {
  // Image cropping states
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  // Google Drive states

  const [googleFiles, setGoogleFiles] = useState<GoogleDriveFile[]>([]);
  const [currentFolder, setCurrentFolder] = useState<GoogleDriveFile | null>(
    null
  );
  const [parentFolder, setParentFolder] = useState<GoogleDriveFile | null>(
    null
  );
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [isGooglePickerLoading, setIsGooglePickerLoading] = useState(false);
  const [isDownloading, startDownloadTransition] = useTransition();
  const [isListing, startListTransition] = useTransition();

  const [imageType, setImageType] = useState<null | "custom" | "vault">(null);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  const [vaultName, setVaultName] = useState<string | null>(null);

  useEffect(() => {
    if (model) {
      setVaultName(model.toUpperCase() + "_FREE");
    }
  }, [model]);

  // Disable body scroll when modals are open
  useEffect(() => {
    if (selectedImage || showFilePicker) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedImage, showFilePicker]);

  // Handle Escape key to close modals
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (selectedImage) {
          setSelectedImage(null);
          setCrop(undefined);
          setCompletedCrop(null);
        } else if (showFilePicker) {
          setShowFilePicker(false);
        }
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [selectedImage, showFilePicker]);

  useEffect(() => {
    const setData = async () => {
      if (selectedImage) {
        if (selectedImage) {
          const response = await fetch(selectedImage);
          const blob = await response.blob();
          const file = new File([blob], "cropped-image.jpg", {
            type: blob.type,
          });
          if (setFormData) {
            setFormData((prev) => ({
              ...prev,
              imageFile: file,
            }));
          }
        }
      }
    };
    if (setFormData && customRequest) {
      setData();
    }
  }, [selectedImage]);

  const handleGoogleDriveSelect = async () => {
    try {
      startListTransition(async () => {
        setIsGooglePickerLoading(true);

        try {
          // Step 1: Start from root or model folder
          let url = "/api/google-drive/list";
          if (model) {
            url += `?folderName=${model}`;
          }

          const response = await fetch(url);
          const initialData = await response.json();

          if (id !== "default") {
            // Step 2: If not default, get parent of the found folder
            const parentId = initialData.parentFolder.id;

            if (!parentId) {
              throw new Error("Parent folder not found");
            }

            const parentResponse = await fetch(
              `/api/google-drive/list?folderId=${parentId}`
            );
            if (!parentResponse.ok) {
              throw new Error("Failed to fetch parent folder files");
            }

            const parentData = await parentResponse.json();

            setGoogleFiles(parentData.files);
            setCurrentFolder(parentData.currentFolder || null);
            setParentFolder(parentData.parentFolder || null);
            setShowFilePicker(true);
          } else {
            // Default view
            if (initialData.files) {
              setGoogleFiles(initialData.files);
              setCurrentFolder(initialData.currentFolder || null);
              setParentFolder(initialData.parentFolder || null);
              setShowFilePicker(true);
            } else {
              alert("No images found in the selected folder");
            }
          }
        } catch (error) {
          console.error("Error fetching drive files:", error);
          alert("Failed to load Google Drive files");
        } finally {
          setIsGooglePickerLoading(false);
        }
      });
    } catch (error) {
      console.error("Error selecting from Google Drive:", error);
      alert("Failed to connect to Google Drive");
    } finally {
      setIsGooglePickerLoading(false);
    }
  };

  const handleVaultSelect = () => {
    setIsVaultOpen(true);
  };

  const handleOpenFolder = async (folder: GoogleDriveFile) => {
    try {
      setIsGooglePickerLoading(true);
      const response = await fetch(
        `/api/google-drive/list?folderId=${folder.id}`
      );

      if (!response.ok) {
        throw new Error("Failed to open folder");
      }

      const data = await response.json();
      setGoogleFiles(data.files);
      setCurrentFolder(data.currentFolder || null);
      setParentFolder(data.parentFolder || null);
    } catch (error) {
      console.error("Error opening folder:", error);
      alert("Failed to open folder");
    } finally {
      setIsGooglePickerLoading(false);
    }
  };

  const handleNavigateUp = async () => {
    if (parentFolder) {
      try {
        setIsGooglePickerLoading(true);
        const response = await fetch(
          `/api/google-drive/list?folderId=${parentFolder.id}`
        );

        if (!response.ok) {
          throw new Error("Failed to navigate up");
        }

        const data = await response.json();
        setGoogleFiles(data.files);
        setCurrentFolder(data.currentFolder || null);
        setParentFolder(data.parentFolder || null);
      } catch (error) {
        console.error("Error navigating up:", error);
        alert("Failed to navigate up");
      } finally {
        setIsGooglePickerLoading(false);
      }
    }
  };

  const handleFileSelected = async (file: GoogleDriveFile) => {
    if (file.isFolder) {
      handleOpenFolder(file);
      return;
    }

    try {
      startDownloadTransition(async () => {
        const response = await fetch(
          `/api/google-drive/download?id=${file.id}`
        );
        if (!response.ok) {
          throw new Error("Failed to download image");
        }

        const blob = await response.blob();

        // Convert blob to Base64 string
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = reader.result as string;
          setSelectedImage(base64Data);
          setCrop(undefined); // Reset crop when new image is loaded
          setFormData?.((prev) => ({
            ...prev,
            croppedImage: base64Data,
          }));
          setShowFilePicker(false);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error loading image:", error);
      alert("Failed to load selected image");
    }
  };

  // Function to center and create aspect ratio crop
  function centerAspectCrop(
    mediaWidth: number,
    mediaHeight: number,
    aspect: number
  ) {
    return centerCrop(
      makeAspectCrop(
        {
          unit: "%",
          width: 90,
        },
        aspect,
        mediaWidth,
        mediaHeight
      ),
      mediaWidth,
      mediaHeight
    );
  }

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setImageSize({ width, height });

    // //initialize with a centered crop of the correct aspect ratio
    setCrop(centerAspectCrop(width, height, aspectRatio));
  };

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setSelectedImage(reader.result as string);
        // Reset crop when new image is loaded
        setCrop(undefined);
        setFormData?.((prev) => ({
          ...prev,
          croppedImage: reader.result as string,
        })); // Reset form data
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const generateCroppedImage = useCallback(() => {
    if (!completedCrop || !imageRef.current) return;

    const image = imageRef.current;
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // For output size, we'll scale to exactly 1080x1350
    const outputWidth = 1080;
    const outputHeight = 1350;

    canvas.width = outputWidth;
    canvas.height = outputHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw the cropped portion of the image, scaled to our desired output size
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      outputWidth,
      outputHeight
    );

    const croppedImageUrl = canvas.toDataURL("image/jpeg", 0.92); // Higher quality JPEG
    onCropComplete(croppedImageUrl);
  }, [completedCrop, onCropComplete]);

  const handleUpload = (file: File) => {
    // Create a FileReader to convert the file to base64
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      // Set the image as base64 string
      setSelectedImage(reader.result as string);

      // Reset crop when new image is loaded
      setCrop(undefined);

      // Update form data with the image
      setFormData?.((prev) => ({
        ...prev,
        croppedImage: reader.result as string,
      }));
    });

    // Read the file as data URL (base64)
    reader.readAsDataURL(file);
  };

  const handleToggleChange = (value: boolean) => {
    setIsPaid(value);
    setVaultName(
      value ? `${model?.toUpperCase()}_PAID` : `${model?.toUpperCase()}_FREE`
    );
  };

  return (
    <div className={cn("flex flex-col gap-2 w-full", className)}>
      <label className="block text-sm font-medium">
        {imageType !== null ? "Upload" : "Download"}{" "}
        {!customRequest ? "and Crop Image" : "Image to be sent"}
      </label>
      <div className="flex gap-2">
        <div className="flex gap-2">
          <input
            type="checkbox"
            id={`${id}-custom`}
            className="accent-purple-600 cursor-pointer"
            checked={imageType === "custom"}
            onChange={(e) => {
              if (e.target.checked) {
                setImageType("custom");
              } else {
                setImageType(null);
              }
            }}
          />
          <label htmlFor={`${id}-custom`} className="cursor-pointer text-gray-700">
            Custom Image
          </label>
        </div>
        <div className="flex gap-2">
          <input
            type="checkbox"
            id={`${id}-vault`}
            className="accent-purple-600 cursor-pointer"
            checked={imageType === "vault"}
            onChange={(e) => {
              if (e.target.checked) {
                setImageType("vault");
              } else {
                setImageType(null);
              }
            }}
          />
          <label htmlFor={`${id}-vault`} className="cursor-pointer text-gray-700">
            Vault Selector
          </label>
        </div>
      </div>
      <div className="flex flex-col  ">
        {imageType === "custom" ? (
          <div className="w-full">
            <label
              className={cn(
                "px-4 w-full py-2 bg-white/70 text-gray-700 border border-pink-200 rounded-lg flex items-center justify-center gap-2",
                { "border border-red-500 text-red-500": error }
              )}
            >
              <input
                type="file"
                accept="image/*"
                onChange={onSelectFile}
                className="hidden"
              />
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
                className={cn("text-gray-700", { "text-red-500": error })}
              >
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
                <line x1="16" y1="5" x2="22" y2="5" />
                <line x1="16" y1="5" x2="12" y2="9" />
              </svg>
              <span>Choose File</span>
            </label>
          </div>
        ) : imageType === "vault" ? (
          <>
            <div className="mb-6">
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span
                    className={`font-medium ${
                      !isPaid ? "text-blue-400" : "text-gray-400"
                    }`}
                  >
                    Free
                  </span>
                  <div
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out cursor-pointer ${
                      isPaid ? "bg-blue-600" : "bg-gray-600"
                    }`}
                    onClick={() => handleToggleChange(!isPaid)}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                        isPaid ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </div>
                  <span
                    className={`font-medium ${
                      isPaid ? "text-blue-400" : "text-gray-400"
                    }`}
                  >
                    Paid
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              disabled={!model}
              onClick={handleVaultSelect}
              className={cn(
                "px-4 w-full py-2 bg-white/70 text-gray-700 border border-pink-200 rounded-lg flex items-center justify-center gap-2",
                { "border border-red-500 text-red-500": error }
              )}
            >
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
              {!isListing
                ? model
                  ? `Select from ${model} vault`
                  : "Select a Model First"
                : isListing
                  ? "Opening vault..."
                  : "Connecting to vault"}
            </button>
          </>
        ) : (
          <PermissionGoogle apiEndpoint="/api/google-drive/list">
            <button
              type="button"
              disabled={!model}
              onClick={handleGoogleDriveSelect}
              className={cn(
                "px-4 w-full py-2 bg-white/70 text-gray-700 border border-pink-200 rounded-lg flex items-center justify-center gap-2",
                { "border border-red-500 text-red-500": error }
              )}
            >
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
              {!isListing
                ? model
                  ? `Select from ${model} folder`
                  : "Select a Model First"
                : isListing
                  ? "Opening folder..."
                  : "Connecting to Google Drive"}
            </button>
          </PermissionGoogle>
        )}
        {error && (
          <p className="text-red-500 text-[12px] mt-2 ">
            {customRequest ? "Select a custom image!" : "Select an image!"}
          </p>
        )}
      </div>

      {/* Fullscreen Cropping Modal - Rendered via Portal */}
      {selectedImage && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[99999] p-4" style={{ zIndex: 99999 }}>
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-pink-200 shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm p-6 border-b border-pink-200 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                  {customRequest ? "Image Preview" : "Crop Your Image"}
                </h2>
                {!customRequest && (
                  <p className="text-sm text-gray-600 mt-1">
                    Crop area will maintain a {id === "default" ? "4:5" : "1:2"} ratio{" "}
                    {id === "default" ? "(1080x1350px)" : "(500x1000px)"}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setCrop(undefined);
                  setCompletedCrop(null);
                }}
                className="p-2 hover:bg-pink-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Image Cropping Area */}
                <div className="flex-1 flex justify-center">
                  <div className="relative max-w-full">
                    {customRequest ? (
                      <Image
                        ref={imageRef}
                        src={selectedImage ?? ""}
                        alt="Selected"
                        className="max-w-full max-h-[70vh] object-contain rounded-lg border border-pink-200"
                        onLoad={onImageLoad}
                        loading="lazy"
                        width={imageSize.width}
                        height={imageSize.height}
                      />
                    ) : (
                      <ReactCrop
                        crop={crop}
                        onChange={(c) => setCrop(c)}
                        onComplete={(c) => setCompletedCrop(c)}
                        aspect={aspectRatio}
                        minWidth={100}
                      >
                        <Image
                          ref={imageRef}
                          src={selectedImage ?? ""}
                          alt="Selected"
                          className="max-w-full max-h-[70vh] object-contain rounded-lg"
                          onLoad={onImageLoad}
                          loading="lazy"
                          width={imageSize.width}
                          height={imageSize.height}
                        />
                      </ReactCrop>
                    )}
                  </div>
                </div>

                {/* Controls Sidebar */}
                {!customRequest && (
                  <div className="lg:w-80 flex flex-col gap-4">
                    <div className="bg-pink-50/60 backdrop-blur-sm rounded-xl p-4 border border-pink-200">
                      <h3 className="font-semibold text-gray-800 mb-3">Crop Controls</h3>
                      
                      <button
                        type="button"
                        onClick={generateCroppedImage}
                        className={`w-full px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg font-medium shadow-md hover:shadow-pink-200 transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-2 ${
                          !completedCrop ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        disabled={!completedCrop}
                      >
                        <svg
                          className="w-5 h-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M8 6H19C19.5523 6 20 6.44772 20 7V17C20 17.5523 19.5523 18 19 18H8M8 6C7.44772 6 7 6.44772 7 7V17C7 17.5523 7.44772 18 8 18M8 6V18"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <path
                            d="M4 8V16"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <path
                            d="M12 11L16 11"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                        Apply Crop
                      </button>

                      <div className="mt-4 text-sm text-gray-600 bg-white/70 px-4 py-3 rounded-lg border border-pink-200">
                        {imageSize.width > 0 && (
                          <div className="flex items-start gap-2">
                            <svg
                              className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <span>
                              Selected area will be exported at{" "}
                              {id === "default" ? "1080x1350px" : "500x1000px"} ratio
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-pink-200">
                      <h4 className="font-medium text-gray-800 mb-2">Tips</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Drag corners to resize the crop area</li>
                        <li>• Drag inside to move the crop area</li>
                        <li>• The aspect ratio is locked for optimal output</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Google Drive File Picker Modal - Rendered via Portal */}
      {showFilePicker && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 px-4 lg:px-20 bg-black/70 flex items-center justify-center z-[99998]" style={{ zIndex: 99998 }}>
          <div
            className={cn(
              "bg-white/95 backdrop-blur-xl rounded-2xl border border-pink-200 shadow-2xl px-6 pb-6 w-full max-h-[80vh] overflow-auto relative",
              { "overflow-hidden": isDownloading }
            )}
          >
            {isDownloading && (
              <div className="fixed inset-0 w-full min-h-screen flex flex-col items-center justify-center bg-black/90 overflow-hidden z-2">
                <svg
                  className="animate-spin h-8 w-8 text-pink-500 mb-2"
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
                <span className="text-sm text-gray-500">
                  Downloading File...
                </span>
              </div>
            )}
            <div className="sticky top-0 pt-2 py-0.5 bg-white/80 backdrop-blur-sm z-50 border-b border-pink-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {currentFolder
                    ? `Folder: ${currentFolder.name}`
                    : "Select an image"}
                </h3>
                <button
                  onClick={() => setShowFilePicker(false)}
                  className="text-gray-600 hover:text-pink-600 cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {/* Folder navigation */}
              {parentFolder && (
                <div className="mb-4 w-full h-full">
                  <button
                    onClick={handleNavigateUp}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
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
                      className="mr-1"
                    >
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                    Back to {parentFolder.name}
                  </button>
                </div>
              )}
            </div>

            {isGooglePickerLoading ? (
              <div className="flex justify-center items-center py-8 h-full w-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {googleFiles.length > 0 ? (
                  googleFiles.map((file) => (
                    <div
                      key={file.id}
                      className="border border-pink-200 rounded-md p-2 cursor-pointer hover:bg-gradient-to-r hover:from-pink-500 hover:to-rose-500 hover:text-white"
                      onClick={() => handleFileSelected(file)}
                    >
                      <div className="h-24 bg-gray-100 flex items-center justify-center mb-2 overflow-hidden">
                        {file.isFolder ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-amber-500"
                          >
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                          </svg>
                        ) : file.thumbnailLink ? (
                          <img
                            src={`/api/image-proxy?url=${encodeURIComponent(file.thumbnailLink)}`}
                            width={200}
                            height={200}
                            alt={file.name}
                            className="max-h-full object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-600"
                          >
                            <rect
                              x="3"
                              y="3"
                              width="18"
                              height="18"
                              rx="2"
                              ry="2"
                            ></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                          </svg>
                        )}
                      </div>
                      <p className="text-xs truncate">
                        {file.isFolder ? `📁 ${file.name}` : file.name}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center col-span-full w-full text-gray-600">
                    No files found in this folder
                  </div>
                )}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {isVaultOpen && (
        <VaultSelector
          isOpen={isVaultOpen}
          onClose={() => setIsVaultOpen(false)}
          onUpload={handleUpload}
          vaultName={vaultName ?? undefined}
          imageOnly={imageOnly}
        />
      )}
    </div>
  );
}
