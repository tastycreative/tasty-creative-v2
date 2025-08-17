'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, User, X, Search } from 'lucide-react';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface UserDropdownProps {
  value?: string;
  onChange: (email: string) => void;
  placeholder?: string;
  className?: string;
}

export default function UserDropdown({ 
  value = '', 
  onChange, 
  placeholder = "Search and select user...",
  className = ""
}: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search users when search term changes OR when dropdown opens
  useEffect(() => {
    const searchUsers = async () => {
      // Always fetch if dropdown is open (either with search term or to show all POD users)
      if (!isOpen) {
        return;
      }

      // If no search term, fetch all POD users
      const queryParam = searchTerm.length >= 2 ? searchTerm : 'POD_USERS_ALL';

      setLoading(true);
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(queryParam)}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setUsers(result.users);
          }
        }
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      // If we have a search term, debounce it
      if (searchTerm.length >= 2) {
        const debounceTimer = setTimeout(searchUsers, 300);
        return () => clearTimeout(debounceTimer);
      } else {
        // If no search term, fetch immediately
        searchUsers();
      }
    }
  }, [searchTerm, isOpen]);

  // Find selected user when value changes
  useEffect(() => {
    if (value && !selectedUser) {
      // Try to find user info from current users list first
      const foundUser = users.find(user => user.email === value);
      if (foundUser) {
        setSelectedUser(foundUser);
      } else if (value.includes('@')) {
        // If user not found but we have an email, fetch user info
        const fetchUserInfo = async () => {
          try {
            const response = await fetch(`/api/users/search?q=${encodeURIComponent(value)}`);
            if (response.ok) {
              const result = await response.json();
              if (result.success && result.users.length > 0) {
                const userFromAPI = result.users.find((u: User) => u.email === value);
                if (userFromAPI) {
                  setSelectedUser(userFromAPI);
                  return;
                }
              }
            }
          } catch (error) {
            console.error('Error fetching user info:', error);
          }
          
          // If API call fails or user not found, create a temporary user object for display
          // Extract name from email (part before @)
          const displayName = value.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          setSelectedUser({
            id: '',
            name: displayName,
            email: value,
            role: 'POD'
          });
        };
        
        fetchUserInfo();
      }
    } else if (!value) {
      setSelectedUser(null);
    }
  }, [value, users]);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    onChange(user.email);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    setSelectedUser(null);
    onChange('');
    setSearchTerm('');
  };

  const handleDropdownToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Focus search input when opening
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      // Clear users list when closing to ensure fresh data on next open
      setUsers([]);
      setSearchTerm('');
    }
  };

  const displayValue = selectedUser 
    ? (selectedUser.name || selectedUser.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
    : '';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Main Input Display */}
      <div 
        onClick={handleDropdownToggle}
        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500 transition-all cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            {selectedUser ? (
              <>
                <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {selectedUser.name?.charAt(0) || selectedUser.email?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {selectedUser.name || selectedUser.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {selectedUser.email}
                  </p>
                </div>
              </>
            ) : (
              <>
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-gray-500 dark:text-gray-400 text-sm">
                  {placeholder}
                </span>
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {selectedUser && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-50 max-h-64 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-600">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users by name or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {/* User List */}
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {searchTerm.length >= 2 ? 'Searching...' : 'Loading POD users...'}
                </p>
              </div>
            ) : users.length > 0 ? (
              <div className="py-2">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {user.name || user.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                    </div>
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                      {user.role}
                    </span>
                  </button>
                ))}
              </div>
            ) : searchTerm.length >= 2 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No POD users found</p>
                <p className="text-xs">Try a different search term</p>
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Search POD users</p>
                <p className="text-xs">Type to filter the list</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
