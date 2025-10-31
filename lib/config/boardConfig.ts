/**
 * Board Configuration
 * Centralized status and priority configurations for the task board system
 */

export type TaskStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'WALL_POST_REVIEW'
  | 'PG_REVIEW'
  | 'FLYER_REVIEW'
  | 'QA_REVIEW'
  | 'READY_TO_DEPLOY'
  | 'COMPLETED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  description?: string;
}

export interface PriorityConfig {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  icon?: string;
}

/**
 * Task Status Configuration
 * Maps status values to their display properties
 */
export const STATUS_CONFIG: Record<TaskStatus, StatusConfig> = {
  NOT_STARTED: {
    label: 'Not Started',
    color: 'gray',
    bgColor: 'bg-gray-100 dark:bg-gray-700',
    textColor: 'text-gray-700 dark:text-gray-300',
    description: 'Task has not been started yet',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'blue',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
    textColor: 'text-blue-700 dark:text-blue-300',
    description: 'Task is currently being worked on',
  },
  WALL_POST_REVIEW: {
    label: 'Wall Post Review',
    color: 'purple',
    bgColor: 'bg-purple-100 dark:bg-purple-900',
    textColor: 'text-purple-700 dark:text-purple-300',
    description: 'Task is under wall post review',
  },
  PG_REVIEW: {
    label: 'PG Review',
    color: 'pink',
    bgColor: 'bg-pink-100 dark:bg-pink-900',
    textColor: 'text-pink-700 dark:text-pink-300',
    description: 'Task is under PG review',
  },
  FLYER_REVIEW: {
    label: 'Flyer Review',
    color: 'indigo',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900',
    textColor: 'text-indigo-700 dark:text-indigo-300',
    description: 'Task is under flyer review',
  },
  QA_REVIEW: {
    label: 'QA Review',
    color: 'yellow',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900',
    textColor: 'text-yellow-700 dark:text-yellow-300',
    description: 'Task is under QA review',
  },
  READY_TO_DEPLOY: {
    label: 'Ready to Deploy',
    color: 'orange',
    bgColor: 'bg-orange-100 dark:bg-orange-900',
    textColor: 'text-orange-700 dark:text-orange-300',
    description: 'Task is ready to be deployed',
  },
  COMPLETED: {
    label: 'Completed',
    color: 'green',
    bgColor: 'bg-green-100 dark:bg-green-900',
    textColor: 'text-green-700 dark:text-green-300',
    description: 'Task has been completed',
  },
};

/**
 * Task Priority Configuration
 * Maps priority values to their display properties
 */
export const PRIORITY_CONFIG: Record<TaskPriority, PriorityConfig> = {
  LOW: {
    label: 'Low',
    color: 'gray',
    bgColor: 'bg-gray-100 dark:bg-gray-700',
    textColor: 'text-gray-700 dark:text-gray-300',
    icon: '🔵',
  },
  MEDIUM: {
    label: 'Medium',
    color: 'yellow',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900',
    textColor: 'text-yellow-700 dark:text-yellow-300',
    icon: '🟡',
  },
  HIGH: {
    label: 'High',
    color: 'red',
    bgColor: 'bg-red-100 dark:bg-red-900',
    textColor: 'text-red-700 dark:text-red-300',
    icon: '🔴',
  },
};

/**
 * Get status configuration by status value
 */
export function getStatusConfig(status: string): StatusConfig {
  return STATUS_CONFIG[status as TaskStatus] || STATUS_CONFIG.NOT_STARTED;
}

/**
 * Get priority configuration by priority value
 */
export function getPriorityConfig(priority: string): PriorityConfig {
  return PRIORITY_CONFIG[priority as TaskPriority] || PRIORITY_CONFIG.MEDIUM;
}

/**
 * Get all available status values
 */
export function getAllStatuses(): TaskStatus[] {
  return Object.keys(STATUS_CONFIG) as TaskStatus[];
}

/**
 * Get all available priority values
 */
export function getAllPriorities(): TaskPriority[] {
  return Object.keys(PRIORITY_CONFIG) as TaskPriority[];
}
