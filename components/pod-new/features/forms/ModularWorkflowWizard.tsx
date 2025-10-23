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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { usePricingData } from "@/hooks/usePricingData";

// Core Types
export type SubmissionType = "otp" | "ptr";
export type ContentStyle = "normal" | "poll" | "game" | "ppv" | "bundle";
export type ComponentModule = "pricing" | "release" | "upload";

// Workflow Routing Helper
function getWorkflowRouting(contentStyle: ContentStyle | undefined, submissionType: SubmissionType | undefined) {
  // Standard workflow for all content types
  const standardWorkflow = [
    { name: "Content Team", type: "primary" },
    { name: "PGT", type: "secondary" },
    { name: "Flyer Team", type: "secondary" },
    { name: "OTP Manager/QA", type: "secondary" },
    { name: "Posted", type: "final" }
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

  // Base fields
  model: string;
  priority: string;
  driveLink: string;
  caption?: string;

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
  { id: 'templates', title: 'Choose Template', icon: Layers, description: 'Start with a template or from scratch' },
  { id: 'type', title: 'Submission Type', icon: Package, description: 'Select OTP or PTR submission' },
  { id: 'style', title: 'Content Style', icon: Sparkles, description: 'Choose your content format' },
  { id: 'components', title: 'Add Features', icon: Zap, description: 'Enhance with components' },
  { id: 'details', title: 'Content Details', icon: FileText, description: 'Add your content information' },
  { id: 'review', title: 'Review & Submit', icon: Check, description: 'Final review before submission' }
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
    tags: ["wall", "standard", "regular"]
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
    tags: ["poll", "engagement", "interactive"]
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
    tags: ["game", "tips", "interactive"]
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
    tags: ["ppv", "premium", "scheduled"]
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
    tags: ["game", "scheduled", "interactive"]
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
    tags: ["bundle", "collection", "scheduled"]
  }
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
    submissionTypes: ["otp", "ptr"] as SubmissionType[]
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
    submissionTypes: ["otp", "ptr"] as SubmissionType[]
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
    submissionTypes: ["otp", "ptr"] as SubmissionType[]
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
    submissionTypes: ["otp", "ptr"] as SubmissionType[]
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
    submissionTypes: ["otp", "ptr"] as SubmissionType[]
  }
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
    estimatedTime: "+1 min"
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
    estimatedTime: "+30 sec"
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
    estimatedTime: "+2 min"
  }
];

