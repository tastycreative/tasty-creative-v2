import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

// Specialized skeleton components for PodComponent
export const TeamMemberSkeleton = () => (
  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
    <Skeleton className="h-4 w-24" />
    <Skeleton className="h-5 w-16 rounded-full" />
  </div>
);

export const CreatorSkeleton = () => (
  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
    <div className="flex-1">
      <Skeleton className="h-4 w-28" />
    </div>
    <Skeleton className="h-5 w-12 rounded-full" />
  </div>
);

export const SheetLinkSkeleton = () => (
  <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-500/30 rounded-lg">
    <div className="flex items-start space-x-3">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  </div>
);

export const SheetIntegrationSkeleton = () => (
  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-500/30 rounded-lg">
    <div className="flex items-start space-x-3">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  </div>
);

export const TeamSelectorSkeleton = () => (
  <div className="space-y-3">
    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
      Switch Team:
    </label>
    <Skeleton className="h-10 w-full rounded-lg" />
  </div>
);

export const WorkflowDashboardSkeleton = () => (
  <div className="space-y-6">
    {/* Dashboard Header - Match exact structure */}
    <div className=" shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg">
      <div className="bg-gradient-to-r from-pink-50/50 to-rose-50/50 dark:from-pink-900/30 dark:to-rose-900/30 border-b border-pink-200 dark:border-pink-500/30 p-6">
        <h2 className="text-gray-900 dark:text-gray-100 font-bold flex items-center text-2xl">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mr-4">
            <span className="h-5 w-5 text-white text-lg">📋</span>
          </div>
          POD Workflow Dashboard
        </h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Overall Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Overall Progress</h3>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                <Skeleton className="h-4 w-20 inline-block" />
              </span>
            </div>
            <Skeleton className="h-3 w-full rounded-full" />
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <Skeleton className="h-3 w-32 inline-block" />
            </div>
          </div>

          {/* Status Summary */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Status Summary</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  <Skeleton className="h-7 w-6 mx-auto" />
                </div>
                <p className="text-xs text-green-700 dark:text-green-300">Completed</p>
              </div>
              <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  <Skeleton className="h-7 w-6 mx-auto" />
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300">In Progress</p>
              </div>
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                <div className="text-lg font-bold text-gray-600 dark:text-gray-400">
                  <Skeleton className="h-7 w-6 mx-auto" />
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300">Not Started</p>
              </div>
              <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-lg font-bold text-red-600 dark:text-red-400">
                  <Skeleton className="h-7 w-6 mx-auto" />
                </div>
                <p className="text-xs text-red-700 dark:text-red-300">Cancelled</p>
              </div>
            </div>
          </div>

          {/* Team Performance */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Team Performance</h3>
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      <Skeleton className="h-3 w-20 inline-block" />
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      <Skeleton className="h-3 w-8 inline-block" />
                    </span>
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Recent Tasks and Pricing Guide - Side by Side */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Tasks */}
      <div className="bg-white border-0 dark:bg-gray-900 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-none dark:ring-1 dark:ring-gray-800 overflow-hidden">
        <div className="border-b border-gray-100 dark:border-gray-700 p-6">
          <div className="text-gray-900 dark:text-gray-100 font-bold flex items-center text-lg">
            <div className="p-2 bg-gradient-to-r from-pink-500 to-rose-600 rounded-lg mr-3">
              <span className="h-5 w-5 text-white text-lg flex items-center justify-center">👤</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Tasks
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Latest team activity and progress
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {/* Tasks Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <div className="text-sm font-semibold text-gray-900 dark:text-white text-left">
                  Task
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white text-center">
                  Assignee
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white text-right">
                  Status
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="grid grid-cols-3 gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                          <Skeleton className="h-3 w-3" />
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white hidden sm:inline">
                          <Skeleton className="h-4 w-16" />
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <div className="p-1 rounded-full bg-gray-100 dark:bg-gray-700">
                          <Skeleton className="h-3 w-3" />
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-gray-100 dark:bg-gray-700">
                          <Skeleton className="h-3 w-12" />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="text-center py-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                <Skeleton className="h-4 w-20 mx-auto" />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                <Skeleton className="h-3 w-32 mx-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Guide Shortcut */}
      <div className="bg-white border-0 dark:bg-gray-900 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-none dark:ring-1 dark:ring-gray-800 overflow-hidden">
        <div className="border-b border-gray-100 dark:border-gray-700 p-6">
          <div className="text-gray-900 dark:text-gray-100 font-bold flex items-center justify-between text-lg">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg mr-3">
                <span className="h-5 w-5 text-white">✨</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Pricing Guide
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Quick preview of content pricing
                </p>
              </div>
            </div>
            <div className="text-purple-600 dark:text-purple-400">
              <Skeleton className="h-4 w-4" />
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {/* Mini Pricing Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <div className="text-sm font-semibold text-gray-900 dark:text-white text-left">
                  Content Item
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white text-right">
                  Price
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="grid grid-cols-2 gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-300 tabular-nums">
                        <Skeleton className="h-4 w-8" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress Bar Skeleton */}
            <div className="px-4">
              <Skeleton className="h-1 w-full rounded-full" />
            </div>

            {/* Summary */}
            <div className="text-center py-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                <Skeleton className="h-4 w-24 mx-auto" />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                <Skeleton className="h-3 w-32 mx-auto" />
              </div>
            </div>

            {/* View All Button */}
            <div className="w-full mt-4">
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Admin Users Skeleton Components
export const UserCardSkeleton = () => (
  <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300">
    <div className="flex items-start space-x-4">
      {/* Avatar skeleton */}
      <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            {/* Name skeleton */}
            <Skeleton className="h-4 w-32 mb-2" />
            {/* Email skeleton */}
            <Skeleton className="h-3 w-48 mb-1" />
            {/* Date skeleton */}
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="flex flex-col items-end space-y-2 ml-2">
            {/* Role badge skeleton */}
            <Skeleton className="h-6 w-20 rounded-full" />
            {/* Edit button skeleton */}
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const UserTableRowSkeleton = () => (
  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 group">
    {/* User Details Column */}
    <td className="px-4 py-4 whitespace-nowrap">
      <div className="flex items-center">
        {/* Avatar skeleton */}
        <Skeleton className="h-10 w-10 rounded-full mr-3 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          {/* Name skeleton */}
          <Skeleton className="h-4 w-32 mb-1" />
          {/* ID skeleton */}
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </td>
    
    {/* Contact Column */}
    <td className="px-4 py-4 whitespace-nowrap">
      <div className="min-w-0">
        {/* Email skeleton */}
        <Skeleton className="h-4 w-40 mb-1" />
        {/* Verification status skeleton */}
        <Skeleton className="h-3 w-24" />
      </div>
    </td>
    
    {/* Role Column */}
    <td className="px-4 py-4 whitespace-nowrap">
      <Skeleton className="h-6 w-20 rounded-full" />
    </td>
    
    {/* Account Info Column */}
    <td className="px-4 py-4 whitespace-nowrap">
      <div className="min-w-0">
        {/* Date skeleton */}
        <Skeleton className="h-4 w-24 mb-1" />
        {/* Day skeleton */}
        <Skeleton className="h-3 w-16" />
      </div>
    </td>
    
    {/* Actions Column */}
    <td className="px-4 py-4 whitespace-nowrap">
      <div className="flex items-center space-x-1 min-w-0">
        {/* Edit button skeleton */}
        <Skeleton className="h-6 w-12" />
        {/* More button skeleton */}
        <Skeleton className="h-6 w-6 rounded" />
      </div>
    </td>
  </tr>
);

export const UserListSkeleton = ({ count = 10 }: { count?: number }) => (
  <>
    {/* Mobile Card View Skeleton */}
    <div className="block lg:hidden">
      <div className="divide-y divide-pink-200 dark:divide-pink-500/30">
        {Array.from({ length: count }).map((_, i) => (
          <UserCardSkeleton key={i} />
        ))}
      </div>
    </div>

    {/* Desktop Table View Skeleton */}
    <div className="hidden lg:block">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[750px]">
          <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
            <tr className="border-b border-pink-200 dark:border-pink-500/30">
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[200px]">
                User Details
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[180px]">
                Contact
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[140px]">
                Role & Permissions
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[120px]">
                Account Info
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[160px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pink-200 dark:divide-pink-500/30 bg-white dark:bg-gray-800">
            {Array.from({ length: count }).map((_, i) => (
              <UserTableRowSkeleton key={i} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </>
);

// Activity History Skeleton Components
export const ActivityCardSkeleton = () => (
  <div className="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300">
    <div className="space-y-3">
      {/* Header: Action Type + Time */}
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-4 w-16" />
      </div>

      {/* Actor and Target Users */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Actor */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 sm:p-3">
          <div className="flex items-center mb-1">
            <Skeleton className="h-3 w-3 mr-1" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-6 w-6 sm:h-8 sm:w-8 rounded-full flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-3 sm:h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>

        {/* Target User */}
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2 sm:p-3">
          <div className="flex items-center mb-1">
            <Skeleton className="h-3 w-3 mr-1" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-6 w-6 sm:h-8 sm:w-8 rounded-full flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-3 sm:h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Role Change */}
      <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-2 sm:p-3">
        <div className="flex items-center mb-2">
          <Skeleton className="h-3 w-3 mr-1" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="flex items-center justify-center space-x-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>

      {/* Timezone info */}
      <div className="flex items-center justify-center gap-1 pt-1 border-t border-gray-200 dark:border-gray-600">
        <Skeleton className="h-3 w-3" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  </div>
);

export const ActivityTableRowSkeleton = () => (
  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300">
    {/* Action Type */}
    <td className="px-2 py-4 whitespace-nowrap">
      <Skeleton className="h-6 w-20 rounded-full" />
    </td>

    {/* Actor */}
    <td className="px-2 py-4">
      <div className="flex items-center min-w-0">
        <Skeleton className="h-8 w-8 rounded-full mr-2 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    </td>

    {/* Target User */}
    <td className="px-2 py-4">
      <div className="flex items-center min-w-0">
        <Skeleton className="h-8 w-8 rounded-full mr-2 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    </td>

    {/* Role Change */}
    <td className="px-2 py-4">
      <div className="flex items-center space-x-1 min-w-0">
        <Skeleton className="h-6 w-12 rounded-full flex-shrink-0" />
        <Skeleton className="h-3 w-3 flex-shrink-0" />
        <Skeleton className="h-6 w-12 rounded-full flex-shrink-0" />
      </div>
    </td>

    {/* Reason */}
    <td className="px-2 py-4">
      <Skeleton className="h-4 w-20" />
    </td>

    {/* Date & Time */}
    <td className="px-2 py-4 whitespace-nowrap">
      <div className="flex items-center gap-1">
        <Skeleton className="h-3 w-3 flex-shrink-0" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-3 w-24 mt-1" />
    </td>
  </tr>
);

export const ActivityHistorySkeleton = ({ count = 10 }: { count?: number }) => (
  <>
    {/* Mobile Card View Skeleton */}
    <div className="block lg:hidden">
      <div className="divide-y divide-pink-200 dark:divide-pink-500/30">
        {Array.from({ length: count }).map((_, i) => (
          <ActivityCardSkeleton key={i} />
        ))}
      </div>
    </div>

    {/* Desktop Table View Skeleton */}
    <div className="hidden lg:block overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[750px]">
          <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
            <tr className="border-b border-pink-200 dark:border-pink-500/30">
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[90px]">
                Action
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[140px]">
                Performed By
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[140px]">
                Target User
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[150px]">
                Role Change
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[120px]">
                Reason
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[130px]">
                Date & Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pink-200 dark:divide-pink-500/30 bg-white dark:bg-gray-800">
            {Array.from({ length: count }).map((_, i) => (
              <ActivityTableRowSkeleton key={i} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </>
);

export { Skeleton }
