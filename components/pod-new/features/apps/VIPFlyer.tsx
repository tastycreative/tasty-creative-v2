/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import ImageCropper from "@/components/ImageCropper";
import Image from "next/image";
import ModelsDropdown from "@/components/ModelsDropdown";
import { useSearchParams } from "next/navigation";
import { POSITIONS } from "@/lib/lib";
import { v4 as uuidv4 } from "uuid";
import Link from "next/link";
import { cn, emailData } from "@/lib/utils";
import ServerOffline from "@/components/ServerOffline";
import FlyerTemplates from "@/components/FlyerTemplates";
import { vipFlyerValidation } from "@/schema/zodValidationSchema";

export default function VIPFlyer({modelName}:{modelName?: string}) {
  const searchParams = useSearchParams();
  const reqId = searchParams?.get("reqId") || null;
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingImage, setIsFetchingImage] = useState(false);

  interface WebhookResponse {
    thumbnail: string;
    webViewLink: string;
    imageId?: string;
    requestId?: string;
  }

  const [requestSent, setRequestSent] = useState(false);
  const [webhookData, setWebhookData] = useState<WebhookResponse | null>(null);
  const [itemReceived, setItemReceived] = useState(0);
  const [response, setResponse] = useState<{ error?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastCheckTimestamp = useRef(0);
  const checkInterval = useRef<NodeJS.Timeout | null>(null);
  const [history, setHistory] = useState<WebhookResponse[]>([]);
  const [selectedTemplateImage, setSelectedTemplateImage] = useState<
    string | null
  >(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const normalizeData = (rawData: any[] | null): WebhookResponse[] => {
    if (!Array.isArray(rawData)) return [];

    const entries: WebhookResponse[] = [];

    rawData.forEach((row) => {
      const output = row["Final Output"];

      if (output && typeof output === "object" && output.driveUrl) {
        entries.push({
          thumbnail: output.imageUrl ?? "", // fallback empty string
          webViewLink: output.driveUrl,
          imageId: output.fileId,
          requestId: row["Request ID"] ?? undefined,
        });
      }
    });

    return entries;
  };

  useEffect(() => {
    async function fetchRequestData() {
      if (!reqId) {
        setError("No request ID provided");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/google/sheets/request?requestId=${reqId}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch request data");
        }

        const jsonData = await response.json();
        const normalized = normalizeData(jsonData.data);

        setHistory(normalized); // ✅ Use this instead of setFileEntries
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        console.error("Error fetching request data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRequestData();
  }, [reqId]);

  const [formData, setFormData] = useState<ModelFormData>({
    model: modelName || "",
    croppedImage: null,
    templatePosition: "BOTTOM",
    type: "VIP",
    options: ["NSFW", "Custom", "Calls"],
    customImage: true,
    noOfTemplate: 1,
  });

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, type } = e.target;
    const value =
      type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value;

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCropComplete = (croppedImage: string) => {
    setFormData({
      ...formData,
      croppedImage,
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const result = vipFlyerValidation.safeParse(formData);

    if (!result.success) {
      const formattedErrors = result.error.format();

      // Map Zod field errors to your fieldErrors state
      const newFieldErrors: Record<string, string> = {};
      for (const key in formattedErrors) {
        if (key !== "_errors") {
          const fieldError =
            formattedErrors[key as keyof typeof formattedErrors];
          newFieldErrors[key] =
            fieldError &&
            "_errors" in fieldError &&
            Array.isArray(fieldError._errors)
              ? fieldError._errors[0]
              : "";
        }
      }

      setFieldErrors(newFieldErrors);
      setError("Please correct the errors above.");
      setIsLoading(false);
      return;
    }

    const requestId = uuidv4(); // Generate unique ID
    const webhookUrl = "/api/webhook-proxy";

    try {
      setIsLoading(true);
      setIsFetchingImage(true);
      setItemReceived(0);

      const formDataToSend = new FormData();

      // Append text data
      formDataToSend.append("customImage", String(formData.customImage));
      formDataToSend.append("date", formData.date || "");
      formDataToSend.append("model", formData.model || "");
      formDataToSend.append("paid", String(formData.paid));
      formDataToSend.append("time", formData.time || "");
      formDataToSend.append("timezone", formData.timezone || "");
      formDataToSend.append("imageId", formData.imageId || "");
      formDataToSend.append("requestId", requestId);
      formDataToSend.append("timestamp", new Date().toISOString());
      formDataToSend.append("imageName", formData.imageName || "");
      formDataToSend.append("noOfTemplate", String(formData.noOfTemplate));
      formDataToSend.append("isCustomRequest", String(formData.customRequest));
      formDataToSend.append("customDetails", formData.customDetails || "");
      formDataToSend.append("type", formData.type || "");
      formDataToSend.append("options", String(formData.options || []));
      formDataToSend.append("croppedImage", formData.croppedImage || "");
      formDataToSend.append(
        "templatePosition",
        formData.templatePosition || ""
      );
      formDataToSend.append("selectedTemplate", selectedTemplate || "");

      // Append the file if it exists
      if (formDataToSend.has("imageFile")) {
        formDataToSend.delete("imageFile"); // Ensure only one instance
      }
      if (formData.imageFile && formData.customImage) {
        formDataToSend.append("imageFile", formData.imageFile);
      }

      const response = await fetch(webhookUrl, {
        method: "POST",
        body: formDataToSend, // Send as FormData (automatically sets correct headers)
      });

      // Read the response correctly
      const textData = await response.text();
      try {
        const jsonData = JSON.parse(textData);
        setResponse(jsonData);
      } catch {
        setResponse({ error: "Invalid JSON response from webhook" });
      }

      if (formData.customRequest != true) {
        startChecking(requestId); // Start checking using requestId
      }
      if (formData.customRequest == true) {
        setIsFetchingImage(false);
        setIsLoading(false);
        setRequestSent(true);
      }

      if (textData.includes("404")) {
        setResponse({ error: "Failed to call webhook" });
        setError(textData);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error calling webhook:", error);
      setResponse({ error: "Failed to call webhook" });
      // setIsProcessing(false);
    } finally {
      startChecking(requestId);
      setIsLoading(false);
    }
  };

  const fetchWebhookData = async (requestId: string) => {
    try {
      const response = await fetch(`/api/webhook?requestId=${requestId}`);

      if (!response.ok) {
        console.error("Webhook data request failed:", response.statusText);
        return;
      }

      const result = await response.json();

      if (!result || !result.data) {
        console.warn("No data found for requestId:", requestId);
        return;
      }

      if (result.timestamp > lastCheckTimestamp.current) {
        setWebhookData(result.data);
        setFormData((prev) => ({
          ...prev,
          thumbnail: result.data.thumbnail,
          webViewLink: result.data.webViewLink,
        }));
        setHistory((prev) => [...prev, result.data]);
        lastCheckTimestamp.current = result.timestamp;
        setItemReceived((prev) => prev + 1);
        // setIsProcessing(false);
      }
    } catch (error) {
      console.error("Error fetching webhook data:", error);
    }
  };

  const startChecking = (requestId: string) => {
    if (checkInterval.current) {
      clearInterval(checkInterval.current);
      checkInterval.current = null;
    }

    checkInterval.current = setInterval(() => {
      fetchWebhookData(requestId);
    }, 2000);
  };

  // Effect to stop checking when webhookData is updated
  useEffect(() => {
    const totalTemplates = Number(formData.noOfTemplate);
    if (itemReceived === totalTemplates) {
      // setIsProcessing(false);

      stopChecking();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webhookData]);

  // Check for //initial data on mount

  const stopChecking = () => {
    if (checkInterval.current) {
      clearInterval(checkInterval.current);
      checkInterval.current = null;
    }
    setIsFetchingImage(false);
  };

  const handleStopGenerating = () => {
    stopChecking();
  };

  useEffect(() => {
    const sendEmail = async () => {
      stopChecking();

      try {
        await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(emailData),
        });
        console.log("Email sent successfully");
      } catch (emailError) {
        console.error("Error sending email:", emailError);
      }
    };
    if (response?.error === "Invalid JSON response from webhook") {
      sendEmail();
    }
  }, [response]);

  useEffect(() => {
    // Only validate croppedImage if it has a value
    if (formData.croppedImage) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fieldSchema = (vipFlyerValidation.shape as any)["croppedImage"];
      if (fieldSchema) {
        const result = fieldSchema.safeParse(formData.croppedImage);

        setFieldErrors((prev) => ({
          ...prev,
          croppedImage: result.success ? "" : result.error.errors[0].message,
        }));
      }
    } else {
      // If croppedImage is empty, clear the error
      setFieldErrors((prev) => ({
        ...prev,
        croppedImage: "",
      }));
    }
  }, [formData.croppedImage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      <div className="container mx-auto px-4 py-8">
        {response?.error === "Invalid JSON response from webhook" ? (
          <ServerOffline />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="col-span-1 bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm shadow-xl p-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 dark:from-pink-400 dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
                    VIP Flyer Generation
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
                    Create stunning promotional materials for VIP subscription benefits
                  </p>
                </div>

                <form className="grid grid-cols-2 gap-4 space-y-4" onSubmit={handleSubmit}>
                  <div className="col-span-2">
                    <ModelsDropdown
                      formData={formData}
                      setFormData={setFormData}
                      isLoading={isLoading}
                      isFetchingImage={isFetchingImage}
                      webhookData={webhookData}
                      error={fieldErrors.model}
                      setFieldErrors={setFieldErrors}
                    />
                  </div>

                  <div className="col-span-2 flex gap-3 items-center">
                    <label
                      className={cn(
                        "relative inline-flex items-center cursor-pointer",
                        {
                          "cursor-not-allowed":
                            isLoading || isFetchingImage || webhookData,
                        }
                      )}
                    >
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        name="customRequest"
                        onChange={handleInputChange}
                        checked={formData.customRequest}
                        disabled={isLoading || isFetchingImage || !!webhookData}
                      />
                      <div className="w-11 h-6 bg-gray-200/60 dark:bg-gray-600/60 peer-checked:bg-gradient-to-r peer-checked:from-pink-500 peer-checked:to-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-gray-200 after:border-gray-300 dark:after:border-gray-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all shadow-inner"></div>
                    </label>
                    <span className="text-base font-medium text-gray-700 dark:text-gray-200">
                      Custom Flyer Request
                    </span>
                  </div>

                  <div className="col-span-2">
                    <ImageCropper
                      onCropComplete={handleCropComplete}
                      aspectRatio={4 / 5} // For 1080:1350 aspect ratio
                      model={formData.model}
                      customRequest={formData.customRequest}
                      setFormData={setFormData}
                      error={fieldErrors.croppedImage}
                    />
                  </div>

                  <div className="col-span-2">
                    <FlyerTemplates
                      flyer="VIP"
                      type={formData.templatePosition || ""}
                      setSelectedTemplateImage={setSelectedTemplateImage}
                      setSelectedTemplate={setSelectedTemplate}
                    />
                  </div>

                  {/* Added Checkbox Options */}
                  <div className="col-span-2 space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                      VIP Features
                    </label>
                    <div className="flex flex-wrap gap-4">
                      {Object.entries({
                        NSFW: true,
                        Custom: true,
                        Calls: true,
                      }).map(([option, defaultValue]) => (
                        <label
                          key={option}
                          className="flex items-center space-x-3 cursor-pointer bg-white/60 dark:bg-gray-800/60 px-4 py-2 rounded-xl border border-gray-200/60 dark:border-gray-600/60 hover:bg-pink-50/60 dark:hover:bg-pink-900/20 transition-all duration-200"
                        >
                          <input
                            type="checkbox"
                            name={option}
                            defaultChecked={defaultValue}
                            onChange={(e) => {
                              const currentOptions = [...(formData.options || [])];
                              if (e.target.checked) {
                                if (!currentOptions.includes(option)) {
                                  setFormData({
                                    ...formData,
                                    options: [...currentOptions, option],
                                  });
                                }
                              } else {
                                setFormData({
                                  ...formData,
                                  options: currentOptions.filter(
                                    (item) => item !== option
                                  ),
                                });
                              }
                            }}
                            className="cursor-pointer w-4 h-4 text-pink-600 bg-white border-2 border-gray-300 rounded focus:ring-pink-500 dark:focus:ring-pink-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {!formData.customRequest && (
                    <div className="col-span-2 space-y-3">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Template Position
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {POSITIONS.map((position) => (
                          <label
                            key={position}
                            className="flex items-center cursor-pointer space-x-2 bg-white/60 dark:bg-gray-800/60 px-4 py-2 rounded-xl border border-gray-200/60 dark:border-gray-600/60 hover:bg-pink-50/60 dark:hover:bg-pink-900/20 transition-all duration-200"
                          >
                            <input
                              type="radio"
                              name="templatePosition"
                              value={position}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  templatePosition: e.target.value,
                                })
                              }
                              className="w-4 h-4 text-pink-600 bg-white border-2 border-gray-300 focus:ring-pink-500 dark:focus:ring-pink-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                              checked={formData.templatePosition === position}
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{position}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="col-span-2 space-y-2">
                    <label
                      htmlFor="noOfTemplate"
                      className="text-sm font-semibold text-gray-700 dark:text-gray-200"
                    >
                      Number of Flyers (1-5)
                    </label>
                    <div className="w-[80px]">
                      <input
                        type="number"
                        id="noOfTemplate"
                        name="noOfTemplate"
                        className="border-2 border-gray-200/60 dark:border-gray-600/60 bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-100 rounded-xl p-3 w-full focus:border-pink-400 dark:focus:border-pink-400 focus:ring-2 focus:ring-pink-200/50 dark:focus:ring-pink-500/20 transition-all duration-200"
                        value={formData.noOfTemplate}
                        onChange={handleInputChange}
                        required
                        disabled={isLoading || isFetchingImage}
                        max={5}
                        min={1}
                      />
                    </div>
                  </div>

                  <div className="col-span-2 mt-6">
                    <button
                      type="submit"
                      className={`rounded-xl px-6 py-4 w-full cursor-pointer bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 text-white font-semibold text-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl hover:from-pink-700 hover:via-purple-700 hover:to-blue-700 dark:hover:from-pink-600 dark:hover:via-purple-600 dark:hover:to-blue-600 shadow-lg ${
                        isLoading || isFetchingImage
                          ? "opacity-60 cursor-not-allowed transform-none"
                          : "opacity-100"
                      }`}
                      disabled={isLoading || isFetchingImage}
                    >
                      {formData.customRequest ? (
                        <span>
                          {isLoading || isFetchingImage
                            ? "Sending..."
                            : "Send Custom Request"}
                        </span>
                      ) : (
                        <span>
                          {isLoading || isFetchingImage
                            ? "Generating..."
                            : "Generate VIP Flyer"}
                        </span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="col-span-2 bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm shadow-xl p-8">
              <div className="flex flex-col gap-6 sticky top-8">
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 dark:from-pink-400 dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent">Preview</h1>
                  <p className="text-base text-gray-600 dark:text-gray-300">
                    Your VIP flyer preview will appear here
                  </p>
                </div>
                {formData.customRequest === true && requestSent ? (
                  <div className="flex items-center h-full justify-center w-full p-6">
                    <div
                      className={cn(
                        "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-700 rounded-2xl p-6 text-center max-w-md w-full shadow-xl transition-all duration-300 ease-in-out",
                        { hidden: error }
                      )}
                    >
                      <div className="text-3xl mb-4">
                        🎉 Successfully submitted request to Discord! 🚀
                      </div>
                      <p className="text-green-700 dark:text-green-300 text-lg">
                        Your message has been sent successfully! 📨✨
                      </p>
                    </div>
                    <div
                      className={cn(
                        "bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-2 border-red-200 dark:border-red-700 rounded-2xl p-6 text-center max-w-md w-full shadow-xl transition-all duration-300 ease-in-out overflow-hidden",
                        { hidden: !error }
                      )}
                    >
                      <div className="text-3xl mb-4">
                        ⚠️ Webhook Communication Failed! 🚫
                      </div>
                      <p className="text-red-700 dark:text-red-300 text-lg mb-4">
                        Unable to send message to Discord. Please check your
                        webhook configuration. 🔧❌
                      </p>
                      <p className="text-red-600 dark:text-red-400 text-sm break-words">Details: {error}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex lg:flex-row flex-col justify-center items-center gap-6 sticky top-8">
                      {/* Preview Image */}
                      <div className="h-80 w-64 bg-gradient-to-br from-white/90 to-pink-50/60 dark:from-gray-800/90 dark:to-purple-800/60 border-2 border-pink-200/60 dark:border-pink-500/40 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg">
                        {formData.croppedImage || formData.templatePosition ? (
                          <div className="relative w-full h-full">
                            {/* Cropped image */}
                            {formData.croppedImage && (
                              <Image
                                src={formData.croppedImage}
                                alt="Cropped preview"
                                className="max-h-full max-w-full object-contain z-10 rounded-xl"
                                width={1080}
                                height={1350}
                              />
                            )}

                            {/* Template image */}
                            {!selectedTemplateImage ? (
                              <Image
                                src={`/templates/TEMPLATE_${formData.templatePosition}.png`}
                                alt="Template"
                                className="absolute top-0 left-0 max-h-full max-w-full object-contain z-20 rounded-xl"
                                width={1080}
                                height={1350}
                              />
                            ) : (
                              <Image
                                src={selectedTemplateImage}
                                alt="Template"
                                className="absolute top-0 left-0 max-h-full max-w-full object-contain z-20 rounded-xl"
                                width={1080}
                                height={1350}
                              />
                            )}

                            {/* Image label */}
                            <div className="absolute z-30 bottom-3 right-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md">
                              1080x1350
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400 text-lg">No image selected</p>
                        )}
                      </div>

                      <div className="flex items-center justify-center rotate-90 lg:rotate-0">
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
                          className="text-pink-500 dark:text-pink-400"
                        >
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                          <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                      </div>

                      {/* Flyer Image */}
                      {isFetchingImage ? (
                        <div className="relative overflow-hidden h-80 w-64 flex items-center justify-center border-2 border-pink-400/60 dark:border-pink-500/60 rounded-2xl bg-gradient-to-br from-pink-50/60 to-purple-50/60 dark:from-pink-900/20 dark:to-purple-900/20 shadow-lg">
                          <div className="flex flex-col items-center justify-center">
                            <svg
                              className="animate-spin h-10 w-10 text-pink-500 dark:text-pink-400 mb-3"
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
                            <span className="text-base font-medium text-gray-600 dark:text-gray-300 mb-4">
                              Generating...
                            </span>
                            <button
                              type="button"
                              onClick={handleStopGenerating}
                              className="absolute bottom-0 py-3 w-full bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-800/40 dark:to-purple-800/40 text-gray-700 dark:text-gray-200 hover:from-pink-200 hover:to-purple-200 dark:hover:from-pink-700/40 dark:hover:to-purple-700/40 rounded-b-2xl cursor-pointer font-medium transition-all duration-200"
                            >
                              Stop Generating
                            </button>
                          </div>
                        </div>
                      ) : webhookData?.thumbnail && webhookData?.webViewLink ? (
                        <div className="flex items-center justify-center h-80 w-64 rounded-2xl bg-gradient-to-br from-pink-50/60 to-purple-50/60 dark:from-pink-900/20 dark:to-purple-900/20 border-2 border-pink-400/60 dark:border-pink-500/60 shadow-lg">
                          <Link
                            href={webhookData?.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-full w-full flex items-center justify-center rounded-2xl overflow-hidden group transition-transform duration-200 hover:scale-105"
                            title="Click to view flyer"
                          >
                            <Image
                              src={webhookData.thumbnail.replace(
                                /=s\d+$/,
                                "=s800"
                              )}
                              alt={"Generated Flyer"}
                              width={400}
                              height={400}
                              className="object-contain max-h-full max-w-full rounded-xl transition-transform duration-200 group-hover:scale-110"
                              loading="lazy"
                            />
                          </Link>
                        </div>
                      ) : (
                        <div className="h-80 w-64 bg-gradient-to-br from-white/90 to-pink-50/60 dark:from-gray-800/90 dark:to-purple-800/60 flex items-center justify-center border-2 border-pink-400/60 dark:border-pink-500/40 rounded-2xl shadow-lg">
                          <span className="text-base font-medium text-gray-500 dark:text-gray-400 text-center px-4">
                            Flyer not yet generated
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {(webhookData || history) && (
                  <>
                    <div className="h-full flex flex-col gap-4">
                      <hr className="border-2 border-pink-400/40 dark:border-pink-500/40" />
                      <span className="text-gray-600 dark:text-gray-300 text-lg font-medium">
                        Generated Flyers: {history.length}
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 overflow-y-auto max-h-64">
                        {history.map((item, index) => (
                          <div
                            key={index}
                            className="border-2 p-3 border-pink-400/60 dark:border-pink-500/40 rounded-xl flex flex-col items-center justify-center hover:bg-gradient-to-br hover:from-pink-50/60 hover:to-purple-50/60 dark:hover:from-pink-900/20 dark:hover:to-purple-900/20 transition-all duration-200 hover:shadow-md cursor-pointer"
                          >
                            <div className="w-24 h-24 rounded-xl overflow-hidden shadow-sm">
                              <Image
                                src={item.thumbnail}
                                alt="Generated Flyer"
                                width={200}
                                height={200}
                                className={cn(
                                  "object-contain max-h-full rounded-xl max-w-full cursor-pointer transition-transform duration-200 hover:scale-110",
                                  {
                                    "cursor-not-allowed opacity-50":
                                      isFetchingImage || isLoading,
                                  }
                                )}
                                onClick={() => {
                                  if (!isFetchingImage || !isLoading) {
                                    setWebhookData(item);
                                  }
                                }}
                                loading="lazy"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}