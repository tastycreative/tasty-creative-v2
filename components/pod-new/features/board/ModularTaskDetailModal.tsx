"use client";

import React, { useState } from 'react';
import { Session } from 'next-auth';
import {
  X,
  Edit3,
  Save,
  Calendar,
  DollarSign,
  Upload,
  FileText,
  Gamepad2,
  BarChart3,
  Video,
  Clock,
  User,
  Tag
} from 'lucide-react';
import { Task } from '@/lib/stores/boardStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import UserDropdown from '@/components/UserDropdown';

interface ModularTaskDetailModalProps {
  task: Task;
  session: Session | null;
  teamMembers: Array<{id: string, email: string, name?: string}>;
  teamAdmins: Array<{id: string, email: string, name?: string}>;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDelete: (taskId: string) => void;
  onUpdateStatus: (status: Task['status']) => void;
}

const statusConfig = {
  NOT_STARTED: {
    label: 'Not Started',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: Clock
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: Clock
  },
  COMPLETED: {
    label: 'Completed',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: Clock
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: Clock
  }
};

const contentStyleConfig = {
  normal: { name: 'Normal Post', icon: FileText, color: 'text-purple-600' },
  game: { name: 'Game Post', icon: Gamepad2, color: 'text-pink-600' },
  poll: { name: 'Poll Post', icon: BarChart3, color: 'text-blue-600' },
  livestream: { name: 'Livestream', icon: Video, color: 'text-red-600' }
};

const componentConfig = {
  pricing: { name: 'Pricing', icon: DollarSign, color: 'text-green-600' },
  release: { name: 'Release Scheduling', icon: Calendar, color: 'text-orange-600' },
  upload: { name: 'File Uploads', icon: Upload, color: 'text-violet-600' }
};

