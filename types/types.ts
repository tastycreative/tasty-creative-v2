/* eslint-disable @typescript-eslint/no-unused-vars */
type AuthResponse = {
  error?: string;
  success?: boolean;
};

type User = {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
  image: string | null;
  createdAt: Date;
};

type Role = "USER" | "GUEST" | "ADMIN" | "MODERATOR" | "SWD";

interface UserRoleFormProps {
  userId: string;
  currentRole: Role;
  userName: string;
  isCurrentUser: boolean;
}

interface NavigationMenuProps {
  scrollToSection: (ref: React.RefObject<HTMLDivElement>) => void;
  menuOpen: boolean;
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  heroRef: React.RefObject<HTMLDivElement>;
  aboutRef: React.RefObject<HTMLDivElement>;
  servicesRef: React.RefObject<HTMLDivElement>;
  workRef: React.RefObject<HTMLDivElement>;
  contactRef: React.RefObject<HTMLDivElement>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
}

interface CalendarEvent {
  id?: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
  };
  location?: string;
  description?: string;
  creator?: {
    email: string;
    displayName?: string;
  };
  organizer?: {
    email: string;
    displayName?: string;
  };
  attendees?: EventAttendee[];
  conferenceData?: EventConferenceData;
  status?: string;
  htmlLink?: string;
  colorId?: string;
}

interface EventConferenceData {
  conferenceId: string;
  conferenceSolution?: {
    key: {
      type: string;
    };
    name: string;
    iconUri: string;
  };
  entryPoints?: Array<{
    entryPointType: string;
    uri: string;
    label?: string;
  }>;
}

interface EventAttendee {
  email: string;
  displayName?: string;
  responseStatus?: string;
  organizer?: boolean;
  self?: boolean;
}

interface NotificationData {
  message: string;
  timestamp: string;
  editedBy: string;
  editedData: {
    [key: string]: string; // Assuming editedData contains key-value pairs where keys are strings and values are strings
  };
  model: string;
  row: string;
  sheet: string;
}

type ModelsDropdownProps = {
  formData: ModelFormData;
  setFormData: React.Dispatch<React.SetStateAction<ModelFormData>>;
  isLoading?: boolean;
  isFetchingImage?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webhookData?: any;
  error?: string;
  setFieldErrors?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onPermissionsLoaded?: () => void;
};

type ModelFormData = {
  model?: string;
  date?: string;
  time?: string;
  timezone?: string;
  imageUrl?: string;
  imageName?: string;
  imageFile?: File;
  paid?: boolean;
  customImage?: boolean;
  imageId?: string;
  noOfTemplate?: number;
  customRequest?: boolean;
  customDetails?: string;
  type?: string;
  croppedImage?: string | null;
  templatePosition?: string;
  options?: string[];
  header?: string;
  tip?: number;
  gets?: number;
  croppedImageLeft?: string | null;
  croppedImageRight?: string | null;
  datetmz?: string | null;
};

type Model = {
  name: string;
  profile: string;
  status: string;
};

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  thumbnailLink?: string;
}

type GoogleDriveFile = {
  id: string;
  name: string;
  mimeType?: string;
  isFolder?: boolean;
  thumbnailLink?: string;
  webViewLink?: string;
};

type WebhookResponse = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  error?: string;
};

type FolderInfo = {
  id: string;
  name: string;
};

type BlurSettings = {
  blurType: "gaussian" | "pixelated" | "mosaic";
  blurIntensity: number;
  brushSize: number;
};

type GifSettings = {
  maxDuration: number;
  fps: number;
  quality: number;
};

type Layout =
  | "Single"
  | "Side by Side"
  | "Horizontal Triptych"
  | "Vertical Triptych"
  | "2x2 Grid";

interface ApiKeyBalance {
  character?: {
    limit: number;
    remaining: number;
    used: number;
  };
  status?: string;
}

interface Voice {
  name: string;
  voiceId: string;
  category?: string;
}

interface HistoryItem {
  history_item_id: string;
  text: string;
  date_unix: number;
  voice_id: string;
  voice_name?: string;
}

interface HistoryAudio {
  audioUrl: string;
  audioBlob: Blob;
}

interface GeneratedAudio {
  audioUrl: string;
  audioBlob: Blob;
  profile?: string;
  voiceName?: string;
}

// types/models.ts
type ModelStatus = "active" | "dropped";

interface ModelDetails {
  id: string;
  name: string;
  status: "active" | "dropped";
  launchDate: string;
  referrerName: string;
  personalityType: string;
  commonTerms: string[];
  commonEmojis: string[];
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  chattingManagers: string[]; // From "General client notes/requests"? If not, default to []
  profileImage?: string;
  stats?: {
    totalRevenue: number;
    monthlyRevenue: number;
    subscribers: number;
    avgResponseTime: string;
  };
}

interface ModelAsset {
  id: string;
  modelId: string;
  type: "all" | "live" | "vip" | "ftt" | string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  createdAt: string;
  size?: number;
}

interface ModelChatter {
  id: string;
  modelId: string;
  name: string;
  username: string;
  lastActive: string;
  totalSpent: number;
  messageCount: number;
  status: "online" | "offline" | "away";
  tier: "whale" | "regular" | "new";
  notes?: string;
}

interface Asset {
  "Request ID": string;
  "Final Output"?: string | { value: string; formula: string };
  "PSD File"?: string | { value: string; formula: string };
  Date?: string;
  Model?: string;
  "Created by"?: string;
  type: "vip" | "live" | "ftt";
}

interface ModelAssetsTabProps {
  modelName: string;
}

interface ModelCardProps {
  model: ModelDetails;
  index: number;
  onClick: () => void;
}

