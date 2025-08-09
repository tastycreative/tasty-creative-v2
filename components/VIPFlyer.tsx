/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import ImageCropper from "./ImageCropper";
import Image from "next/image";
import ModelsDropdown from "./ModelsDropdown";
import { useSearchParams } from "next/navigation";
import { POSITIONS } from "@/lib/lib";
import { v4 as uuidv4 } from "uuid";
import Link from "next/link";
import { cn, emailData } from "@/lib/utils";
import ServerOffline from "./ServerOffline";
import FlyerTemplates from "./FlyerTemplates";
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-foreground min-h-screen">
      {response?.error === "Invalid JSON response from webhook" ? (
        <ServerOffline />
      ) : (
        <>
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border col-span-1 border-pink-200 dark:border-pink-500/20 p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-400 dark:to-rose-400 bg-clip-text text-transparent">VIP Flyer Generation</h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
              Create promotional materials for VIP subscription benefits
            </p>

            <form className="grid grid-cols-2 gap-4" onSubmit={handleSubmit}>
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
                    disabled={isLoading || isFetchingImage || !!webhookData}
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-pink-500 peer-checked:to-rose-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-gray-200 after:border-gray-300 dark:after:border-gray-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
                <h1 className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-0">
                  Custom Flyer
                </h1>
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
              <div className="col-span-2 mt-2">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
                  Options
                </label>
                <div className="flex flex-wrap gap-4">
                  {Object.entries({
                    NSFW: true,
                    Custom: true,
                    Calls: true,
                  }).map(([option, defaultValue]) => (
                    <label
                      key={option}
                      className="flex items-center space-x-2 cursor-pointer"
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
                        className="cursor-pointer accent-pink-600 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-200">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {!formData.customRequest && (
                <div className="flex gap-4 col-span-2">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
                      Template Position
                    </label>
                    <div className="flex space-x-4">
                      {POSITIONS.map((position) => (
                        <label
                          key={position}
                          className="flex items-center cursor-pointer space-x-2"
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
                            className="text-pink-600 accent-pink-600 cursor-pointer rounded"
                            checked={formData.templatePosition === position}
                          />
                          <span className="text-sm">{position}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col">
                <label
                  htmlFor="noOfTemplate"
                  className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-200"
                >
                  No. of Flyers to generate (1-5)
                </label>
                <div className="flex gap-2 w-[40px]">
                  <input
                    type="number"
                    id="noOfTemplate"
                    name="noOfTemplate"
                    className="border border-pink-200 dark:border-pink-500/30 bg-white/70 dark:bg-gray-700 text-gray-700 dark:text-gray-100 rounded-md p-2 flex-1 w-[50px] focus:border-pink-400 dark:focus:border-pink-400"
                    value={formData.noOfTemplate}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading || isFetchingImage}
                    max={5}
                    min={1}
                  />
                </div>
              </div>

              <div className="mt-2 col-span-2">
                <button
                  type="submit"
                  className={`rounded-md px-5 w-full cursor-pointer bg-gradient-to-r from-pink-600 to-rose-600 py-2 text-white font-medium transition-colors hover:from-pink-700 hover:to-rose-700 dark:hover:from-pink-700 dark:hover:to-rose-700 ${
                    isLoading || isFetchingImage
                      ? "opacity-60 cursor-not-allowed"
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

          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border col-span-2 border-pink-200 dark:border-pink-500/20 p-6 rounded-lg shadow-md">
            <div className="flex flex-col gap-4 sticky top-8">
              <div>
                <h1 className="font-bold text-xl bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-400 dark:to-rose-400 bg-clip-text text-transparent">Preview</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  VIP flyer preview will appear here
                </p>
              </div>
              {formData.customRequest === true && requestSent ? (
                <div className="flex items-center h-full justify-center w-full p-4">
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
                <>
                  <div className="flex lg:flex-row flex-col justify-center items-center gap-4 sticky top-8">
                    {/* Preview Image */}
                    <div className="h-80 w-64 bg-white/80 dark:bg-gray-700 border border-pink-200 dark:border-pink-500/30 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      {formData.croppedImage || formData.templatePosition ? (
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
                          {!selectedTemplateImage ? (
                            <Image
                              src={`/templates/TEMPLATE_${formData.templatePosition}.png`}
                              alt="Template"
                              className="absolute top-0 left-0 max-h-full max-w-full object-contain z-20"
                              width={1080}
                              height={1350}
                            />
                          ) : (
                            <Image
                              src={selectedTemplateImage}
                              alt="Template"
                              className="absolute top-0 left-0 max-h-full max-w-full object-contain z-20"
                              width={1080}
                              height={1350}
                            />
                          )}

                          {/* Image label */}
                          <div className="absolute z-30 bottom-2 right-2 bg-black dark:bg-gray-800 bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                            1080x1350
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400">No image selected</p>
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
                      <div className="relative overflow-hidden h-80 w-64 flex items-center justify-center border border-pink-400 rounded-md bg-pink-50/40">
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
                            src={webhookData.thumbnail.replace(
                              /=s\d+$/,
                              "=s800"
                            )}
                            alt={"Generated Flyer"}
                            width={400}
                            height={400}
                            className="object-contain max-h-full max-w-full"
                            loading="lazy"
                          />
                        </Link>
                      </div>
                    ) : (
                      <div className="h-80 w-64 bg-white/80 dark:bg-gray-700 flex items-center justify-center border border-pink-400 dark:border-pink-500/30 rounded-md">
                        <span className="text-sm text-gray-500 dark:text-gray-400 text-center px-2">
                          Flyer not yet generated
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {(webhookData || history) && (
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

              {/* Button */}
              {/* <button
            className={`rounded-md px-5 w-full cursor-pointer bg-gradient-to-r from-blue-600 to-purple-600 py-2 text-white font-medium transition-colors  ${
              isLoading || isFetchingImage
                ? "opacity-60 cursor-not-allowed"
                : "opacity-100"
            }`}
          >
            Create Event
          </button> */}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
