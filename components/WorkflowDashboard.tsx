"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Clock,
  Play,
  CheckCircle2,
  XCircle,
  Sparkles,
  ExternalLink,
} from "lucide-react";

// Simple Progress component
const Progress = ({
  value,
  className,
  subtle = false,
}: {
  value: number;
  className?: string;
  subtle?: boolean;
}) => (
  <div
    className={`w-full bg-gray-100 dark:bg-gray-800 rounded-full ${className}`}
  >
    <div
      className={`h-full rounded-full transition-all duration-300 ${
        subtle 
          ? "bg-gray-300 dark:bg-gray-600" 
          : "bg-gradient-to-r from-purple-500 to-blue-600 dark:from-purple-400 dark:to-blue-500"
      }`}
      style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
    ></div>
  </div>
);

// Status configuration matching the Board component
const statusConfig = {
  "not-started": {
    label: "Not Started",
    icon: Clock,
    color:
      "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600",
    bgColor: "bg-gray-50 dark:bg-gray-800/50",
  },
  "in-progress": {
    label: "In Progress",
    icon: Play,
    color:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    color:
      "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-600",
    bgColor: "bg-green-50 dark:bg-green-900/20",
  },
  review: {
    label: "Cancelled",
    icon: XCircle,
    color:
      "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-600",
    bgColor: "bg-red-50 dark:bg-red-900/20",
  },
};

interface Task {
  id: string;
  title: string;
  assignee: string;
  status: "not-started" | "in-progress" | "review" | "completed";
  progress: number;
  dueDate: string;
  priority: "low" | "medium" | "high";
}

interface Creator {
  id: string;
  name: string;
  specialty: string;
  rowNumber?: number;
}

interface PricingItem {
  name: string;
  price: string;
  creator: string;
  totalCombinations?: number;
}

interface WorkflowDashboardProps {
  tasks?: Task[];
  creators?: Creator[];
  onPricingGuideClick?: () => void;
  pricingPreview?: PricingItem[];
  pricingRotationProgress?: number;
}

