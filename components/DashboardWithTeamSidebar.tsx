"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Clock,
  Play,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ExternalLink,
  Users,
  TrendingUp,
  Calendar,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

// Simple Progress component
const Progress = ({
  value,
  className,
}: {
  value: number
  className?: string
}) => (
  <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full ${className}`}>
    <div
      className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-purple-500 to-pink-600"
      style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
    />
  </div>
)

// Status configuration
const statusConfig = {
  "not-started": {
    label: "Not Started",
    icon: Clock,
    color: "bg-gray-100 text-gray-700 border-gray-200",
  },
  "in-progress": {
    label: "In Progress", 
    icon: Play,
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  completed: {
    label: "Complete",
    icon: CheckCircle2,
    color: "bg-green-100 text-green-700 border-green-200",
  },
  review: {
    label: "Review",
    icon: XCircle,
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
}

// Mock data based on design
const mockTasks = [
  {
    id: "1",
    title: "Luna_Dreams - Schedule Complete", 
    assignee: "Jake",
    status: "completed" as const,
    progress: 100,
  },
  {
    id: "2", 
    title: "Sophia_Blaze - Data Analysis",
    assignee: "Vanessa", 
    status: "in-progress" as const,
    progress: 65,
  },
  {
    id: "3",
    title: "Maya_Rose - Content Upload",
    assignee: "Sarah",
    status: "review" as const, 
    progress: 90,
  },
]

const teamMembers = [
  {
    name: "Jake",
    role: "Team Lead",
    avatar: "J",
    color: "bg-pink-500",
  },
  {
    name: "Vanessa", 
    role: "Creator",
    avatar: "V",
    color: "bg-purple-500",
  },
  {
    name: "Sarah",
    role: "Analyst", 
    avatar: "S",
    color: "bg-blue-500",
  },
]

const assignedModels = [
  {
    name: "Luna_Dreams",
    assignee: "Jake",
    role: "Creator", 
    avatar: "L",
    color: "bg-orange-500",
  },
  {
    name: "Sophia_Blaze",
    assignee: "Vanessa",
    role: "Creator",
    avatar: "S", 
    color: "bg-purple-500",
  },
  {
    name: "Maya_Rose",
    assignee: "Jake", 
    role: "Creator",
    avatar: "M",
    color: "bg-green-500",
  },
  {
    name: "Emma_Starr",
    assignee: "Sarah",
    role: "Analyst",
    avatar: "E",
    color: "bg-orange-500", 
  },
]

const sheetLinks = [
  { name: "Luna", status: "synced" },
  { name: "Sophia", status: "synced" }, 
  { name: "Maya", status: "synced" },
  { name: "Others", status: "synced" },
]

interface DashboardWithTeamSidebarProps {
  tasks?: any[]
  creators?: any[]
}

export function DashboardWithTeamSidebar({ 
  tasks = mockTasks, 
  creators = [] 
}: DashboardWithTeamSidebarProps) {
  const completedTasks = tasks.filter(task => task.status === "completed").length
  const inProgressTasks = tasks.filter(task => task.status === "in-progress").length
  const notStartedTasks = tasks.filter(task => task.status === "not-started").length
  const cancelledTasks = tasks.filter(task => task.status === "review").length
  const totalTasks = tasks.length
  const overallProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 50

  return (
    <div className="flex gap-6 min-h-full">
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Workflow Dashboard Header */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              POD Workflow Dashboard
              <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full">
                Sheets Synced
              </span>
            </h2>
          </div>
          
          {/* Progress Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Overall Progress */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Overall Progress
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {completedTasks}/{totalTasks}
                    </span>
                    <span className="text-sm text-gray-500">completed</span>
                  </div>
                  <Progress value={overallProgress} className="h-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {Math.round(overallProgress)}% of tasks completed
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Status Summary */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Status Summary
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="text-lg font-bold text-green-600">{completedTasks}</div>
                    <div className="text-xs text-green-700">Completed</div>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <div className="text-lg font-bold text-blue-600">{inProgressTasks}</div>
                    <div className="text-xs text-blue-700">In Progress</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-lg font-bold text-gray-600">{notStartedTasks}</div>
                    <div className="text-xs text-gray-700">Not Started</div>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded">
                    <div className="text-lg font-bold text-red-600">{cancelledTasks}</div>
                    <div className="text-xs text-red-700">Cancelled</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team Performance */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Team Performance
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">87%</span>
                    <div className="flex items-center text-green-600 text-sm">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      +12%
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    efficiency this week
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Tasks and Schedule Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Tasks Feed */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasks.map((task) => {
                  const config = statusConfig[task.status]
                  const IconComponent = config.icon
                  const member = teamMembers.find(m => m.name === task.assignee)

                  return (
                    <div key={task.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className={`h-8 w-8 ${member?.color || 'bg-gray-500'}`}>
                          <AvatarFallback className="text-white text-sm">
                            {member?.avatar || task.assignee[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{task.title}</div>
                          <div className="text-xs text-gray-500">{task.assignee}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                          <div className="flex items-center gap-1">
                            <IconComponent className="h-3 w-3" />
                            {config.label}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Schedule Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Daily Posts Scheduled</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-bold">All Models</span> 18/28
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">Mass Messages Ready</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-bold">Luna, Sophia</span> 2/4
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="font-medium">CHECK Validation</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-bold">Maya, Emma</span> Pass
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">Performance Analysis</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-bold">This Week</span> 89%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Sidebar - Team Management */}
      <div className="w-80 space-y-4">
        {/* Team Selector */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 bg-gradient-to-r from-purple-500 to-pink-600">
                  <AvatarFallback className="text-white text-sm">T1</AvatarFallback>
                </Avatar>
                <span className="font-medium">Team #1</span>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </div>
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Members ({teamMembers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div key={member.name} className="flex items-center gap-3">
                  <Avatar className={`h-8 w-8 ${member.color}`}>
                    <AvatarFallback className="text-white text-sm">
                      {member.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{member.name}</div>
                    <div className="text-xs text-gray-500">({member.role})</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Assigned Models */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Assigned Models ({assignedModels.length})</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {assignedModels.map((model) => (
                <div key={model.name} className="flex items-center gap-3">
                  <Avatar className={`h-8 w-8 ${model.color}`}>
                    <AvatarFallback className="text-white text-sm">
                      {model.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{model.name}</div>
                    <div className="text-xs text-gray-500">
                      {model.assignee} ({model.role})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sheet Links */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Sheet Links</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {sheetLinks.map((sheet) => (
                <div key={sheet.name} className="flex items-center justify-between">
                  <span className="text-sm">{sheet.name}</span>
                  <div className="h-2 w-2 bg-green-500 rounded-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}