import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from 'lucide-react';

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
  const [clientModels, setClientModels] = useState<ClientModel[]>([]);
  const [filteredModels, setFilteredModels] = useState<ClientModel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch client models from API
  const fetchClientModels = async () => {
    setIsLoading(true);
    setError(null);
    try {
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
        setClientModels(validModels);
        setFilteredModels(validModels);
      } else {
        console.error('Failed to fetch client models:', data.error);
        setError('Failed to load models');
        setClientModels([]);
        setFilteredModels([]);
      }
    } catch (error) {
      console.error('Error fetching client models:', error);
      setError('Failed to load models');
      setClientModels([]);
      setFilteredModels([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch models on component mount
  useEffect(() => {
    fetchClientModels();
  }, []);

  // Filter models based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredModels(clientModels);
    } else {
      const filtered = clientModels.filter((model) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          model.clientName.toLowerCase().includes(searchLower) ||
          (model.name && model.name.toLowerCase().includes(searchLower))
        );
      });
      setFilteredModels(filtered);
    }
  }, [searchTerm, clientModels]);

  // Handle value change - we pass the clientName as the value
  const handleValueChange = (selectedClientName: string) => {
    onValueChange(selectedClientName);
  };

  return (
    <Select value={value} onValueChange={handleValueChange} disabled={disabled}>
        <SelectTrigger
          className={`${className} ${hasError ? "border-red-500 dark:border-red-500" : ""}`}
          disabled={disabled}
        >
          <SelectValue
            placeholder={isLoading ? "Loading models..." : error ? "Error loading models" : placeholder}
          />
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
            />
          </div>
        </div>

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
                {model.profilePicture && (
                  <img
                    src={model.profilePicture}
                    alt={model.clientName}
                    className="w-6 h-6 rounded-full object-cover"
                    onError={(e) => {
                      // Hide image if it fails to load
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
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
  );
};

export default ModelsDropdownList;
