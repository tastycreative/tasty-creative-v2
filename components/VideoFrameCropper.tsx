/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactCrop, {
  centerCrop,
  Crop,
  makeAspectCrop,
  PixelCrop,
} from "react-image-crop";
import GoogleDrivePicker from "./GoogleDrivePicker";
import VaultSelector from "./VaultSelector";

type VideoFrameCropperProps = {
  onCropComplete: (croppedImage: string) => void;
  videoUrl: string;
  setVideoUrl: (url: string) => void;
  useFrame: boolean;
  setUseFrame: (useFrame: boolean) => void;
  model?: string;
};

export default function VideoFrameCropper({
  onCropComplete,
  videoUrl,
  setVideoUrl,
  useFrame,
  setUseFrame,
  model,
}: VideoFrameCropperProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const [capturedFrame, setCapturedFrame] = useState<string | null>(null);

  const [itemType, setItemType] = useState<"custom" | "vault" | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [vaultName, setVaultName] = useState<string | null>(null);
  const [isVaultOpen, setIsVaultOpen] = useState(false);

  useEffect(() => {
    if (model) {
      setVaultName(model.toUpperCase() + "_FREE");
    }
  }, [model]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log(file);

    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    // const isHEIC = fileExtension === "heic" || fileExtension === "heif";

    // if (isHEIC) {
    //   try {
    //     const blob = await heic2any({
    //       blob: file,
    //       toType: "image/jpeg",
    //       quality: 0.9,
    //     }) as Blob;

    //     const objectUrl = URL.createObjectURL(blob);
    //     setCapturedFrame(objectUrl);
    //   } catch (error) {
    //     console.error("Error converting HEIC/HEIF file:", error);
    //   }
    // } else
    if (file.type.startsWith("image/")) {
      const objectUrl = URL.createObjectURL(file);
      setCapturedFrame(objectUrl);
    } else if (file.type.startsWith("video/")) {
      const objectUrl = URL.createObjectURL(file);
      setVideoUrl(objectUrl);
    } else {
      console.warn("Unsupported file type:", file.type);
    }
  };

  // Handle file from VaultSelector
  const handleUpload = async (file: File) => {
    console.log("File from vault:", file);

    // Check if it's an image or video based on file type
    if (file.type.startsWith("image/")) {
      // For images, create object URL and set as captured frame
      const objectUrl = URL.createObjectURL(file);
      setCapturedFrame(objectUrl);
      // When an image is selected from vault, we want to use it directly
      setUseFrame(true);
    } else if (file.type.startsWith("video/")) {
      // For videos, create object URL and set as video URL
      const objectUrl = URL.createObjectURL(file);
      setVideoUrl(objectUrl);
      // Reset captured frame when new video is loaded
      setCapturedFrame(null);
      setUseFrame(false);
    } else {
      console.warn("Unsupported file type from vault:", file.type);
    }
  };

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const ctx = canvas.getContext("2d");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frameData = canvas.toDataURL("image/jpeg");
      setCapturedFrame(frameData);
    }
  };

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
    setCrop(centerAspectCrop(width, height, 1 / 2));
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

  const handleToggleChange = (value: boolean) => {
    setIsPaid(value);
    setVaultName(
      value ? `${model?.toUpperCase()}_PAID` : `${model?.toUpperCase()}_FREE`
    );
  };

  const handleVaultSelect = () => {
    setIsVaultOpen(true);
  };

  return (
    <div className="space-y-6    ">
      <div className="flex flex-wrap gap-2">
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            {itemType != null ? "Upload" : "Download"}
            {" and Crop Image/Video"}
          </label>

          <div className="flex gap-2">
            <div className="flex gap-2">
              <input
                type="checkbox"
                id={`custom`}
                className="accent-purple-600 cursor-pointer"
                checked={itemType === "custom"}
                onChange={(e) => {
                  if (e.target.checked) {
                    setItemType("custom");
                  } else {
                    setItemType(null);
                  }
                }}
              />
              <label htmlFor={`custom`} className="cursor-pointer">
                Custom Image/Video
              </label>
            </div>
            <div className="flex gap-2">
              <input
                type="checkbox"
                id={`vault`}
                className="accent-purple-600 cursor-pointer"
                checked={itemType === "vault"}
                onChange={(e) => {
                  if (e.target.checked) {
                    setItemType("vault");
                  } else {
                    setItemType(null);
                  }
                }}
              />
              <label htmlFor={`vault`} className="cursor-pointer">
                Vault Selector
              </label>
            </div>
          </div>
        </div>
        <div className="flex flex-col   w-full">
          {itemType === "custom" ? (
            <div className="w-full f">
              <label className="px-4 w-full py-2 bg-black/60 text-white rounded-lg flex items-center justify-center gap-2 cursor-pointer">
                <input
                  type="file"
                  accept="image/*,image/heic,image/heif,video/*"
                  onChange={handleFileUpload}
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
                  className="text-white"
                >
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
                  <line x1="16" y1="5" x2="22" y2="5" />
                  <line x1="16" y1="5" x2="12" y2="9" />
                </svg>
                <span>Choose File</span>
              </label>
            </div>
          ) : itemType === "vault" ? (
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
                  "px-4 w-full py-2 bg-black/60 text-white rounded-lg flex items-center justify-center gap-2"
                  // { "border border-red-500 text-red-500": error }
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
                {!model ? "Select a Model First" : `Select from ${model} vault`}
              </button>
            </>
          ) : (
            <GoogleDrivePicker
              id={"right-panel"}
              model={model ?? ""}
              setSelectedImage={setCapturedFrame}
              setCrop={setCrop}
              setVideoUrl={setVideoUrl}
            />
          )}
        </div>
      </div>

      {videoUrl && (
        <div className="space-y-4">
          <div className="rounded-lg overflow-hidden shadow-lg border border-gray-200">
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              className="w-full max-w-3xl rounded-lg"
            />
          </div>
          <div className="space-y-4">
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setUseFrame(true)}
                className={`px-4 py-2 rounded font-medium transition ${
                  useFrame
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                Use Captured Frame
              </button>
              <button
                onClick={() => setUseFrame(false)}
                className={`px-4 py-2 rounded font-medium transition ${
                  !useFrame
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                Use Full Video
              </button>
            </div>
          </div>
          <button
            onClick={captureFrame}
            className={cn(
              "bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 shadow-md hover:shadow-black/60 transition-all duration-300 hover:-translate-y-0.5 mx-auto",
              { hidden: !useFrame }
            )}
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3 16.8V7.2C3 6.0799 3 5.51984 3.21799 5.09202C3.40973 4.71569 3.71569 4.40973 4.09202 4.21799C4.51984 4 5.0799 4 6.2 4H17.8C18.9201 4 19.4802 4 19.908 4.21799C20.2843 4.40973 20.5903 4.71569 20.782 5.09202C21 5.51984 21 6.0799 21 7.2V16.8C21 17.9201 21 18.4802 20.782 18.908C20.5903 19.2843 20.2843 19.5903 19.908 19.782C19.4802 20 18.9201 20 17.8 20H6.2C5.0799 20 4.51984 20 4.09202 19.782C3.71569 19.5903 3.40973 19.2843 3.21799 18.908C3 18.4802 3 17.9201 3 16.8Z"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            Capture Frame
          </button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {capturedFrame && (useFrame || itemType) && (
        <div className="flex flex-col w-full items-center gap-4">
          <p className="text-xs text-gray-300">
            Crop area will maintain a 1:2 (500x1000px)
          </p>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1 / 2}
                minWidth={100}
                className="max-w-full shadow-sm"
              >
                <img
                  ref={imageRef}
                  src={capturedFrame}
                  alt="Selected frame"
                  className="w-full object-contain max-h-96 rounded"
                  onLoad={onImageLoad}
                />
              </ReactCrop>
            </div>
          </div>
          <div className="flex flex-wrap w-full items-center gap-4 pt-3">
            <button
              type="button"
              onClick={generateCroppedImage}
              className={`px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium shadow-md hover:shadow-purple-200 transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2 ${
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

            <div className="text-sm text-gray-500 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
              {imageSize.width > 0 && (
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-blue-500"
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
                  <span>Selected area will be exported at 500×1000px</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {isVaultOpen && (
        <VaultSelector
          isOpen={isVaultOpen}
          onClose={() => setIsVaultOpen(false)}
          onUpload={handleUpload}
          vaultName={vaultName ?? undefined}
          includeImage={true} 
          imageOnly={false}
        />
      )}
    </div>
  );
}
