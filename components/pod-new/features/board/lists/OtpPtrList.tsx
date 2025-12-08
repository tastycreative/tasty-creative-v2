
import React from 'react';
import { Task } from '@/lib/stores/boardStore';
import { Session } from 'next-auth';

interface OtpPtrListProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  getPriorityIcon: (priority: string) => string;
}

export default function OtpPtrList({ tasks, onTaskClick, getPriorityIcon }: OtpPtrListProps) {
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
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Model
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Content Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Release Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Pricing
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {tasks.map((task) => {
              const workflow = (task as any).ModularWorkflow;
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
                  
                  {/* Submission Type */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {workflow?.submissionType || '-'}
                    </span>
                  </td>
                  
                  {/* Model */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {workflow?.modelName || '-'}
                    </span>
                  </td>
                  
                  {/* Content Type */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {workflow?.contentType || '-'}
                    </span>
                  </td>
                  
                  {/* Release Date */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {workflow?.releaseDate || '-'}
                    </span>
                  </td>
                  
                  {/* Pricing */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {workflow?.pricing ? `$${workflow.pricing}` : '-'}
                    </span>
                  </td>
                  
                  {/* Workflow Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {workflow?.status && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                        {workflow.status}
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
