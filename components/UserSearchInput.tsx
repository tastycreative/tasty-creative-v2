'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, User, X } from 'lucide-react';

interface UserOption {
  id: string;
  name: string | null;
  email: string;
}

interface UserSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function UserSearchInput({ 
  value, 
  onChange, 
  placeholder = "Search users...",
  className = ""
}: UserSearchInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<UserOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const searchUsers = async () => {
      if (inputValue.length < 2) {
        setSearchResults([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(inputValue)}`);
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.users || []);
          setIsOpen(data.users?.length > 0);
        }
      } catch (error) {
        console.error('Error searching users:', error);
        setSearchResults([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [inputValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  };

  const handleUserSelect = (user: UserOption) => {
    setInputValue(user.email);
    onChange(user.email);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setInputValue('');
    onChange('');
    setSearchResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (searchResults.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {inputValue && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 text-center text-gray-500 dark:text-gray-400">
              Searching...
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map((user) => (
              <button
                key={user.id}
                onClick={() => handleUserSelect(user)}
                className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 focus:bg-gray-100 dark:focus:bg-gray-600 focus:outline-none first:rounded-t-lg last:rounded-b-lg"
              >
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {user.name || user.email.split('@')[0]}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user.email}
                    </div>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="p-3 text-center text-gray-500 dark:text-gray-400">
              No users found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
