"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  User,
  X,
  Settings,
  ChevronDown,
  Sparkles,
  Clock,
  AlertCircle,
  Users,
  Calendar,
  Workflow,
  Flame,
  ArrowUp,
  Minus,
  ArrowDown,
  Check,
  Zap,
  Signal,
  Circle,
} from "lucide-react";
import { useLayoutStore, useResponsiveLayout } from "@/lib/stores/layoutStore";

type PriorityFilter = "ALL" | "URGENT" | "HIGH" | "MEDIUM" | "LOW";
type AssigneeFilter = "ALL" | "MY_TASKS" | "ASSIGNED" | "UNASSIGNED";
type DueDateFilter = "ALL" | "OVERDUE" | "TODAY" | "WEEK";
type WorkflowFilter = "ALL" | "NORMAL" | "GAME" | "POLL" | "LIVESTREAM" | "LEGACY";
type SortBy = "title" | "priority" | "dueDate" | "createdAt" | "updatedAt";
type SortOrder = "asc" | "desc";

interface BoardFiltersProps {
  searchTerm: string;
  priorityFilter: PriorityFilter;
  assigneeFilter: AssigneeFilter;
  dueDateFilter: DueDateFilter;
  workflowFilter: WorkflowFilter;
  sortBy: SortBy;
  sortOrder: SortOrder;
  showFilters: boolean;
  filteredTasksCount: number;
  totalTasks: number;
  setSearchTerm: (term: string) => void;
  setPriorityFilter: (filter: PriorityFilter) => void;
  setAssigneeFilter: (filter: AssigneeFilter) => void;
  setDueDateFilter: (filter: DueDateFilter) => void;
  setWorkflowFilter: (filter: WorkflowFilter) => void;
  setSortBy: (sortBy: SortBy) => void;
  setSortOrder: (order: SortOrder) => void;
  setShowFilters: (show: boolean) => void;
  setShowColumnSettings: (show: boolean) => void;
}