export default function ModularWorkflowWizard() {
  const router = useRouter();
  const { fetchTasks } = useBoardTasks();
  const { selectedTeamId } = usePodStore();
  const { teams: availableTeams } = useAvailableTeams();

  // Form Management
  const { register, control, handleSubmit, formState: { errors }, setValue, getValues, watch } = useForm<ModularFormData>({
    mode: "onChange",
    defaultValues: {
      submissionType: "otp",
      contentStyle: "normal",
      selectedComponents: [],
      model: "",
      priority: "normal",
      driveLink: "",
      caption: ""
    }
  });

  // Wizard State
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState("3 min");

  // File Management
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [localFiles, setLocalFiles] = useState<LocalFilePreview[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);

  // Pricing Integration
  const selectedModel = watch("model");
  const { pricingGroups, loading: pricingLoading, error: pricingError, getPricingForContent, getBasePriceForContent } = usePricingData(selectedModel);
  const [availablePricing, setAvailablePricing] = useState<any[]>([]);
  const [selectedPricingItem, setSelectedPricingItem] = useState<string>("");

  // Watch form values
  const submissionType = watch("submissionType");
  const contentStyle = watch("contentStyle");
  const selectedComponents = watch("selectedComponents") || [];
  const pricingType = watch("pricingType");
  const originalPollReference = watch("originalPollReference");

  // Get current team
  const currentTeam = availableTeams.find(team => team.id === selectedTeamId);

  // Calculate progress
  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100;

  // Content style compatibility check (all styles now work with both OTP and PTR)
  // Removed auto-reset logic - PPV/Bundle now available for both submission types

  // Update available pricing when model or content style changes
  useEffect(() => {
    if (selectedModel && contentStyle) {
      const pricingOptions = getPricingForContent(selectedModel, contentStyle);
      setAvailablePricing(pricingOptions);
      console.log('📊 Available pricing options for', selectedModel, contentStyle, ':', pricingOptions);

      // Only reset if we have the pricing component selected
      if (selectedComponents.includes('pricing')) {
        setSelectedPricingItem("");
        setValue("pricingType", "");
        setValue("basePrice", "");
      }
    } else {
      setAvailablePricing([]);
    }
  }, [selectedModel, contentStyle, getPricingForContent, selectedComponents, setValue]);

  // Auto-populate base price when pricing item is selected
  useEffect(() => {
    if (selectedModel && selectedPricingItem) {
      const basePrice = getBasePriceForContent(selectedModel, selectedPricingItem);
      if (basePrice) {
        setValue("basePrice", basePrice);
        console.log('💰 Auto-populated base price:', basePrice, 'for', selectedPricingItem);
      }
    }
  }, [selectedModel, selectedPricingItem, getBasePriceForContent, setValue]);

  // Load models
  useEffect(() => {
    const fetchModels = async () => {
      setLoadingModels(true);
      try {
        const response = await fetch("/api/models");
        const data = await response.json();
        if (Array.isArray(data.models)) {
          const uniqueModels = data.models.filter((model: any, index: number, arr: any[]) =>
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
    localStorage.setItem('workflow_draft', JSON.stringify({
      ...formData,
      currentStep,
      savedAt: new Date().toISOString()
    }));
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2000);
  }, [getValues, currentStep]);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('workflow_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        const savedTime = new Date(parsed.savedAt);
        const hoursSince = (Date.now() - savedTime.getTime()) / (1000 * 60 * 60);

        if (hoursSince < 24) {
          toast.info("Draft restored from " + savedTime.toLocaleTimeString(), {
            action: {
              label: "Clear",
              onClick: () => {
                localStorage.removeItem('workflow_draft');
                window.location.reload();
              }
            }
          });

          Object.keys(parsed).forEach(key => {
            if (key !== 'currentStep' && key !== 'savedAt') {
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
    if (contentStyle === 'game') baseTime += 2;
    if (contentStyle === 'ppv') baseTime += 2;
    if (contentStyle === 'poll') baseTime += 1;

    // Component specific time adjustments
    selectedComponents.forEach(comp => {
      if (comp === 'pricing') baseTime += 1;
      if (comp === 'upload') baseTime += 2;
      if (comp === 'release') baseTime += 0.5;
    });
    setEstimatedTime(`${Math.ceil(baseTime)} min`);
  }, [contentStyle, selectedComponents]);

  // Smart recommendations
  const getSmartRecommendations = useCallback((type: SubmissionType, style: ContentStyle) => {
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
  }, []);

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
      case 'templates':
        return true; // Optional step
      case 'type':
        if (!submissionType) {
          toast.error("Please select a submission type");
          return false;
        }
        return true;
      case 'style':
        if (!contentStyle) {
          toast.error("Please select a content style");
          return false;
        }
        return true;
      case 'components':
        return true; // Optional
      case 'details':
        const formData = getValues();

        // Only block on truly required fields for final submission
        if (currentStep === WIZARD_STEPS.length - 1) {
          if (!formData.model) {
            toast.error("Please select a model before submitting");
            return false;
          }
          if (!formData.driveLink) {
            toast.error("Please provide a Drive link before submitting");
            return false;
          }
        }

        // Show warnings for optional fields (don't block navigation)
        if (selectedComponents.includes('pricing')) {
          if (!formData.pricingType && !formData.basePrice) {
            toast.info("💡 Tip: Add pricing information or remove the pricing component", {
              duration: 3000
            });
          }
        }

        // Release date is now optional - just show a warning for PTR
        if (selectedComponents.includes('release') && submissionType === 'ptr') {
          if (!formData.releaseDate) {
            toast.info("💡 PTR Tip: Consider adding a release date for model deadline tracking", {
              duration: 3000
            });
          }
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
    setCompletedSteps([0, 1, 2, 3]);
    setCurrentStep(4); // Jump to details
    toast.success(`Applied "${template.name}" template`);
  };

  // Toggle component
  const toggleComponent = (componentId: ComponentModule) => {
    const current = selectedComponents || [];
    const isSelected = current.includes(componentId);

    if (isSelected) {
      setValue("selectedComponents", current.filter(id => id !== componentId));
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

    try {
      // Upload files first (with error handling for missing AWS config)
      if (localFiles.length > 0) {
        try {
          await uploadAllLocalFiles(localFiles, attachments, setAttachments, setLocalFiles);
        } catch (uploadError: any) {
          console.error('File upload failed:', uploadError);

          // Check if this is the AWS configuration error
          if (uploadError.message?.includes('Server configuration error')) {
            toast.error('File upload unavailable: AWS S3 not configured. Proceeding without files.', {
              description: 'Contact admin to configure AWS environment variables for file uploads.',
              duration: 5000
            });

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
        componentData: {
          ...(data.selectedComponents?.includes('pricing') && {
            pricingType: data.pricingType,
            basePrice: data.basePrice,
            pricingItem: selectedPricingItem,
            pricingSource: selectedPricingItem ? 'dynamic' : 'manual'
          }),
          ...(data.selectedComponents?.includes('release') && {
            releaseDate: data.releaseDate,
            releaseTime: data.releaseTime,
            releaseTimezone: data.releaseTimezone,
            priority: data.priority
          }),
          // Include PPV/Bundle specific fields
          ...((data.contentStyle === 'ppv' || data.contentStyle === 'bundle') && data.originalPollReference && {
            originalPollReference: data.originalPollReference
          })
        },
        modelName: data.model,
        priority: data.priority,
        driveLink: data.driveLink,
        contentDescription: data.caption || `${contentStyle} submission`,
        attachments: attachments,
        teamId: selectedTeamId,
        estimatedDuration: parseInt(estimatedTime)
      };

      const response = await fetch('/api/modular-workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflowPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create workflow');
      }

      // Clear draft
      localStorage.removeItem('workflow_draft');

      toast.success("Workflow created successfully!");

      // Refresh tasks and redirect
      if (selectedTeamId) {
        fetchTasks(selectedTeamId, true);
        setTimeout(() => {
          router.push(`/board?team=${selectedTeamId}`);
        }, 1500);
      }

    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create workflow');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render current step content
  const renderStepContent = () => {
    switch (WIZARD_STEPS[currentStep].id) {
      case 'templates':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Start Your Workflow
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Choose a template for quick setup or build from scratch
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {formTemplates.map((template) => (
                <motion.div
                  key={template.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="cursor-pointer"
                  onClick={() => applyTemplate(template)}
                >
                  <Card className="h-full hover:shadow-xl transition-all border-2 hover:border-purple-300 overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="mb-2">
                        <div className="flex justify-between items-start mb-2">
                          <div className={cn(
                            "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0",
                            template.color
                          )}>
                            <template.icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              {template.estimatedTime}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              {template.popularity}%
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {template.description}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {template.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="text-xs text-gray-500">
                        <span className="font-medium block mb-1">Components:</span>
                        <div className="flex flex-wrap gap-1">
                          {template.components.map(comp => (
                            <Badge key={comp} className="text-xs">
                              {comp}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="text-center pt-6">
              <Button
                variant="outline"
                size="lg"
                onClick={() => nextStep()}
                className="gap-2"
              >
                <Layers className="w-4 h-4" />
                Start from Scratch
              </Button>
            </div>
          </div>
        );

      case 'type':
        return (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Choose Submission Type</h2>
              <p className="text-gray-600 dark:text-gray-300">
                This determines the priority and routing of your workflow
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  id: "otp" as SubmissionType,
                  name: "OTP",
                  title: "One-Time Post",
                  desc: "Flexible scheduling for regular content",
                  icon: Package,
                  color: "from-blue-500 to-purple-500",
                  features: ["Standard priority", "Flexible timing", "Regular workflow"]
                },
                {
                  id: "ptr" as SubmissionType,
                  name: "PTR",
                  title: "Priority Tape Release",
                  desc: "Model-specified dates with high priority",
                  icon: Clock,
                  color: "from-orange-500 to-red-500",
                  features: ["High priority", "Fixed deadlines", "Expedited routing"]
                }
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
                      <div className={cn(
                        "w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4",
                        type.color
                      )}>
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
                          <div key={index} className="flex items-center gap-2 text-sm">
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

      case 'style':
        // Filter content styles based on submission type selection
        const availableStyles = styleTemplates.filter(style =>
          style.submissionTypes.includes(submissionType)
        );

        return (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Select Content Style</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Choose the format for your {submissionType?.toUpperCase()} content
              </p>
              {submissionType && (
                <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  {submissionType === 'ptr' ? '🔥 PTR: High Priority Content' : '📝 OTP: Standard Content'}
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
                        <div className={cn(
                          "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0",
                          style.color
                        )}>
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
                        <p className="text-xs font-medium leading-relaxed">{style.preview}</p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Teams involved:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {style.teams.slice(0, 3).map((team, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs py-0.5 px-2">
                              {team}
                            </Badge>
                          ))}
                          {style.teams.length > 3 && (
                            <Badge variant="outline" className="text-xs py-0.5 px-2">
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

      case 'components':
        const recommendations = getSmartRecommendations(submissionType, contentStyle);

        return (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Add Optional Features</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Enhance your workflow with additional components
              </p>
              {recommendations.length > 0 && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg inline-block">
                  <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Smart recommendations based on your selections
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {componentModules.map((component) => {
                const isSelected = selectedComponents.includes(component.id);
                const isRecommended = recommendations.includes(component.id);

                return (
                  <motion.div
                    key={component.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card
                      className={cn(
                        "cursor-pointer transition-all",
                        isSelected
                          ? "border-2 border-purple-500 shadow-lg bg-purple-50 dark:bg-purple-950"
                          : "border-2 border-gray-200 hover:border-gray-300"
                      )}
                      onClick={() => toggleComponent(component.id)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center",
                              component.color
                            )}>
                              <component.icon className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <CardTitle className="text-lg">
                                  {component.name}
                                </CardTitle>
                                {isRecommended && (
                                  <Badge className="bg-amber-500 text-white">
                                    <Star className="w-3 h-3 mr-1" />
                                    Recommended
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {component.description}
                              </p>
                              <div className="flex items-center gap-3 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {component.estimatedTime}
                                </Badge>
                                {component.features.map((feature) => (
                                  <Badge key={feature} variant="secondary" className="text-xs">
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="mt-1">
                            <div className={cn(
                              "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                              isSelected
                                ? "bg-purple-500 border-purple-500"
                                : "border-gray-300"
                            )}>
                              {isSelected && (
                                <Check className="w-4 h-4 text-white" />
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );

      case 'details':
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
                    Model
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="w-4 h-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Select the model for this content</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Select
                    onValueChange={(value) => setValue("model", value)}
                    disabled={loadingModels}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder={loadingModels ? "Loading..." : "Select model"} />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model, idx) => (
                        <SelectItem key={idx} value={model.name}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

                <div>
                  <Label htmlFor="caption">Caption/Description</Label>
                  <Textarea
                    id="caption"
                    placeholder="Add content description..."
                    {...register("caption")}
                    rows={3}
                    className="mt-2"
                  />
                </div>

                {selectedComponents.includes("upload") && (
                  <div>
                    <Label>File Attachments</Label>
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
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        Note: File upload requires AWS S3 configuration. Files will be uploaded during submission.
                      </p>
                    </div>
                  </div>
                )}

                {selectedComponents.includes("pricing") && (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Dynamic Pricing {selectedModel ? `for ${selectedModel}` : ''}
                      </h4>
                      {pricingLoading && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">Loading pricing data...</p>
                      )}
                      {pricingError && (
                        <p className="text-sm text-red-600 dark:text-red-400">Error loading pricing: {pricingError}</p>
                      )}
                      {!selectedModel && (
                        <p className="text-sm text-amber-600 dark:text-amber-400">Please select a model first to see pricing options</p>
                      )}
                      {selectedModel && !pricingLoading && availablePricing.length === 0 && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">No pricing data available for this model and content style</p>
                      )}
                    </div>

                    {/* Content Type - Flexible Input (Dropdown OR Manual Text) */}
                    <div>
                      <Label htmlFor="pricingType">
                        Content Type
                        <span className="text-xs text-gray-500 ml-2">(Select from list OR type custom)</span>
                      </Label>

                      {availablePricing.length > 0 && (
                        <>
                          <Select
                            onValueChange={(value) => {
                              setSelectedPricingItem(value);
                              setValue("pricingType", value);
                            }}
                            disabled={pricingLoading || availablePricing.length === 0}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Quick select from model pricing..." />
                            </SelectTrigger>
                            <SelectContent>
                              {availablePricing.map((item) => (
                                <SelectItem key={item.id} value={item.name}>
                                  {item.name} {item.price && `- $${item.price}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="relative my-2">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t border-gray-300 dark:border-gray-600" />
                            </div>
                            <div className="relative flex justify-center text-xs">
                              <span className="bg-white dark:bg-gray-950 px-2 text-gray-500">OR type custom</span>
                            </div>
                          </div>
                        </>
                      )}

                      <Input
                        id="pricingType"
                        type="text"
                        placeholder="Type custom content type (e.g., SOLO, BG/GG, Custom Bundle)"
                        {...register("pricingType")}
                        className="mt-2"
                        onChange={(e) => {
                          setValue("pricingType", e.target.value);
                          if (e.target.value) {
                            setSelectedPricingItem(""); // Clear dropdown selection when typing
                          }
                        }}
                      />

                      {selectedPricingItem && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          ✓ Using: {availablePricing.find(item => item.name === selectedPricingItem)?.description}
                        </p>
                      )}
                      {pricingType && !selectedPricingItem && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          ✓ Custom content type: {pricingType}
                        </p>
                      )}
                    </div>

                    {/* Base Price - Always Editable */}
                    <div>
                      <Label htmlFor="basePrice">
                        Base Price / Description
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="w-4 h-4 text-gray-400 ml-2 inline" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Enter amount ($25), description (SOLO/BG/GG), or both. Always editable!</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                      <Input
                        id="basePrice"
                        type="text"
                        placeholder="Enter price, description, or both (e.g., '$25 - SOLO/BG')"
                        {...register("basePrice")}
                        className="mt-2"
                      />
                      {selectedPricingItem && getBasePriceForContent(selectedModel, selectedPricingItem) && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                          💡 Suggested from model data: ${getBasePriceForContent(selectedModel, selectedPricingItem)} (You can override)
                        </p>
                      )}
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Flexible field - type anything: "$25", "SOLO/BG/GG", "$32 PTR bundle", etc.
                      </p>
                    </div>
                  </div>
                )}

                {/* PPV/Bundle Specific Fields */}
                {(contentStyle === 'ppv' || contentStyle === 'bundle') && (
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
                                <p>Reference to original poll this PPV/Bundle is based on</p>
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
                          Include any poll IDs, dates, or references that connect this PPV/Bundle to the original poll content
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
                      <Select onValueChange={(value) => setValue("releaseTimezone", value)}>
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
                        <p className="text-sm text-gray-600 dark:text-gray-400">Current Team</p>
                        <p className="font-semibold text-lg">{currentTeam.name}</p>
                      </div>
                      <Badge className="bg-blue-600 text-white">
                        {submissionType === 'ptr' ? 'High Priority' : 'Standard'}
                      </Badge>
                    </div>

                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-2">
                        Workflow Routing Preview:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {getWorkflowRouting(contentStyle, submissionType).slice(0, 4).map((route, index) => (
                          <Badge
                            key={index}
                            variant={route.type === 'primary' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {route.name}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      💡 Tip: You can change the team assignment in the right sidebar before submitting
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      ⚠️ No team selected. Please select a team from the right sidebar.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 'review':
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
                      <Badge className={`px-4 py-2 text-lg ${
                        formData.submissionType === 'ptr'
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                          : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                      }`}>
                        {formData.submissionType?.toUpperCase()}
                      </Badge>
                      <span className="text-2xl">+</span>
                      <Badge variant="secondary" className="px-4 py-2 text-lg">
                        {styleTemplates.find(s => s.id === formData.contentStyle)?.name}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                      {formData.submissionType === 'ptr'
                        ? '🚨 High Priority - Model-requested deadline'
                        : '📅 Standard Scheduling - Flexible timing'
                      }
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
                          <Badge key={comp} variant="outline" className="capitalize">
                            {comp}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Team Assignment */}
                  {currentTeam && (
                    <div className="p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        👥 Assigned Team:
                      </p>
                      <div className="text-center">
                        <Badge className="bg-blue-600 text-white px-4 py-1">
                          {currentTeam.name}
                        </Badge>
                      </div>
                    </div>
                  )}
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
                    <Badge className={
                      formData.submissionType === 'ptr'
                        ? 'bg-orange-600 text-white'
                        : 'bg-purple-600 text-white'
                    }>
                      {formData.submissionType?.toUpperCase()}
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <Badge variant="secondary">
                      {styleTemplates.find(s => s.id === formData.contentStyle)?.name}
                    </Badge>
                    {formData.selectedComponents?.map((comp, idx) => (
                      <React.Fragment key={comp}>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <Badge variant="outline">{comp}</Badge>
                      </React.Fragment>
                    ))}
                    {currentTeam && (
                      <>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <Badge className="bg-blue-600 text-white">
                          {currentTeam.name}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>

                {/* Details Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Type</p>
                    <p className="font-medium">{formData.submissionType?.toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Style</p>
                    <p className="font-medium">
                      {styleTemplates.find(s => s.id === formData.contentStyle)?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Model</p>
                    <p className="font-medium">{formData.model || 'Not selected'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Priority</p>
                    <p className="font-medium capitalize">{formData.priority}</p>
                  </div>
                </div>

                {formData.driveLink && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Drive Link</p>
                    <p className="font-medium text-sm break-all">{formData.driveLink}</p>
                  </div>
                )}

                {formData.caption && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Caption</p>
                    <p className="text-sm">{formData.caption}</p>
                  </div>
                )}

                {/* Pricing Information */}
                {selectedComponents.includes('pricing') && (formData.pricingType || formData.basePrice) && (
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Pricing Details
                    </h4>
                    {formData.pricingType && (
                      <div className="mb-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Content Type</p>
                        <p className="font-medium">{formData.pricingType}</p>
                      </div>
                    )}
                    {formData.basePrice && (
                      <div className="mb-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Base Price</p>
                        <p className="font-medium">${formData.basePrice}</p>
                      </div>
                    )}
                    {selectedPricingItem && (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        ✓ Pricing sourced from model's database
                      </p>
                    )}
                  </div>
                )}

                {/* PPV/Bundle Reference Information */}
                {(contentStyle === 'ppv' || contentStyle === 'bundle') && formData.originalPollReference && (
                  <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      PPV/Bundle Reference
                    </h4>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Original Poll Reference</p>
                      <p className="text-sm">{formData.originalPollReference}</p>
                    </div>
                  </div>
                )}

                {/* Release Schedule Information */}
                {selectedComponents.includes('release') && (formData.releaseDate || formData.releaseTime) && (
                  <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Release Schedule
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      {formData.releaseDate && (
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Date</p>
                          <p className="font-medium">{new Date(formData.releaseDate).toLocaleDateString()}</p>
                        </div>
                      )}
                      {formData.releaseTime && (
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Time</p>
                          <p className="font-medium">{formData.releaseTime}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(attachments.length > 0 || localFiles.length > 0) && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Files</p>
                    <p className="font-medium">
                      {attachments.length + localFiles.length} files attached
                    </p>
                  </div>
                )}

                {/* Team Assignment */}
                {currentTeam && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Team Assignment
                    </h4>
                    <p className="text-sm">
                      This workflow will be assigned to <strong>{currentTeam.name}</strong>
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {formData.submissionType === 'ptr'
                        ? '🔥 High priority - PTR deadline enforced'
                        : '📋 Standard workflow routing'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
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
                    isActive ? "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300" :
                    isCompleted ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 cursor-pointer hover:bg-green-100" :
                    "text-gray-500 dark:text-gray-400"
                  )}
                  disabled={!isCompleted && index > currentStep}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                    isActive ? "bg-purple-600 text-white" :
                    isCompleted ? "bg-green-600 text-white" :
                    "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                  )}>
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
            <Button
              variant="outline"
              onClick={saveDraft}
              className="gap-2"
            >
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
                    Creating...
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
        className="fixed bottom-4 right-4 w-14 h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg flex items-center justify-center z-20"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowHelp(!showHelp)}
      >
        <HelpCircle className="w-6 h-6" />
      </motion.button>

      {/* Help Panel */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-900 shadow-2xl z-30 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Help & Tips</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHelp(false)}
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
                        <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">→</kbd>
                      </div>
                      <div className="flex justify-between">
                        <span>Previous step</span>
                        <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">←</kbd>
                      </div>
                      <div className="flex justify-between">
                        <span>Save draft</span>
                        <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">Ctrl+S</kbd>
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
        )}
      </AnimatePresence>
    </div>
  );
}