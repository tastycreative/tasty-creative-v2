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

type Role = "USER" | "GUEST" | "ADMIN" | "MODERATOR";

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