// Filter chip component for active filters
const FilterChip = ({
  label,
  value,
  onRemove,
  color = "purple"
}: {
  label: string;
  value: string;
  onRemove: () => void;
  color?: "purple" | "pink" | "blue" | "amber" | "emerald";
}) => {
  const colorClasses = {
    purple: "from-purple-500/20 to-violet-500/20 border-purple-400/30 text-purple-300 hover:border-purple-400/50",
    pink: "from-pink-500/20 to-rose-500/20 border-pink-400/30 text-pink-300 hover:border-pink-400/50",
    blue: "from-blue-500/20 to-cyan-500/20 border-blue-400/30 text-blue-300 hover:border-blue-400/50",
    amber: "from-amber-500/20 to-orange-500/20 border-amber-400/30 text-amber-300 hover:border-amber-400/50",
    emerald: "from-emerald-500/20 to-teal-500/20 border-emerald-400/30 text-emerald-300 hover:border-emerald-400/50",
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5
        bg-gradient-to-r ${colorClasses[color]}
        border rounded-full text-xs font-medium
        backdrop-blur-sm transition-all duration-300
        animate-in fade-in slide-in-from-left-2 duration-300
        group cursor-default
      `}
    >
      <span className="opacity-60">{label}:</span>
      <span className="font-semibold">{value}</span>
      <button
        onClick={onRemove}
        className="ml-0.5 p-0.5 rounded-full hover:bg-white/10 transition-colors opacity-60 group-hover:opacity-100"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
};

// Generic dropdown option configuration type
interface DropdownOption {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  bgGradient: string;
  borderColor: string;
  textColor: string;
  glowColor: string;
  description: string;
  pulse?: boolean;
}

// Priority configuration
const PRIORITY_OPTIONS: Record<PriorityFilter, DropdownOption> = {
  ALL: {
    label: "All Priorities",
    icon: Signal,
    gradient: "from-purple-500 to-violet-500",
    bgGradient: "from-purple-500/20 to-violet-500/20",
    borderColor: "border-purple-400/40",
    textColor: "text-purple-300",
    glowColor: "shadow-purple-500/30",
    description: "Show all tasks",
  },
  URGENT: {
    label: "Urgent",
    icon: Flame,
    gradient: "from-red-500 to-rose-500",
    bgGradient: "from-red-500/20 to-rose-500/20",
    borderColor: "border-red-400/40",
    textColor: "text-red-300",
    glowColor: "shadow-red-500/30",
    description: "Critical, immediate action",
    pulse: true,
  },
  HIGH: {
    label: "High",
    icon: Zap,
    gradient: "from-orange-500 to-amber-500",
    bgGradient: "from-orange-500/20 to-amber-500/20",
    borderColor: "border-orange-400/40",
    textColor: "text-orange-300",
    glowColor: "shadow-orange-500/30",
    description: "Important, prioritize soon",
  },
  MEDIUM: {
    label: "Medium",
    icon: Minus,
    gradient: "from-yellow-500 to-lime-500",
    bgGradient: "from-yellow-500/20 to-lime-500/20",
    borderColor: "border-yellow-400/40",
    textColor: "text-yellow-300",
    glowColor: "shadow-yellow-500/30",
    description: "Normal priority",
  },
  LOW: {
    label: "Low",
    icon: ArrowDown,
    gradient: "from-emerald-500 to-teal-500",
    bgGradient: "from-emerald-500/20 to-teal-500/20",
    borderColor: "border-emerald-400/40",
    textColor: "text-emerald-300",
    glowColor: "shadow-emerald-500/30",
    description: "Can wait, low urgency",
  },
};

// Assignee configuration
const ASSIGNEE_OPTIONS: Record<AssigneeFilter, DropdownOption> = {
  ALL: {
    label: "All Tasks",
    icon: Users,
    gradient: "from-purple-500 to-violet-500",
    bgGradient: "from-purple-500/20 to-violet-500/20",
    borderColor: "border-purple-400/40",
    textColor: "text-purple-300",
    glowColor: "shadow-purple-500/30",
    description: "Show everyone's tasks",
  },
  MY_TASKS: {
    label: "My Tasks",
    icon: User,
    gradient: "from-pink-500 to-rose-500",
    bgGradient: "from-pink-500/20 to-rose-500/20",
    borderColor: "border-pink-400/40",
    textColor: "text-pink-300",
    glowColor: "shadow-pink-500/30",
    description: "Tasks assigned to me",
  },
  ASSIGNED: {
    label: "Assigned",
    icon: Users,
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-400/40",
    textColor: "text-blue-300",
    glowColor: "shadow-blue-500/30",
    description: "Tasks with assignees",
  },
  UNASSIGNED: {
    label: "Unassigned",
    icon: Circle,
    gradient: "from-gray-500 to-slate-500",
    bgGradient: "from-gray-500/20 to-slate-500/20",
    borderColor: "border-gray-400/40",
    textColor: "text-gray-300",
    glowColor: "shadow-gray-500/30",
    description: "Tasks without assignees",
  },
};

// Due Date configuration
const DUEDATE_OPTIONS: Record<DueDateFilter, DropdownOption> = {
  ALL: {
    label: "All Dates",
    icon: Calendar,
    gradient: "from-purple-500 to-violet-500",
    bgGradient: "from-purple-500/20 to-violet-500/20",
    borderColor: "border-purple-400/40",
    textColor: "text-purple-300",
    glowColor: "shadow-purple-500/30",
    description: "Show all due dates",
  },
  OVERDUE: {
    label: "Overdue",
    icon: AlertCircle,
    gradient: "from-red-500 to-rose-500",
    bgGradient: "from-red-500/20 to-rose-500/20",
    borderColor: "border-red-400/40",
    textColor: "text-red-300",
    glowColor: "shadow-red-500/30",
    description: "Past due date",
    pulse: true,
  },
  TODAY: {
    label: "Due Today",
    icon: Clock,
    gradient: "from-amber-500 to-orange-500",
    bgGradient: "from-amber-500/20 to-orange-500/20",
    borderColor: "border-amber-400/40",
    textColor: "text-amber-300",
    glowColor: "shadow-amber-500/30",
    description: "Due within 24 hours",
  },
  WEEK: {
    label: "This Week",
    icon: Calendar,
    gradient: "from-emerald-500 to-teal-500",
    bgGradient: "from-emerald-500/20 to-teal-500/20",
    borderColor: "border-emerald-400/40",
    textColor: "text-emerald-300",
    glowColor: "shadow-emerald-500/30",
    description: "Due within 7 days",
  },
};

// Workflow configuration
const WORKFLOW_OPTIONS: Record<WorkflowFilter, DropdownOption> = {
  ALL: {
    label: "All Workflows",
    icon: Workflow,
    gradient: "from-purple-500 to-violet-500",
    bgGradient: "from-purple-500/20 to-violet-500/20",
    borderColor: "border-purple-400/40",
    textColor: "text-purple-300",
    glowColor: "shadow-purple-500/30",
    description: "Show all workflow types",
  },
  NORMAL: {
    label: "Normal",
    icon: Circle,
    gradient: "from-blue-500 to-indigo-500",
    bgGradient: "from-blue-500/20 to-indigo-500/20",
    borderColor: "border-blue-400/40",
    textColor: "text-blue-300",
    glowColor: "shadow-blue-500/30",
    description: "Standard content posts",
  },
  GAME: {
    label: "Games",
    icon: Sparkles,
    gradient: "from-pink-500 to-rose-500",
    bgGradient: "from-pink-500/20 to-rose-500/20",
    borderColor: "border-pink-400/40",
    textColor: "text-pink-300",
    glowColor: "shadow-pink-500/30",
    description: "Interactive game content",
  },
  POLL: {
    label: "Polls",
    icon: Users,
    gradient: "from-cyan-500 to-teal-500",
    bgGradient: "from-cyan-500/20 to-teal-500/20",
    borderColor: "border-cyan-400/40",
    textColor: "text-cyan-300",
    glowColor: "shadow-cyan-500/30",
    description: "Audience poll content",
  },
  LIVESTREAM: {
    label: "Livestreams",
    icon: Zap,
    gradient: "from-red-500 to-orange-500",
    bgGradient: "from-red-500/20 to-orange-500/20",
    borderColor: "border-red-400/40",
    textColor: "text-red-300",
    glowColor: "shadow-red-500/30",
    description: "Live streaming content",
  },
  LEGACY: {
    label: "Legacy",
    icon: Clock,
    gradient: "from-gray-500 to-slate-500",
    bgGradient: "from-gray-500/20 to-slate-500/20",
    borderColor: "border-gray-400/40",
    textColor: "text-gray-300",
    glowColor: "shadow-gray-500/30",
    description: "Older workflow format",
  },
};

// Generic Premium Dropdown Component with Portal
function PremiumDropdown<T extends string>({
  value,
  onChange,
  options,
  label,
  headerText,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Record<T, DropdownOption>;
  label: string;
  headerText: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  const currentConfig = options[value];
  const CurrentIcon = currentConfig.icon;
  const optionKeys = Object.keys(options) as T[];
  const isDefaultValue = value === optionKeys[0];

  // Client-side only mounting for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate dropdown position
  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  // Update position when opening
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isOpen, updatePosition]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleSelect = (key: T) => {
    onChange(key);
    setIsOpen(false);
  };

  const dropdownMenu = isOpen && mounted ? createPortal(
    <div
      ref={dropdownRef}
      className="fixed rounded-2xl shadow-2xl shadow-black/50"
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
        zIndex: 9999,
        backgroundColor: '#0f0f1a',
      }}
    >
      {/* Solid background layer */}
      <div className="absolute inset-0 bg-gray-900 rounded-2xl" />

      {/* Content layer */}
      <div className="relative border border-white/10 rounded-2xl overflow-hidden">
        {/* Gradient header */}
        <div className="px-3 py-2 border-b border-white/10 bg-gradient-to-r from-purple-500/20 to-pink-500/20">
          <span className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">
            {headerText}
          </span>
        </div>

        {/* Options */}
        <div className="py-1 max-h-[280px] overflow-y-auto">
          {optionKeys.map((key) => {
            const config = options[key];
            const Icon = config.icon;
            const isSelected = value === key;
            const isHovered = hoveredItem === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelect(key)}
                onMouseEnter={() => setHoveredItem(key)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`
                  relative w-full flex items-center gap-3 px-3 py-2.5
                  transition-all duration-200 ease-out
                  ${isSelected
                    ? `bg-gradient-to-r ${config.bgGradient}`
                    : isHovered
                      ? "bg-white/10"
                      : "bg-transparent"
                  }
                  group/item
                `}
              >
                {/* Icon container */}
                <div className={`
                  relative flex items-center justify-center w-7 h-7
                  rounded-lg transition-all duration-300 flex-shrink-0
                  ${isSelected || isHovered
                    ? `bg-gradient-to-br ${config.gradient} shadow-lg ${config.glowColor}`
                    : "bg-white/10"
                  }
                  group-hover/item:scale-110
                `}>
                  <Icon className={`
                    h-3.5 w-3.5 transition-colors duration-200
                    ${isSelected || isHovered ? "text-white" : "text-white/60"}
                  `} />
                  {config.pulse && (isSelected || isHovered) && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                  )}
                </div>

                {/* Text content */}
                <div className="flex-1 text-left min-w-0">
                  <div className={`
                    font-medium text-sm transition-colors duration-200 truncate
                    ${isSelected ? config.textColor : isHovered ? "text-white" : "text-white/80"}
                  `}>
                    {config.label}
                  </div>
                  <div className="text-[10px] text-white/40 truncate">
                    {config.description}
                  </div>
                </div>

                {/* Selected checkmark */}
                {isSelected && (
                  <div className={`
                    flex items-center justify-center w-5 h-5 flex-shrink-0
                    bg-gradient-to-br ${config.gradient}
                    rounded-full shadow-lg ${config.glowColor}
                  `}>
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </div>
                )}

                {/* Hover indicator line */}
                {(isSelected || isHovered) && (
                  <div className={`
                    absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6
                    bg-gradient-to-b ${config.gradient}
                    rounded-r-full
                  `} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className="relative">
      <label className="block text-[10px] uppercase tracking-wider text-purple-300/70 mb-1.5 font-semibold">
        {label}
      </label>

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative w-full flex items-center gap-3 px-3 py-2.5
          bg-gradient-to-r ${!isDefaultValue ? currentConfig.bgGradient : "from-white/5 to-white/5"}
          border ${!isDefaultValue ? currentConfig.borderColor : "border-white/10"}
          rounded-xl text-sm text-white/90
          transition-all duration-300 ease-out
          hover:bg-white/10 hover:border-purple-400/40
          focus:outline-none focus:ring-2 focus:ring-purple-500/30
          ${isOpen ? "ring-2 ring-purple-500/30 border-purple-400/50" : ""}
          group
        `}
      >
        {/* Icon with glow */}
        <div className={`
          relative flex items-center justify-center w-7 h-7
          bg-gradient-to-br ${currentConfig.gradient}
          rounded-lg shadow-lg ${!isDefaultValue ? currentConfig.glowColor : "shadow-purple-500/20"}
          transition-all duration-300
          group-hover:scale-110 group-hover:shadow-xl
        `}>
          <CurrentIcon className="h-3.5 w-3.5 text-white" />
          {currentConfig.pulse && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-400 rounded-full animate-ping" />
          )}
        </div>

        {/* Label */}
        <span className={`flex-1 text-left font-medium truncate ${!isDefaultValue ? currentConfig.textColor : "text-white/80"}`}>
          {currentConfig.label}
        </span>

        {/* Chevron */}
        <ChevronDown className={`
          h-4 w-4 text-purple-400/70 flex-shrink-0
          transition-transform duration-300 ease-out
          ${isOpen ? "rotate-180" : ""}
        `} />

        {/* Active indicator bar */}
        {!isDefaultValue && (
          <div className={`
            absolute bottom-0 left-3 right-3 h-0.5
            bg-gradient-to-r ${currentConfig.gradient}
            rounded-full opacity-60
          `} />
        )}
      </button>

      {dropdownMenu}
    </div>
  );
}