interface ModelDetailsModalProps {
  model: ModelDetails;
  isOpen: boolean;
  onClose: () => void;
}

interface ModelDetailsTabsProps {
  activeTab: "info" | "assets" | "chatters" | "apps";
  setActiveTab: (tab: "info" | "assets" | "chatters" | "apps") => void;
}

interface ModelInfoTabProps {
  model: ModelDetails;
}

interface ModelsListProps {
  models: ModelDetails[];
  onModelClick: (model: ModelDetails) => void;
}

interface ModelsHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: ModelStatus | "all";
  setStatusFilter: (status: ModelStatus | "all") => void;
  totalModels: number;
  activeModels: number;
}

interface Chatter {
  id: string;
  name: string;
  status: "online" | "offline" | "busy";
  assignedDate: string;
  totalChats: number;
  activeChats: number;
  revenue: number;
  avgResponseTime: string;
  lastActive: string;
}

interface ModelChattersTabProps {
  modelName: string;
}

interface ClientData {
  clientName: string;
  chatters: string;
  chattingManagers: string;
}

// Video Editor Types
// Transform properties for clip positioning and scaling
interface ClipTransform {
  scale: number; // Scale factor (1.0 = 100%, 0.5 = 50%, 2.0 = 200%)
  positionX: number; // X position in pixels from center
  positionY: number; // Y position in pixels from center
  rotation: number; // Rotation in degrees
  fitMode: "contain" | "cover" | "fill"; // How video fits in canvas
  crop?: {
    top: number; // Crop in pixels or percentage
    right: number;
    bottom: number;
    left: number;
  };
  // Frame/border styling for visual separation in multi-layout modes
  frame?: {
    show: boolean;
    style: "border" | "outline" | "shadow" | "glow";
    width: number; // Border width in pixels
    radius: number; // Corner radius in pixels
    opacity: number; // 0-1 opacity
    color: string; // CSS color value
    includeInExport: boolean; // Whether to include frame in final render
  };
  // Optional keyframe support for future animation
  keyframes?: Array<{
    time: number; // Frame number
    transform: Partial<Omit<ClipTransform, "keyframes">>;
  }>;
}

interface Clip {
  id: string;
  start: number;
  duration: number;
  src: string;
  row: number;
  type: "video" | "image"; // Add type to differentiate between video and image clips
  fileName?: string; // Optional filename for better labeling
  startFrom?: number; // Start offset within the video file (for split clips)
  // Position and size properties for draggable/resizable image clips
  x?: number; // X position as percentage (0-100)
  y?: number; // Y position as percentage (0-100)
  width?: number; // Width as percentage (0-100)
  height?: number; // Height as percentage (0-100)
  // 2D rotation (degrees). Only applied for image clips.
  rotation?: number;
  // Intrinsic media dimensions for accurate transform calculations
  intrinsicWidth?: number;
  intrinsicHeight?: number;
  // New transform properties for advanced positioning
  transform?: ClipTransform;
  // Auto-fit flag - when true, clip automatically fits to layout cell
  autoFit?: boolean;
}

interface TextOverlay {
  id: string;
  start: number;
  duration: number;
  text: string;
  row: number;
  // Position and size properties for draggable/resizable functionality
  x?: number; // X position as percentage (0-100)
  y?: number; // Y position as percentage (0-100)
  width?: number; // Width as percentage (0-100)
  height?: number; // Height as percentage (0-100)
  fontSize?: number; // Font size
  color?: string; // Text color
  backgroundColor?: string; // Background color when editing or for label
  fontFamily?: string; // Font family
  fontWeight?: "normal" | "bold" | number; // Font weight
  textAlign?: "left" | "center" | "right"; // Alignment
  // 2D rotation (degrees)
  rotation?: number;
}

interface BlurOverlay {
  id: string;
  start: number;
  duration: number;
  row: number;
  // Position and size properties for draggable/resizable functionality
  x?: number; // X position as percentage (0-100)
  y?: number; // Y position as percentage (0-100)
  width?: number; // Width as percentage (0-100)
  height?: number; // Height as percentage (0-100)
  blurIntensity?: number; // Blur intensity in pixels
  // Blur type and shape
  blurType?: "gaussian" | "pixelate" | "mosaic";
  shape?: "rectangle" | "circle";
  // 2D rotation (degrees)
  rotation?: number;
}


interface Creator {
  id: string;
  name: string;
  guaranteed?: string;
  status?: string;
  launchDate?: string;
  referrerName?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  profileLink?: string;
  personalityType?: string;
  commonTerms?: string;
  commonEmojis?: string;
  restrictedTermsEmojis?: string;
  notes?: string;
  generalNotes?: string;
  contentDetails?: any;
  modelDetails?: {
    id: string;
    full_name?: string;
    age?: string;
    birthday?: string;
    height?: string;
    weight?: string;
    clothing_size?: string;
    ethnicity?: string;
    birthplace?: string;
    current_city?: string;
    timezone?: string;
    background?: string;
    favorite_colors?: string;
    interests?: string;
    personality?: string;
    amazon_wishlist?: string;
    clothing_items?: string;
    content_offered?: string;
    custom_min_price?: string;
    favorite_emojis?: string;
    keywords?: string;
    limitations?: string;
    oftv_channel_interest?: string;
    tone_language?: string;
    video_call_min_price?: string;
    client_name?: string;
    mm_restrictions?: string;
    verbiage_restrictions?: string;
    wall_restrictions?: string;
  };
}

interface PricingGroup {
  id: string;
  groupName: string;
  items: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
  pricing: Record<string, Record<string, string>>;
}

interface CreatorsData {
  creators: Creator[];
  pricingData: PricingGroup[];
}