// Gallery System Type Definitions

export interface GalleryItem {
  id: string;
  sheetRowId: string;
  title: string;
  captionText: string;
  price: number;
  totalBuys: number;
  totalRevenue: number;
  category: string;
  dateAdded: string;
  contentStyle?: string;
  messageType?: string;
  gifUrl?: string;
  previewUrl?: string;
  contentType: "FAVORITE" | "RELEASE" | "LIBRARY";
  usageCount?: number;
  lastUsed?: Date | null;
  notes?: string;
  isFavorite?: boolean;
  isRelease?: boolean;
  isPTR?: boolean;
  creatorName?: string;
  tableName?: string; // Table name from Supabase (e.g., 'gs_dakota_free')
  // New fields from actual sheet structure
  scheduleTab?: string;
  type?: string; // MM or Post
  timePST?: string;
  paywallContent?: string;
  captionStyle?: string;
  outcome?: string; // Good, Bad, etc.
  scheduledDate?: string;
  // PTR rotation fields
  rotationStatus?: "Active" | "Resting" | "Ready";
  daysSinceLastSent?: number | null;
  isReadyForRotation?: boolean;
  performanceHistory?: Array<{
    sentDate: string;
    result?: "good" | "bad" | "pending";
  }>;
  ptrSent?: boolean;
  dateMarkedSent?: string;
  markedBy?: string;
  
  // Alias fields for compatibility
  caption?: string; // alias for captionText
  revenue?: number; // alias for totalRevenue
  purchases?: number; // alias for totalBuys
  mediaUrl?: string; // alias for gifUrl or previewUrl
  thumbnailUrl?: string; // alias for previewUrl
}

export interface FilterState {
  search: string;
  category: string;
  creator: string;
  messageType: string;
  outcome: string;
  sortBy: string;
  revenue: string;
  contentTypeFilter?: string; // MM or Post filter
}

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  startIndex?: number;
  endIndex?: number;
}

export interface StatsCardsProps {
  items: GalleryItem[];
  className?: string;
}

export interface PaginationProps {
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  className?: string;
  showItemsPerPageSelector?: boolean;
  itemsPerPageOptions?: number[];
}

export enum SortOption {
  MOST_REVENUE = 'revenue',
  MOST_POPULAR = 'purchases',
  BEST_SUCCESS = 'outcome_success',
  BY_CONTENT_TYPE = 'content_type',
  BY_CREATOR = 'creator',
  HIGHEST_PRICE = 'price_high',
  LOWEST_PRICE = 'price_low',
  NEWEST = 'newest',
  BEST_ROI = 'roi'
}

export interface ContentCardProps {
  content: GalleryItem;
  onToggleFavorite?: (content: GalleryItem) => Promise<void> | void;
  onTogglePTR?: (content: GalleryItem) => Promise<void> | void;
  onMarkPTRAsSent?: (content: GalleryItem) => Promise<void> | void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (id: string) => void;
}

export interface MediaDisplayProps {
  content: GalleryItem;
  mediaUrl: string;
  isGif: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export interface CardActionsProps {
  content: GalleryItem;
  onToggleFavorite: () => void;
  onTogglePTR: () => void;
  onMarkPTRAsSent?: () => void;
}

export interface CardMetadataProps {
  content: GalleryItem;
}