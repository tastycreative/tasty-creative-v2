// Shared types and constants for Modular Workflow Form

export type SubmissionType = "otp" | "ptr";
export type ContentStyle = "normal" | "poll" | "game" | "livestream";
export type ComponentModule = "release" | "upload";

export interface ModularFormData {
  submissionType: SubmissionType;
  contentStyle: ContentStyle;
  selectedComponents: ComponentModule[];

  // Base fields
  model: string;
  priority: string;
  driveLink: string;
  caption?: string;

  // NEW FIELDS - Content Details
  contentType?: string;
  contentLength?: string;
  contentCount?: string;
  contentTags?: string[];
  externalCreatorTags?: string;
  internalModelTags?: string[];

  // Team assignment fields
  // Component fields (dynamic based on selection)
  [key: string]: any;
}

export interface Model {
  id?: string;
  name: string;
  image?: string;
  profile?: string;
  status?: string;
}

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  submissionType: SubmissionType;
  contentStyle: ContentStyle;
  components: ComponentModule[];
  icon: any;
  color: string;
}

export interface StyleTemplate {
  id: ContentStyle;
  name: string;
  description: string;
  features: string[];
  icon: any;
  requiredComponents: ComponentModule[];
  recommendedComponents: ComponentModule[];
}

export interface ComponentModuleDefinition {
  id: ComponentModule;
  name: string;
  description: string;
  icon: any;
  color: string;
  requiredFields?: string[];
}

// Content Type Options (13 types from Tasty Content Inventories)
export const CONTENT_TYPE_OPTIONS = [
  { value: 'BG', label: 'BG (Boy/Girl)' },
  { value: 'BGG', label: 'BGG (Boy/Girl/Girl)' },
  { value: 'GG', label: 'GG (Girl/Girl)' },
  { value: 'GGG', label: 'GGG (Girl/Girl/Girl)' },
  { value: 'ORGY', label: 'Orgy' },
  { value: 'SOLO', label: 'Solo' },
  { value: 'COMPILATION', label: 'Compilation' },
  { value: 'AHEGAO', label: 'Ahegao' },
  { value: 'JOI', label: 'JOI (Jerk Off Instructions)' },
  { value: 'THANK_YOU_VIDS', label: 'Thank you Vids' },
  { value: 'VIP_GIFTS', label: 'VIP GIFTS' },
  { value: 'BJ', label: 'BJ (Blowjob)' },
  { value: 'FEET', label: 'FEET' },
];

// Timezone options
export const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: 'UTC (GMT+0)' },
  { value: 'EST', label: 'EST (GMT-5)' },
  { value: 'CST', label: 'CST (GMT-6)' },
  { value: 'MST', label: 'MST (GMT-7)' },
  { value: 'PST', label: 'PST (GMT-8)' },
  { value: 'GMT', label: 'GMT (GMT+0)' },
  { value: 'CET', label: 'CET (GMT+1)' },
  { value: 'EET', label: 'EET (GMT+2)' },
  { value: 'JST', label: 'JST (GMT+9)' },
  { value: 'AEST', label: 'AEST (GMT+10)' },
];
