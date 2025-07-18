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
