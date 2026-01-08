"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { usePodStore, useAvailableTeams } from "@/lib/stores/podStore";
import { useBoardTasks } from "@/lib/stores/boardStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import FileUpload, {
  uploadAllLocalFiles,
  LocalFilePreview,
} from "@/components/ui/FileUpload";
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
  Check,
  ChevronLeft,
  ChevronRight,
  Save,
  HelpCircle,
  Sparkles,
  Clock,
  Users,
  ArrowRight,
  Star,
  TrendingUp,
  Package,
  Layers,
  Eye,
  Play,
  BookOpen,
  Command,
  Info,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CONTENT_TAGS } from "@/lib/constants/contentTags";
import { MultiSelect } from "@/components/ui/multi-select";
import Link from "next/link";

// Core Types
export type SubmissionType = "otp" | "ptr";
export type ContentStyle = "normal" | "poll" | "game" | "ppv" | "bundle";
export type ComponentModule = "pricing" | "release" | "upload";
export type Platform = "onlyfans" | "fansly";

// Workflow Routing Helper
function getWorkflowRouting(
  contentStyle: ContentStyle | undefined,
  submissionType: SubmissionType | undefined
) {
  // Standard workflow for all content types
  const standardWorkflow = [
    { name: "Content Team", type: "primary" },
    { name: "PGT", type: "secondary" },
    { name: "Flyer Team", type: "secondary" },
    { name: "OTP Manager/QA", type: "secondary" },
    { name: "Posted", type: "final" },
  ];

  // Return standard workflow for all cases
  // The actual workflow columns are created server-side based on contentStyle
  return standardWorkflow;
}

// Form Data Interface
interface ModularFormData {
  submissionType: SubmissionType;
  contentStyle: ContentStyle;
  selectedComponents: ComponentModule[];
  platform: Platform; // NEW: OnlyFans or Fansly

  // Base fields
  model: string;
  priority: string;
  driveLink: string;
  caption?: string;
  pricingCategory?: string; // NEW: CHEAP_PORN, EXPENSIVE_PORN, GF_ACCURATE

  // Content Details fields (NEW)
  contentType?: string;
  contentLength?: string;
  contentCount?: string;

  // Tags fields
  contentTags?: string[];
  externalCreatorTags?: string;
  internalModelTags?: string[];

  // PPV/Bundle specific fields
  originalPollReference?: string;

  // Component fields (dynamic)
  [key: string]: any;
}

// Template System
interface FormTemplate {
  id: string;
  name: string;
  description: string;
  submissionType: SubmissionType;
  contentStyle: ContentStyle;
  components: ComponentModule[];
  icon: any;
  color: string;
  popularity: number;
  estimatedTime: string;
  tags: string[];
}

// Wizard Steps Configuration
const WIZARD_STEPS = [
  // { id: 'templates', title: 'Choose Template', icon: Layers, description: 'Start with a template or from scratch' }, // Commented out - skipping template selection
  {
    id: "type",
    title: "Submission Type",
    icon: Package,
    description: "Select OTP or PTR submission",
  },
  {
    id: "style",
    title: "Content Style",
    icon: Sparkles,
    description: "Choose your content format",
  },
  {
    id: "details",
    title: "Content Details",
    icon: FileText,
    description: "Add your content information",
  },
  {
    id: "review",
    title: "Review & Submit",
    icon: Check,
    description: "Final review before submission",
  },
];

// Enhanced Templates with Metadata
const formTemplates: FormTemplate[] = [
  // OTP Templates (Regular Wall Posts)
  {
    id: "otp-normal",
    name: "Standard Wall Post",
    description: "Regular wall content like Instagram",
    submissionType: "otp",
    contentStyle: "normal",
    components: ["upload"],
    icon: FileText,
    color: "from-blue-500 to-purple-500",
    popularity: 90,
    estimatedTime: "2 min",
    tags: ["wall", "standard", "regular"],
  },
  {
    id: "otp-poll",
    name: "Poll Wall Post",
    description: "Fan engagement polls on wall",
    submissionType: "otp",
    contentStyle: "poll",
    components: ["upload"],
    icon: BarChart3,
    color: "from-green-500 to-cyan-500",
    popularity: 75,
    estimatedTime: "3 min",
    tags: ["poll", "engagement", "interactive"],
  },
  {
    id: "otp-game",
    name: "Game Wall Post",
    description: "Interactive tip games on wall",
    submissionType: "otp",
    contentStyle: "game",
    components: ["pricing", "upload"],
    icon: Gamepad2,
    color: "from-pink-500 to-rose-500",
    popularity: 70,
    estimatedTime: "4 min",
    tags: ["game", "tips", "interactive"],
  },
  // PTR Templates (Model-Requested Dates)
  {
    id: "ptr-ppv",
    name: "PPV Release",
    description: "Pay-per-view content - 1 tape",
    submissionType: "ptr",
    contentStyle: "ppv",
    components: ["release", "pricing", "upload"],
    icon: DollarSign,
    color: "from-purple-500 to-pink-500",
    popularity: 85,
    estimatedTime: "3 min",
    tags: ["ppv", "premium", "scheduled"],
  },
  {
    id: "ptr-game",
    name: "Scheduled Game",
    description: "Interactive tip game with model deadline",
    submissionType: "ptr",
    contentStyle: "game",
    components: ["release", "pricing", "upload"],
    icon: Gamepad2,
    color: "from-pink-500 to-rose-500",
    popularity: 75,
    estimatedTime: "4 min",
    tags: ["game", "scheduled", "interactive"],
  },
  {
    id: "ptr-bundle",
    name: "Content Bundle",
    description: "Multiple content pieces bundled",
    submissionType: "ptr",
    contentStyle: "bundle",
    components: ["release", "pricing", "upload"],
    icon: Package,
    color: "from-orange-500 to-red-500",
    popularity: 80,
    estimatedTime: "4 min",
    tags: ["bundle", "collection", "scheduled"],
  },
];

