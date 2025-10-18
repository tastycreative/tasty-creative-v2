"use client";
import { cn, emailData } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";
import { useState, FormEvent, ChangeEvent, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import SharedModelsDropdown from "./SharedModelsDropdown";
import { DateTime } from "luxon";
import ServerOffline from "@/components/ServerOffline";
import ImageCropper from "@/components/ImageCropper";
import FlyerTemplates from "@/components/FlyerTemplates";
import { POSITIONS } from "@/lib/lib";
import { fttFlyerValidation } from "@/schema/zodValidationSchema";

export default function FTTFlyer({ modelName }: { modelName?: string }) {
  const router = useRouter();

  const searchParams = useSearchParams();
  const tabValue = searchParams?.get("tab") || "ftt";

  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/google/check-auth");

        // Check if response is ok and content-type is JSON
        if (!res.ok) {
          setIsLoading(false);
          return;
        }

        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          setIsLoading(false);
          return;
        }

        const data = await res.json();

        if (!data.authenticated) {
          // Get the current tab from URL or default to 'live'
          const currentTab = tabValue || "ftt";

          // Include the current tab in the auth request
          const authRes = await fetch(
            `/api/google/auth?tab=${encodeURIComponent(currentTab)}`
          );

          if (!authRes.ok) {
            setIsLoading(false);
            return;
          }

          const authContentType = authRes.headers.get("content-type");
          if (!authContentType || !authContentType.includes("application/json")) {
            setIsLoading(false);
            return;
          }

          const authData = await authRes.json();

          if (authData.authUrl) {
            // Append the tab parameter to the auth URL
            const authUrlWithTab = new URL(authData.authUrl);
            authUrlWithTab.searchParams?.set(
              "state",
              JSON.stringify({ tab: currentTab })
            );

            window.location.href = authUrlWithTab.toString();
          }
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Authentication check failed", error);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const [isGooglePickerLoading, setIsGooglePickerLoading] =
    useState<boolean>(false);
  const [response, setResponse] = useState<WebhookResponse | null>(null);
  const [selectedImage, setSelectedImage] = useState<GoogleDriveFile | null>(
    null
  );
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [googleFiles, setGoogleFiles] = useState<GoogleDriveFile[]>([]);
  const [currentFolder, setCurrentFolder] = useState<FolderInfo | null>(null);
  const [parentFolder, setParentFolder] = useState<FolderInfo | null>(null);
  const [showFilePicker, setShowFilePicker] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [webhookData, setWebhookData] = useState<any>(null);
  // const [isProcessing, setIsProcessing] = useState(false);
  const lastCheckTimestamp = useRef(0);
  const checkInterval = useRef<NodeJS.Timeout | null>(null);
  const [isFetchingImage, setIsFetchingImage] = useState(false);
  const [history, setHistory] = useState<WebhookResponse[]>([]);
  const [isCustomImage, setIsCustomImage] = useState(false);
  const [isEventCreating, setIsEventCreating] = useState(false);
  const [itemReceived, setItemReceived] = useState(0);
  const [requestSent, setRequestSent] = useState(false);
  const [sheetLink, setSheetLink] = useState<string | null>(null);
  const [calendarLink, setCalendarLink] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [selectedTemplateImage, setSelectedTemplateImage] = useState<
    string | null
  >(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const [eventCreated, setEventCreated] = useState<{
    success: boolean;
    message: string;
    eventLink?: string;
  } | null>(null);

  const [formData, setFormData] = useState<ModelFormData>({
    model: modelName || "",
    customImage: false,
    templatePosition: "BOTTOM",
    imageId: "",
    noOfTemplate: 1,
    customRequest: false,
    customDetails: "",
    type: "FTT",
    tip: 10,
    gets: 100,
  });

  useEffect(() => {
    const { date, time, timezone } = formData;

    if (!date || !time || !timezone) return;

    try {
      // Combine the date and time, then parse it with the timezone
      const selectedDateTime = DateTime.fromFormat(
        `${date} ${time}`,
        "yyyy-MM-dd HH:mm",
        {
          zone: timezone,
        }
      );

      // Get "today" in the same timezone
      const nowInZone = DateTime.now().setZone(timezone);

      const isToday =
        selectedDateTime.hasSame(nowInZone, "day") &&
        selectedDateTime.hasSame(nowInZone, "month") &&
        selectedDateTime.hasSame(nowInZone, "year");

      setFormData((prev) => ({
        ...prev,
        header: isToday ? "Live Tonight" : "Going Live",
      }));
    } catch (err) {
      console.error("Invalid date/time/timezone format:", err);
    }
  }, [formData.date, formData.time, formData.timezone]);

  console.log("Form Data:", formData);

  // Check authentication status when component mounts
  useEffect(() => {
    checkAuthStatus();
  }, []);

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

  // Check for //initial data on mount

  const stopChecking = () => {
    if (checkInterval.current) {
      clearInterval(checkInterval.current);
      checkInterval.current = null;
    }
    setIsFetchingImage(false);
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

  const checkAuthStatus = async () => {
    try {
      const response = await fetch("/api/google-drive/list");
      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          setIsAuthenticated(true);
          const data = await response.json();
          if (data.files) {
            setGoogleFiles(data.files);
            setCurrentFolder(data.currentFolder || null);
            setParentFolder(data.parentFolder || null);
          }
        } else {
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      setIsAuthenticated(false);
    }
  };

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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const result = fttFlyerValidation.safeParse(formData);

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
    const webhookUrl =
      response?.error === "Invalid JSON response from webhook"
        ? "/api/discord"
        : "/api/webhook-proxy";

    try {
      setIsLoading(true);
      setIsFetchingImage(true);
      setItemReceived(0);
      const formDataToSend = new FormData();

      // Append form data fields
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
      formDataToSend.append("header", formData.header || "");
      formDataToSend.append("tip", String(formData.tip || 1));
      formDataToSend.append("gets", String(formData.gets || 1));
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

      // Handle request-based logic
      if (formData.customRequest !== true) {
        startChecking(requestId); // Start checking using requestId
      } else {
        setIsFetchingImage(false);
        setIsLoading(false);
        setRequestSent(true);
      }
    } catch (error) {
      console.error("Error calling webhook:", error);
      setResponse({ error: "Failed to call webhook" });
      setError("An error occurred while making the request.");
    } finally {
      setIsLoading(false);
    }
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
      setFormData((prev) => ({
        ...prev,
        customRequest: true,
      }));
      sendEmail();
    }
  }, [response]);

  const handleCreateEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEventCreating(true);
    try {
      // Attempt to create the event directly
      const response = await fetch("/api/google-calendar/create-event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      setSheetLink(result.spreadsheetLink);
      setCalendarLink(result.eventLink);

      // Handle authentication error (token expired or missing)
      if (response.status === 401 && result.requireAuth) {
        // Store form data in session storage to retrieve after authentication
        sessionStorage.setItem("calendarFormData", JSON.stringify(formData));

        // Get Google authentication URL and redirect
        const authResponse = await fetch("/api/google/auth");
        if (!authResponse.ok) {
          throw new Error("Failed to get authentication URL");
        }

        const authData = await authResponse.json();
        if (authData.authUrl) {
          window.location.href = authData.authUrl;
          return;
        }
      }

      // Handle successful event creation
      if (response.ok) {
        setEventCreated({
          success: true,
          message: result.message,
          eventLink: result.eventLink,
        });
        toast("Event created successfully!");
      } else {
        setEventCreated({
          success: false,
          message: result.message || "Failed to create event",
        });
        toast(result.message);
      }
    } catch (error) {
      console.error("Error creating event:", error);
      setEventCreated({
        success: false,
        message: "An error occurred while creating the event",
      });
      toast(String(error));
    } finally {
      setIsEventCreating(false);
    }
  };

  const handleStopGenerating = () => {
    stopChecking();
  };

  const handleCropComplete = (croppedImage: string) => {
    setFormData({
      ...formData,
      croppedImage,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          {response?.error === "Invalid JSON response from webhook" && (
            <ServerOffline />
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="flex col-span-1 flex-col gap-6 bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm shadow-xl p-8 lg:max-w-lg w-full">
              <div className="space-y-3">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 dark:from-pink-400 dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
                  FTT Flyer Generation
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
                  Create stunning promotion flyers for First to Tip campaigns
                </p>
              </div>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <SharedModelsDropdown
                    formData={formData}
                    setFormData={setFormData}
                    isLoading={isLoading}
                    isFetchingImage={isFetchingImage}
                    webhookData={webhookData}
                  />
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

                <div className="col-span-2 flex w-full gap-6 items-center">
                  <div className="flex flex-col space-y-2">
                    <label htmlFor="tip" className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Tip Amount
                    </label>
                    <div className="flex gap-2 w-[110px] relative items-center">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
                        $
                      </span>
                      <input
                        type="number"
                        id="tip"
                        name="tip"
                        className="border-2 border-gray-200/60 dark:border-gray-600/60 pl-6 bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-100 rounded-xl p-3 flex-1 focus:border-pink-400 dark:focus:border-pink-400 focus:ring-2 focus:ring-pink-200/50 dark:focus:ring-pink-500/20 transition-all duration-200"
                        value={formData.tip}
                        onChange={handleInputChange}
                        required
                        disabled={isLoading || isFetchingImage}
                        max={99}
                        min={10}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label htmlFor="gets" className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Gets Amount
                    </label>
                    <div className="flex gap-2 w-[110px] relative items-center">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
                        $
                      </span>
                      <input
                        type="number"
                        id="gets"
                        name="gets"
                        className="border-2 border-gray-200/60 dark:border-gray-600/60 pl-6 bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-100 rounded-xl p-3 flex-1 focus:border-pink-400 dark:focus:border-pink-400 focus:ring-2 focus:ring-pink-200/50 dark:focus:ring-pink-500/20 transition-all duration-200"
                        value={formData.gets}
                        onChange={handleInputChange}
                        required
                        disabled={isLoading || isFetchingImage}
                        max={999}
                        min={100}
                      />
                    </div>
                  </div>
                </div>
                <div className="col-span-2 flex w-full justify-start items-center">
                  <div className="flex flex-col space-y-2">
                    <label
                      htmlFor="noOfTemplate"
                      className="text-sm font-semibold text-gray-700 dark:text-gray-200"
                    >
                      Number of Flyers (1-5)
                    </label>
                    <div className="flex gap-2 w-[80px]">
                      <input
                        type="number"
                        id="noOfTemplate"
                        name="noOfTemplate"
                        className="border-2 border-gray-200/60 dark:border-gray-600/60 bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-100 rounded-xl p-3 flex-1 focus:border-pink-400 dark:focus:border-pink-400 focus:ring-2 focus:ring-pink-200/50 dark:focus:ring-pink-500/20 transition-all duration-200"
                        value={formData.noOfTemplate}
                        onChange={handleInputChange}
                        required
                        disabled={isLoading || isFetchingImage}
                        max={5}
                        min={1}
                      />
                    </div>
                  </div>
                </div>

                {formData.customRequest && (
                  <div className="col-span-2">
                    <div className="flex flex-col space-y-2">
                      <label
                        htmlFor="customDetails"
                        className="text-sm font-semibold text-gray-700 dark:text-gray-200"
                      >
                        Custom Request Details
                      </label>
                      <div className="flex gap-2">
                        <textarea
                          id="customDetails"
                          name="customDetails"
                          className="rounded-xl p-4 flex-1 bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-100 border-2 border-gray-200/60 dark:border-gray-600/60 focus:border-pink-400 dark:focus:border-pink-400 focus:ring-2 focus:ring-pink-200/50 dark:focus:ring-pink-500/20 transition-all duration-200 resize-y"
                          value={formData.customDetails}
                          onChange={handleInputChange}
                          required
                          disabled={isLoading || isFetchingImage || webhookData}
                          rows={4}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 col-span-2">
                  <button
                    type="submit"
                    className={`rounded-xl px-6 py-4 w-full cursor-pointer bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 text-white font-semibold text-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl hover:from-pink-700 hover:via-purple-700 hover:to-blue-700 dark:hover:from-pink-600 dark:hover:via-purple-600 dark:hover:to-blue-600 shadow-lg ${
                      isLoading || isFetchingImage
                        ? "opacity-60 cursor-not-allowed transform-none"
                        : "opacity-100"
                    }`}
                    // disabled={isLoading || isFetchingImage || requestSent}
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
                          : "Generate FTT Flyer"}
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>

            <div className="flex col-span-2 flex-col gap-6 bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm shadow-xl p-8 w-full">
              <div className="space-y-2">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 dark:from-pink-400 dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent">Preview</h1>
                <p className="text-base text-gray-600 dark:text-gray-300">
                  Your FTT flyer preview will appear here
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
                      Unable to send message to Discord. Please check your webhook
                      configuration. 🔧❌
                    </p>
                    <p className="text-red-600 dark:text-red-400 text-sm break-words">Details: {error}</p>
                  </div>
                </div>
              ) : (
                response?.error != "Invalid JSON response from webhook" && (
                  <>
                    <div className="flex flex-col lg:flex-row items-center justify-center gap-6 w-full">
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

                      {isFetchingImage ? (
                        <div className="w-full relative overflow-hidden lg:w-[280px] h-[320px] flex items-center justify-center border-2 border-pink-400/60 dark:border-pink-500/60 rounded-2xl bg-gradient-to-br from-pink-50/60 to-purple-50/60 dark:from-pink-900/20 dark:to-purple-900/20 shadow-lg">
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
                      ) : webhookData &&
                        webhookData.thumbnail &&
                        webhookData.webViewLink ? (
                        <div className="flex items-center justify-center h-80 w-64 rounded-2xl bg-gradient-to-br from-pink-50/60 to-purple-50/60 dark:from-pink-900/20 dark:to-purple-900/20 border-2 border-pink-400/60 dark:border-pink-500/60 shadow-lg">
                          <Link
                            href={webhookData?.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-full w-full flex items-center justify-center rounded-2xl overflow-hidden group transition-transform duration-200 hover:scale-105"
                            title="Click to view flyer"
                          >
                            <Image
                              src={webhookData.thumbnail.replace(/=s\d+$/, "=s800")}
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
                    {webhookData && (
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
                  </>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}