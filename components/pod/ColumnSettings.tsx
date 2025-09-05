"use client";

import React, { useState } from 'react';
import {
  Settings,
  Plus,
  Edit3,
  Trash2,
  GripVertical,
  X,
  Check,
  RotateCcw,
  Palette,
} from 'lucide-react';
import { useBoardColumns } from '@/lib/stores/boardStore';
import type { BoardColumn } from '@/lib/stores/boardStore';

interface ColumnSettingsProps {
  currentTeamId: string;
}

interface EditingColumn {
  id: string;
  label: string;
  color: string;
}

const PREDEFINED_COLORS = [
  '#6B7280', // Gray
  '#EF4444', // Red  
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#22C55E', // Green
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#10B981', // Emerald
];

const ColumnSettings = React.memo<ColumnSettingsProps>(({ currentTeamId }) => {
  const {
    columns,
    isLoadingColumns,
    showColumnSettings,
    fetchColumns,
    createColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,
    resetToDefaultColumns,
    setShowColumnSettings,
  } = useBoardColumns();

  const [editingColumn, setEditingColumn] = useState<EditingColumn | null>(null);
  const [newColumnLabel, setNewColumnLabel] = useState('');
  const [newColumnColor, setNewColumnColor] = useState('#6B7280');
  const [showNewColumnForm, setShowNewColumnForm] = useState(false);
  const [draggedColumn, setDraggedColumn] = useState<BoardColumn | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [localColumns, setLocalColumns] = useState<BoardColumn[]>([]);

  // Keep local columns in sync with store
  React.useEffect(() => {
    setLocalColumns(columns);
  }, [columns]);

  // Load columns when component mounts or team changes (only if not already loaded)
  React.useEffect(() => {
    if (currentTeamId && showColumnSettings && columns.length === 0 && !isLoadingColumns) {
      fetchColumns(currentTeamId);
    }
  }, [currentTeamId, showColumnSettings, columns.length, isLoadingColumns, fetchColumns]);

  const handleSaveEdit = async () => {
    if (!editingColumn) return;
    
    await updateColumn(editingColumn.id, {
      label: editingColumn.label,
      color: editingColumn.color,
    });
    setEditingColumn(null);
  };

  const handleCancelEdit = () => {
    setEditingColumn(null);
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (window.confirm('Are you sure you want to delete this column?')) {
      await deleteColumn(columnId);
    }
  };

  const handleCreateColumn = async () => {
    if (!newColumnLabel.trim()) return;

    const newStatus = `CUSTOM_${Date.now()}`;
    await createColumn({
      teamId: currentTeamId,
      label: newColumnLabel.trim(),
      status: newStatus,
      position: columns.length,
      color: newColumnColor,
      isDefault: false,
      isActive: true,
    });

    setNewColumnLabel('');
    setNewColumnColor('#6B7280');
    setShowNewColumnForm(false);
  };

  const handleResetColumns = async () => {
    if (window.confirm('This will reset all columns to the default 4-column layout. Are you sure?')) {
      await resetToDefaultColumns(currentTeamId);
    }
  };

  const handleDragStart = (column: BoardColumn) => {
    setDraggedColumn(column);
  };

  const handleDragEnd = () => {
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, targetColumn: BoardColumn) => {
    e.preventDefault();
    if (!draggedColumn || draggedColumn.id === targetColumn.id) return;
    
    setDragOverColumn(targetColumn.id);
    
    // Optimistic reordering for visual feedback
    const reorderedColumns = [...localColumns];
    const draggedIndex = reorderedColumns.findIndex(c => c.id === draggedColumn.id);
    const targetIndex = reorderedColumns.findIndex(c => c.id === targetColumn.id);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [removed] = reorderedColumns.splice(draggedIndex, 1);
      reorderedColumns.splice(targetIndex, 0, removed);
      setLocalColumns(reorderedColumns);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (targetColumn: BoardColumn) => {
    if (!draggedColumn || draggedColumn.id === targetColumn.id) {
      setDraggedColumn(null);
      setDragOverColumn(null);
      return;
    }

    const reorderedColumns = [...localColumns];
    const updatedColumns = reorderedColumns.map((col, index) => ({
      ...col,
      position: index
    }));

    // Update the store immediately
    await reorderColumns(updatedColumns);
    
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  if (!showColumnSettings) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Column Settings
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleResetColumns}
              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors flex items-center space-x-1"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset</span>
            </button>
            <button
              onClick={() => setShowColumnSettings(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {isLoadingColumns ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <>
              {/* Existing Columns */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Current Columns ({columns.length})
                </h3>
                {localColumns.map((column) => {
                  const isDragging = draggedColumn?.id === column.id;
                  const isDragOver = dragOverColumn === column.id;
                  
                  return (
                    <div
                      key={column.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 ${
                        isDragging 
                          ? 'opacity-50 scale-95 bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600' 
                          : isDragOver
                            ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-500 transform translate-y-1'
                            : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                      }`}
                      draggable
                      onDragStart={() => handleDragStart(column)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleDragOver(e, column)}
                      onDragLeave={handleDragLeave}
                      onDrop={() => handleDrop(column)}
                    >
                    {/* Drag Handle */}
                    <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />

                    {/* Color Indicator */}
                    <div
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: column.color }}
                    />

                    {/* Label */}
                    {editingColumn?.id === column.id ? (
                      <div className="flex-1 flex items-center space-x-2">
                        <input
                          type="text"
                          value={editingColumn.label}
                          onChange={(e) => setEditingColumn({ ...editingColumn, label: e.target.value })}
                          className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          autoFocus
                        />
                        <div className="flex space-x-1">
                          {PREDEFINED_COLORS.map(color => (
                            <button
                              key={color}
                              onClick={() => setEditingColumn({ ...editingColumn, color })}
                              className={`w-6 h-6 rounded border-2 ${editingColumn.color === color ? 'border-gray-800 dark:border-gray-200' : 'border-gray-300 dark:border-gray-600'}`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {column.label}
                        </span>
                        {column.isDefault && (
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                            (Default)
                          </span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center space-x-1">
                      {editingColumn?.id === column.id ? (
                        <>
                          <button
                            onClick={handleSaveEdit}
                            className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingColumn({
                              id: column.id,
                              label: column.label,
                              color: column.color
                            })}
                            className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          {!column.isDefault && (
                            <button
                              onClick={() => handleDeleteColumn(column.id)}
                              className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                    </div>
                  );
                })}
              </div>

              {/* Add New Column */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                {showNewColumnForm ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Add New Column
                    </h4>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newColumnLabel}
                        onChange={(e) => setNewColumnLabel(e.target.value)}
                        placeholder="Column name"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                      <div className="flex space-x-1">
                        {PREDEFINED_COLORS.slice(0, 5).map(color => (
                          <button
                            key={color}
                            onClick={() => setNewColumnColor(color)}
                            className={`w-8 h-8 rounded border-2 ${newColumnColor === color ? 'border-gray-800 dark:border-gray-200' : 'border-gray-300 dark:border-gray-600'}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleCreateColumn}
                        disabled={!newColumnLabel.trim()}
                        className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-md text-sm transition-colors"
                      >
                        Create Column
                      </button>
                      <button
                        onClick={() => {
                          setShowNewColumnForm(false);
                          setNewColumnLabel('');
                          setNewColumnColor('#6B7280');
                        }}
                        className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md text-sm transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNewColumnForm(true)}
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add New Column</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Help Text */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            💡 Drag columns to reorder them. Default columns can be renamed but not deleted.
          </p>
        </div>
      </div>
    </div>
  );
});

export default ColumnSettings;