// Style Templates Configuration with submission type filtering
const styleTemplates = [
  // All content styles work with both OTP and PTR
  // OTP = flexible scheduling, PTR = model-requested deadline
  {
    id: "normal" as ContentStyle,
    name: "Wall Post",
    description: "Regular wall content like Instagram posts",
    icon: FileText,
    color: "from-blue-500 to-purple-500",
    preview: "📝 Standard wall posts and updates",
    teams: ["Content Team", "PGT", "Flyer Team", "OTP Manager/QA"],
    priority: false,
    submissionTypes: ["otp", "ptr"] as SubmissionType[],
  },
  {
    id: "poll" as ContentStyle,
    name: "Poll Post",
    description: "Fan engagement polls on wall",
    icon: BarChart3,
    color: "from-green-500 to-cyan-500",
    preview: "📊 Interactive polls for engagement",
    teams: ["Content Team", "PGT", "Flyer Team", "OTP Manager/QA"],
    priority: false,
    submissionTypes: ["otp", "ptr"] as SubmissionType[],
  },
  {
    id: "game" as ContentStyle,
    name: "Game Post",
    description: "Interactive tip games",
    icon: Gamepad2,
    color: "from-pink-500 to-rose-500",
    preview: "🎮 Gamified tipping experiences",
    teams: ["Content Team", "PGT", "Flyer Team", "OTP Manager/QA"],
    priority: false,
    submissionTypes: ["otp", "ptr"] as SubmissionType[],
  },
  // Premium content styles (work with both OTP and PTR)
  {
    id: "ppv" as ContentStyle,
    name: "PPV (Pay Per View)",
    description: "Viewers pay to unlock content - 1 tape",
    icon: DollarSign,
    color: "from-purple-500 to-pink-500",
    preview: "💰 Premium locked content",
    teams: ["Content Team", "PGT", "Flyer Team", "OTP Manager/QA"],
    priority: true,
    submissionTypes: ["otp", "ptr"] as SubmissionType[],
  },
  {
    id: "bundle" as ContentStyle,
    name: "Bundle",
    description: "Bundled content collection",
    icon: Package,
    color: "from-orange-500 to-red-500",
    preview: "📦 Multiple content pieces bundled",
    teams: ["Content Team", "PGT", "Flyer Team", "OTP Manager/QA"],
    priority: true,
    submissionTypes: ["otp", "ptr"] as SubmissionType[],
  },
];

// Component Modules Configuration
const componentModules = [
  {
    id: "pricing" as ComponentModule,
    name: "Pricing",
    description: "Add monetization tiers",
    icon: DollarSign,
    color: "from-green-500 to-emerald-500",
    recommended: ["game", "livestream"],
    required: false,
    features: ["Revenue", "Tiers", "Premium"],
    estimatedTime: "+1 min",
  },
  {
    id: "release" as ComponentModule,
    name: "Release Schedule",
    description: "Set specific timing",
    icon: Calendar,
    color: "from-orange-500 to-red-500",
    recommended: ["ptr"],
    required: false,
    features: ["Scheduled", "Priority", "Timed"],
    estimatedTime: "+30 sec",
  },
  {
    id: "upload" as ComponentModule,
    name: "File Upload",
    description: "Attach media files",
    icon: Upload,
    color: "from-violet-500 to-purple-500",
    recommended: ["normal", "game", "poll", "livestream"],
    required: false,
    features: ["Media", "Attachments", "Files"],
    estimatedTime: "+2 min",
  },
];

