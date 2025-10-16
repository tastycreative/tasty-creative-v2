export interface ScheduledContent {
  id: number | string
  page: string // Creator/model name
  scheduleTab: string
  type: 'MM' | 'Post' // Mass Message or Wall Post
  scheduledDate: string // M/D/YYYY format
  timePST: string
  messageType: 'PPV' | 'PPV Follow Up' | 'Sexting Set Bump'
  contentStyle?: string
  contentPreview?: string // URL to content
  paywallContent?: string // Description of paywall content
  caption?: string
  captionStyle?: string
  price?: string
  outcome?: string
  notes?: string
  status: 'scheduled' | 'published'
  createdAt?: string
}

export interface ScheduleStats {
  total: number
  byMessageType: Record<string, number>
  byPage: Record<string, number>
  byScheduleTab: Record<string, number>
  byType: Record<string, number>
  byOutcome: Record<string, number>
}

export interface ScheduleResponse {
  items: ScheduledContent[]
  stats: ScheduleStats
  availablePages: string[]
  availableScheduleTabs: string[]
  availableMessageTypes: string[]
  availableTypes: string[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    hasNextPage: boolean
    hasPreviousPage: boolean
    itemsPerPage: number
  }
}

export interface ScheduleFilters {
  page?: string // Creator/model name
  schedule_tab?: string
  message_type?: 'PPV' | 'PPV Follow Up' | 'Sexting Set Bump'
  type?: 'MM' | 'Post'
  content_style?: string
  outcome?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  pageNumber?: number
  limit?: number
}
