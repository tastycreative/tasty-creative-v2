"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useSearchParams, useRouter } from "next/navigation";
import { usePodStore, useAvailableTeams } from "@/lib/stores/podStore";
import { useBoardTasks } from "@/lib/stores/boardStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import FileUpload, { uploadAllLocalFiles, LocalFilePreview } from "@/components/ui/FileUpload";
import { TaskAttachment } from "@/lib/stores/boardStore";
import {
  FileText,
  Calendar,
  DollarSign,
  Gamepad2,
  BarChart3,
  Upload,
  Zap,
  Video,
  X,
  FileImage,
  FileVideo,
  File,
  Users,
  ArrowRight,
  Bell
} from "lucide-react";

// Import modular components
import {
  SubmissionTypeSelector,
  ContentStyleSelector,
  QuickTemplatesSection,
  ContentDetailsSection,
  TagsSection,
  TeamNotificationPreview,
  ReleaseScheduleSection,
  ContentStyleFields,
  ValidationErrors,
  SuccessMessage,
  styleTemplates,
  formTemplates,
  CONTENT_TYPE_OPTIONS,
  type ModularFormData as ImportedModularFormData,
} from "./modular-workflow";

// Helper functions for file handling (kept for backward compatibility)
const getFileIcon = (file: File) => {
  if (file.type.startsWith('image/')) return FileImage;
  if (file.type.startsWith('video/')) return FileVideo;
  return File;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Core Types (imported from modular components)
import type { SubmissionType, ContentStyle, ComponentModule, FormTemplate, Model } from "./modular-workflow";
export type { SubmissionType, ContentStyle, ComponentModule };

// Component Definitions
interface StyleTemplate {
  id: ContentStyle;
  name: string;
  description: string;
  icon: any;
  color: string;
  defaultFields: string[];
  features: string[];
}

interface ComponentDefinition {
  id: ComponentModule;
  name: string;
  description: string;
  icon: any;
  color: string;
  fields: FormFieldDefinition[];
  dependencies?: ComponentModule[];
  recommendedFor?: ContentStyle[];
  conflictsWith?: ComponentModule[];
  features: string[];
}

interface FormFieldDefinition {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'textarea' | 'select' | 'file';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

interface ModularFormData {
  submissionType: SubmissionType;
  contentStyle: ContentStyle;
  selectedComponents: ComponentModule[];
  platform: 'onlyfans' | 'fansly'; // NEW: Platform selection

  // Base fields
  model: string;
  priority: string;
  driveLink: string;
  caption?: string;

  // NEW FIELDS - Content Details
  contentType?: string;
  contentLength?: string;
  contentCount?: string;
  externalCreatorTags?: string;
  internalModelTags?: string[];

  // Team assignment fields

  // Component fields (dynamic based on selection)
  [key: string]: any;
}

// NOTE: styleTemplates now imported from modular-workflow/ContentStyleSelector

// Component Modules with Dependencies
const componentModules: ComponentDefinition[] = [
  {
    id: "release",
    name: "Release Scheduling",
    description: "Advanced release date and priority settings",
    icon: Calendar,
    color: "from-orange-500 to-red-500",
    recommendedFor: ["normal", "game", "poll", "livestream"],
    features: ["Scheduling", "Priority", "Timezone"],
    fields: [
      {
        name: "releaseDate",
        label: "Release Date",
        type: "date",
        required: true
      },
      {
        name: "releaseTime",
        label: "Release Time",
        type: "text",
        placeholder: "14:30"
      },
      {
        name: "releaseTimezone",
        label: "Timezone",
        type: "select",
        required: false,
        options: [
          { value: "UTC", label: "UTC (GMT+0)" },
          { value: "EST", label: "EST (GMT-5)" },
          { value: "CST", label: "CST (GMT-6)" },
          { value: "MST", label: "MST (GMT-7)" },
          { value: "PST", label: "PST (GMT-8)" },
          { value: "GMT", label: "GMT (GMT+0)" },
          { value: "CET", label: "CET (GMT+1)" },
          { value: "EET", label: "EET (GMT+2)" },
          { value: "JST", label: "JST (GMT+9)" },
          { value: "AEST", label: "AEST (GMT+10)" }
        ]
      },
      {
        name: "priority",
        label: "Priority Level",
        type: "select",
        options: [
          { value: "low", label: "Low" },
          { value: "normal", label: "Normal" },
          { value: "high", label: "High" },
          { value: "urgent", label: "Urgent" }
        ]
      }
    ]
  },
  {
    id: "upload",
    name: "File Uploads",
    description: "Add file attachments and media",
    icon: Upload,
    color: "from-violet-500 to-purple-500",
    recommendedFor: ["normal", "game", "poll", "livestream"],
    features: ["Media", "Attachments"],
    fields: [
      {
        name: "maxFiles",
        label: "Maximum Files",
        type: "number",
        placeholder: "5"
      },
      {
        name: "fileTypes",
        label: "Allowed File Types",
        type: "select",
        options: [
          { value: "images", label: "Images Only" },
          { value: "videos", label: "Videos Only" },
          { value: "all", label: "All Media Types" }
        ]
      }
    ]
  }
];

// NOTE: formTemplates now imported from modular-workflow/QuickTemplatesSection
// NOTE: FormTemplate interface defined in modular-workflow/types.ts

// Enhanced validation function with dependency logic
function validateFormData(data: ModularFormData): string[] {
  const errors: string[] = [];

  // Basic validation
  if (!data.submissionType) {
    errors.push("Please select a submission type (OTP or PTR)");
  }

  if (!data.contentStyle) {
    errors.push("Please select a content style");
  }

  // Required base fields
  if (!data.model) {
    errors.push("Please select a model");
  }

  if (!data.priority) {
    errors.push("Please select a priority level");
  }

  if (!data.driveLink) {
    errors.push("Please provide a Drive link");
  }

  // Check if files are uploaded (S3 attachments or local files ready for upload)
  // This validation will be handled in the component

  // PTR-specific validation
  if (data.submissionType === "ptr") {
    if (!data.selectedComponents?.includes("release")) {
      errors.push("PTR submissions require Release component for model-specified dates");
    }
  }

  // Content style specific validation
  // Removed pricing validation - pricing added by QA team later

  // Livestream specific validation
  if (data.contentStyle === "livestream") {
    if (!data.selectedComponents?.includes("upload")) {
      errors.push("Livestream content requires Upload component for stream assets");
    }
  }

  return errors;
}

// Smart recommendation system
function getSmartRecommendations(submissionType: SubmissionType, contentStyle: ContentStyle): ComponentModule[] {
  const recommendations: ComponentModule[] = [];

  // PTR always needs release component
  if (submissionType === "ptr") {
    recommendations.push("release");
  }

  // Content style specific recommendations
  switch (contentStyle) {
    case "game":
      recommendations.push("upload");
      break;
    case "poll":
      recommendations.push("upload");
      break;
    case "livestream":
      recommendations.push("upload");
      break;
    case "normal":
      recommendations.push("upload");
      break;
  }

  return [...new Set(recommendations)]; // Remove duplicates
}

export default function ModularWorkflowForm() {
  const router = useRouter();
  const { fetchTasks } = useBoardTasks();

  const { register, control, handleSubmit, formState: { errors }, setValue, getValues, watch } = useForm<ModularFormData>({
    mode: "onChange",
    defaultValues: {
      submissionType: "otp",
      contentStyle: "normal",
      selectedComponents: [],
      platform: "onlyfans", // Default to OnlyFans
      model: "",
      priority: "normal",
      driveLink: "",
      caption: ""
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  // S3 file upload state
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [localFiles, setLocalFiles] = useState<LocalFilePreview[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  // Team integration
  const searchParams = useSearchParams();
  const { selectedTeamId } = usePodStore();
  const { teams: availableTeams } = useAvailableTeams();

  const submissionType = useWatch({ control, name: "submissionType" });
  const contentStyle = useWatch({ control, name: "contentStyle" });
  const selectedComponents = useWatch({ control, name: "selectedComponents" }) || [];
  const platform = useWatch({ control, name: "platform" });

  // Get smart recommendations
  const smartRecommendations = getSmartRecommendations(submissionType, contentStyle);

  // Get current team info
  const currentTeam = availableTeams.find(team => team.id === selectedTeamId);
  const teamParam = searchParams?.get("team");

  // Get workflow routing preview
  const getWorkflowRouting = (contentStyle: ContentStyle, submissionType: SubmissionType) => {
    const routes = [];

    // Primary team (current selection)
    if (currentTeam) {
      routes.push({ name: currentTeam.name, type: 'primary' });
    }

    // Content style specific routing
    switch (contentStyle) {
      case 'normal':
        routes.push({ name: 'Caption Team', type: 'secondary' });
        routes.push({ name: 'Posting Team', type: 'secondary' });
        routes.push({ name: 'Chatting Team', type: 'secondary' });
        break;
      case 'game':
        routes.push({ name: 'Game Setup Team', type: 'secondary' });
        routes.push({ name: 'Caption Team', type: 'secondary' });
        routes.push({ name: 'Posting Team', type: 'secondary' });
        routes.push({ name: 'Engagement Team', type: 'secondary' });
        break;
      case 'poll':
        routes.push({ name: 'Question Design Team', type: 'secondary' });
        routes.push({ name: 'Posting Team', type: 'secondary' });
        routes.push({ name: 'Results Analysis Team', type: 'secondary' });
        break;
      case 'livestream':
        routes.push({ name: 'Stream Setup Team', type: 'secondary' });
        routes.push({ name: 'Technical Team', type: 'secondary' });
        routes.push({ name: 'Promotion Team', type: 'secondary' });
        routes.push({ name: 'Live Management Team', type: 'secondary' });
        break;
    }

    return routes;
  };

  // Fetch models from API
  useEffect(() => {
    const fetchModels = async () => {
      setLoadingModels(true);
      try {
        const response = await fetch("/api/models");
        const data = await response.json();
        if (Array.isArray(data.models)) {
          // Filter out duplicate model names to prevent key conflicts
          const uniqueModels = data.models.filter((model: Model, index: number, arr: Model[]) =>
            arr.findIndex((m: Model) => m.name === model.name) === index
          );
          setModels(uniqueModels);
        }
      } catch (error) {
        console.error("Error fetching models:", error);
        setValidationErrors(prev => [...prev, "Failed to load models. Please try again."]);
      } finally {
        setLoadingModels(false);
      }
    };

    fetchModels();
  }, []);

  // Auto-apply smart recommendations when submission type or content style changes
  useEffect(() => {
    const currentComponents = getValues("selectedComponents") || [];

    // Auto-add critical recommendations (like PTR requiring release)
    if (submissionType === "ptr" && !currentComponents.includes("release")) {
      setValue("selectedComponents", [...currentComponents, "release"]);
    }
  }, [submissionType, contentStyle, setValue, getValues]);

  // Validate form data
  const validateFormData = (data: ModularFormData): string[] => {
    const errors: string[] = [];

    // Required fields validation
    if (!data.model || data.model === '') {
      errors.push('Please select a model');
    }

    if (!data.submissionType) {
      errors.push('Please select a submission type (OTP or PTR)');
    }

    if (!data.contentStyle) {
      errors.push('Please select a content style');
    }

    // PTR specific validation
    if (data.submissionType === 'ptr') {
      if (!data.releaseDate) {
        errors.push('Release date is required for PTR submissions');
      }
    }

    // Component-specific validations
    // Removed pricing validation - pricing added by QA team later

    if (data.selectedComponents?.includes('release')) {
      if (!data.priority) {
        errors.push('Please select a priority level');
      }
    }

    return errors;
  };

  const onSubmit = async (data: ModularFormData) => {
    // Validate form data
    const validationErrors = validateFormData(data);

    // File upload is optional - matching OTP/PTR behavior
    // Files can be attached but are not required for submission

    // Validate team selection
    if (!selectedTeamId) {
      validationErrors.push("Please select a team from the URL or team selector");
    }

    if (validationErrors.length > 0) {
      setValidationErrors(validationErrors);
      return;
    }

    setValidationErrors([]);
    setIsSubmitting(true);

    try {
      // First, upload any local files to S3
      if (localFiles.length > 0) {
        console.log('📤 Uploading local files to S3...');
        await uploadAllLocalFiles(localFiles, attachments, setAttachments, setLocalFiles);
      }

      console.log('📋 Creating modular workflow...');
      // Prepare modular workflow data
      const workflowPayload = {
        submissionType: data.submissionType,
        contentStyle: data.contentStyle,
        selectedComponents: data.selectedComponents || [],
        platform: data.platform, // NEW: Include platform selection
        componentData: {
          // NEW FIELDS - Content Details
          contentType: data.contentType,
          contentLength: data.contentLength,
          contentCount: data.contentCount,
          externalCreatorTags: data.externalCreatorTags,
          internalModelTags: data.internalModelTags,
          // Collect all component-specific data
          ...(data.selectedComponents?.includes('release') && {
            releaseDate: data.releaseDate,
            releaseTime: data.releaseTime,
            releaseTimezone: data.releaseTimezone,
            priority: data.priority
          }),
          ...(data.selectedComponents?.includes('upload') && {
            maxFiles: data.maxFiles,
            fileTypes: data.fileTypes
          }),
          // Style-specific data
          ...(data.contentStyle === 'game' && {
            gameType: data.gameType,
            gameRules: data.gameRules
          }),
          ...(data.contentStyle === 'poll' && {
            pollQuestion: data.pollQuestion,
            pollOptions: data.pollOptions
          }),
          ...(data.contentStyle === 'livestream' && {
            streamTitle: data.streamTitle,
            streamDescription: data.streamDescription,
            scheduledTime: data.scheduledTime
          })
        },
        workflowTemplate: undefined, // Will add template support later

        // Base fields
        modelName: data.model,
        priority: data.priority,
        driveLink: data.driveLink,
        contentDescription: data.caption || `${contentStyle.charAt(0).toUpperCase() + contentStyle.slice(1)} submission with ${selectedComponents.length} components`,

        // File attachments (S3 uploaded files)
        attachments: attachments,

        // Team assignment - NOTE: Don't send teamId to allow platform-based routing
        // The API will determine the correct team based on platform selection
        // teamId: selectedTeamId,
        // teamAssignments: {
        //   primaryTeamId: selectedTeamId,
        //   additionalTeamIds: [],
        //   assignmentMethod: 'automatic',
        //   assignedAt: new Date().toISOString()
        // },
        estimatedDuration: undefined // Can be calculated based on components
      };

      console.log('🚀 Submitting modular workflow:', workflowPayload);

      const response = await fetch('/api/modular-workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflowPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create workflow');
      }

      console.log('✅ Workflow created successfully:', result);

      setIsSubmitting(false);
      setIsSubmitted(true);
      setSubmissionResult(result);

      // Show success with task details
      setValidationErrors([]);

      // Force refresh board tasks for the team where the task was created
      const createdTeamId = result.task.teamId;
      if (createdTeamId) {
        // Force refresh with forceRefresh=true to bypass cache
        fetchTasks(createdTeamId, true).then(() => {
          console.log(`✅ Board tasks refreshed for team ${result.task.teamName}`);
        }).catch((e) => {
          console.log('⚠️ Could not refresh board tasks:', e);
        });
      }

      // Reset form after success and optionally navigate to board
      setTimeout(() => {
        setIsSubmitted(false);
        setSubmissionResult(null);
        // Reset form fields
        setValue('caption', '');
        setValue('model', '');
        setValue('driveLink', '');
        setAttachments([]);
        setLocalFiles([]);

        // Navigate to board to see the new task
        if (selectedTeamId && result.task?.id) {
          router.push(`/board?team=${selectedTeamId}`);
        }
      }, 3000);

    } catch (error) {
      console.error('❌ Error submitting workflow:', error);
      setIsSubmitting(false);
      setValidationErrors([
        error instanceof Error ? error.message : 'Failed to create workflow. Please try again.'
      ]);
    }
  };

  const toggleComponent = (componentId: ComponentModule) => {
    const current = selectedComponents || [];
    const isSelected = current.includes(componentId);

    if (isSelected) {
      setValue("selectedComponents", current.filter(id => id !== componentId));
    } else {
      setValue("selectedComponents", [...current, componentId]);
    }
  };

  // All helper functions now replaced by modular components

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-2xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <CardHeader className="space-y-6 pb-8">
        <div className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
            Modular Workflow Form
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Create dynamic content with intelligent component suggestions
          </p>
        </div>

        {/* Template Quick Actions */}
        <QuickTemplatesSection setValue={setValue} />

        {/* Team Assignment Context */}
        {currentTeam && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center mt-0.5">
                <Users className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Workflow Assignment</h4>
                <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 mb-3">
                  <span>Primary assignment:</span>
                  <span className="font-semibold bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                    {currentTeam.name}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                  <span className="text-xs bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded">
                    Will be notified first
                  </span>
                </div>

                {/* PGT Team Notification Preview - Always shown */}
                <TeamNotificationPreview />

                {/* Workflow routing preview */}
                {contentStyle && contentStyle !== 'normal' && (
                  <div className="mt-3 p-3 bg-blue-100/50 dark:bg-blue-900/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                    <h5 className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-2">
                      {submissionType === 'ptr' ? 'PTR' : 'OTP'} + {contentStyle.charAt(0).toUpperCase() + contentStyle.slice(1)} Workflow:
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {getWorkflowRouting(contentStyle, submissionType).map((route, index) => (
                        <span
                          key={index}
                          className={`text-xs px-2 py-1 rounded ${
                            route.type === 'primary'
                              ? 'bg-blue-600 text-white font-medium'
                              : 'bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300'
                          }`}
                        >
                          {route.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  {submissionType === 'ptr' ? '🔥 High Priority - PTR deadlines enforced' : '📋 Standard workflow routing'}
                </p>
              </div>
            </div>

          </div>
        )}

        {/* Success Message */}
        {isSubmitted && submissionResult && <SuccessMessage result={submissionResult} />}

        {/* Validation Errors */}
        <ValidationErrors errors={validationErrors} />
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Step 0: Platform Selection */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                0
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Select Platform
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-11">
              {[
                { id: 'onlyfans', name: 'OnlyFans', color: 'from-blue-500 to-cyan-500' },
                { id: 'fansly', name: 'Fansly', color: 'from-purple-500 to-pink-500' }
              ].map((plat) => (
                <div
                  key={plat.id}
                  className={`relative rounded-lg border p-4 shadow-sm transition-all cursor-pointer hover:shadow-md ${
                    platform === plat.id
                      ? "border-pink-300 bg-pink-50 dark:border-pink-600 dark:bg-pink-950"
                      : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800"
                  }`}
                  onClick={() => setValue("platform", plat.id as 'onlyfans' | 'fansly')}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="platform"
                      value={plat.id}
                      checked={platform === plat.id}
                      onChange={() => setValue("platform", plat.id as 'onlyfans' | 'fansly')}
                      className="h-4 w-4"
                    />
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${plat.color} flex items-center justify-center`}>
                      <span className="text-white font-bold text-xs">{plat.name.substring(0, 2)}</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{plat.name}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {plat.id === 'onlyfans' ? 'Team: OTP-PTR' : 'Team: OTP-Fansly'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Submission Type */}
          <SubmissionTypeSelector register={register} currentValue={submissionType} />

          {/* Step 2: Content Style */}
          <ContentStyleSelector register={register} currentValue={contentStyle} />

          {/* Step 3: Component Modules */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-pink-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Add Component Modules
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                (Optional - enhance your content with additional features)
              </span>
            </div>

            {/* Smart Recommendations Alert */}
            {smartRecommendations.length > 0 && (
              <div className="ml-11 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5">💡</div>
                  <div>
                    <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-1">Smart Recommendations</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Based on your selections, we recommend: {smartRecommendations.map(comp =>
                        componentModules.find(c => c.id === comp)?.name
                      ).join(", ")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-11">
              {componentModules.map((component) => {
                const isSelected = selectedComponents.includes(component.id);
                const isRecommended = smartRecommendations.includes(component.id);
                const isRecommendedForStyle = component.recommendedFor?.includes(contentStyle);

                return (
                  <div
                    key={component.id}
                    className={`relative rounded-lg border p-4 shadow-sm transition-all cursor-pointer hover:shadow-md ${
                      isSelected
                        ? "border-pink-300 bg-pink-50 dark:border-pink-600 dark:bg-pink-950"
                        : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800"
                    }`}
                    onClick={() => toggleComponent(component.id)}
                  >
                    {/* Recommendation badges */}
                    <div className="absolute -top-2 -right-2 flex gap-1">
                      {isRecommended && (
                        <span className="bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm">
                          ⭐ Smart Pick
                        </span>
                      )}
                      {isRecommendedForStyle && !isRecommended && (
                        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm">
                          💎 Recommended
                        </span>
                      )}
                    </div>

                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <component.icon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {component.name}
                          </h4>
                        </div>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {component.description}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {component.features.map((feature, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-300"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="ml-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleComponent(component.id)}
                          className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500 dark:border-gray-600 dark:bg-gray-700"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 4: Base Fields (Always Required) */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                4
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Required Details
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 ml-11">
              {/* Row 1: Model, Priority, Drive Link */}
              <div>
                <Label htmlFor="model" className="block mb-2 font-medium">Model *</Label>
                <Select onValueChange={(value) => setValue("model", value)} disabled={loadingModels}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingModels ? "Loading models..." : "Select model..."} />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    side="bottom"
                    align="start"
                    sideOffset={4}
                    className="max-h-[300px] overflow-y-auto"
                    avoidCollisions={false}
                  >
                    {models.map((model, index) => (
                      <SelectItem key={`model-${index}`} value={model.name}>
                        <div className="flex items-center justify-between w-full">
                          <span>{model.name}</span>
                          {model.status && (
                            <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                              model.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {model.status}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.model && (
                  <p className="text-red-500 text-sm mt-1">Model selection is required</p>
                )}
                {loadingModels && (
                  <p className="text-gray-500 text-sm mt-1">Fetching available models...</p>
                )}
              </div>

              <div>
                <Label htmlFor="priority" className="block mb-2 font-medium">Priority *</Label>
                <Select onValueChange={(value) => setValue("priority", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                {errors.priority && (
                  <p className="text-red-500 text-sm mt-1">Priority selection is required</p>
                )}
              </div>

              <div>
                <Label htmlFor="driveLink" className="block mb-2 font-medium">Drive Link *</Label>
                <Input
                  id="driveLink"
                  type="url"
                  placeholder="https://drive.google.com/..."
                  {...register("driveLink", { required: "Drive link is required" })}
                />
                {errors.driveLink && (
                  <p className="text-red-500 text-sm mt-1">{String(errors.driveLink.message)}</p>
                )}
              </div>

              {/* Row 2: Content Type, Content Length, Content Count */}
              <ContentDetailsSection register={register} setValue={setValue} />
            </div>

            <div className="ml-11 space-y-4">
              <div>
                <Label htmlFor="caption" className="block mb-2 font-medium">Caption/Description</Label>
                <Textarea
                  id="caption"
                  placeholder="Add a caption or description for your content..."
                  {...register("caption")}
                  rows={3}
                />
              </div>

              {/* Tags Section - Split into External and Internal */}
              <TagsSection register={register} setValue={setValue} watch={watch} models={models} />

              <div>
                <Label className="block mb-2 font-medium">
                  Reference Images (screenshots from OF vault)
                </Label>
                <FileUpload
                  attachments={attachments}
                  onAttachmentsChange={setAttachments}
                  localFiles={localFiles}
                  onLocalFilesChange={setLocalFiles}
                  uploadOnSubmit={true}
                  maxFiles={10}
                  maxFileSize={50}
                  acceptedTypes={[
                    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
                    'video/mp4', 'video/mov', 'video/avi', 'video/mkv',
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                  ]}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Max 10 files, 50MB each. NOT actual content (that's in Drive Link). These are reference screenshots from OF vault for context.
                </p>
              </div>
            </div>
          </div>

          {/* Style-specific fields */}
          {contentStyle !== "normal" && (
            <ContentStyleFields contentStyle={contentStyle} register={register} />
          )}

          {/* Component-specific fields */}
          {selectedComponents.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {contentStyle !== "normal" ? 6 : 5}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Component Configuration
                </h3>
              </div>
              <div className="ml-11 space-y-6">
                {selectedComponents.includes("upload") && (
                  <div>
                    <Label className="block mb-2 font-medium">Additional File Attachments</Label>
                    <div className="border-2 border-dashed border-purple-300 dark:border-purple-600 rounded-lg p-4 text-center bg-purple-50 dark:bg-purple-950/20">
                      <Upload className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                      <p className="text-sm text-purple-700 dark:text-purple-300 mb-1">
                        Additional files for enhanced content
                      </p>
                      <p className="text-xs text-purple-600 dark:text-purple-400">
                        Supplementary materials, thumbnails, or bonus content
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2 border-purple-300 text-purple-700 hover:bg-purple-100"
                        onClick={() => {
                          // This could trigger another file upload instance
                          // For now, just show a placeholder
                        }}
                      >
                        Add Supplementary Files
                      </Button>
                    </div>
                  </div>
                )}

                {selectedComponents.includes("release") && (
                  <ReleaseScheduleSection register={register} setValue={setValue} watch={watch} />
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-center pt-6">
            <Button
              type="submit"
              disabled={isSubmitting || isSubmitted}
              className="bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 hover:from-pink-700 hover:via-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating Workflow...
                </>
              ) : isSubmitted ? (
                <>
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Workflow Created & Task Assigned!
                </>
              ) : (
                "Create Workflow"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}