export default function ModularWorkflowWizard() {
  const router = useRouter();
  const { fetchTasks } = useBoardTasks();
  const { selectedTeamId, setSelectedTeamId } = usePodStore();
  const { teams: availableTeams } = useAvailableTeams();

  // Form Management
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
    watch,
  } = useForm<ModularFormData>({
    mode: "onChange",
    defaultValues: {
      submissionType: "otp",
      contentStyle: "normal",
      selectedComponents: [],
      platform: "onlyfans", // Default to OnlyFans
      model: "",
      priority: "normal",
      driveLink: "",
      caption: "",
      pricingCategory: "EXPENSIVE_PORN", // Default pricing tier
    },
  });

  // Wizard State
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState<string>("");
  const [showHelp, setShowHelp] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(
    null
  );
  const [draftSaved, setDraftSaved] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState("3 min");

  // File Management
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [localFiles, setLocalFiles] = useState<LocalFilePreview[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [internalModels, setInternalModels] = useState<any[]>([]);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [selectedInternalModels, setSelectedInternalModels] = useState<
    string[]
  >([]);
  const [contentTypeOptions, setContentTypeOptions] = useState<
    Array<{
      id: string;
      value: string;
      label: string;
      category: string;
      priceType?: string;
      priceFixed?: number;
      priceMin?: number;
      priceMax?: number;
      description?: string;
    }>
  >([]);
  const [loadingContentTypes, setLoadingContentTypes] = useState(true);
  const [selectedContentTypeOption, setSelectedContentTypeOption] = useState<{
    id: string;
    value: string;
    label: string;
    category: string;
    priceType?: string;
    priceFixed?: number;
    priceMin?: number;
    priceMax?: number;
  } | null>(null);

  // Watch form values
  const submissionType = watch("submissionType");
  const contentStyle = watch("contentStyle");
  const selectedComponents = watch("selectedComponents") || [];
  const platform = watch("platform");
  const pricingCategory = watch("pricingCategory");

  // Get current team
  const currentTeam = availableTeams.find((team) => team.id === selectedTeamId);
  // Compute preview team name based on selected platform (ui-only preview)
  const previewTeamName = platform === 'fansly' ? 'OTP-Fansly' : 'OTP-PTR';

  // Auto-select appropriate team when platform changes (best-effort)
  useEffect(() => {
    if (!availableTeams || availableTeams.length === 0) return;

    // prefer explicit Fansly team when platform === 'fansly'
    if (platform === 'fansly') {
      const fanslyTeam = availableTeams.find((t) => /fansly/i.test(t.name));
      if (fanslyTeam && selectedTeamId !== fanslyTeam.id) {
        console.log('🎯 Auto-selecting Fansly team:', fanslyTeam.id, fanslyTeam.name);
        setSelectedTeamId(fanslyTeam.id);
      }
      return;
    }

    // For onlyfans or default, choose OTP-PTR-like team
    const ptrTeam = availableTeams.find((t) => /otp-?ptr|ptr|onlyfans/i.test(t.name));
    if (ptrTeam && selectedTeamId !== ptrTeam.id) {
      console.log('🎯 Auto-selecting PTR team:', ptrTeam.id, ptrTeam.name);
      setSelectedTeamId(ptrTeam.id);
    }
  }, [platform, availableTeams, selectedTeamId, setSelectedTeamId]);

  // Calculate progress
  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100;

  // Content style compatibility check (all styles now work with both OTP and PTR)
  // Removed auto-reset logic - PPV/Bundle now available for both submission types

  // Load models from client-models API
  useEffect(() => {
    const fetchModels = async () => {
      setLoadingModels(true);
      try {
        const response = await fetch("/api/client-models");
        const data = await response.json();
        if (data.success && Array.isArray(data.clientModels)) {
          // Map client models to the format expected by the form
          const uniqueModels = data.clientModels
            .filter((model: any) => model.status?.toLowerCase() !== 'dropped') // Filter out dropped models
            .map((model: any) => ({
              name: model.clientName || model.name, // Use clientName which is the actual field from API
              profile: model.url || '',
              status: model.status || 'active'
            }))
            .filter(
              (model: any, index: number, arr: any[]) =>
                arr.findIndex((m: any) => m.name === model.name) === index
            );
          setModels(uniqueModels);
        }
      } catch (error) {
        console.error("Error fetching models:", error);
        toast.error("Failed to load models");
      } finally {
        setLoadingModels(false);
      }
    };
    fetchModels();
  }, []);

  // Load internal models from database
  useEffect(() => {
    const fetchInternalModels = async () => {
      try {
        const response = await fetch("/api/client-models");
        const data = await response.json();
        if (data.success && Array.isArray(data.clientModels)) {
          setInternalModels(data.clientModels);
        }
      } catch (error) {
        console.error("Error fetching internal models:", error);
      }
    };
    fetchInternalModels();
  }, []);

  // Function to fetch content type options (extracted for reuse with refresh button)
  const fetchContentTypeOptions = useCallback(async () => {
    setLoadingContentTypes(true);
    try {
      const category = pricingCategory || "EXPENSIVE_PORN";
      const url = `/api/content-type-options?category=${encodeURIComponent(category)}`;

      const response = await fetch(url);
      const data = await response.json();
      if (data.success && Array.isArray(data.contentTypeOptions)) {
        setContentTypeOptions(data.contentTypeOptions);
        console.log(`📊 Loaded ${data.contentTypeOptions.length} content types for category: ${category}`);
      }
    } catch (error) {
      console.error("Error fetching content type options:", error);
      toast.error("Failed to load content type options");
    } finally {
      setLoadingContentTypes(false);
    }
  }, [pricingCategory]);

  // Load content type options from database (refetch when pricing category changes)
  useEffect(() => {
    fetchContentTypeOptions();
  }, [fetchContentTypeOptions]);

  // Auto-save draft functionality
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      if (currentStep > 0) {
        saveDraft();
      }
    }, 2000);
    return () => clearTimeout(saveTimer);
  }, [submissionType, contentStyle, selectedComponents]);

  // Save draft to localStorage
  const saveDraft = useCallback(() => {
    const formData = getValues();
    localStorage.setItem(
      "workflow_draft",
      JSON.stringify({
        ...formData,
        currentStep,
        savedAt: new Date().toISOString(),
      })
    );
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2000);
  }, [getValues, currentStep]);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem("workflow_draft");
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        const savedTime = new Date(parsed.savedAt);
        const hoursSince =
          (Date.now() - savedTime.getTime()) / (1000 * 60 * 60);

        if (hoursSince < 24) {
          toast.info("Draft restored from " + savedTime.toLocaleTimeString(), {
            action: {
              label: "Clear",
              onClick: () => {
                localStorage.removeItem("workflow_draft");
                window.location.reload();
              },
            },
          });

          Object.keys(parsed).forEach((key) => {
            if (key !== "currentStep" && key !== "savedAt") {
              setValue(key as any, parsed[key]);
            }
          });

          if (parsed.currentStep) {
            setCurrentStep(parsed.currentStep);
          }
        }
      } catch (e) {
        console.error("Failed to load draft:", e);
      }
    }
  }, [setValue]);

  // Calculate estimated time
  useEffect(() => {
    let baseTime = 2;
    // Content style specific time adjustments
    // Note: 'urgent' is not a valid ContentStyle, removing this condition
    if (contentStyle === "game") baseTime += 2;
    if (contentStyle === "ppv") baseTime += 2;
    if (contentStyle === "poll") baseTime += 1;

    // Component specific time adjustments
    selectedComponents.forEach((comp) => {
      if (comp === "pricing") baseTime += 1;
      if (comp === "upload") baseTime += 2;
      if (comp === "release") baseTime += 0.5;
    });
    setEstimatedTime(`${Math.ceil(baseTime)} min`);
  }, [contentStyle, selectedComponents]);

  // Smart recommendations
  const getSmartRecommendations = useCallback(
    (type: SubmissionType, style: ContentStyle) => {
      const recommendations: ComponentModule[] = [];

      // PTR types always get release schedule
      if (type === "ptr") recommendations.push("release");

      // Style-specific recommendations
      switch (style) {
        // Removed 'urgent' case as it's not a valid ContentStyle
        case "game":
          recommendations.push("pricing", "upload");
          break;
        case "ppv":
          recommendations.push("pricing", "upload");
          break;
        case "poll":
          recommendations.push("upload");
          break;
        case "normal":
          recommendations.push("upload");
          break;
      }

      return [...new Set(recommendations)];
    },
    []
  );

  // Auto-populate selectedComponents based on submission type and content style
  useEffect(() => {
    if (submissionType && contentStyle) {
      const recommendedComponents = getSmartRecommendations(
        submissionType,
        contentStyle
      );
      setValue("selectedComponents", recommendedComponents);
      console.log("🎯 Auto-selected components:", recommendedComponents);
    }
  }, [submissionType, contentStyle, getSmartRecommendations, setValue]);

  // Navigation handlers
  const goToStep = (step: number) => {
    if (step < currentStep || completedSteps.includes(currentStep)) {
      setCurrentStep(step);
    } else {
      toast.error("Please complete the current step first");
    }
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCompletedSteps([...completedSteps, currentStep]);
      if (currentStep < WIZARD_STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Step validation (relaxed for better UX - warnings instead of blockers)
  const validateCurrentStep = (): boolean => {
    switch (WIZARD_STEPS[currentStep].id) {
      // case 'templates': // COMMENTED OUT - Template step removed
      //   return true; // Optional step
      case "type":
        if (!platform) {
          toast.error("Please select a platform (OnlyFans or Fansly)");
          return false;
        }
        if (!submissionType) {
          toast.error("Please select a submission type");
          return false;
        }
        return true;
      case "style":
        if (!contentStyle) {
          toast.error("Please select a content style");
          return false;
        }
        return true;
      case "details":
        const formData = getValues();

        // Always validate model selection (required field)
        if (!formData.model) {
          toast.error("Please select a model before continuing");
          return false;
        }

        // Always validate driveLink (required field)
        if (!formData.driveLink || formData.driveLink.trim() === "") {
          toast.error("Please provide a Drive link before continuing");
          return false;
        }

        // Show warnings for optional fields (don't block navigation)
        if (selectedComponents.includes("pricing")) {
          // Check if content type is selected (which includes pricing info)
          if (!formData.contentType && !selectedContentTypeOption) {
            toast.info(
              "💡 Tip: Select a content type with pricing or remove the pricing component",
              {
                duration: 3000,
              }
            );
          }
        }

        // Release date is now optional - just show a warning for PTR
        if (
          selectedComponents.includes("release") &&
          submissionType === "ptr"
        ) {
          if (!formData.releaseDate) {
            toast.info(
              "💡 PTR Tip: Consider adding a release date for model deadline tracking",
              {
                duration: 3000,
              }
            );
          }
        }

        return true;
      case "review":
        // Final validation before submission
        const reviewData = getValues();

        if (!reviewData.model) {
          toast.error("Please go back and select a model");
          return false;
        }

        if (!reviewData.driveLink || reviewData.driveLink.trim() === "") {
          toast.error("Please go back and provide a Drive link");
          return false;
        }

        return true;
      default:
        return true;
    }
  };

  // Apply template
  const applyTemplate = (template: FormTemplate) => {
    setSelectedTemplate(template);
    setValue("submissionType", template.submissionType);
    setValue("contentStyle", template.contentStyle);
    setValue("selectedComponents", template.components);
    setCompletedSteps([0, 1]); // Mark type and style steps as complete (template step removed)
    setCurrentStep(2); // Jump to Content Details (step 2 in 4-step wizard)
    toast.success(`Applied "${template.name}" template`);
  };

  // Toggle component
  const toggleComponent = (componentId: ComponentModule) => {
    const current = selectedComponents || [];
    const isSelected = current.includes(componentId);

    if (isSelected) {
      setValue(
        "selectedComponents",
        current.filter((id) => id !== componentId)
      );
    } else {
      setValue("selectedComponents", [...current, componentId]);
    }
  };

  // Form submission
  const onSubmit = async (data: ModularFormData) => {
    if (!selectedTeamId) {
      toast.error("Please select a team");
      return;
    }

    setIsSubmitting(true);
    setSubmissionProgress("Preparing workflow...");

    try {
      // Upload files first (with error handling for missing AWS config)
      let uploadedAttachments = attachments;
      if (localFiles.length > 0) {
        setSubmissionProgress(`Uploading ${localFiles.length} file${localFiles.length > 1 ? 's' : ''}...`);
        try {
          const newAttachments = await uploadAllLocalFiles(
            localFiles,
            attachments,
            setAttachments,
            setLocalFiles
          );
          // Use the returned attachments directly to avoid state timing issues
          uploadedAttachments = [...attachments, ...newAttachments];
        } catch (uploadError: any) {
          console.error("File upload failed:", uploadError);

          // Check if this is the AWS configuration error
          if (uploadError.message?.includes("Server configuration error")) {
            toast.error(
              "File upload unavailable: AWS S3 not configured. Proceeding without files.",
              {
                description:
                  "Contact admin to configure AWS environment variables for file uploads.",
                duration: 5000,
              }
            );

            // Clear local files and continue without attachments
            setLocalFiles([]);
          } else {
            // Re-throw other upload errors
            throw uploadError;
          }
        }
      }

      // Prepare workflow payload
      const workflowPayload = {
        submissionType: data.submissionType,
        contentStyle: data.contentStyle,
        selectedComponents: data.selectedComponents || [],
        platform: data.platform, // NEW: Include platform selection
        componentData: {
          ...(data.selectedComponents?.includes("release") && {
            releaseDate: data.releaseDate,
            releaseTime: data.releaseTime,
            releaseTimezone: data.releaseTimezone,
            priority: data.priority,
          }),
          // Include PPV/Bundle specific fields
          ...((data.contentStyle === "ppv" || data.contentStyle === "bundle") &&
            data.originalPollReference && {
              originalPollReference: data.originalPollReference,
            }),
        },
        modelName: data.model,
        priority: data.priority,
        driveLink: data.driveLink,
        attachments: uploadedAttachments,
        // Content Details fields
        contentType: data.contentType,
        contentTypeOptionId: selectedContentTypeOption?.id, // NEW: Store relational ID
        pricingCategory: data.pricingCategory, // NEW: Store pricing category
        contentLength: data.contentLength,
        contentCount: data.contentCount,
        // Tags fields
        contentTags: data.contentTags || [],
        externalCreatorTags: data.externalCreatorTags,
        internalModelTags: data.internalModelTags || [],
        // NOTE: Don't send teamId - let platform-based routing determine the team
        // teamId: selectedTeamId,
        estimatedDuration: parseInt(estimatedTime),
      };

      console.log('🚀 Submitting workflow payload:', {
        ...workflowPayload,
        requiredFields: {
          submissionType: !!workflowPayload.submissionType,
          contentStyle: !!workflowPayload.contentStyle,
          selectedComponents: workflowPayload.selectedComponents !== undefined,
          modelName: !!workflowPayload.modelName,
          priority: !!workflowPayload.priority,
          driveLink: !!workflowPayload.driveLink,
        }
      });

      setSubmissionProgress("Creating workflow...");

      const response = await fetch("/api/modular-workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workflowPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create workflow");
      }

      setSubmissionProgress("Assigning to team...");

      // Clear draft
      localStorage.removeItem("workflow_draft");

      setSubmissionProgress("Finalizing...");

      toast.success(`Workflow created successfully! Assigned to ${result.task.teamName}`);

      // Refresh tasks and redirect to the team where the task was actually created
      const createdTeamId = result.task.teamId;
      if (createdTeamId) {
        setSubmissionProgress("Refreshing tasks...");
        fetchTasks(createdTeamId, true);
        setTimeout(() => {
          router.push(`/board?team=${createdTeamId}`);
        }, 1500);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create workflow"
      );
    } finally {
      setIsSubmitting(false);
      setSubmissionProgress("");
    }
  };

  // Handle internal model selection
  const handleModelToggle = (modelName: string) => {
    setSelectedInternalModels((prev) => {
      if (prev.includes(modelName)) {
        return prev.filter((m) => m !== modelName);
      } else {
        return [...prev, modelName];
      }
    });
  };

  const handleSaveModelSelection = () => {
    setValue("internalModelTags", selectedInternalModels);
    setShowModelSelector(false);
  };

  // Render current step content
  const renderStepContent = () => {
    switch (WIZARD_STEPS[currentStep].id) {
      // COMMENTED OUT - Template selection step removed from wizard
      // case 'templates':
      //   return (
      //     <div className="space-y-6">
      //       <div className="text-center mb-8">
      //         <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
      //           Start Your Workflow
      //         </h2>
      //         <p className="text-gray-600 dark:text-gray-300">
      //           Choose a template for quick setup or build from scratch
      //         </p>
      //       </div>
      //       ...
      //     </div>
      //   );

      case "type":
        return (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">
                Choose Submission Type & Platform
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                This determines the priority and routing of your workflow
              </p>
            </div>

            {/* Platform Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 text-center">Select Platform</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    id: "onlyfans" as Platform,
                    name: "OnlyFans",
                    color: "from-blue-500 to-cyan-500",
                    icon: Package,
                  },
                  {
                    id: "fansly" as Platform,
                    name: "Fansly",
                    color: "from-purple-500 to-pink-500",
                    icon: Sparkles,
                  },
                ].map((plat) => (
                  <motion.div
                    key={plat.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className={cn(
                        "cursor-pointer transition-all",
                        platform === plat.id
                          ? "border-2 border-purple-500 shadow-lg"
                          : "border-2 border-gray-200 hover:border-gray-300"
                      )}
                      onClick={() => setValue("platform", plat.id)}
                    >
                      <CardHeader className="text-center">
                        <div
                          className={cn(
                            "w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4 mx-auto",
                            plat.color
                          )}
                        >
                          <plat.icon className="w-8 h-8 text-white" />
                        </div>
                        <CardTitle className="text-xl flex items-center justify-center gap-2">
                          {plat.name}
                          {platform === plat.id && (
                            <Check className="w-5 h-5 text-purple-500" />
                          )}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-4 text-center">Select Submission Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  id: "otp" as SubmissionType,
                  name: "OTP",
                  title: "One-Time Post",
                  desc: "Flexible scheduling for regular content",
                  icon: Package,
                  color: "from-blue-500 to-purple-500",
                  features: [
                    "Standard priority",
                    "Flexible timing",
                    "Regular workflow",
                  ],
                },
                {
                  id: "ptr" as SubmissionType,
                  name: "PTR",
                  title: "Priority Tape Release",
                  desc: "Model-specified dates with high priority",
                  icon: Clock,
                  color: "from-orange-500 to-red-500",
                  features: [
                    "High priority",
                    "Fixed deadlines",
                    "Expedited routing",
                  ],
                },
              ].map((type) => (
                <motion.div
                  key={type.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className={cn(
                      "cursor-pointer transition-all",
                      submissionType === type.id
                        ? "border-2 border-purple-500 shadow-lg"
                        : "border-2 border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => setValue("submissionType", type.id)}
                  >
                    <CardHeader>
                      <div
                        className={cn(
                          "w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4",
                          type.color
                        )}
                      >
                        <type.icon className="w-8 h-8 text-white" />
                      </div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        {type.name}
                        {submissionType === type.id && (
                          <Check className="w-5 h-5 text-purple-500" />
                        )}
                      </CardTitle>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {type.title}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {type.desc}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {type.features.map((feature, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 text-sm"
                          >
                            <Check className="w-4 h-4 text-green-500" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case "style":
        // Filter content styles based on submission type selection
        const availableStyles = styleTemplates.filter((style) =>
          style.submissionTypes.includes(submissionType)
        );

        return (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Select Content Style</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Choose the format for your {submissionType?.toUpperCase()}{" "}
                content
              </p>
              {submissionType && (
                <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  {submissionType === "ptr"
                    ? "🔥 PTR: High Priority Content"
                    : "📝 OTP: Standard Content"}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableStyles.map((style) => (
                <motion.div
                  key={style.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className={cn(
                      "cursor-pointer transition-all h-full min-w-0",
                      contentStyle === style.id
                        ? "border-2 border-purple-500 shadow-lg bg-purple-50/50 dark:bg-purple-950/30"
                        : "border-2 border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => setValue("contentStyle", style.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className={cn(
                            "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0",
                            style.color
                          )}
                        >
                          <style.icon className="w-6 h-6 text-white" />
                        </div>
                        {contentStyle === style.id && (
                          <Check className="w-5 h-5 text-purple-500 flex-shrink-0" />
                        )}
                      </div>
                      <CardTitle className="text-base leading-tight">
                        {style.name}
                      </CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {style.description}
                      </p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg mb-3">
                        <p className="text-xs font-medium leading-relaxed">
                          {style.preview}
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Teams involved:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {style.teams.slice(0, 3).map((team, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs py-0.5 px-2"
                            >
                              {team}
                            </Badge>
                          ))}
                          {style.teams.length > 3 && (
                            <Badge
                              variant="outline"
                              className="text-xs py-0.5 px-2"
                            >
                              +{style.teams.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case "details":
        return (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Content Details</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Add the specific information for your workflow
              </p>
              
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Required Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="model" className="flex items-center gap-2">
                    Model <span className="text-red-500">*</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="w-4 h-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Required: Select the model for this content</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <SearchableSelect
                    value={watch("model")}
                    onValueChange={(value) => setValue("model", value)}
                    options={models.map((model) => ({
                      value: model.name,
                      label: model.name,
                    }))}
                    placeholder={loadingModels ? "Loading models..." : "Select a model"}
                    searchPlaceholder="Search models..."
                    emptyMessage="No models found."
                    disabled={loadingModels}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="pricingCategory" className="flex items-center gap-2">
                    Pricing Tier <span className="text-red-500">*</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="w-4 h-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Select the pricing tier for content types</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Select
                    onValueChange={(value) => setValue("pricingCategory", value)}
                    defaultValue="EXPENSIVE_PORN"
                    value={pricingCategory}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CHEAP_PORN">Cheap Porn / Porn Accurate</SelectItem>
                      <SelectItem value="EXPENSIVE_PORN">Expensive Porn / Premium</SelectItem>
                      <SelectItem value="GF_ACCURATE">GF / GF Accurate</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    This determines available content types and pricing
                  </p>
                </div>

                <div>
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select
                    onValueChange={(value) => setValue("priority", value)}
                    defaultValue="normal"
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="driveLink">Drive Link</Label>
                  <Input
                    id="driveLink"
                    type="url"
                    placeholder="https://drive.google.com/..."
                    {...register("driveLink", { required: true })}
                    className="mt-2"
                  />
                </div>

                {/* Content Details Section - Content Type, Length, Count */}
                <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    Additional Content Details
                  </h4>

                  <div className="grid grid-cols-1 gap-4">
                    {/* Content Type */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label
                          htmlFor="contentType"
                          className="font-medium"
                        >
                          Content Type
                        </Label>
                        <button
                          type="button"
                          onClick={() => fetchContentTypeOptions()}
                          disabled={loadingContentTypes}
                          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 transition-colors"
                          title="Refresh content types"
                        >
                          <RefreshCw className={`h-4 w-4 ${loadingContentTypes ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                      <Select
                        onValueChange={(value) => {
                          setValue("contentType", value);
                          // Store the full content type option object
                          const selectedOption = contentTypeOptions.find(opt => opt.value === value);
                          setSelectedContentTypeOption(selectedOption || null);
                        }}
                        disabled={loadingContentTypes}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={loadingContentTypes ? "Loading..." : "Select content type..."} />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px] overflow-y-auto">
                          {contentTypeOptions.map((option, index) => {
                            // Format price display - show $--.-- if no price is set
                            let priceDisplay = " - $--.--";
                            if (option.priceType === "FIXED" && option.priceFixed) {
                              priceDisplay = ` - $${option.priceFixed.toFixed(2)}`;
                            } else if (option.priceType === "RANGE" && option.priceMin && option.priceMax) {
                              priceDisplay = ` - $${option.priceMin.toFixed(2)}-${option.priceMax.toFixed(2)}`;
                            } else if (option.priceType === "MINIMUM" && option.priceMin) {
                              priceDisplay = ` - $${option.priceMin.toFixed(2)}+`;
                            }

                            return (
                              <SelectItem key={`${option.value}-${index}`} value={option.value}>
                                {option.label}{priceDisplay}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        {loadingContentTypes ? "Loading content types..." : "Select from available content types with pricing"}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        💡 Need to update prices?{" "}
                        <Link href="/settings" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-800 dark:hover:text-blue-300">
                          Go to Settings
                        </Link>
                      </p>
                    </div>
                  </div>

                  {/* Content Length and Count in separate row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Content Length */}
                    <div>
                      <Label
                        htmlFor="contentLength"
                        className="block mb-2 font-medium"
                      >
                        Content Length
                      </Label>
                      <Input
                        id="contentLength"
                        type="text"
                        placeholder="8:43 or 8 mins 43 secs"
                        {...register("contentLength")}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Format: "8:43" or "8 mins 43 secs"
                      </p>
                    </div>

                    {/* Content Count */}
                    <div>
                      <Label
                        htmlFor="contentCount"
                        className="block mb-2 font-medium"
                      >
                        Content Count
                      </Label>
                      <Input
                        id="contentCount"
                        type="text"
                        placeholder="1 Video, 3 Photos"
                        {...register("contentCount")}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Format: "1 Video" or "3 Photos"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tags Section */}
                <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    Tags
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* External Creator Tags */}
                    <div>
                      <Label
                        htmlFor="externalCreatorTags"
                        className="block mb-2 font-medium"
                      >
                        Tags - External Creators
                      </Label>
                      <Input
                        id="externalCreatorTags"
                        type="text"
                        placeholder="@johndoe @janedoe"
                        {...register("externalCreatorTags")}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter @usernames separated by spaces
                      </p>
                    </div>

                    {/* Internal Model Tags */}
                    <div>
                      <Label
                        htmlFor="internalModelTags"
                        className="block mb-2 font-medium"
                      >
                        Tags - Internal Models
                      </Label>
                      <div
                        className="border border-gray-300 dark:border-gray-700 rounded-md p-2 min-h-[40px] cursor-pointer hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
                        onClick={() => setShowModelSelector(true)}
                      >
                        {selectedInternalModels.length === 0 ? (
                          <span className="text-gray-500 text-sm">
                            Click to select models...
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {selectedInternalModels.map((modelName) => (
                              <Badge
                                key={modelName}
                                variant="secondary"
                                className="text-xs"
                              >
                                {modelName}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Click to select internal models (
                        {selectedInternalModels.length} selected)
                      </p>
                    </div>
                  </div>
                </div>

                {selectedComponents.includes("upload") && (
                  <div>
                    <Label>Reference Images (screenshots from OF vault)</Label>
                    <div className="mt-2">
                      <FileUpload
                        attachments={attachments}
                        onAttachmentsChange={setAttachments}
                        localFiles={localFiles}
                        onLocalFilesChange={setLocalFiles}
                        uploadOnSubmit={true}
                        maxFiles={10}
                        maxFileSize={50}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        Upload screenshots from OnlyFans vault for team
                        reference
                      </p>
                    </div>
                  </div>
                )}

                {/* Content Tags - QA Team Section */}
                <div className="space-y-2">
                  <MultiSelect
                    options={CONTENT_TAGS.map((tag) => ({
                      label: tag,
                      value: tag,
                    }))}
                    onValueChange={(values) => {
                      setValue("contentTags", values);
                    }}
                    defaultValue={watch("contentTags") || []}
                    placeholder="Select content tags..."
                    variant="secondary"
                    maxCount={4}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Select all tags that apply to this content. QA team will
                    review.
                  </p>
                </div>

                {/* PPV/Bundle Specific Fields */}
                {(contentStyle === "ppv" || contentStyle === "bundle") && (
                  <Card className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        PPV/Bundle Specific Fields
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div>
                        <Label htmlFor="originalPollReference">
                          Original Poll Reference
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="w-4 h-4 text-gray-400 ml-2 inline" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  Reference to original poll this PPV/Bundle is
                                  based on
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </Label>
                        <Textarea
                          id="originalPollReference"
                          placeholder="Reference to original poll this PPV is based on"
                          {...register("originalPollReference")}
                          rows={2}
                          className="mt-2"
                        />
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Include any poll IDs, dates, or references that
                          connect this PPV/Bundle to the original poll content
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedComponents.includes("release") && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="releaseDate">Release Date</Label>
                      <Input
                        id="releaseDate"
                        type="date"
                        {...register("releaseDate")}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="releaseTime">Release Time</Label>
                      <Input
                        id="releaseTime"
                        type="time"
                        {...register("releaseTime")}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="releaseTimezone">Timezone</Label>
                      <Select
                        onValueChange={(value) =>
                          setValue("releaseTimezone", value)
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select timezone..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                          <SelectItem value="EST">EST (GMT-5)</SelectItem>
                          <SelectItem value="CST">CST (GMT-6)</SelectItem>
                          <SelectItem value="MST">MST (GMT-7)</SelectItem>
                          <SelectItem value="PST">PST (GMT-8)</SelectItem>
                          <SelectItem value="GMT">GMT (GMT+0)</SelectItem>
                          <SelectItem value="CET">CET (GMT+1)</SelectItem>
                          <SelectItem value="EET">EET (GMT+2)</SelectItem>
                          <SelectItem value="JST">JST (GMT+9)</SelectItem>
                          <SelectItem value="AEST">AEST (GMT+10)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Team Assignment Card */}
            <Card className="mt-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Team Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentTeam ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Current Team
                        </p>
                        <p className="font-semibold text-lg">
                          {currentTeam.name}
                        </p>
                      </div>
                      <Badge className="bg-blue-600 text-white">
                        {submissionType === "ptr"
                          ? "High Priority"
                          : "Standard"}
                      </Badge>
                    </div>

                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-2">
                        Workflow Routing Preview:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {getWorkflowRouting(contentStyle, submissionType)
                          .slice(0, 4)
                          .map((route, index) => (
                            <Badge
                              key={index}
                              variant={
                                route.type === "primary"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {route.name}
                            </Badge>
                          ))}
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      💡 Tip: You can change the team assignment in the right
                      sidebar before submitting
                    </p>
                  
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      ⚠️ No team selected. Please select a team from the right
                      sidebar.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case "review":
        const formData = getValues();

        return (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Review Your Workflow</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Double-check everything before submission
              </p>
            </div>

            {/* Clear Visual Summary Card */}
            <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-purple-950 dark:via-pink-950 dark:to-blue-950">
              <CardHeader>
                <CardTitle className="text-center text-xl">
                  📋 What You're Creating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Main Type and Style */}
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center gap-3">
                      <Badge
                        className={`px-4 py-2 text-lg ${
                          formData.submissionType === "ptr"
                            ? "bg-gradient-to-r from-orange-500 to-red-500 text-white"
                            : "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                        }`}
                      >
                        {formData.submissionType?.toUpperCase()}
                      </Badge>
                      <span className="text-2xl">+</span>
                      <Badge variant="secondary" className="px-4 py-2 text-lg">
                        {
                          styleTemplates.find(
                            (s) => s.id === formData.contentStyle
                          )?.name
                        }
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                      {formData.submissionType === "ptr"
                        ? "🚨 High Priority - Model-requested deadline"
                        : "📅 Standard Scheduling - Flexible timing"}
                    </p>
                  </div>

                  {/* Components Added */}
                  {formData.selectedComponents?.length > 0 && (
                    <div className="p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        ✨ Additional Components:
                      </p>
                      <div className="flex gap-2 flex-wrap justify-center">
                        {formData.selectedComponents.map((comp) => (
                          <Badge
                            key={comp}
                            variant="outline"
                            className="capitalize"
                          >
                            {comp}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Team Assignment */}
                  <div className="p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      👥 Assigned Team:
                    </p>
                    <div className="text-center">
                      <Badge className="bg-blue-600 text-white px-4 py-1">
                        {formData.platform === 'fansly' ? 'OTP-Fansly' : 'OTP-PTR'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Detailed Summary
                  <Badge variant="outline" className="text-sm">
                    <Clock className="w-3 h-3 mr-1" />
                    Est. {estimatedTime}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Workflow Path Preview */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-lg">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Workflow Path
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      className={
                        formData.submissionType === "ptr"
                          ? "bg-orange-600 text-white"
                          : "bg-purple-600 text-white"
                      }
                    >
                      {formData.submissionType?.toUpperCase()}
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <Badge variant="secondary">
                      {
                        styleTemplates.find(
                          (s) => s.id === formData.contentStyle
                        )?.name
                      }
                    </Badge>
                    {formData.selectedComponents?.map((comp, idx) => (
                      <React.Fragment key={comp}>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <Badge variant="outline">{comp}</Badge>
                      </React.Fragment>
                    ))}
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <Badge className="bg-blue-600 text-white">
                      {formData.platform === 'fansly' ? 'OTP-Fansly' : 'OTP-PTR'}
                    </Badge>
                  </div>
                </div>

                {/* Details Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Type
                    </p>
                    <p className="font-medium">
                      {formData.submissionType?.toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Style
                    </p>
                    <p className="font-medium">
                      {
                        styleTemplates.find(
                          (s) => s.id === formData.contentStyle
                        )?.name
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Model
                    </p>
                    <p className="font-medium">
                      {formData.model || "Not selected"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Priority
                    </p>
                    <p className="font-medium capitalize">
                      {formData.priority}
                    </p>
                  </div>
                  {formData.pricingCategory && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Pricing Tier
                      </p>
                      <p className="font-medium">
                        {formData.pricingCategory === 'CHEAP_PORN' && '💰 Cheap Porn'}
                        {formData.pricingCategory === 'EXPENSIVE_PORN' && '💎 Expensive Porn'}
                        {formData.pricingCategory === 'GF_ACCURATE' && '💕 GF Accurate'}
                      </p>
                    </div>
                  )}
                  {formData.contentType && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Content Type
                      </p>
                      <p className="font-medium flex items-center gap-2">
                        <span>{formData.contentType}</span>
                        {selectedContentTypeOption && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            {selectedContentTypeOption.priceType === 'FIXED' && selectedContentTypeOption.priceFixed &&
                              `$${selectedContentTypeOption.priceFixed.toFixed(2)}`}
                            {selectedContentTypeOption.priceType === 'RANGE' && selectedContentTypeOption.priceMin && selectedContentTypeOption.priceMax &&
                              `$${selectedContentTypeOption.priceMin.toFixed(2)}-$${selectedContentTypeOption.priceMax.toFixed(2)}`}
                            {selectedContentTypeOption.priceType === 'MINIMUM' && selectedContentTypeOption.priceMin &&
                              `$${selectedContentTypeOption.priceMin.toFixed(2)}+`}
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                  {formData.contentLength && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Content Length
                      </p>
                      <p className="font-medium">{formData.contentLength}</p>
                    </div>
                  )}
                  {formData.contentCount && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Content Count
                      </p>
                      <p className="font-medium">{formData.contentCount}</p>
                    </div>
                  )}
                </div>

                {formData.driveLink && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Drive Link
                    </p>
                    <p className="font-medium text-sm break-all">
                      {formData.driveLink}
                    </p>
                  </div>
                )}

                {formData.caption && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Caption
                    </p>
                    <p className="text-sm">{formData.caption}</p>
                  </div>
                )}

                {/* PPV/Bundle Reference Information */}
                {(contentStyle === "ppv" || contentStyle === "bundle") &&
                  formData.originalPollReference && (
                    <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        PPV/Bundle Reference
                      </h4>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Original Poll Reference
                        </p>
                        <p className="text-sm">
                          {formData.originalPollReference}
                        </p>
                      </div>
                    </div>
                  )}

                {/* Release Schedule Information */}
                {selectedComponents.includes("release") &&
                  (formData.releaseDate || formData.releaseTime) && (
                    <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Release Schedule
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        {formData.releaseDate && (
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Date
                            </p>
                            <p className="font-medium">
                              {new Date(
                                formData.releaseDate
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        {formData.releaseTime && (
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Time
                            </p>
                            <p className="font-medium">
                              {formData.releaseTime}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                {(attachments.length > 0 || localFiles.length > 0) && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Files
                    </p>
                    <p className="font-medium">
                      {attachments.length + localFiles.length} files attached
                    </p>
                  </div>
                )}

                {/* Team Assignment */}
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Team Assignment
                  </h4>
                  <p className="text-sm">
                    This workflow will be assigned to{" "}
                    <strong>{formData.platform === 'fansly' ? 'OTP-Fansly' : 'OTP-PTR'}</strong>
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {formData.submissionType === "ptr"
                      ? "🔥 High priority - PTR deadline enforced"
                      : "📋 Standard workflow routing"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-pink-50/30 dark:bg-gray-950">
      {/* Header with Progress */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl font-bold">Create Workflow</h1>
              <div className="flex items-center gap-2">
                {draftSaved && (
                  <Badge variant="outline" className="text-xs">
                    <Save className="w-3 h-3 mr-1" />
                    Draft saved
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  Step {currentStep + 1} of {WIZARD_STEPS.length}
                </Badge>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Indicators */}
          <div className="flex items-center justify-between overflow-x-auto pb-2">
            {WIZARD_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === index;
              const isCompleted = completedSteps.includes(index);

              return (
                <button
                  key={step.id}
                  onClick={() => goToStep(index)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap",
                    isActive
                      ? "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
                      : isCompleted
                        ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 cursor-pointer hover:bg-green-100"
                        : "text-gray-500 dark:text-gray-400"
                  )}
                  disabled={!isCompleted && index > currentStep}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                      isActive
                        ? "bg-purple-600 text-white"
                        : isCompleted
                          ? "bg-green-600 text-white"
                          : "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="font-medium text-sm">{step.title}</p>
                    <p className="text-xs opacity-75">{step.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={saveDraft} className="gap-2">
              <Save className="w-4 h-4" />
              Save Draft
            </Button>

            {currentStep === WIZARD_STEPS.length - 1 ? (
              <Button
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {submissionProgress || "Creating..."}
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Create Workflow
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Floating Help Button */}
      <motion.button
        className="fixed bottom-4 right-4 w-14 h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg flex items-center justify-center z-30"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowHelp(!showHelp)}
      >
        <HelpCircle className="w-6 h-6" />
      </motion.button>

      {/* Help Panel */}
      <AnimatePresence>
        {showHelp && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setShowHelp(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: 400 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 400 }}
              className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">Help & Tips</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHelp(false)}
                    className="hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    ✕
                  </Button>
                </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Current Step
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {WIZARD_STEPS[currentStep].description}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Command className="w-4 h-4" />
                      Keyboard Shortcuts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Next step</span>
                        <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                          →
                        </kbd>
                      </div>
                      <div className="flex justify-between">
                        <span>Previous step</span>
                        <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                          ←
                        </kbd>
                      </div>
                      <div className="flex justify-between">
                        <span>Save draft</span>
                        <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                          Ctrl+S
                        </kbd>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Quick Guide
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <li>1. Choose a template or start fresh</li>
                      <li>2. Select OTP or PTR based on urgency</li>
                      <li>3. Pick your content style</li>
                      <li>4. Add optional components</li>
                      <li>5. Fill in content details</li>
                      <li>6. Review and submit</li>
                    </ol>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Internal Model Selector Dialog */}
      <Dialog open={showModelSelector} onOpenChange={setShowModelSelector}>
        <DialogContent className="max-w-2xl max-h-[600px]">
          <DialogHeader>
            <DialogTitle>Select Internal Models</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[400px] py-4">
            <div className="grid grid-cols-2 gap-3">
              {internalModels.map((model) => (
                <div
                  key={model.id}
                  className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  onClick={() =>
                    handleModelToggle(model.clientName || model.name)
                  }
                >
                  <Checkbox
                    checked={selectedInternalModels.includes(
                      model.clientName || model.name
                    )}
                    onCheckedChange={() =>
                      handleModelToggle(model.clientName || model.name)
                    }
                  />
                  <Label className="cursor-pointer flex-1">
                    {model.clientName || model.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowModelSelector(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveModelSelection}>
              Save Selection ({selectedInternalModels.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