export default function ModularTaskDetailModal({
  task,
  session,
  teamMembers,
  teamAdmins,
  onClose,
  onUpdate,
  onDelete,
  onUpdateStatus
}: ModularTaskDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    assignedTo: task.assignedTo || '',
    dueDate: task.dueDate || '',
    componentData: task.componentData || {}
  });

  if (!task) return null;

  const selectedComponents = task.selectedComponents || [];
  const componentData = task.componentData || {};
  const contentStyle = (componentData as any)?.contentStyle || 'normal';
  const submissionType = (componentData as any)?.submissionType || 'otp';

  const handleSave = async () => {
    try {
      await onUpdate(task.id, {
        title: editData.title,
        description: editData.description,
        priority: editData.priority,
        assignedTo: editData.assignedTo,
        dueDate: editData.dueDate,
        componentData: editData.componentData
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const updateComponentData = (key: string, value: any) => {
    setEditData(prev => ({
      ...prev,
      componentData: {
        ...prev.componentData,
        [key]: value
      }
    }));
  };

  const canEdit = session?.user && (
    session.user.role === 'ADMIN' ||
    session.user.email === task.assignedTo ||
    session.user.id === task.createdById
  );

  const contentStyleInfo = contentStyleConfig[contentStyle as keyof typeof contentStyleConfig];
  const StatusIcon = statusConfig[task.status]?.icon || Clock;

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-start justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${statusConfig[task.status]?.color?.split(' ')[0] || 'bg-gray-500'}`}></div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {isEditing ? (
                  <Input
                    value={editData.title}
                    onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                    className="text-xl font-semibold"
                  />
                ) : task.title}
              </h2>
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <span>Modular Workflow Task</span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <StatusIcon className="w-4 h-4" />
                  <span>{statusConfig[task.status]?.label}</span>
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {canEdit && !isEditing && (
              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
            {isEditing && (
              <>
                <Button onClick={handleSave} size="sm">
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                  Cancel
                </Button>
              </>
            )}
            <Button onClick={onClose} variant="ghost" size="sm">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Workflow Overview */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
            <h3 className="font-medium text-purple-800 dark:text-purple-200 mb-3">Workflow Configuration</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-purple-700 dark:text-purple-300">
                  {submissionType?.toUpperCase() || 'OTP'}
                </span>
              </div>
              {contentStyleInfo && (
                <div className="flex items-center space-x-2">
                  <contentStyleInfo.icon className={`w-4 h-4 ${contentStyleInfo.color}`} />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {contentStyleInfo.name}
                  </span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Tag className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {selectedComponents.length} Components
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {task.assignedUser?.name || task.assignedTo || 'Unassigned'}
                </span>
              </div>
            </div>
          </div>

          {/* Selected Components */}
          {selectedComponents.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Selected Components</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {selectedComponents.map((componentId: string) => {
                  const config = componentConfig[componentId as keyof typeof componentConfig];
                  if (!config) return null;

                  return (
                    <div key={componentId} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <config.icon className={`w-5 h-5 ${config.color}`} />
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{config.name}</h4>
                      </div>

                      {/* Component-specific data display/editing */}
                      {componentId === 'pricing' && (
                        <div className="space-y-2">
                          <div className="text-sm">
                            <span className="text-gray-500">Type: </span>
                            {isEditing ? (
                              <Select
                                value={(editData.componentData as any)?.pricingType || ''}
                                onValueChange={(value) => updateComponentData('pricingType', value)}
                              >
                                <SelectTrigger className="w-full mt-1">
                                  <SelectValue placeholder="Select pricing type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="single">Single Price</SelectItem>
                                  <SelectItem value="tiers">Pricing Tiers</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="font-medium">{(componentData as any)?.pricingType || 'Not set'}</span>
                            )}
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-500">Base Price: </span>
                            {isEditing ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={(editData.componentData as any)?.basePrice || ''}
                                onChange={(e) => updateComponentData('basePrice', e.target.value)}
                                placeholder="25.00"
                                className="mt-1"
                              />
                            ) : (
                              <span className="font-medium">${(componentData as any)?.basePrice || '0.00'}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {componentId === 'release' && (
                        <div className="space-y-2">
                          <div className="text-sm">
                            <span className="text-gray-500">Release Date: </span>
                            {isEditing ? (
                              <Input
                                type="date"
                                value={(editData.componentData as any)?.releaseDate || ''}
                                onChange={(e) => updateComponentData('releaseDate', e.target.value)}
                                className="mt-1"
                              />
                            ) : (
                              <span className="font-medium">{(componentData as any)?.releaseDate || 'Not set'}</span>
                            )}
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-500">Release Time: </span>
                            {isEditing ? (
                              <Input
                                type="time"
                                value={(editData.componentData as any)?.releaseTime || ''}
                                onChange={(e) => updateComponentData('releaseTime', e.target.value)}
                                className="mt-1"
                              />
                            ) : (
                              <span className="font-medium">{(componentData as any)?.releaseTime || 'Not set'}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {componentId === 'upload' && (
                        <div className="space-y-2">
                          <div className="text-sm">
                            <span className="text-gray-500">Max Files: </span>
                            <span className="font-medium">{(componentData as any)?.maxFiles || '5'}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-500">File Types: </span>
                            <span className="font-medium">{(componentData as any)?.fileTypes || 'All'}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-500">Attachments: </span>
                            <span className="font-medium">{task.attachments?.length || 0} files</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Task Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Task Details</h3>
              <div className="space-y-4">
                <div>
                  <Label>Description</Label>
                  {isEditing ? (
                    <Textarea
                      value={editData.description}
                      onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {task.description || 'No description provided'}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Priority</Label>
                  {isEditing ? (
                    <Select
                      value={editData.priority}
                      onValueChange={(value) => setEditData(prev => ({ ...prev, priority: value as Task['priority'] }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {task.priority}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Due Date</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editData.dueDate}
                      onChange={(e) => setEditData(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Assignment & Status</h3>
              <div className="space-y-4">
                <div>
                  <Label>Assigned To</Label>
                  {isEditing ? (
                    <UserDropdown
                      value={editData.assignedTo}
                      onChange={(email) => setEditData(prev => ({ ...prev, assignedTo: email }))}
                      placeholder="Select team member..."
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {task.assignedUser?.name || task.assignedTo || 'Unassigned'}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Status</Label>
                  <Select
                    value={task.status}
                    onValueChange={(value) => onUpdateStatus(value as Task['status'])}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Created</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {new Date(task.createdAt).toLocaleDateString()} by {task.createdByUser?.name || 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Workflow Data */}
          {Object.keys(componentData).length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Workflow Data</h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">
                  {JSON.stringify(componentData, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Actions */}
          {canEdit && (
            <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={() => onDelete(task.id)}
                variant="destructive"
                size="sm"
              >
                Delete Task
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}