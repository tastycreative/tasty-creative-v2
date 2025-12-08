"use client";

import React from 'react';
import { Session } from 'next-auth';
import { Task, BoardColumn } from '@/lib/stores/boardStore';
import { formatForTaskCard, formatDueDate } from '@/lib/dateUtils';
import { Calendar, User, AlertCircle } from 'lucide-react';
import UserProfile from '@/components/ui/UserProfile';
import OtpPtrList from './lists/OtpPtrList';

interface BoardListProps {
  tasks: Task[];
  columns: BoardColumn[];
  session: Session | null;
  onTaskClick: (task: Task) => void;
  teamName: string;
}

export default function BoardList({ tasks, columns, session, onTaskClick, teamName }: BoardListProps) {
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT': return '🚨';
      case 'HIGH': return '🔴';
      case 'MEDIUM': return '🟡';
      case 'LOW': return '🟢';
      default: return '⚪';
    }
  };

  // Determine the team type
  const isOFTVTeam = teamName === 'OFTV';
  const isPGTTeam = teamName === 'PGT' || teamName === 'Post Generation Team'; // Adjust team name as needed

  // OFTV-specific columns
  const oftvColumns = [
    { key: 'videoEditor', label: 'Video Editor' },
    { key: 'videoEditorStatus', label: 'Video Status' },
    { key: 'thumbnailEditor', label: 'Thumbnail Editor' },
    { key: 'thumbnailEditorStatus', label: 'Thumbnail Status' },
  ];



  // Get OFTV status config
  const getOFTVStatusConfig = (status: string) => {
    const statusOptions = [
      { value: 'NOT_STARTED', label: 'Not Started', color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300' },
      { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' },
      { value: 'NEEDS_REVISION', label: 'Needs Revision', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' },
      { value: 'APPROVED', label: 'Approved', color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' },
      { value: 'HOLD', label: 'Hold', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300' },
      { value: 'WAITING_FOR_VO', label: 'Waiting for VO', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' },
      { value: 'SENT', label: 'Sent', color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300' },
      { value: 'PUBLISHED', label: 'Published', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300' },
    ];
    return statusOptions.find(opt => opt.value === status) || statusOptions[0];
  };

  if (tasks.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
        <AlertCircle className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No tasks found
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Try adjusting your filters or create a new task to get started.
        </p>
      </div>
    );
  }

  // Render OFTV-specific table
  if (isOFTVTeam) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Task
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Model
                </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Folder Link
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Video Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Video Editor
                  </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Video Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Thumbnail Editor
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Thumbnail Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Special Instructions
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Date Assigned
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Date Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Due Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {tasks.map((task) => {
                const oftvTask = (task as any).oftvTask;
                return (
                  <tr
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                  >
                    {/* Task */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {task.podTeam?.projectPrefix && task.taskNumber && (
                          <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                            {task.podTeam.projectPrefix}-{task.taskNumber}
                          </span>
                        )}
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </td>
                    
                    {/* Priority */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getPriorityIcon(task.priority)}</span>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {task.priority}
                        </span>
                      </div>
                    </td>
                    
                    {/* Model */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {oftvTask?.model || '-'}
                      </span>
                    </td>
                    
                    {/* Folder Link */}
                                      {/* Folder Link */}
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {task.oftvTask?.folderLink ? (
                      <a
                        href={task.oftvTask.folderLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Link
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-600">-</span>
                    )}
                  </td>
                  
                  {/* Video Description */}
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {task.oftvTask?.videoDescription ? (
                      <div className="max-w-xs line-clamp-2">
                        {task.oftvTask.videoDescription}
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-600">-</span>
                    )}
                  </td>
                  
                  {/* Video Editor */}
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {oftvTask?.videoEditorUser ? (
                      <div className="flex items-center gap-2">
                        <UserProfile user={oftvTask.videoEditorUser} size="sm" />
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[120px]">
                          {oftvTask.videoEditorUser.name || oftvTask.videoEditorUser.email}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-600">-</span>
                    )}
                  </td>
                    
                    {/* Video Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {oftvTask?.videoEditorStatus && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOFTVStatusConfig(oftvTask.videoEditorStatus).color}`}>
                          {getOFTVStatusConfig(oftvTask.videoEditorStatus).label}
                        </span>
                      )}
                    </td>
                    
                    {/* Thumbnail Editor */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {oftvTask?.thumbnailEditorUser ? (
                        <div className="flex items-center gap-2">
                          <UserProfile
                            user={oftvTask.thumbnailEditorUser}
                            size="sm"
                            showTooltip
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[120px]">
                            {oftvTask.thumbnailEditorUser.name || oftvTask.thumbnailEditorUser.email}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500 italic">
                          Unassigned
                        </span>
                      )}
                    </td>
                    
                    {/* Thumbnail Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {oftvTask?.thumbnailEditorStatus && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOFTVStatusConfig(oftvTask.thumbnailEditorStatus).color}`}>
                          {getOFTVStatusConfig(oftvTask.thumbnailEditorStatus).label}
                        </span>
                      )}
                    </td>
                    
                    {/* Special Instructions */}
                    <td className="px-6 py-4">
                      {oftvTask?.specialInstructions ? (
                        <div className="max-w-xs">
                          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                            {oftvTask.specialInstructions}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500 italic">-</span>
                      )}
                    </td>
                    
                    {/* Date Assigned */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {oftvTask?.dateAssigned ? (
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {new Date(oftvTask.dateAssigned).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500 italic">-</span>
                      )}
                    </td>
                    
                    {/* Date Completed */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {oftvTask?.dateCompleted ? (
                        <span className="text-sm text-green-700 dark:text-green-400 font-medium">
                          {new Date(oftvTask.dateCompleted).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500 italic">-</span>
                      )}
                    </td>
                    
                    {/* Due Date */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {task.dueDate ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className={`text-sm ${formatDueDate(task.dueDate).className}`}>
                            {formatDueDate(task.dueDate).formatted}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500 italic">
                          No due date
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Render ModularWorkflow-specific table (for PGT/OTP-PTR teams)
  if (isPGTTeam || tasks.some(t => (t as any).ModularWorkflow)) {
    return (
      <OtpPtrList 
        tasks={tasks} 
        onTaskClick={onTaskClick} 
        getPriorityIcon={getPriorityIcon} 
      />
    );
  }

  // Default: Render standard board column-based table
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Task
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Assignee
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {tasks.map((task) => {
              const column = columns.find(col => col.status === task.status);
              return (
                <tr
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                >
                  {/* Task */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {task.podTeam?.projectPrefix && task.taskNumber && (
                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                          {task.podTeam.projectPrefix}-{task.taskNumber}
                        </span>
                      )}
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </td>
                  
                  {/* Priority */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getPriorityIcon(task.priority)}</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {task.priority}
                      </span>
                    </div>
                  </td>
                  
                  {/* Assignee */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {task.assignedUser ? (
                      <div className="flex items-center gap-2">
                        <UserProfile
                          user={task.assignedUser}
                          size="sm"
                          showTooltip
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[150px]">
                          {task.assignedUser.name || task.assignedUser.email}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-gray-500 italic">
                        Unassigned
                      </span>
                    )}
                  </td>
                  
                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {column && (
                      <span 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: `${column.color}20`,
                          color: column.color,
                          borderColor: column.color,
                          borderWidth: '1px'
                        }}
                      >
                        {column.label}
                      </span>
                    )}
                  </td>
                  
                  {/* Due Date */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {task.dueDate ? (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className={`text-sm ${formatDueDate(task.dueDate).className}`}>
                          {formatDueDate(task.dueDate).formatted}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-gray-500 italic">
                        No due date
                      </span>
                    )}
                  </td>
                  
                  {/* Created */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {formatForTaskCard(task.createdAt)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
