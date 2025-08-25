"use client";

import React, { useState, useEffect } from "react";

type Errors = {
  accountName?: string;
  voiceName?: string;
  voiceId?: string;
  apiKey?: string;
  general?: string;
};

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Key,
  FileText,
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2,
  Mic,
  Shield,
  Zap,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  ExternalLink,
  Database,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function AddVoiceModelPage() {
  const [formData, setFormData] = useState({
    accountName: "",
    voiceName: "",
    voiceId: "",
    apiKey: "",
    description: "Backup account for high-volume usage",
    category: "professional",
    accountKey: "", // For legacy migration
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [testingApiKey, setTestingApiKey] = useState(false);
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isMigrationMode, setIsMigrationMode] = useState(false);
  const [existingModels, setExistingModels] = useState<any[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Only clear error if the field is a key of Errors
    if (
      ["accountName", "voiceName", "voiceId", "apiKey", "general"].includes(
        field
      )
    ) {
      if (errors[field as keyof Errors]) {
        setErrors((prev) => ({
          ...prev,
          [field]: undefined,
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors: Errors = {};

    if (!formData.accountName.trim()) {
      newErrors.accountName = "Account name is required";
    }

    if (!formData.voiceName.trim()) {
      newErrors.voiceName = "Voice name is required";
    }

    if (!formData.voiceId.trim()) {
      newErrors.voiceId = "Voice ID is required";
    } else if (formData.voiceId.length < 10) {
      newErrors.voiceId = "Voice ID should be at least 10 characters long";
    }

    if (!formData.apiKey.trim()) {
      newErrors.apiKey = "API key is required";
    } else if (!formData.apiKey.startsWith("sk_")) {
      newErrors.apiKey = "API key should start with 'sk_'";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const testApiKey = async () => {
    if (!formData.apiKey || !formData.apiKey.startsWith("sk_")) {
      setErrors((prev) => ({
        ...prev,
        apiKey: "Please enter a valid API key first",
      }));
      return;
    }

    setTestingApiKey(true);
    setApiKeyValid(null);

    try {
      const response = await fetch(
        "https://api.elevenlabs.io/v1/user/subscription",
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "xi-api-key": formData.apiKey,
          },
        }
      );

      if (response.ok) {
        setErrors((prev) => ({
          ...prev,
          apiKey: undefined,
        }));
        setApiKeyValid(true);
      } else {
        setErrors((prev) => ({
          ...prev,
          apiKey: "Invalid API key - unable to authenticate with ElevenLabs",
        }));
        setApiKeyValid(false);
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        apiKey: "Unable to test API key - network error",
      }));
      setApiKeyValid(false);
    } finally {
      setTestingApiKey(false);
    }
  };

  const handleMigrationModeToggle = () => {
    setIsMigrationMode(!isMigrationMode);
    if (!isMigrationMode) {
      // Entering migration mode - clear form
      setFormData((prev) => ({
        ...prev,
        accountName: "",
        voiceName: "",
        voiceId: "",
        accountKey: "",
      }));
    } else {
      // Exiting migration mode - clear accountKey
      setFormData((prev) => ({
        ...prev,
        accountKey: "",
      }));
    }
    setErrors({});
  };

  const handleLegacyAccountSelect = (accountKey: string) => {
    // Legacy account profiles mapping
    const legacyProfiles: Record<string, any> = {
      account_1: {
        name: "OF Bri's voice",
        voiceName: "OF Bri",
        voiceId: "XtrZA2v40BnLkNsO4MbN",
      },
      account_2: {
        name: "OF Coco's voice",
        voiceName: "OF Coco",
        voiceId: "oT9QD0CuqG8lLK2X4bY3",
      },
      account_3: {
        name: "OF Mel's voice",
        voiceName: "OF Mel",
        voiceId: "oPCTXWLNPjuUYQCRVrwA",
      },
      // Add more as needed...
    };

    const profile = legacyProfiles[accountKey];
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        accountKey,
        accountName: profile.name,
        voiceName: profile.voiceName,
        voiceId: profile.voiceId,
      }));
    }
  };

  const addVoiceModel = async () => {
    if (!validateForm()) {
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/voice-models", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setCurrentStep(2);
      } else {
        // Handle specific field errors
        if (result.error.includes("accountKey")) {
          setErrors({
            general: "An account with this configuration already exists",
          });
        } else if (result.error.includes("voiceId")) {
          setErrors({ voiceId: "This voice ID is already in use" });
        } else if (result.error.includes("API key")) {
          setErrors({ apiKey: result.error });
        } else {
          setErrors({ general: result.error });
        }
      }
    } catch (error) {
      console.error("Error adding voice model:", error);
      setErrors({ general: "Network error - please try again" });
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setFormData({
      accountName: "",
      voiceName: "",
      voiceId: "",
      apiKey: "",
      description: "Backup account for high-volume usage",
      category: "professional",
      accountKey: "",
    });
    setErrors({});
    setIsMigrationMode(false);
  };

  // Load existing models on mount
  useEffect(() => {
    const fetchExistingModels = async () => {
      setIsLoadingModels(true);
      try {
        const response = await fetch("/api/voice-models");
        const data = await response.json();
        if (data.success) {
          setExistingModels(data.models);
        }
      } catch (error) {
        console.error("Failed to fetch existing models:", error);
      } finally {
        setIsLoadingModels(false);
      }
    };
    fetchExistingModels();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg">
              <Mic className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-pink-800 bg-clip-text text-transparent dark:from-gray-100 dark:via-purple-300 dark:to-pink-300">
                Add New Voice Model
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Configure a new ElevenLabs voice model for your application
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-purple-100 dark:border-purple-800/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total Models
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {isLoadingModels ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      existingModels.length
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-purple-100 dark:border-purple-800/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Active Models
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {existingModels.filter((m) => m.isActive).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-purple-100 dark:border-purple-800/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Categories
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {new Set(existingModels.map((m) => m.category)).size}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Progress Indicator */}
        <div className="mb-8">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-100 dark:border-purple-800/30 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Progress
              </h3>
              <Badge variant={currentStep === 1 ? "default" : "secondary"}>
                Step {currentStep} of 2
              </Badge>
            </div>

            <div className="flex items-center space-x-4">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                  currentStep >= 1
                    ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg"
                    : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                }`}
              >
                {currentStep > 1 ? <CheckCircle className="h-5 w-5" /> : "1"}
              </div>

              <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    currentStep >= 2
                      ? "w-full bg-gradient-to-r from-pink-500 to-purple-600"
                      : "w-0"
                  }`}
                />
              </div>

              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                  currentStep >= 2
                    ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg"
                    : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                }`}
              >
                {currentStep >= 2 ? <CheckCircle className="h-5 w-5" /> : "2"}
              </div>
            </div>

            <div className="flex justify-between mt-3 text-sm">
              <span
                className={`font-medium ${currentStep === 1 ? "text-purple-600 dark:text-purple-400" : "text-gray-600 dark:text-gray-400"}`}
              >
                Configure Model
              </span>
              <span
                className={`font-medium ${currentStep === 2 ? "text-purple-600 dark:text-purple-400" : "text-gray-600 dark:text-gray-400"}`}
              >
                Success
              </span>
            </div>
          </div>
        </div>

        {currentStep === 1 && (
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-lg bg-white/20">
                  <Mic className="h-6 w-6" />
                </div>
                Voice Model Configuration
              </CardTitle>
              <CardDescription className="text-pink-100">
                Enter the details for your new voice model
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {/* General Error */}
              {errors.general && (
                <Alert
                  variant="destructive"
                  className="border-red-200 bg-red-50 dark:bg-red-900/20"
                >
                  <AlertCircle className="h-5 w-5" />
                  <AlertDescription className="font-medium">
                    {errors.general}
                  </AlertDescription>
                </Alert>
              )}

              {/* Enhanced Migration Mode Toggle */}
              <div className="border-2 border-dashed border-blue-200 dark:border-blue-800 rounded-xl p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <input
                        type="checkbox"
                        id="migrationMode"
                        checked={isMigrationMode}
                        onChange={handleMigrationModeToggle}
                        className="sr-only"
                      />
                      <div
                        onClick={handleMigrationModeToggle}
                        className={`w-12 h-6 rounded-full cursor-pointer transition-all duration-200 ${
                          isMigrationMode
                            ? "bg-blue-500 shadow-lg"
                            : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-all duration-200 mt-0.5 ${
                            isMigrationMode
                              ? "translate-x-6"
                              : "translate-x-0.5"
                          }`}
                        />
                      </div>
                    </div>
                    <Label
                      htmlFor="migrationMode"
                      className="flex items-center gap-2 cursor-pointer font-semibold text-blue-800 dark:text-blue-300"
                    >
                      <Database className="h-5 w-5" />
                      Migration Mode: Move legacy account to database
                    </Label>
                  </div>
                </div>

                {isMigrationMode && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                      <div className="p-1 bg-blue-500 rounded-full">
                        <RefreshCw className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-blue-800 dark:text-blue-300 font-medium">
                          Legacy Account Migration
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                          This will migrate an existing legacy account
                          (account_1, account_2, etc.) to the database for
                          better management and security.
                        </p>
                      </div>
                    </div>

                    {existingModels.length > 0 && (
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                        <p className="text-green-800 dark:text-green-300 font-semibold mb-2 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Already Migrated Accounts:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {existingModels.map((model) => (
                            <Badge
                              key={model.id}
                              variant="secondary"
                              className="bg-green-100 text-green-800 border-green-300"
                            >
                              {model.accountKey}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Legacy Account Selection (only in migration mode) */}
              {isMigrationMode && (
                <div className="space-y-2">
                  <Label htmlFor="legacyAccount">Select Legacy Account</Label>
                  <Select
                    value={formData.accountKey}
                    onValueChange={handleLegacyAccountSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a legacy account to migrate" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        {
                          key: "account_1",
                          name: "account_1 - OF Bri's voice",
                        },
                        {
                          key: "account_2",
                          name: "account_2 - OF Coco's voice",
                        },
                        {
                          key: "account_3",
                          name: "account_3 - OF Mel's voice",
                        },
                        {
                          key: "account_4",
                          name: "account_4 - OF Lala's voice",
                        },
                        {
                          key: "account_5",
                          name: "account_5 - OF Bronwin's voice",
                        },
                        {
                          key: "account_6",
                          name: "account_6 - OF Nicole's voice",
                        },
                        {
                          key: "account_7",
                          name: "account_7 - OF Sarah's voice",
                        },
                        {
                          key: "account_8",
                          name: "account_8 - OF Carter Cameron's voice",
                        },
                        {
                          key: "account_9",
                          name: "account_9 - OF Sinatra's voice",
                        },
                        {
                          key: "account_10",
                          name: "account_10 - OF Michelle G's voice",
                        },
                      ].map((account) => {
                        const isAlreadyMigrated = existingModels.some(
                          (model) => model.accountKey === account.key
                        );
                        return (
                          <SelectItem
                            key={account.key}
                            value={account.key}
                            disabled={isAlreadyMigrated}
                          >
                            {account.name}{" "}
                            {isAlreadyMigrated && "(Already migrated)"}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {formData.accountKey &&
                    existingModels.some(
                      (model) => model.accountKey === formData.accountKey
                    ) && (
                      <p className="text-sm text-amber-600">
                        ⚠️ This account is already in the database. You can edit
                        it from the Voice Gen Accounts page instead.
                      </p>
                    )}
                </div>
              )}

              {/* Form Fields */}
              <div className="grid gap-6">
                {/* Account Name */}
                <div className="space-y-2">
                  <Label
                    htmlFor="accountName"
                    className="text-base font-semibold flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    Account Name
                  </Label>
                  <Input
                    id="accountName"
                    placeholder="e.g., OF Jessica's voice"
                    value={formData.accountName}
                    onChange={(e) =>
                      handleInputChange("accountName", e.target.value)
                    }
                    className={`${errors.accountName ? "border-red-500 focus:ring-red-500" : "focus:ring-purple-500"} transition-all`}
                    disabled={isMigrationMode && !formData.accountKey}
                  />
                  {errors.accountName && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.accountName}
                    </p>
                  )}
                </div>

                {/* Voice Name */}
                <div className="space-y-2">
                  <Label
                    htmlFor="voiceName"
                    className="text-base font-semibold flex items-center gap-2"
                  >
                    <Mic className="h-4 w-4" />
                    Voice Name
                  </Label>
                  <Input
                    id="voiceName"
                    placeholder="e.g., OF Jessica"
                    value={formData.voiceName}
                    onChange={(e) =>
                      handleInputChange("voiceName", e.target.value)
                    }
                    className={`${errors.voiceName ? "border-red-500 focus:ring-red-500" : "focus:ring-purple-500"} transition-all`}
                    disabled={isMigrationMode && !formData.accountKey}
                  />
                  {errors.voiceName && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.voiceName}
                    </p>
                  )}
                </div>

                {/* Voice ID */}
                <div className="space-y-2">
                  <Label
                    htmlFor="voiceId"
                    className="text-base font-semibold flex items-center gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    Voice ID
                  </Label>
                  <Input
                    id="voiceId"
                    placeholder="e.g., abc123def456ghi789"
                    value={formData.voiceId}
                    onChange={(e) =>
                      handleInputChange("voiceId", e.target.value)
                    }
                    className={`${errors.voiceId ? "border-red-500 focus:ring-red-500" : "focus:ring-purple-500"} transition-all font-mono`}
                    disabled={isMigrationMode && !formData.accountKey}
                  />
                  {errors.voiceId && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.voiceId}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    {isMigrationMode
                      ? "Auto-filled from legacy account"
                      : "Get this from your ElevenLabs dashboard"}
                  </p>
                </div>

                {/* API Key */}
                <div className="space-y-2">
                  <Label
                    htmlFor="apiKey"
                    className="text-base font-semibold flex items-center gap-2"
                  >
                    <Key className="h-4 w-4" />
                    ElevenLabs API Key
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="apiKey"
                        type={showApiKey ? "text" : "password"}
                        placeholder="sk_..."
                        value={formData.apiKey}
                        onChange={(e) =>
                          handleInputChange("apiKey", e.target.value)
                        }
                        className={`pr-10 ${errors.apiKey ? "border-red-500 focus:ring-red-500" : apiKeyValid ? "border-green-500 focus:ring-green-500" : "focus:ring-purple-500"} transition-all`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showApiKey ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={testApiKey}
                      disabled={testingApiKey || !formData.apiKey}
                      className={`min-w-[80px] ${
                        apiKeyValid === true
                          ? "border-green-500 text-green-700 hover:bg-green-50"
                          : apiKeyValid === false
                            ? "border-red-500 text-red-700 hover:bg-red-50"
                            : ""
                      }`}
                    >
                      {testingApiKey ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : apiKeyValid === true ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : apiKeyValid === false ? (
                        <AlertCircle className="h-4 w-4" />
                      ) : (
                        "Test"
                      )}
                    </Button>
                  </div>
                  {errors.apiKey && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.apiKey}
                    </p>
                  )}
                  {apiKeyValid === true && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      API key is valid and working!
                    </p>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Your API key will be encrypted and stored securely
                  </p>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label
                    htmlFor="category"
                    className="text-base font-semibold flex items-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Category
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      handleInputChange("category", value)
                    }
                  >
                    <SelectTrigger className="focus:ring-purple-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          Professional
                        </div>
                      </SelectItem>
                      <SelectItem value="casual">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          Casual
                        </div>
                      </SelectItem>
                      <SelectItem value="experimental">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                          Experimental
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label
                    htmlFor="description"
                    className="text-base font-semibold flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    rows={3}
                    className="focus:ring-purple-500 transition-all resize-none"
                    placeholder="Describe the purpose and use case for this voice model..."
                  />
                </div>
              </div>

              <Separator />

              {/* Add Button */}
              <Button
                onClick={addVoiceModel}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:via-purple-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Adding Voice Model...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Add Voice Model
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 text-white">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 rounded-lg bg-white/20">
                  <CheckCircle className="h-8 w-8" />
                </div>
                Voice Model Added Successfully!
              </CardTitle>
              <CardDescription className="text-green-100 text-lg">
                Your new voice model is now available in the system
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              {/* Success Summary */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-500/30 rounded-xl p-6 mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  <span className="font-bold text-green-800 dark:text-green-200 text-lg">
                    Model Configuration Complete
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      Account Name:
                    </span>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">
                      {formData.accountName}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      Voice Name:
                    </span>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">
                      {formData.voiceName}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      Voice ID:
                    </span>
                    <p className="text-gray-600 dark:text-gray-400 font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {formData.voiceId}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      Category:
                    </span>
                    <Badge variant="secondary" className="capitalize">
                      {formData.category}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* What Happens Next */}
              <div className="space-y-6">
                <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  What happens next?
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 text-white font-bold">
                      1
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        Immediately Available
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Your voice model is now available in the voice
                        generation interface and ready to use
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 text-white font-bold">
                      2
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        Secure Storage
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        API key is encrypted and stored securely in the database
                        with industry-standard protection
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700">
                    <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 text-white font-bold">
                      3
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        No Deployment Needed
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Changes are live immediately - no code changes or
                        redeployment required
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-8" />

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={resetForm}
                  className="flex-1 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:via-purple-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Add Another Model
                </Button>
                <Button
                  onClick={() =>
                    (window.location.href = "/admin/vn-sales/overview")
                  }
                  variant="outline"
                  className="flex-1 border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-900/20 font-semibold py-3 rounded-xl transition-all"
                  size="lg"
                >
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Go to Overview
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
