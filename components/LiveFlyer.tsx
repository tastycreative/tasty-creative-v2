"use client";
import { cn, emailData, formatDateOption } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";
import { useState, FormEvent, ChangeEvent, useEffect, useRef } from "react";

import { TIMEZONES } from "@/lib/lib";
import { toast } from "sonner";
import ModelsDropdown from "./ModelsDropdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { DateTime } from "luxon";
import ImageCropper from "./ImageCropper";
import FlyerTemplates from "./FlyerTemplates";
import ServerOffline from "./ServerOffline";
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
        formDataToSend.delete("imageFile");  // Ensure only one instance
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

  return (
    <div className="flex flex-col gap-5">
      {response?.error === "Invalid JSON response from webhook" && (
        <ServerOffline />
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex col-span-1 flex-col gap-4 shadow-md  lg:max-w-lg w-full p-6 r bg-white/60 backdrop-blur-sm rounded-lg border border-pink-200">
          <div>
            <h1 className="text-2xl font-bold text-start bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Live Flyer Generation
            </h1>
            <p className="text-gray-600 text-sm">
              Create promotion flyers for upcoming live events
            </p>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-2">
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
                <div className="w-11 h-6 bg-gray-200 peer-checked:bg-gradient-to-r peer-checked:from-pink-500 peer-checked:to-rose-500  rounded-full peer  peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
              <h1 className="text-sm text-gray-600 font-medium mb-0">
                Paid Page
              </h1>
            </div>

            <div className="col-span-2">
              <div className="flex flex-col text-gray-700">
                <label htmlFor="date" className="text-sm font-medium mb-1">
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  className={cn(
                    "bg-white/70 text-gray-700 border-pink-200 rounded-lg w-full p-2 focus:border-pink-400 focus:ring-pink-300",
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
                <label htmlFor="time" className="text-sm font-medium mb-1 text-gray-700">
                  Time
                </label>
                <div className="flex gap-2">
                  <input
                    type="time"
                    id="time"
                    name="time"
                    className={cn(
                      "rounded-md p-2 flex-1 bg-white/70 text-gray-700 border border-pink-200 focus:border-pink-400 focus:ring-pink-300",
                      {
                        "border border-red-500 text-red-500": fieldErrors.time,
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
                      "bg-white/70 cursor-pointer !h-[41px] border-pink-200 p-2 text-gray-700 rounded-lg w-full focus:border-pink-400",
                      {
                        "border border-red-500 !text-red-500":
                          fieldErrors.timezone,
                      }
                    )}
                  >
                    <SelectValue placeholder="Select Timezone" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 border-pink-200 text-gray-700 max-h-72">
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

            {/* <div className="col-span-2 w-full">
              <label className="text-sm font-medium mb-1"></label>
              {formData.datetmz ? formData.datetmz : "Date/Timezone"}
            </div> */}

            <div className="col-span-2 text-gray-700 flex flex-col gap-4 ">
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="dtmz"
                  value="MonthDay"
                  checked={dtmzoption === "MonthDay"}
                  onChange={() => setDtmzoption("MonthDay")}
                  className="accent-pink-600"
                />
                <span className="text-sm">
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

              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="dtmz"
                  value="DayOfWeek"
                  checked={dtmzoption === "DayOfWeek"}
                  onChange={() => setDtmzoption("DayOfWeek")}
                  className="accent-pink-600"
                />
                <span className="text-sm">
                  {" "}
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

              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="dtmz"
                  value="MMDD"
                  checked={dtmzoption === "MMDD"}
                  onChange={() => setDtmzoption("MMDD")}
                  className="accent-pink-600"
                />
                <span className="text-sm">
                  {" "}
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
                  className="text-sm font-medium mb-1 text-gray-700"
                >
                  No. of Flyers to generate (1-5)
                </label>
                <div className="flex gap-2 w-[40px]">
                  <input
                    type="number"
                    id="noOfTemplate"
                    name="noOfTemplate"
                    className="border border-pink-200 bg-white/70 text-gray-700 rounded-md p-2 flex-1 w-[50px] focus:border-pink-400"
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
                  <div className="w-11 h-6 bg-gray-200 peer-checked:bg-gradient-to-r peer-checked:from-pink-500 peer-checked:to-rose-500  rounded-full peer  peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
                <h1 className="text-sm text-gray-600 font-medium mb-0">
                  Custom Flyer
                </h1>
              </div>
            </div>

            {formData.customRequest && (
              <div className="col-span-2">
                <div className="flex flex-col">
                  <label
                    htmlFor="customDetails"
                    className="text-sm font-medium mb-1 text-gray-700"
                  >
                    Custom request details:
                  </label>
                  <div className="flex gap-2">
                    <textarea
                      id="customDetails"
                      name="customDetails"
                      className="rounded-md p-2 flex-1 bg-white/70 text-gray-700 border border-pink-200 focus:border-pink-400 resize-y"
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
                className={`rounded-md px-5 w-full cursor-pointer bg-gradient-to-r from-pink-600 to-rose-600 py-2 text-white font-medium transition-colors hover:from-pink-700 hover:to-rose-700 ${
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

        <div className="flex col-span-2 flex-col gap-4 shadow-md relative  w-full p-6 r bg-white/60 backdrop-blur-sm rounded-lg border border-pink-200">
          <div>
            <h1 className="text-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">Preview</h1>
            <p className="text-sm text-gray-600 mb-2">
              Live flyer preview will appear here
            </p>
          </div>
          {formData.customRequest === true && requestSent ? (
            <div className="flex  h-full  items-center justify-center w-full p-4">
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
                  Unable to send message to Discord. Please check your webhook
                  configuration. 🔧❌
                </p>
                <p className="h-full text-wrap">Details: {error}</p>
              </div>
            </div>
          ) : (
            response?.error != "Invalid JSON response from webhook" && (
              <>
                <div className="flex flex-col lg:flex-row justify-center gap-4 w-full md:sticky md:top-8">
                  <div className="h-80 w-64 bg-white/80 border border-pink-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 ">
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
                        <div className="absolute z-30 bottom-2 right-2 bg-gray-800 bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                          1080x1350
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">No image selected</p>
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
                    >
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </div>

                  {/* Flyer Image */}
                  {isFetchingImage ? (
                    <div className=" relative overflow-hidden h-80 w-64 flex items-center justify-center  border border-pink-400 rounded-md bg-pink-50/40">
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
                        <span className="text-sm text-gray-500">
                          Generating...
                        </span>
                        <button
                          type="button"
                          onClick={handleStopGenerating}
                          className="absolute bottom-0 py-2 w-full bg-pink-100 text-gray-700 hover:bg-pink-200 rounded-t-md cursor-pointer"
                        >
                          Stop Generating
                        </button>
                      </div>
                    </div>
                  ) : webhookData?.thumbnail && webhookData?.webViewLink ? (
                    <div className="flex items-center justify-center h-80 w-64 rounded-md bg-pink-50/40 border border-pink-400">
                      <Link
                        href={webhookData?.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-full w-full flex items-center justify-center"
                        title="Click to view flyer"
                      >
                        {/* <iframe
                            src={convertToPreviewLink(webhookData?.webViewLink)}
                            width={400}
                            height={400}
                            frameBorder="0"
                            allowFullScreen
                            title="Live Flyer Preview"
                            className="object-contain max-h-full max-w-full rounded-md"
                          /> */}
                        <Image
                          src={webhookData.thumbnail.replace(/=s\d+$/, "=s800")}
                          alt={"Generated Flyer"}
                          width={400}
                          height={400}
                          className="object-contain max-h-full max-w-full"
                          loading="lazy"
                        />
                      </Link>
                    </div>
                  ) : (
                    <div className="h-80 w-64 bg-white/80 flex items-center justify-center border border-pink-400 rounded-md">
                      <span className="text-sm text-gray-500 text-center px-2">
                        Flyer not yet generated
                      </span>
                    </div>
                  )}
                </div>
                {webhookData && (
                  <>
                    <div className="h-full flex flex-col gap-2">
                      <hr className="border-pink-400" />
                      <span className="text-gray-600">
                        {" "}
                        Generated: {history.length}
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 overflow-y-auto ">
                        {history.map((item, index) => (
                          <div
                            key={index}
                            className="border p-2 border-pink-400 rounded-md flex flex-col items-center justify-center hover:bg-pink-50/40"
                          >
                            <div className="w-24 h-24 rounded-md overflow-hidden ">
                              <Image
                                src={item.thumbnail}
                                alt="Generated Flyer"
                                width={200}
                                height={200}
                                className={cn(
                                  "object-contain max-h-full rounded-md max-w-full cursor-pointer",
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
                <div className="mt-2 absolute bottom-6 w-full">
                  <button
                    type="button"
                    onClick={handleCreateEventSubmit}
                    className={`rounded-md px-5 w-1/2  bg-gradient-to-r from-pink-600 to-rose-600 py-2 text-white font-medium transition-colors hover:from-pink-700 hover:to-rose-700  ${
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
                    <div className="rounded-lg p-4 space-y-3">
                      <div className="flex items-center font-medium">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 mr-2"
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
                            className="text-sm text-blue-500"
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
                          <div className="text-sm text-gray-500">
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
  );
}
