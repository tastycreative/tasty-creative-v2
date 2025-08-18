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
    <div className="border border-pink-200 dark:border-pink-500/30 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg">
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

    {/* Task List - Match exact structure */}
    <div className="border border-pink-200 dark:border-pink-500/30 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg">
      <div className="bg-gradient-to-r from-pink-50/50 to-rose-50/50 dark:from-pink-900/30 dark:to-rose-900/30 border-b border-pink-200 dark:border-pink-500/30 p-6">
        <h2 className="text-gray-900 dark:text-gray-100 font-bold flex items-center text-lg">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mr-3">
            <span className="text-white text-sm">👤</span>
          </div>
          Recent Tasks
        </h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="p-4 rounded-lg border border-pink-200 dark:border-pink-500/30 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              {/* Member Header */}
              <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-pink-200 dark:border-pink-500/30">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                  <Skeleton className="h-3 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                    <Skeleton className="h-4 w-24" />
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    <Skeleton className="h-3 w-16" />
                  </p>
                </div>
              </div>
              
              {/* Task List */}
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, taskIndex) => (
                  <div key={taskIndex} className="flex items-center justify-between p-3 rounded-lg border transition-colors bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-600">
                    <div className="flex items-center space-x-3 flex-1">
                      {/* Status Icon */}
                      <div className="p-1 rounded-full bg-gray-100 dark:bg-gray-700">
                        <Skeleton className="h-3 w-3" />
                      </div>
                      
                      {/* Task Title */}
                      <span className="text-sm font-medium flex-1 text-gray-900 dark:text-gray-100">
                        <Skeleton className="h-4 w-32" />
                      </span>
                    </div>
                    
                    {/* Status Badge */}
                    <span className="text-xs px-2 py-1 rounded-full font-medium bg-gray-100 dark:bg-gray-700">
                      <Skeleton className="h-3 w-12" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export { Skeleton }