const WorkflowDashboard: React.FC<WorkflowDashboardProps> = ({
  tasks = [],
  creators = [],
  onPricingGuideClick,
  pricingPreview = [],
  pricingRotationProgress = 0,
}) => {
  const completedTasks = tasks.filter(
    (task) => task.status === "completed"
  ).length;
  const totalTasks = tasks.length;
  const overallProgress =
    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <Card className="bg-white border-0 dark:bg-gray-900 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-none dark:ring-1 dark:ring-gray-800 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-pink-50/50 to-rose-50/50 dark:from-pink-900/30 dark:to-rose-900/30 border-b border-pink-200 dark:border-pink-500/30">
          <CardTitle className="text-gray-900 dark:text-gray-100 font-bold flex items-center text-2xl">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mr-4">
              <span className="h-5 w-5 text-white text-lg">📋</span>
            </div>
            POD Workflow Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Overall Progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Overall Progress
                </h3>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {completedTasks}/{totalTasks} completed
                </span>
              </div>
              <Progress value={overallProgress} className="h-3" />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {overallProgress.toFixed(0)}% of tasks completed
              </p>
            </div>

            {/* Status Summary */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Status Summary
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {completedTasks}
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    Completed
                  </p>
                </div>
                <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {tasks.filter((t) => t.status === "in-progress").length}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    In Progress
                  </p>
                </div>
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                  <p className="text-lg font-bold text-gray-600 dark:text-gray-400">
                    {tasks.filter((t) => t.status === "not-started").length}
                  </p>
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    Not Started
                  </p>
                </div>
                <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">
                    {tasks.filter((t) => t.status === "review").length}
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300">
                    Cancelled
                  </p>
                </div>
              </div>
            </div>

            {/* Team Performance */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Team Performance
              </h3>
              <div className="space-y-2">
                {Array.from(new Set(tasks.map((t) => t.assignee))).map(
                  (assignee) => {
                    const memberTasks = tasks.filter(
                      (t) => t.assignee === assignee
                    );
                    const completedCount = memberTasks.filter(
                      (t) => t.status === "completed"
                    ).length;
                    const memberProgress =
                      memberTasks.length > 0
                        ? (completedCount / memberTasks.length) * 100
                        : 0;

                    return (
                      <div key={assignee} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            {assignee}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            {memberProgress.toFixed(0)}%
                          </span>
                        </div>
                        <Progress value={memberProgress} className="h-2" />
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Tasks and Pricing Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task List */}
        <Card className="bg-white border-0 dark:bg-gray-900 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-none dark:ring-1 dark:ring-gray-800 overflow-hidden">
          <CardHeader className="border-b border-gray-100 dark:border-gray-700 p-6">
            <CardTitle className="text-gray-900 dark:text-gray-100 font-bold flex items-center text-lg">
              <div className="p-2 bg-gradient-to-r from-pink-500 to-rose-600 rounded-lg mr-3">
                <span className="h-5 w-5 text-white text-lg flex items-center justify-center">
                  👤
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Tasks
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Latest team activity and progress
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {tasks.length > 0 ? (
              <div className="space-y-4">
                {/* Tasks Table */}
                <div className="bg-white dark:bg-gray-800  rounded-lg overflow-hidden">
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
                    {tasks.slice(0, 5).map((task) => {
                      const config = statusConfig[task.status];
                      const IconComponent = config.icon;

                      return (
                        <div
                          key={task.id}
                          className="grid grid-cols-3 gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                        >
                          <div className="text-left">
                            <div
                              className={`text-sm font-medium ${task.status === "completed" ? "line-through text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-white"}`}
                            >
                              {task.title}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-start space-x-2">
                              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                                <span className="text-white text-xs font-bold">
                                  {task.assignee
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </span>
                              </div>
                              <span className="text-sm font-medium text-gray-900 dark:text-white hidden sm:inline">
                                {task.assignee}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <div
                                className={`p-1 rounded-full ${config.color}`}
                              >
                                <IconComponent className="h-3 w-3" />
                              </div>
                              <span
                                className={`text-xs px-2 py-1 rounded-full font-medium ${config.color}`}
                              >
                                {config.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Summary */}
                {tasks.length > 5 && (
                  <div className="text-center py-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {tasks.length} Total Tasks
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Showing 5 of {tasks.length} recent tasks
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-600 rounded-lg w-fit mx-auto mb-4">
                  <span className="h-6 w-6 text-white text-xl flex items-center justify-center">
                    📋
                  </span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No tasks found
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  No tasks assigned to this team yet. Tasks will appear here
                  once created.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing Guide Shortcut */}
        <Card className="bg-white border-0 dark:bg-gray-900 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-none dark:ring-1 dark:ring-gray-800 overflow-hidden">
          <CardHeader className="border-b border-gray-100 dark:border-gray-700 p-6">
            <CardTitle className="text-gray-900 dark:text-gray-100 font-bold flex items-center justify-between text-lg">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg mr-3">
                  <Sparkles className="h-5 w-5 text-white" />
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
              {onPricingGuideClick && (
                <button
                  onClick={onPricingGuideClick}
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {pricingPreview.length > 0 ? (
              <div className="space-y-4">
                {/* Mini Pricing Table */}
                <div className="bg-white dark:bg-gray-800  rounded-lg overflow-hidden">
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
                    {pricingPreview.slice(0, 4).map((item, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-2 gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                      >
                        <div className="text-left">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {item.creator}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-light text-gray-700 dark:text-gray-300 tabular-nums">
                            {item.price}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="px-4">
                  <Progress value={pricingRotationProgress} className="h-1" subtle />
                </div>

                {/* Summary */}
                {pricingPreview.length > 0 && (
                  <div className="text-center py-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {pricingPreview[0]?.totalCombinations ||
                        pricingPreview.length}{" "}
                      Total Contents
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Showing {Math.min(pricingPreview.length, 4)} of{" "}
                      {pricingPreview[0]?.totalCombinations ||
                        pricingPreview.length}{" "}
                      pricing options
                    </div>
                  </div>
                )}

                {/* View All Button */}
                {onPricingGuideClick && (
                  <button
                    onClick={onPricingGuideClick}
                    className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg text-sm font-medium flex items-center justify-center space-x-2"
                  >
                    <span>View Full Pricing Guide</span>
                    <ExternalLink className="h-4 w-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg w-fit mx-auto mb-4">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No pricing data available
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Assign creators to your team to see pricing information
                </p>
                {onPricingGuideClick && (
                  <button
                    onClick={onPricingGuideClick}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg text-sm font-medium"
                  >
                    Browse Full Pricing Guide
                  </button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorkflowDashboard;
