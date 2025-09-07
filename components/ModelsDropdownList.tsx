import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
}

const ModelsDropdownList: React.FC<ModelsDropdownListProps> = ({
  value,
  onValueChange,
  placeholder = "Choose your model...",
  className = ""
}) => {
  const [clientModels, setClientModels] = useState<ClientModel[]>([]);
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
        // Filter out any models with empty clientName and ensure they have valid data
        const validModels = data.clientModels.filter(
          (model: ClientModel) => model.clientName && model.clientName.trim() !== ''
        );
        setClientModels(validModels);
      } else {
        console.error('Failed to fetch client models:', data.error);
        setError('Failed to load models');
        // Fallback to hardcoded models
        setClientModels([
          { id: 'fallback-1', clientName: 'Alanna', status: 'active' },
          { id: 'fallback-2', clientName: 'Sarah', status: 'active' },
          { id: 'fallback-3', clientName: 'Jessica', status: 'active' },
        ]);
      }
    } catch (error) {
      console.error('Error fetching client models:', error);
      setError('Failed to load models');
      // Fallback to hardcoded models
      setClientModels([
        { id: 'fallback-1', clientName: 'Alanna', status: 'active' },
        { id: 'fallback-2', clientName: 'Sarah', status: 'active' },
        { id: 'fallback-3', clientName: 'Jessica', status: 'active' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch models on component mount
  useEffect(() => {
    fetchClientModels();
  }, []);

  // Handle value change - we pass the clientName as the value
  const handleValueChange = (selectedClientName: string) => {
    onValueChange(selectedClientName);
  };

  return (
    <Select value={value} onValueChange={handleValueChange}>
      <SelectTrigger className={className}>
        <SelectValue 
          placeholder={isLoading ? "Loading models..." : error ? "Error loading models" : placeholder} 
        />
      </SelectTrigger>
      <SelectContent className="rounded-lg border shadow-lg bg-white dark:bg-gray-900">
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
        ) : clientModels.length > 0 ? (
          clientModels.map((model) => (
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
