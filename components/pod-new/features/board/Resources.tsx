"use client";

import React, { useState, useMemo } from "react";
import { Plus, ExternalLink, Trash2, Edit2, Save, X, Loader2, Search } from "lucide-react";
import { useTeamResourcesQuery, useCreateTeamResourceMutation, useUpdateTeamResourceMutation, useDeleteTeamResourceMutation } from '@/hooks/useBoardQueries';

interface Resource {
  id: string;
  name: string;
  link: string;
  createdAt: string;
  updatedAt: string;
}

interface ResourcesProps {
  teamName: string;
  teamId: string;
}

export default function Resources({ teamName, teamId }: ResourcesProps) {
  const resourcesQuery = useTeamResourcesQuery(teamId);
  const createResource = useCreateTeamResourceMutation(teamId);
  const updateResource = useUpdateTeamResourceMutation(teamId);
  const deleteResource = useDeleteTeamResourceMutation(teamId);
  const resources = (resourcesQuery.data ?? []) as Resource[];
  const loading = resourcesQuery.isLoading;
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newResource, setNewResource] = useState({ name: "", link: "" });
  const [editResource, setEditResource] = useState({ name: "", link: "" });
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Helper function to check if a URL is valid
  const isValidUrl = (urlString: string): boolean => {
    try {
      const url = new URL(urlString);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // Filter resources based on search query
  const filteredResources = useMemo(() => {
    if (!searchQuery.trim()) {
      return resources;
    }

    const query = searchQuery.toLowerCase();
    return resources.filter(
      (resource) =>
        resource.name.toLowerCase().includes(query) ||
        resource.link.toLowerCase().includes(query)
    );
  }, [resources, searchQuery]);

  const refetchResources = () => resourcesQuery.refetch();

  const handleAdd = async () => {
    if (newResource.name.trim() && newResource.link.trim()) {
      try {
        await createResource.mutateAsync({ name: newResource.name.trim(), link: newResource.link.trim() });
        setNewResource({ name: "", link: "" });
        setIsAdding(false);
      } catch (err) {
        console.error("Error creating resource:", err);
        alert("Failed to create resource. Please try again.");
      }
    }
  };

  const handleEdit = (id: string) => {
    const resource = resources.find(r => r.id === id);
    if (resource) {
      setEditResource({ name: resource.name, link: resource.link });
      setEditingId(id);
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (editResource.name.trim() && editResource.link.trim()) {
      try {
        await updateResource.mutateAsync({ id, name: editResource.name.trim(), link: editResource.link.trim() });
        setEditingId(null);
        setEditResource({ name: "", link: "" });
      } catch (err) {
        console.error("Error updating resource:", err);
        alert("Failed to update resource. Please try again.");
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditResource({ name: "", link: "" });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this resource?")) {
      try {
        await deleteResource.mutateAsync({ id });
      } catch (err) {
        console.error("Error deleting resource:", err);
        alert("Failed to delete resource. Please try again.");
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Team Resources
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Helpful links and documentation for {teamName}
            </p>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>Add Resource</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search resources by name or link..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search Results Count */}
        {searchQuery && !loading && (
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {filteredResources.length === 0 ? (
              <span>No results found</span>
            ) : (
              <span>
                Showing {filteredResources.length} of {resources.length} resource{resources.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {(resourcesQuery.isError || error) && (
        <div className="mx-6 mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error || (resourcesQuery.error as any)?.message || 'Failed to load resources'}</p>
          <button
            onClick={refetchResources}
            className="mt-2 text-sm text-red-700 dark:text-red-300 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="p-12 flex items-center justify-center">
          <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading resources...</span>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Resource Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Link
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {/* Add New Resource Row */}
            {isAdding && (
              <tr className="bg-blue-50 dark:bg-blue-900/20">
                <td className="px-6 py-4">
                  <input
                    type="text"
                    value={newResource.name}
                    onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
                    placeholder="Enter resource name..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    autoFocus
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="url"
                    value={newResource.link}
                    onChange={(e) => setNewResource({ ...newResource, link: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={handleAdd}
                      className="p-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                      title="Save"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setIsAdding(false);
                        setNewResource({ name: "", link: "" });
                      }}
                      className="p-2 text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {/* Existing Resources */}
            {filteredResources.map((resource) => (
              <tr key={resource.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                {editingId === resource.id ? (
                  <>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={editResource.name}
                        onChange={(e) => setEditResource({ ...editResource, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="url"
                        value={editResource.link}
                        onChange={(e) => setEditResource({ ...editResource, link: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleSaveEdit(resource.id)}
                          className="p-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          title="Save"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-2 text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {resource.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isValidUrl(resource.link) ? (
                        <a
                          href={resource.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline"
                        >
                          <span className="truncate max-w-md">{resource.link}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      ) : (
                        <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-md block">
                          {resource.link}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(resource.id)}
                          className="p-2 text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(resource.id)}
                          className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}

            {/* Empty State */}
            {resources.length === 0 && !isAdding && (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center">
                  <div className="text-gray-500 dark:text-gray-400">
                    <p className="text-sm">No resources added yet.</p>
                    <p className="text-xs mt-1">Click "Add Resource" to get started.</p>
                  </div>
                </td>
              </tr>
            )}

            {/* No Search Results */}
            {resources.length > 0 && filteredResources.length === 0 && !isAdding && (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center">
                  <div className="text-gray-500 dark:text-gray-400">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No resources match "{searchQuery}"</p>
                    <p className="text-xs mt-1">Try a different search term</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
