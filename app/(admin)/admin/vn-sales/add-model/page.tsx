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
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [isMigrationMode, setIsMigrationMode] = useState(false);
  const [existingModels, setExistingModels] = useState<any[]>([]);

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
        // You could show a success message here
        alert("API key is valid!");
      } else {
        setErrors((prev) => ({
          ...prev,
          apiKey: "Invalid API key - unable to authenticate with ElevenLabs",
        }));
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        apiKey: "Unable to test API key - network error",
      }));
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
      try {
        const response = await fetch("/api/voice-models");
        const data = await response.json();
        if (data.success) {
          setExistingModels(data.models);
        }
      } catch (error) {
        console.error("Failed to fetch existing models:", error);
      }
    };
    fetchExistingModels();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Add New Voice Model
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure a new ElevenLabs voice model for your application
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= 1
                  ? "bg-pink-500 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              1
            </div>
            <div
              className={`flex-1 h-1 ${
                currentStep >= 2 ? "bg-pink-500" : "bg-gray-200"
              }`}
            ></div>
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= 2
                  ? "bg-pink-500 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              2
            </div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Configure Model</span>
            <span>Success</span>
          </div>
        </div>

        {currentStep === 1 && (
          <Card className="shadow-lg border-pink-200 dark:border-pink-500/30">
            <CardHeader className="bg-gradient-to-r from-pink-500 to-rose-500 text-white">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Voice Model Configuration
              </CardTitle>
              <CardDescription className="text-pink-100">
                Enter the details for your new voice model
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* General Error */}
              {errors.general && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.general}</AlertDescription>
                </Alert>
              )}

              {/* Migration Mode Toggle */}
              <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="migrationMode"
                    checked={isMigrationMode}
                    onChange={handleMigrationModeToggle}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <Label
                    htmlFor="migrationMode"
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4 text-blue-600" />
                    Migration Mode: Move legacy account to database
                  </Label>
                </div>
                {isMigrationMode && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      This will migrate an existing legacy account (account_1,
                      account_2, etc.) to the database.
                    </p>
                    {existingModels.length > 0 && (
                      <div className="text-sm">
                        <p className="text-gray-700 dark:text-gray-300 font-medium">
                          Already migrated:
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {existingModels.map((model) => (
                            <span
                              key={model.id}
                              className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs"
                            >
                              {model.accountKey}
                            </span>
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

              {/* Account Name */}
              <div className="space-y-2">
                <Label htmlFor="accountName">Account Name</Label>
                <Input
                  id="accountName"
                  placeholder="e.g., OF Jessica's voice"
                  value={formData.accountName}
                  onChange={(e) =>
                    handleInputChange("accountName", e.target.value)
                  }
                  className={errors.accountName ? "border-red-500" : ""}
                  disabled={isMigrationMode && !formData.accountKey}
                />
                {errors.accountName && (
                  <p className="text-sm text-red-500">{errors.accountName}</p>
                )}
              </div>

              {/* Voice Name */}
              <div className="space-y-2">
                <Label htmlFor="voiceName">Voice Name</Label>
                <Input
                  id="voiceName"
                  placeholder="e.g., OF Jessica"
                  value={formData.voiceName}
                  onChange={(e) =>
                    handleInputChange("voiceName", e.target.value)
                  }
                  className={errors.voiceName ? "border-red-500" : ""}
                  disabled={isMigrationMode && !formData.accountKey}
                />
                {errors.voiceName && (
                  <p className="text-sm text-red-500">{errors.voiceName}</p>
                )}
              </div>

              {/* Voice ID */}
              <div className="space-y-2">
                <Label htmlFor="voiceId">Voice ID</Label>
                <Input
                  id="voiceId"
                  placeholder="e.g., abc123def456ghi789"
                  value={formData.voiceId}
                  onChange={(e) => handleInputChange("voiceId", e.target.value)}
                  className={errors.voiceId ? "border-red-500" : ""}
                  disabled={isMigrationMode && !formData.accountKey}
                />
                {errors.voiceId && (
                  <p className="text-sm text-red-500">{errors.voiceId}</p>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isMigrationMode
                    ? "Auto-filled from legacy account"
                    : "Get this from your ElevenLabs dashboard"}
                </p>
              </div>

              {/* API Key */}
              <div className="space-y-2">
                <Label htmlFor="apiKey" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  ElevenLabs API Key
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="sk_..."
                    value={formData.apiKey}
                    onChange={(e) =>
                      handleInputChange("apiKey", e.target.value)
                    }
                    className={`flex-1 ${errors.apiKey ? "border-red-500" : ""}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={testApiKey}
                    disabled={testingApiKey || !formData.apiKey}
                  >
                    {testingApiKey ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Test"
                    )}
                  </Button>
                </div>
                {errors.apiKey && (
                  <p className="text-sm text-red-500">{errors.apiKey}</p>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your ElevenLabs API key for this account
                </p>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    handleInputChange("category", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="experimental">Experimental</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  rows={3}
                />
              </div>

              {/* Add Button */}
              <Button
                onClick={addVoiceModel}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding Voice Model...
                  </>
                ) : (
                  <>
                    <User className="mr-2 h-4 w-4" />
                    Add Voice Model
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            {/* Success Message */}
            <Card className="shadow-lg border-green-200 dark:border-green-500/30">
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Voice Model Added Successfully!
                </CardTitle>
                <CardDescription className="text-green-100">
                  Your new voice model is now available in the system
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="font-semibold text-green-800 dark:text-green-200">
                      Model Configuration Complete
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Account Name:
                      </span>
                      <p className="text-gray-600 dark:text-gray-400">
                        {formData.accountName}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Voice Name:
                      </span>
                      <p className="text-gray-600 dark:text-gray-400">
                        {formData.voiceName}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Voice ID:
                      </span>
                      <p className="text-gray-600 dark:text-gray-400 font-mono text-xs">
                        {formData.voiceId}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Category:
                      </span>
                      <p className="text-gray-600 dark:text-gray-400 capitalize">
                        {formData.category}
                      </p>
                    </div>
                  </div>
                </div>

                {/* What Happens Next */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    What happens next?
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                          1
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          Immediately Available
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Your voice model is now available in the voice
                          generation interface
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                          2
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          Secure Storage
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          API key is encrypted and stored securely in the
                          database
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                          3
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          No Deployment Needed
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Changes are live immediately - no code changes or
                          redeployment required
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6">
                  <Button
                    onClick={resetForm}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Add Another Model
                  </Button>
                  <Button
                    onClick={() =>
                      (window.location.href = "/admin/vn-sales/overview")
                    }
                    variant="outline"
                    className="flex-1"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Go to Overview
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
