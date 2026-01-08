// Shared types for Modular Workflow Wizard

import { LucideIcon } from "lucide-react";
import { TaskAttachment } from "@/lib/stores/boardStore";

// Core Types
export type SubmissionType = "otp" | "ptr";
export type ContentStyle = "normal" | "poll" | "game" | "ppv" | "bundle";
export type ComponentModule = "pricing" | "release" | "upload";
export type Platform = "onlyfans" | "fansly";

// Form Data Interface
export interface ModularFormData {
  submissionType: SubmissionType;
  contentStyle: ContentStyle;
  selectedComponents: ComponentModule[];
  platform: Platform;

  // Base fields
  model: string;
  priority: string;
  driveLink: string;
  caption?: string;
  pricingCategory?: string;

  // Content Details fields
  contentType?: string;
  contentLength?: string;
  contentCount?: string;

  // Tags fields
  contentTags?: string[];
  externalCreatorTags?: string;
  internalModelTags?: string[];

  // PPV/Bundle specific fields
  originalPollReference?: string;

  // Release schedule fields
  releaseDate?: string;
  releaseTime?: string;
  releaseTimezone?: string;

  // Component fields (dynamic)
  [key: string]: any;
}

// Template System
export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  submissionType: SubmissionType;
  contentStyle: ContentStyle;
  components: ComponentModule[];
  icon: LucideIcon;
  color: string;
  popularity: number;
  estimatedTime: string;
  tags: string[];
}

// Style Template
export interface StyleTemplate {
  id: ContentStyle;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  preview: string;
  teams: string[];
  priority: boolean;
  submissionTypes: SubmissionType[];
}

// Component Module Definition
export interface ComponentModuleDefinition {
  id: ComponentModule;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  recommended: string[];
  required: boolean;
  features: string[];
  estimatedTime: string;
}

// Wizard Step
export interface WizardStep {
  id: string;
  title: string;
  icon: LucideIcon;
  description: string;
}

// Model
export interface Model {
  id?: string;
  name: string;
  image?: string;
  profile?: string;
  status?: string;
}

// Content Type Option (from database)
export interface ContentTypeOption {
  id: string;
  value: string;
  label: string;
  category: string;
  priceType?: string;
  priceFixed?: number;
  priceMin?: number;
  priceMax?: number;
  description?: string;
}

// Workflow Route
export interface WorkflowRoute {
  name: string;
  type: "primary" | "secondary" | "final";
}

// Wizard Context (for sharing state across steps)
export interface WizardContextValue {
  // Form state
  formData: ModularFormData;
  setValue: (field: keyof ModularFormData, value: any) => void;
  watch: <T = any>(field: keyof ModularFormData) => T;
  getValues: () => ModularFormData;

  // Wizard state
  currentStep: number;
  completedSteps: number[];
  isSubmitting: boolean;
  submissionProgress: string;

  // File state
  attachments: TaskAttachment[];
  setAttachments: React.Dispatch<React.SetStateAction<TaskAttachment[]>>;
  localFiles: any[];
  setLocalFiles: React.Dispatch<React.SetStateAction<any[]>>;

  // Model state
  models: Model[];
  loadingModels: boolean;
  internalModels: any[];

  // Content type state
  contentTypeOptions: ContentTypeOption[];
  loadingContentTypes: boolean;
  selectedContentTypeOption: ContentTypeOption | null;
  setSelectedContentTypeOption: React.Dispatch<
    React.SetStateAction<ContentTypeOption | null>
  >;

  // Internal model selection
  selectedInternalModels: string[];
  setSelectedInternalModels: React.Dispatch<React.SetStateAction<string[]>>;
  showModelSelector: boolean;
  setShowModelSelector: React.Dispatch<React.SetStateAction<boolean>>;

  // Team state
  selectedTeamId: string | null;
  currentTeam: any;
  availableTeams: any[];
}

// Timezone options
export const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "UTC (GMT+0)" },
  { value: "EST", label: "EST (GMT-5)" },
  { value: "CST", label: "CST (GMT-6)" },
  { value: "MST", label: "MST (GMT-7)" },
  { value: "PST", label: "PST (GMT-8)" },
  { value: "GMT", label: "GMT (GMT+0)" },
  { value: "CET", label: "CET (GMT+1)" },
  { value: "EET", label: "EET (GMT+2)" },
  { value: "JST", label: "JST (GMT+9)" },
  { value: "AEST", label: "AEST (GMT+10)" },
];

// Content type options
export const CONTENT_TYPE_OPTIONS = [
  { value: "photo", label: "Photo" },
  { value: "video", label: "Video" },
  { value: "photo-set", label: "Photo Set" },
  { value: "video-set", label: "Video Set" },
  { value: "mixed", label: "Mixed (Photos + Videos)" },
  { value: "gif", label: "GIF" },
  { value: "live", label: "Livestream" },
  { value: "audio", label: "Audio" },
  { value: "text", label: "Text Only" },
];
