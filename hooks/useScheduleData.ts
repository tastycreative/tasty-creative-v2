import { useQuery } from '@tanstack/react-query'
import type { ScheduleFilters, ScheduleResponse } from '@/types/schedule'

/**
 * Custom hook to fetch scheduled content data
 *
 * @param filters - Filters to apply to the schedule data
 * @returns React Query result with schedule data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useScheduleData({
 *   page: 'DAKOTA FREE',
 *   message_type: 'PPV',
 *   schedule_tab: 'Schedule #1A',
 *   type: 'MM'
 * })
 * ```
 */
export function useScheduleData(filters: ScheduleFilters = {}) {
  return useQuery<ScheduleResponse>({
    queryKey: ['schedule', filters],
    queryFn: async () => {
      const params = new URLSearchParams()

      // Add all filter parameters
      if (filters.page) params.set('page', filters.page)
      if (filters.schedule_tab) params.set('schedule_tab', filters.schedule_tab)
      if (filters.message_type) params.set('message_type', filters.message_type)
      if (filters.type) params.set('type', filters.type)
      if (filters.content_style) params.set('content_style', filters.content_style)
      if (filters.outcome) params.set('outcome', filters.outcome)
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.set('dateTo', filters.dateTo)
      if (filters.search) params.set('q', filters.search)
      if (filters.pageNumber) params.set('pageNumber', filters.pageNumber.toString())
      if (filters.limit) params.set('limit', filters.limit.toString())

      const res = await fetch(`/api/schedule?${params.toString()}`)

      if (!res.ok) {
        throw new Error(`Failed to fetch schedule data: ${res.statusText}`)
      }

      return res.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2
  })
}

/**
 * Hook to clear schedule cache
 */
export function useClearScheduleCache() {
  return async () => {
    try {
      await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clearCache' })
      })
    } catch (error) {
      console.error('Failed to clear cache:', error)
    }
  }
}
