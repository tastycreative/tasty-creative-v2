"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { motion } from "framer-motion";
import {
  CheckSquare,
  AlertTriangle,
  Users,
  DollarSign,
  TrendingUp,
  Package,
  Calendar,
  BarChart3,
} from "lucide-react";

// Components
import QuickStatsCard from "@/components/pod-new/features/dashboard/QuickStatsCard";
import TaskPipelineChart from "@/components/pod-new/features/dashboard/TaskPipelineChart";
import PriorityDonutChart from "@/components/pod-new/features/dashboard/PriorityDonutChart";
import ContentTypeChart from "@/components/pod-new/features/dashboard/ContentTypeChart";
import ContentStylePills from "@/components/pod-new/features/dashboard/ContentStylePills";
import ContributorLeaderboard from "@/components/pod-new/features/dashboard/ContributorLeaderboard";
import RecentSubmissionsTimeline from "@/components/pod-new/features/dashboard/RecentSubmissionsTimeline";
import DashboardSkeleton from "@/components/pod-new/features/dashboard/DashboardSkeleton";
import TodayEventsCard from "@/components/pod-new/features/dashboard/TodayEventsCard";

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12,
    },
  },
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data, isLoading, error, refetch } = useDashboardMetrics();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-pink-50/30 dark:bg-gray-950 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl p-8 shadow-xl max-w-md border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
          </div>

          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500/10 to-red-500/10 dark:from-red-400/20 dark:to-red-400/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200/50 dark:border-red-500/30">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-red-600 to-purple-600 dark:from-gray-100 dark:via-red-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
              Failed to Load Dashboard
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error instanceof Error
                ? error.message
                : "An unexpected error occurred"}
            </p>
            <button
              onClick={() => refetch()}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
            >
              Retry
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!data) return null;

  const userRole = session?.user?.role || "USER";

  return (
    <div className="min-h-screen bg-pink-50/30 dark:bg-gray-950">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Enhanced Header with Gallery Theme */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm p-8"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
          </div>

          {/* Decorative Circles */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white dark:bg-gray-800 rounded-full opacity-50 blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-white dark:bg-gray-800 rounded-full opacity-50 blur-3xl"></div>

          <div className="relative flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-pink-500/10 to-purple-500/10 dark:from-pink-400/20 dark:to-purple-400/20 rounded-xl border border-pink-200/50 dark:border-pink-500/30">
              <BarChart3 className="w-8 h-8 text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-gray-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                  Dashboard
                </span>
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1 text-lg font-medium">
                Welcome back! Here's what's happening with your POD workflow.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Today's Events Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <TodayEventsCard />
        </motion.div>

        {/* Unassigned Tasks Alert */}
        {data.taskPipeline.unassignedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-2 border-orange-300 dark:border-orange-700 p-6 hover:shadow-lg transition-all"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(251,146,60,0.3),rgba(255,255,255,0))]"></div>
            </div>

            <div className="relative flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                  {data.taskPipeline.unassignedCount} Unassigned Task
                  {data.taskPipeline.unassignedCount !== 1 ? "s" : ""}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  These tasks need to be assigned to team members
                </p>
              </div>
              <a
                href="/board?filter=unassigned"
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all flex-shrink-0"
              >
                Assign Now
              </a>
            </div>
          </motion.div>
        )}

        {/* Quick Stats Row with Stagger Animation */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <motion.div variants={itemVariants}>
            <QuickStatsCard
              title="Active Tasks"
              value={data.quickStats.activeTasks}
              subtitle={`+${data.quickStats.tasksCreatedToday} created today`}
              icon={CheckSquare}
              gradient="from-blue-50 to-blue-100"
              href="/board"
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <QuickStatsCard
              title="Overdue Tasks"
              value={data.quickStats.overdueTasks}
              subtitle={
                data.quickStats.overdueTasks > 0
                  ? "Requires attention"
                  : "All on track"
              }
              icon={AlertTriangle}
              gradient="from-red-50 to-red-100"
              href="/board?filter=overdue"
              alert={true}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <QuickStatsCard
              title="Active Models"
              value={data.quickStats.activeModels}
              subtitle={`${Math.round((data.quickStats.activeModels / data.quickStats.totalModels) * 100)}% of total`}
              icon={Users}
              gradient="from-purple-50 to-purple-100"
              href="/my-models"
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <QuickStatsCard
              title="Total Revenue"
              value={`$${data.quickStats.totalRevenue.toLocaleString()}`}
              subtitle={`From ${data.quickStats.activeModels} active models`}
              icon={DollarSign}
              gradient="from-emerald-50 to-green-100"
              href="/my-models?sort=revenue"
            />
          </motion.div>
        </motion.div>

        {/* Main Content Grid with Stagger Animation */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
            // className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Left Column - Task Pipeline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div variants={itemVariants}>
              <TaskPipelineChart data={data.taskPipeline.byStatus} />
            </motion.div>
            <motion.div variants={itemVariants}>
              <PriorityDonutChart data={data.taskPipeline.byPriority} />
            </motion.div>
          </div>

          {/* Right Column - Content Production */}
          {/* <div className="space-y-6">
            <motion.div variants={itemVariants}>
              <ContentTypeChart
                otpCount={data.contentProduction.otpCount}
                ptrCount={data.contentProduction.ptrCount}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <ContentStylePills
                data={data.contentProduction.styleDistribution}
              />
            </motion.div>
          </div> */}
        </motion.div>

        {/* Bottom Row - Contributors & Recent Submissions */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Top Contributors */}
          {data.teamPerformance.topContributors.length > 0 && (
            <motion.div variants={itemVariants}>
              <ContributorLeaderboard
                data={data.teamPerformance.topContributors}
              />
            </motion.div>
          )}

          {/* Recent Submissions Timeline */}
          <motion.div variants={itemVariants}>
            <RecentSubmissionsTimeline
              data={data.contentProduction.recentSubmissions}
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