export default function BoardFilters({
  searchTerm,
  priorityFilter,
  assigneeFilter,
  dueDateFilter,
  workflowFilter,
  sortBy,
  sortOrder,
  showFilters,
  filteredTasksCount,
  totalTasks,
  setSearchTerm,
  setPriorityFilter,
  setAssigneeFilter,
  setDueDateFilter,
  setWorkflowFilter,
  setSortBy,
  setSortOrder,
  setShowFilters,
  setShowColumnSettings,
}: BoardFiltersProps) {
  const [searchFocused, setSearchFocused] = useState(false);

  useResponsiveLayout();
  const { leftSidebarCollapsed, rightSidebarCollapsed, isMobile, isTablet, focusMode } = useLayoutStore();

  const bothSidebarsOpen = !leftSidebarCollapsed && !rightSidebarCollapsed;
  const compactMode = isMobile || focusMode || bothSidebarsOpen || isTablet;

  const hasActiveFilters =
    priorityFilter !== "ALL" ||
    assigneeFilter !== "ALL" ||
    dueDateFilter !== "ALL" ||
    workflowFilter !== "ALL";

  const activeFilterCount = [
    priorityFilter !== "ALL",
    assigneeFilter !== "ALL",
    dueDateFilter !== "ALL",
    workflowFilter !== "ALL",
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearchTerm("");
    setPriorityFilter("ALL");
    setAssigneeFilter("ALL");
    setDueDateFilter("ALL");
    setWorkflowFilter("ALL");
  };

  // Get display values for active filter chips
  const getFilterLabel = (type: string, value: string) => {
    const labels: Record<string, Record<string, string>> = {
      priority: { URGENT: "Urgent", HIGH: "High", MEDIUM: "Medium", LOW: "Low" },
      assignee: { MY_TASKS: "My Tasks", ASSIGNED: "Assigned", UNASSIGNED: "Unassigned" },
      dueDate: { OVERDUE: "Overdue", TODAY: "Today", WEEK: "This Week" },
      workflow: { NORMAL: "Normal", GAME: "Game", POLL: "Poll", LIVESTREAM: "Live", LEGACY: "Legacy" },
    };
    return labels[type]?.[value] || value;
  };

  const sortOptions = [
    { value: "updatedAt", label: "Last Updated" },
    { value: "createdAt", label: "Created" },
    { value: "dueDate", label: "Due Date" },
    { value: "priority", label: "Priority" },
    { value: "title", label: "Title" },
  ];

  return (
    <div className="relative">
      {/* Glassmorphism container */}
      <div className="
        relative
        bg-gradient-to-br from-gray-900/80 via-purple-900/40 to-gray-900/80
        backdrop-blur-xl
        border border-white/10
        rounded-2xl
        shadow-2xl shadow-purple-500/5
        transition-all duration-500
      ">
        {/* Animated gradient border effect */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 animate-pulse" />
          <div className="absolute -inset-[1px] bg-gradient-to-r from-transparent via-purple-400/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-700" />
        </div>

        <div className={`relative ${compactMode ? 'p-3' : 'p-4'}`}>
          {/* Top Row: Search + Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input with glow effect */}
            <div className={`relative flex-1 min-w-[200px] ${compactMode ? 'max-w-full' : 'max-w-md'}`}>
              <div className={`
                absolute inset-0 rounded-xl
                bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20
                blur-xl transition-opacity duration-500
                ${searchFocused ? 'opacity-100' : 'opacity-0'}
              `} />
              <div className="relative">
                <Search className={`
                  absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4
                  transition-colors duration-300
                  ${searchFocused ? 'text-purple-400' : 'text-white/40'}
                `} />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="
                    w-full pl-10 pr-10 py-2.5
                    bg-white/5 hover:bg-white/10
                    border border-white/10 hover:border-purple-400/30
                    rounded-xl text-white placeholder:text-white/30
                    focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400/50
                    transition-all duration-300
                  "
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <X className="h-3.5 w-3.5 text-white/50 hover:text-white" />
                  </button>
                )}
              </div>
            </div>

            {/* Sort Controls */}
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="
                  px-3 py-2.5 min-w-[140px]
                  bg-white/5 hover:bg-white/10
                  border border-white/10 hover:border-purple-400/30
                  rounded-xl text-sm text-white/90
                  focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400/50
                  transition-all duration-300
                  cursor-pointer appearance-none
                  bg-no-repeat bg-right
                  pr-8
                "
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239333ea' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundSize: '16px',
                  backgroundPosition: 'right 8px center',
                }}
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value} className="bg-gray-900">
                    {opt.label}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="
                  p-2.5
                  bg-white/5 hover:bg-white/10
                  border border-white/10 hover:border-purple-400/30
                  rounded-xl text-white/70 hover:text-purple-400
                  focus:outline-none focus:ring-2 focus:ring-purple-500/30
                  transition-all duration-300
                  group
                "
                title={sortOrder === "asc" ? "Ascending" : "Descending"}
              >
                {sortOrder === "asc" ? (
                  <SortAsc className="h-4 w-4 group-hover:scale-110 transition-transform" />
                ) : (
                  <SortDesc className="h-4 w-4 group-hover:scale-110 transition-transform" />
                )}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* My Tasks Toggle */}
              <button
                onClick={() => setAssigneeFilter(assigneeFilter === "MY_TASKS" ? "ALL" : "MY_TASKS")}
                className={`
                  flex items-center gap-2 px-4 py-2.5
                  rounded-xl text-sm font-medium
                  transition-all duration-300
                  ${assigneeFilter === "MY_TASKS"
                    ? "bg-gradient-to-r from-purple-500/30 to-pink-500/30 border-purple-400/50 text-white shadow-lg shadow-purple-500/20"
                    : "bg-white/5 hover:bg-white/10 border-white/10 hover:border-purple-400/30 text-white/70 hover:text-white"
                  }
                  border
                `}
              >
                <User className={`h-4 w-4 ${assigneeFilter === "MY_TASKS" ? "text-purple-300" : ""}`} />
                {!compactMode && <span>My Tasks</span>}
              </button>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`
                  flex items-center gap-2 px-4 py-2.5
                  rounded-xl text-sm font-medium
                  transition-all duration-300 relative
                  ${showFilters || hasActiveFilters
                    ? "bg-gradient-to-r from-violet-500/30 to-blue-500/30 border-violet-400/50 text-white shadow-lg shadow-violet-500/20"
                    : "bg-white/5 hover:bg-white/10 border-white/10 hover:border-violet-400/30 text-white/70 hover:text-white"
                  }
                  border
                `}
              >
                <Filter className={`h-4 w-4 ${showFilters ? "text-violet-300" : ""}`} />
                {!compactMode && <span>Filters</span>}
                {activeFilterCount > 0 && (
                  <span className="
                    absolute -top-1.5 -right-1.5
                    min-w-[18px] h-[18px] px-1
                    bg-gradient-to-br from-pink-500 to-purple-600
                    rounded-full text-[10px] font-bold text-white
                    flex items-center justify-center
                    shadow-lg shadow-purple-500/30
                    animate-in zoom-in duration-200
                  ">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Columns Settings */}
              <button
                onClick={() => setShowColumnSettings(true)}
                className="
                  flex items-center gap-2 px-4 py-2.5
                  bg-white/5 hover:bg-white/10
                  border border-white/10 hover:border-blue-400/30
                  rounded-xl text-sm font-medium text-white/70 hover:text-white
                  transition-all duration-300
                "
              >
                <Settings className="h-4 w-4" />
                {!compactMode && <span>Columns</span>}
              </button>
            </div>

            {/* Task Count Badge */}
            {!compactMode && (
              <div className="
                flex items-center gap-2 px-3 py-2
                bg-white/5 rounded-xl
                text-xs text-white/50
                border border-white/5
              ">
                <Sparkles className="h-3 w-3 text-purple-400" />
                <span>
                  <span className="text-white/90 font-semibold">{filteredTasksCount}</span>
                  <span className="mx-1">/</span>
                  <span>{totalTasks}</span>
                </span>
              </div>
            )}
          </div>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-white/5">
              {priorityFilter !== "ALL" && (
                <FilterChip
                  label="Priority"
                  value={getFilterLabel("priority", priorityFilter)}
                  onRemove={() => setPriorityFilter("ALL")}
                  color="amber"
                />
              )}
              {assigneeFilter !== "ALL" && assigneeFilter !== "MY_TASKS" && (
                <FilterChip
                  label="Assignment"
                  value={getFilterLabel("assignee", assigneeFilter)}
                  onRemove={() => setAssigneeFilter("ALL")}
                  color="emerald"
                />
              )}
              {dueDateFilter !== "ALL" && (
                <FilterChip
                  label="Due"
                  value={getFilterLabel("dueDate", dueDateFilter)}
                  onRemove={() => setDueDateFilter("ALL")}
                  color="pink"
                />
              )}
              {workflowFilter !== "ALL" && (
                <FilterChip
                  label="Workflow"
                  value={getFilterLabel("workflow", workflowFilter)}
                  onRemove={() => setWorkflowFilter("ALL")}
                  color="blue"
                />
              )}

              <button
                onClick={clearAllFilters}
                className="
                  ml-auto px-3 py-1.5
                  text-xs text-white/40 hover:text-white/80
                  hover:bg-white/5 rounded-full
                  transition-all duration-200
                  flex items-center gap-1.5
                "
              >
                <X className="h-3 w-3" />
                Clear all
              </button>
            </div>
          )}

          {/* Expanded Filter Panel */}
          {showFilters && (
            <div className="
              mt-4 pt-4
              border-t border-white/10
              animate-in slide-in-from-top-2 fade-in duration-300
            ">
              <div className={`grid gap-4 ${compactMode ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'}`}>
                <PremiumDropdown<PriorityFilter>
                  value={priorityFilter}
                  onChange={setPriorityFilter}
                  options={PRIORITY_OPTIONS}
                  label="Priority"
                  headerText="Select Priority Level"
                />
                <PremiumDropdown<AssigneeFilter>
                  value={assigneeFilter}
                  onChange={setAssigneeFilter}
                  options={ASSIGNEE_OPTIONS}
                  label="Assignment"
                  headerText="Filter by Assignment"
                />
                <PremiumDropdown<DueDateFilter>
                  value={dueDateFilter}
                  onChange={setDueDateFilter}
                  options={DUEDATE_OPTIONS}
                  label="Due Date"
                  headerText="Filter by Due Date"
                />
                <PremiumDropdown<WorkflowFilter>
                  value={workflowFilter}
                  onChange={setWorkflowFilter}
                  options={WORKFLOW_OPTIONS}
                  label="Workflow Type"
                  headerText="Filter by Workflow"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
