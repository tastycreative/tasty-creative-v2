"use client";
import { cn, emailData, formatDateOption } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";
import { useState, FormEvent, ChangeEvent, useEffect, useRef } from "react";

interface LiveFlyerItem {
  id: string;
  date: string;
  clientModelId?: string;
  finalOutput: string;
  finalOutputThumbnail?: string | null;
  psdFile?: string | null;
  createdById?: string;
  requestId?: string;
  createdAt?: string;
}

import { TIMEZONES } from "@/lib/lib";
import { toast } from "sonner";
import SharedModelsDropdown from "./SharedModelsDropdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateTime } from "luxon";
import ImageCropper from "@/components/ImageCropper";
import FlyerTemplates from "@/components/FlyerTemplates";
import ServerOffline from "@/components/ServerOffline";
import { liveFlyerValidation } from "@/schema/zodValidationSchema";

export default function LiveFlyer({ modelName }: { modelName?: string }) {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [response, setResponse] = useState<WebhookResponse | null>(null);

  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [webhookData, setWebhookData] = useState<any>(null);
  // const [isProcessing, setIsProcessing] = useState(false);
  const lastCheckTimestamp = useRef(0);
  const checkInterval = useRef<NodeJS.Timeout | null>(null);
  const [isFetchingImage, setIsFetchingImage] = useState(false);
  const [history, setHistory] = useState<WebhookResponse[]>([]);
  const [isEventCreating, setIsEventCreating] = useState(false);
  const [itemReceived, setItemReceived] = useState(0);
  const [requestSent, setRequestSent] = useState(false);
  const [sheetLink, setSheetLink] = useState<string | null>(null);
  const [calendarLink, setCalendarLink] = useState<string | null>(null);
  const [selectedTemplateImage, setSelectedTemplateImage] = useState<
    string | null
  >(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // LiveFlyer gallery data (from LiveFlyerGallery table)
  const [liveFlyerItems, setLiveFlyerItems] = useState<LiveFlyerItem[]>([]);
  const [isLoadingLiveFlyers, setIsLoadingLiveFlyers] = useState(false);
  const [liveFlyerError, setLiveFlyerError] = useState<string | null>(null);

  const [dtmzoption, setDtmzoption] = useState<
    "MonthDay" | "DayOfWeek" | "MMDD"
  >("MonthDay");

  const [eventCreated, setEventCreated] = useState<{
    success: boolean;
    message: string;
    eventLink?: string;
  } | null>(null);

  const [formData, setFormData] = useState<ModelFormData>({
    model: modelName || "",
    date: "",
    time: "",
    timezone: "",
    paid: false,
    customImage: true,
    imageId: "",
    noOfTemplate: 1,
    customRequest: false,
    customDetails: "",
    type: "LIVE",
    datetmz: "",
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Tab state for lazy loading gallery
  const [activeTab, setActiveTab] = useState<"create" | "outputs">("create");
  const [loadOutputs, setLoadOutputs] = useState(false);
  // dynamic import will only run on client when requested
  const [LiveFlyerGallery, setLiveFlyerGallery] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    if (loadOutputs && typeof window !== "undefined" && !LiveFlyerGallery) {
      import("@/components/LiveFlyerGallery")
        .then((mod) => {
          if (mounted) setLiveFlyerGallery(() => mod.default);
        })
        .catch((err) => console.error("Failed to load LiveFlyerGallery", err));
    }
    return () => {
      mounted = false;
    };
  }, [loadOutputs, LiveFlyerGallery]);

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

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, type } = e.target;

    const rawValue =
      type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value;

    const value = name === "noOfTemplates" ? Number(rawValue) : rawValue;

    // Validate this field only
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fieldSchema = (liveFlyerValidation.shape as any)[name];
    if (fieldSchema) {
      const result = fieldSchema.safeParse(value);

      setFieldErrors((prev) => ({
        ...prev,
        [name]: result.success ? "" : result.error.errors[0].message,
      }));
    }

    // Update form data
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const result = liveFlyerValidation.safeParse(formData);

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

    // Clear previous errors if valid
    setFieldErrors({});
    setError("");
    setIsLoading(true);

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
      formDataToSend.append("croppedImage", formData.croppedImage || "");
      formDataToSend.append("selectedTemplate", selectedTemplate || "");
      formDataToSend.append("datetmz", formData.datetmz || "");

      // Append the file if it exists
      if (formDataToSend.has("imageFile")) {
        formDataToSend.delete("imageFile"); // Ensure only one instance
      }
      if (formData.imageFile && formData.customImage) {
        formDataToSend.append("imageFile", formData.imageFile);
      }

      // Make the API request
      const response = await fetch(webhookUrl, {
        method: "POST",
        body: formDataToSend, // Send as FormData (automatically sets correct headers)
      });

      //console.log(response, "response");

      // Check for errors based on the status code
      if (!response.ok) {
        const errorText = await response.text();
        setResponse({
          error: `Failed to call webhook. Status: ${response.status} - ${errorText}`,
        });
        setError(errorText);
        setIsLoading(false);
        return;
      }

      // Read the response correctly (expect JSON response)
      const textData = await response.text();
      try {
        const jsonData = JSON.parse(textData);
        setResponse(jsonData); // Store the response in the state
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        setResponse({ error: "Invalid JSON response from webhook" });
        setError(textData); // Store the raw response if it's not JSON
        stopChecking(); // Stop checking if the response is invalid
        // Send email about the invalid response (server offline)
        const emailData = {
          to: "kentjohnliloc@gmail.com",
          subject: "Webhook Server Offline",
          text: `The webhook server returned an invalid response:\n\n${textData}`,
          html: `<p>The webhook server returned an invalid response:</p><pre>${textData}</pre>`,
        };

        // Send the email notification to admin about the issue
        try {
          await fetch("/api/sendEmail", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(emailData),
          });
        } catch (emailError) {
          console.error("Error sending email:", emailError);
        }
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
        //console.log("Email sent successfully");
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

  useEffect(() => {
    // Only validate croppedImage if it has a value
    if (formData.croppedImage) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fieldSchema = (liveFlyerValidation.shape as any)["croppedImage"];
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

  const dateTimezone = () => {
    const { date, time, timezone } = formData;
    if (!date || !timezone) return null;

    const datetimezone = date + " " + time + " " + timezone;

    try {
      setFormData((prev) => ({
        ...prev,
        datetmz: formatDateOption(datetimezone, dtmzoption),
      }));
    } catch (err) {
      console.error("Invalid date/timezone format:", err);
      return null;
    }
  };

  useEffect(() => {
    if (formData.date && formData.time && formData.timezone) {
      dateTimezone();
    }
  }, [formData.date, formData.time, formData.timezone, dtmzoption]);

  // Fetch LiveFlyerGallery items for the selected model (clientModel name)
  useEffect(() => {
    const clientModelName = formData.model;
    if (!clientModelName) return;

    let cancelled = false;
    setIsLoadingLiveFlyers(true);
    setLiveFlyerError(null);

    // API route should return items from LiveFlyerGallery by client model name
    fetch(`/api/liveflyer/gallery?model=${encodeURIComponent(clientModelName)}`)
      .then(async (res) => {
        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || "Failed to fetch live flyers");
        }
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setLiveFlyerItems(Array.isArray(data) ? data : data.items || []);
      })
      .catch((err) => {
        if (cancelled) return;
        setLiveFlyerError(String(err.message || err));
      })
      .finally(() => {
        if (!cancelled) setIsLoadingLiveFlyers(false);
      });

    return () => {
      cancelled = true;
    };
  }, [formData.model]);

  // If outputs tab selected, render only the gallery (full-width)
  if (activeTab === "outputs") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
        <div className="container mx-auto px-4 py-8">
          {/* Tabs */}
          <div className="mb-6">
            <div className="flex items-center gap-8 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setActiveTab("create");
                }}
                className={`pb-3 px-1 font-medium transition-colors relative ${
                  activeTab === "create"
                    ? "text-pink-600 dark:text-pink-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                Create
                {activeTab === "create" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-600 dark:bg-pink-400"></span>
                )}
              </button>
              <button
                onClick={() => {
                  setActiveTab("outputs");
                  setLoadOutputs(true);
                }}
                className={`pb-3 px-1 font-medium transition-colors relative ${
                  activeTab === "outputs"
                    ? "text-pink-600 dark:text-pink-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                Outputs
                {activeTab === "outputs" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-600 dark:bg-pink-400"></span>
                )}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200/60 dark:border-gray-700/60 p-6 bg-white/70 dark:bg-gray-900">
            {LiveFlyerGallery ? (
              <LiveFlyerGallery
                clientModelName={formData.model}
                clientModelId={undefined}
              />
            ) : (
              <div className="text-sm text-gray-500">Loading gallery...</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      <div className="container mx-auto px-4 py-8">
        {response?.error === "Invalid JSON response from webhook" && (
          <ServerOffline />
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-8">
              <button
                onClick={() => {
                  setActiveTab("create");
                }}
                className={`pb-3 px-1 font-medium transition-colors relative ${
                  activeTab === "create"
                    ? "text-pink-600 dark:text-pink-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                Create
                {activeTab === "create" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-600 dark:bg-pink-400"></span>
                )}
              </button>
              <button
                onClick={() => {
                  setActiveTab("outputs");
                  setLoadOutputs(true);
                }}
                className={`pb-3 px-1 font-medium transition-colors relative ${
                  activeTab === "outputs"
                    ? "text-pink-600 dark:text-pink-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                Outputs
                {activeTab === "outputs" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-600 dark:bg-pink-400"></span>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Form Section - only show when Create tab active */}
          <div className="relative overflow-hidden bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm shadow-lg col-span-1 flex flex-col gap-4 lg:max-w-lg w-full p-8">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
            </div>

            <div className="relative">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-pink-500/10 to-purple-500/10 dark:from-pink-400/20 dark:to-purple-400/20 rounded-xl border border-pink-200/50 dark:border-pink-500/30">
                  <svg
                    className="w-6 h-6 text-pink-600 dark:text-pink-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tight">
                    <span className="bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-gray-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                      Live Flyer Generation
                    </span>
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 mt-1 text-lg font-medium">
                    Create stunning promotional flyers for live events
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="relative grid grid-cols-2 gap-4"
            >
              <div className="col-span-2">
                <SharedModelsDropdown
                  formData={formData}
                  setFormData={setFormData}
                  isLoading={isLoading}
                  isFetchingImage={isFetchingImage}
                  webhookData={webhookData}
                  error={fieldErrors.model}
                  setFieldErrors={setFieldErrors}
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
              <div className="col-span-2">
                <FlyerTemplates
                  flyer="LIVE"
                  type="LIVE"
                  setSelectedTemplateImage={setSelectedTemplateImage}
                  setSelectedTemplate={setSelectedTemplate}
                />
              </div>

              <div className="col-span-2 flex gap-2 items-center">
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
                    name="paid"
                    onChange={handleInputChange}
                    checked={formData.paid}
                    disabled={isLoading || isFetchingImage || webhookData}
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-pink-500 peer-checked:to-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-gray-200 after:border-gray-300 dark:after:border-gray-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
                <h1 className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-0">
                  Paid Page
                </h1>
              </div>

              <div className="col-span-2">
                <div className="flex flex-col text-gray-700 dark:text-gray-200">
                  <label
                    htmlFor="date"
                    className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-200"
                  >
                    Date
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    className={cn(
                      "bg-white/70 dark:bg-gray-700 text-gray-700 dark:text-gray-100 border-pink-200 dark:border-pink-500/30 rounded-2xl w-full p-3 focus:border-pink-400 dark:focus:border-pink-400 focus:ring-pink-300 transition-all duration-200",
                      {
                        "border border-red-500 text-red-500": fieldErrors.date,
                      }
                    )}
                    value={formData.date}
                    onChange={handleInputChange}
                    disabled={isLoading || isFetchingImage || webhookData}
                  />
                </div>
              </div>

              <div className="col-span-1">
                <div className="flex flex-col">
                  <label
                    htmlFor="time"
                    className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-200"
                  >
                    Time
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="time"
                      id="time"
                      name="time"
                      className={cn(
                        "rounded-2xl p-3 flex-1 bg-white/70 dark:bg-gray-700 text-gray-700 dark:text-gray-100 border border-pink-200 dark:border-pink-500/30 focus:border-pink-400 dark:focus:border-pink-400 focus:ring-pink-300 transition-all duration-200",
                        {
                          "border border-red-500 text-red-500":
                            fieldErrors.time,
                        }
                      )}
                      value={formData.time}
                      onChange={handleInputChange}
                      disabled={isLoading || isFetchingImage || webhookData}
                    />
                  </div>
                </div>
              </div>

              <div className="col-span-1">
                <div className="w-full mt-6">
                  <Select
                    value={formData.timezone}
                    onValueChange={(value) => {
                      // Update form data first
                      setFormData((prev) => ({ ...prev, timezone: value }));

                      // Now validate the updated value
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const fieldSchema = (liveFlyerValidation.shape as any)[
                        "timezone"
                      ];
                      if (fieldSchema) {
                        const result = fieldSchema.safeParse(value);

                        setFieldErrors((prev) => ({
                          ...prev,
                          timezone: result.success
                            ? ""
                            : result.error.errors[0].message,
                        }));
                      }
                    }}
                    disabled={isLoading || isFetchingImage || webhookData}
                  >
                    <SelectTrigger
                      className={cn(
                        "bg-white/70 dark:bg-gray-700 cursor-pointer !h-[48px] border-pink-200 dark:border-pink-500/30 p-3 text-gray-700 dark:text-gray-100 rounded-2xl w-full focus:border-pink-400 dark:focus:border-pink-400 transition-all duration-200",
                        {
                          "border border-red-500 !text-red-500":
                            fieldErrors.timezone,
                        }
                      )}
                    >
                      <SelectValue placeholder="Select Timezone" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 dark:bg-gray-800/95 border-pink-200 dark:border-pink-500/20 text-gray-700 dark:text-gray-100 max-h-72 rounded-2xl">
                      {TIMEZONES.map((tz) => (
                        <SelectItem
                          key={tz.name}
                          value={tz.name}
                          className="flex items-center justify-between py-2"
                        >
                          {tz.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="col-span-2 text-gray-700 dark:text-gray-200 flex flex-col gap-4 ">
                <label className="flex items-center gap-3 p-3 rounded-2xl bg-white/50 dark:bg-gray-800/50 hover:bg-pink-50/50 dark:hover:bg-pink-900/20 transition-all duration-200 cursor-pointer">
                  <input
                    type="radio"
                    name="dtmz"
                    value="MonthDay"
                    checked={dtmzoption === "MonthDay"}
                    onChange={() => setDtmzoption("MonthDay")}
                    className="accent-pink-600"
                  />
                  <span className="text-sm font-medium">
                    {formData.datetmz
                      ? formatDateOption(
                          formData.date +
                            " " +
                            formData.time +
                            " " +
                            formData.timezone,
                          "MonthDay"
                        )
                      : "MonthDay"}
                  </span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-2xl bg-white/50 dark:bg-gray-800/50 hover:bg-pink-50/50 dark:hover:bg-pink-900/20 transition-all duration-200 cursor-pointer">
                  <input
                    type="radio"
                    name="dtmz"
                    value="DayOfWeek"
                    checked={dtmzoption === "DayOfWeek"}
                    onChange={() => setDtmzoption("DayOfWeek")}
                    className="accent-pink-600"
                  />
                  <span className="text-sm font-medium">
                    {formData.datetmz
                      ? formatDateOption(
                          formData.date +
                            " " +
                            formData.time +
                            " " +
                            formData.timezone,
                          "DayOfWeek"
                        )
                      : "DayOfWeek"}
                  </span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-2xl bg-white/50 dark:bg-gray-800/50 hover:bg-pink-50/50 dark:hover:bg-pink-900/20 transition-all duration-200 cursor-pointer">
                  <input
                    type="radio"
                    name="dtmz"
                    value="MMDD"
                    checked={dtmzoption === "MMDD"}
                    onChange={() => setDtmzoption("MMDD")}
                    className="accent-pink-600"
                  />
                  <span className="text-sm font-medium">
                    {formData.datetmz
                      ? formatDateOption(
                          formData.date +
                            " " +
                            formData.time +
                            " " +
                            formData.timezone,
                          "MMDD"
                        )
                      : "MMDD"}
                  </span>
                </label>
              </div>

              <div className="col-span-2 flex w-full justify-between items-center h-full">
                <div className="flex flex-col">
                  <label
                    htmlFor="noOfTemplate"
                    className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-200"
                  >
                    No. of Flyers to generate (1-5)
                  </label>
                  <div className="flex gap-2 w-[60px]">
                    <input
                      type="number"
                      id="noOfTemplate"
                      name="noOfTemplate"
                      className="border border-pink-200 dark:border-pink-500/30 bg-white/70 dark:bg-gray-700 text-gray-700 dark:text-gray-100 rounded-2xl p-3 flex-1 focus:border-pink-400 dark:focus:border-pink-400 transition-all duration-200"
                      value={formData.noOfTemplate}
                      onChange={handleInputChange}
                      disabled={isLoading || isFetchingImage}
                      max={5}
                      min={1}
                    />
                  </div>
                </div>
                <div className=" flex gap-2 items-center relative">
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
                      disabled={
                        isLoading ||
                        isFetchingImage ||
                        webhookData ||
                        response?.error === "Invalid JSON response from webhook"
                      }
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-pink-500 peer-checked:to-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-gray-200 after:border-gray-300 dark:after:border-gray-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                  <h1 className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-0">
                    Custom Flyer
                  </h1>
                </div>
              </div>

              {formData.customRequest && (
                <div className="col-span-2">
                  <div className="flex flex-col">
                    <label
                      htmlFor="customDetails"
                      className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-200"
                    >
                      Custom request details:
                    </label>
                    <div className="flex gap-2">
                      <textarea
                        id="customDetails"
                        name="customDetails"
                        className="rounded-2xl p-3 flex-1 bg-white/70 dark:bg-gray-700 text-gray-700 dark:text-gray-100 border border-pink-200 dark:border-pink-500/30 focus:border-pink-400 dark:focus:border-pink-400 resize-y transition-all duration-200"
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

              <div className="mt-2 col-span-2">
                <button
                  type="submit"
                  className={`rounded-2xl px-6 py-3 w-full cursor-pointer bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-medium shadow-lg shadow-pink-500/25 hover:shadow-xl hover:shadow-pink-500/30 transition-all duration-200 ${
                    isLoading || isFetchingImage || requestSent
                      ? "opacity-60 cursor-not-allowed"
                      : "opacity-100"
                  }`}
                  disabled={isLoading || isFetchingImage || requestSent}
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
                        : "Generate Live Flyer"}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Preview Section or Outputs - if Outputs active, make this span full width */}
          <div
            className={`relative overflow-hidden bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm shadow-lg ${activeTab === "outputs" ? "col-span-3" : "col-span-2"} flex flex-col gap-4 w-full p-8`}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
            </div>

            <div className="relative">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-pink-500/10 to-purple-500/10 dark:from-pink-400/20 dark:to-purple-400/20 rounded-xl border border-pink-200/50 dark:border-pink-500/30">
                  <svg
                    className="w-6 h-6 text-pink-600 dark:text-pink-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">
                    <span className="bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-gray-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                      Preview
                    </span>
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mt-1 font-medium">
                    Live flyer preview will appear here
                  </p>
                </div>
              </div>

              {formData.customRequest === true && requestSent ? (
                <div className="flex h-full items-center justify-center w-full p-4">
                  <div
                    className={cn(
                      " bg-opacity-50   border-opacity-50 rounded-lg p-4 text-center max-w-md w-full shadow-lg transition-all duration-300 ease-in-out",
                      { hidden: error }
                    )}
                  >
                    <div className="text-2xl mb-2">
                      🎉 Successfully submitted request to Discord! 🚀
                    </div>
                    <p className="text-opacity-80">
                      Your message has been sent successfully! 📨✨
                    </p>
                  </div>
                  <div
                    className={cn(
                      "bg-red-100 bg-opacity overflow-hidden relative-50 border text-wrap h-full border-red-300 border-opacity-50 rounded-lg p-4 text-center max-w-md w-full shadow-lg transition-all duration-300 ease-in-out",
                      { hidden: !error }
                    )}
                  >
                    <div className="text-2xl mb-2">
                      ⚠️ Webhook Communication Failed! 🚫
                    </div>
                    <p className="text-red-800 text-opacity-80">
                      Unable to send message to Discord. Please check your
                      webhook configuration. 🔧❌
                    </p>
                    <p className="h-full text-wrap">Details: {error}</p>
                  </div>
                </div>
              ) : (
                response?.error != "Invalid JSON response from webhook" && (
                  <>
                    <div className="flex flex-col lg:flex-row justify-center gap-4 w-full md:sticky md:top-8">
                      <div className="h-80 w-64 bg-white/80 dark:bg-gray-700/50 border border-pink-200/60 dark:border-pink-500/30 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg">
                        {formData.croppedImage || selectedTemplateImage ? (
                          <div className="relative w-full h-full">
                            {/* Cropped image */}
                            {formData.croppedImage && (
                              <Image
                                src={formData.croppedImage}
                                alt="Cropped preview"
                                className="max-h-full max-w-full object-contain z-10"
                                width={1080}
                                height={1350}
                              />
                            )}

                            {/* Template image */}
                            {selectedTemplateImage && (
                              <Image
                                src={selectedTemplateImage}
                                alt="Template"
                                className="absolute top-0 left-0 max-h-full max-w-full object-contain z-20"
                                width={1080}
                                height={1350}
                              />
                            )}

                            {/* Image label */}
                            <div className="absolute z-30 bottom-2 right-2 bg-gradient-to-r from-pink-500 to-purple-500 bg-opacity-90 text-white text-xs px-3 py-1 rounded-full font-medium">
                              1080x1350
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400">
                            No image selected
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-center rotate-90 lg:rotate-0">
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
                          className="text-pink-500"
                        >
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                          <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                      </div>

                      {/* Flyer Image */}
                      {isFetchingImage ? (
                        <div className="relative overflow-hidden h-80 w-64 flex items-center justify-center border border-pink-400/60 dark:border-pink-500/30 rounded-2xl bg-gradient-to-br from-pink-50/40 via-purple-50/40 to-blue-50/40 dark:from-pink-500/10 dark:via-purple-500/10 dark:to-blue-500/10 shadow-lg">
                          <div className="flex flex-col items-center justify-center">
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
                            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                              Generating...
                            </span>
                            <button
                              type="button"
                              onClick={handleStopGenerating}
                              className="absolute bottom-0 py-3 w-full bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-500/20 dark:to-purple-500/20 text-gray-700 dark:text-gray-200 hover:from-pink-200 hover:to-purple-200 dark:hover:from-pink-500/30 dark:hover:to-purple-500/30 rounded-t-2xl cursor-pointer transition-all duration-200 font-medium"
                            >
                              Stop Generating
                            </button>
                          </div>
                        </div>
                      ) : webhookData?.thumbnail && webhookData?.webViewLink ? (
                        <div className="flex items-center justify-center h-80 w-64 rounded-2xl bg-gradient-to-br from-pink-50/40 via-purple-50/40 to-blue-50/40 dark:from-pink-500/10 dark:via-purple-500/10 dark:to-blue-500/10 border border-pink-400/60 dark:border-pink-500/30 shadow-lg">
                          <Link
                            href={webhookData?.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-full w-full flex items-center justify-center rounded-2xl hover:scale-105 transition-all duration-200"
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
                              className="object-contain max-h-full max-w-full rounded-2xl"
                              loading="lazy"
                            />
                          </Link>
                        </div>
                      ) : (
                        <div className="h-80 w-64 bg-white/80 dark:bg-gray-700/50 flex items-center justify-center border border-pink-400/60 dark:border-pink-500/30 rounded-2xl shadow-lg">
                          <span className="text-sm text-gray-500 dark:text-gray-400 text-center px-2 font-medium">
                            Flyer not yet generated
                          </span>
                        </div>
                      )}
                    </div>

                    {webhookData && (
                      <>
                        <div className="h-full flex flex-col gap-4 mt-6">
                          <hr className="border-pink-400/60 dark:border-pink-500/30" />
                          <span className="text-gray-600 dark:text-gray-300 font-medium">
                            Generated: {history.length}
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 overflow-y-auto">
                            {history.map((item, index) => (
                              <div
                                key={index}
                                className="border border-pink-400/60 dark:border-pink-500/30 p-3 rounded-2xl flex flex-col items-center justify-center hover:bg-gradient-to-br hover:from-pink-50/40 hover:to-purple-50/40 dark:hover:from-pink-500/10 dark:hover:to-purple-500/10 transition-all duration-200 cursor-pointer shadow-lg"
                              >
                                <div className="w-24 h-24 rounded-2xl overflow-hidden">
                                  <Image
                                    src={item.thumbnail}
                                    alt="Generated Flyer"
                                    width={200}
                                    height={200}
                                    className={cn(
                                      "object-contain max-h-full rounded-2xl max-w-full cursor-pointer hover:scale-105 transition-all duration-200",
                                      {
                                        "cursor-not-allowed":
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

                    <div className="mt-6 flex justify-center">
                      <button
                        type="button"
                        onClick={handleCreateEventSubmit}
                        className={`rounded-2xl px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-medium shadow-lg shadow-pink-500/25 hover:shadow-xl hover:shadow-pink-500/30 transition-all duration-200 ${
                          isEventCreating ||
                          isFetchingImage ||
                          eventCreated?.success ||
                          !!calendarLink ||
                          !webhookData ||
                          !response
                            ? "opacity-60 cursor-not-allowed"
                            : "opacity-100 cursor-pointer"
                        }`}
                        disabled={
                          isEventCreating ||
                          isFetchingImage ||
                          eventCreated?.success ||
                          !!calendarLink ||
                          !webhookData ||
                          !response
                        }
                      >
                        {isEventCreating ? "Creating Event..." : "Create Event"}
                      </button>
                      {eventCreated && (
                        <div className="rounded-2xl p-4 space-y-3 mt-4 bg-gradient-to-br from-green-50/80 to-blue-50/80 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200/60 dark:border-green-700/30">
                          <div className="flex items-center font-medium">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-6 w-6 mr-2 text-green-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {eventCreated.message}{" "}
                            {eventCreated.message === "Event processing..." ? (
                              <div
                                className="text-sm text-blue-500 cursor-pointer"
                                onClick={handleCreateEventSubmit}
                              >
                                Try again
                              </div>
                            ) : (
                              ""
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-pink-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                />
                              </svg>
                              <Link
                                href={sheetLink || ""}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-600 hover:underline"
                              >
                                {sheetLink
                                  ? "View Spreadsheet"
                                  : "Failed to insert on spreadsheet"}
                              </Link>
                            </div>

                            <div className="flex items-center space-x-2">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-pink-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 11h14a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2z"
                                />
                              </svg>
                              <Link
                                href={calendarLink || ""}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-600 hover:underline"
                              >
                                {calendarLink
                                  ? "Open Calendar Event"
                                  : "Failed to insert on calendar"}
                              </Link>
                            </div>

                            {calendarLink && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                Alternatively, navigate to the Calendar tab
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
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
