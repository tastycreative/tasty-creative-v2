import React, { useState, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Loader2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface ClientModel {
  id: string;
  clientName: string;
  name?: string;
  status: string;
  profilePicture?: string;
}

interface ModelsDropdownListProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  hasError?: boolean;
}

const ModelsDropdownList: React.FC<ModelsDropdownListProps> = ({
  value,
  onValueChange,
  placeholder = "Choose your model...",
  className = "",
  disabled = false,
  hasError = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [manualModelName, setManualModelName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const queryClient = useQueryClient();

  // Helper function to get initials from name
  const getInitials = (name: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Fetch client models with TanStack Query - cached globally
  const { data: clientModels = [], isLoading, error } = useQuery({
    queryKey: ['client-models'],
    queryFn: async () => {
      const response = await fetch('/api/client-models');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.clientModels)) {
        // Filter out models with empty clientName, dropped status, and ensure they have valid data
        const validModels = data.clientModels.filter(
          (model: ClientModel) =>
            model.clientName &&
            model.clientName.trim() !== '' &&
            model.status.toLowerCase() !== 'dropped'
        );
        console.log('📸 Model data sample:', validModels.slice(0, 3).map((m: ClientModel) => ({
          name: m.clientName,
          hasProfilePic: !!m.profilePicture,
          profilePicUrl: m.profilePicture
        })));
        return validModels;
      } else {
        console.error('Failed to fetch client models:', data.error);
        throw new Error('Failed to load models');
      }
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    enabled: isOpen || !!value, // Only fetch when dropdown is opened or there's a value
  });

  // Filter models based on search term - use useMemo directly without state
  const filteredModels = useMemo(() => {
    if (searchTerm.trim() === '') {
      return clientModels;
    } else {
      return clientModels.filter((model: ClientModel) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          model.clientName.toLowerCase().includes(searchLower) ||
          (model.name && model.name.toLowerCase().includes(searchLower))
        );
      });
    }
  }, [searchTerm, clientModels]);

  // Handle value change - we pass the clientName as the value
  const handleValueChange = (selectedClientName: string) => {
    onValueChange(selectedClientName);
  };

  // Find the selected model to display with profile picture
  const selectedModel = clientModels.find((model: ClientModel) => model.clientName === value);

  // Handle manual model creation
  const handleCreateManualModel = async () => {
    const trimmedName = manualModelName.trim();

    if (!trimmedName) {
      setCreateError('Model name is required');
      return;
    }

    // Client-side duplicate check
    const isDuplicate = clientModels.some(
      (model) => model.clientName.toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      setCreateError('A model with this name already exists');
      return;
    }

    setIsCreating(true);
    setCreateError('');

    try {
      const response = await fetch('/api/client-models/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName: manualModelName.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        // Invalidate and refetch the client models
        await queryClient.invalidateQueries({ queryKey: ['client-models'] });

        // Set the newly created model as selected
        onValueChange(data.clientModel.clientName);

        // Reset form
        setManualModelName('');
        setIsAddingManual(false);
        setSearchTerm('');
      } else {
        setCreateError(data.error || 'Failed to create model');
      }
    } catch (error) {
      console.error('Error creating manual model:', error);
      setCreateError('Failed to create model. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="relative">
      {/* Loading Overlay */}
      {isLoading && value && !selectedModel && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-pink-600"></div>
            <span>Loading...</span>
          </div>
        </div>
      )}

      <Select value={value} onValueChange={handleValueChange} disabled={disabled} onOpenChange={setIsOpen}>
        <SelectTrigger
          className={`${className} ${hasError ? "border-red-500 dark:border-red-500" : ""}`}
          disabled={disabled}
        >
          {value && selectedModel ? (
            <div className="flex items-center gap-2 w-full">
              {selectedModel.profilePicture ? (
                <img
                  src={selectedModel.profilePicture}
                  alt={selectedModel.clientName}
                  className="w-6 h-6 rounded-full object-cover border border-gray-300 dark:border-gray-600"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white text-[10px] font-bold flex items-center justify-center border border-gray-300 dark:border-gray-600">
                  {getInitials(selectedModel.clientName)}
                </div>
              )}
              <span className="truncate">{value}</span>
            </div>
          ) : (
            <SelectValue
              placeholder={isLoading ? "Loading models..." : (error ? "Error loading models" : placeholder)}
            />
          )}
        </SelectTrigger>
        <SelectContent className="rounded-lg border shadow-lg !bg-[oklch(1_0_0)] dark:!bg-[oklch(0.205_0_0)] z-50">
        {/* Search Input */}
        <div className="p-2 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search models..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
        </div>

        {/* Add Manual Model */}
        {!isAddingManual ? (
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsAddingManual(true);
                setCreateError('');
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add model manually
            </button>
          </div>
        ) : (
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/10">
            <div className="space-y-2">
              <input
                type="text"
                value={manualModelName}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setManualModelName(newValue);

                  // Real-time duplicate validation
                  if (newValue.trim()) {
                    const isDuplicate = clientModels.some(
                      (model) => model.clientName.toLowerCase() === newValue.trim().toLowerCase()
                    );
                    if (isDuplicate) {
                      setCreateError('A model with this name already exists');
                    } else {
                      setCreateError('');
                    }
                  } else {
                    setCreateError('');
                  }
                }}
                placeholder="Enter model name..."
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') {
                    handleCreateManualModel();
                  } else if (e.key === 'Escape') {
                    setIsAddingManual(false);
                    setManualModelName('');
                    setCreateError('');
                  }
                }}
                autoFocus
              />
              {createError && (
                <div className="text-xs text-red-600 dark:text-red-400">
                  {createError}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateManualModel();
                  }}
                  disabled={isCreating}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md transition-colors"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-3 w-3" />
                      Create
                    </>
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAddingManual(false);
                    setManualModelName('');
                    setCreateError('');
                  }}
                  disabled={isCreating}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Model List */}
        {isLoading ? (
          <SelectItem value="loading" disabled className="text-sm py-2.5">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-300 border-t-blue-600"></div>
              Loading models...
            </div>
          </SelectItem>
        ) : error ? (
          <SelectItem value="error" disabled className="text-sm py-2.5">
            <div className="flex items-center gap-2 text-red-600">
              <span>⚠️</span>
              Error loading models
            </div>
          </SelectItem>
        ) : filteredModels.length > 0 ? (
          filteredModels.map((model) => (
            <SelectItem
              key={model.id}
              value={model.clientName} // Use clientName as the value
              className="text-sm py-2.5"
            >
              <div className="flex items-center gap-3">
                {model.profilePicture ? (
                  <img
                    src={model.profilePicture}
                    alt={model.clientName}
                    className="w-8 h-8 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                    onError={(e) => {
                      // Show initials fallback if image fails to load
                      const img = e.target as HTMLImageElement;
                      const parent = img.parentElement;
                      if (parent) {
                        img.style.display = 'none';
                        const initialsDiv = document.createElement('div');
                        initialsDiv.className = 'flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white text-xs font-bold';
                        initialsDiv.textContent = getInitials(model.clientName);
                        parent.insertBefore(initialsDiv, img);
                      }
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white text-xs font-bold">
                    {getInitials(model.clientName)}
                  </div>
                )}
                <div>
                  <div className="font-medium">{model.clientName}</div>
                  {model.name && model.name !== model.clientName && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {model.name}
                    </div>
                  )}
                </div>
              </div>
            </SelectItem>
          ))
        ) : searchTerm.trim() !== '' ? (
          <SelectItem value="no-results" disabled className="text-sm py-2.5">
            <div className="flex items-center gap-2 text-gray-500">
              <span>🔍</span>
              No models found matching "{searchTerm}"
            </div>
          </SelectItem>
        ) : (
          <SelectItem value="no-models" disabled className="text-sm py-2.5">
            <div className="flex items-center gap-2 text-gray-500">
              <span>📋</span>
              No models available
            </div>
          </SelectItem>
        )}
      </SelectContent>
    </Select>
    </div>
  );
};

export default ModelsDropdownList;
