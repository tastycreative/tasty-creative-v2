"use client";

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  FileSpreadsheet, 
  ExternalLink, 
  Folder, 
  Calendar,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { SheetGenerationWizard } from './SheetGenerationWizard';

interface SheetLink {
  id: string;
  sheetUrl: string;
  sheetName: string | null;
  sheetType: string | null;
  folderName: string | null;
  folderId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ModelSheetLinksTabProps {
  modelName: string;
}

export function ModelSheetLinksTab({ modelName }: ModelSheetLinksTabProps) {
  // Filter and sort state
  const [filterType, setFilterType] = useState<string>('');
  const [filterFolder, setFilterFolder] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'updatedAt'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch sheet links and launchesPodFolderId for the model
  const { data: sheetLinksData, isLoading: sheetLinksLoading, error: sheetLinksError } = useQuery<{ sheetLinks: SheetLink[], launchesPodFolderId?: string }>({
    queryKey: ['model-sheet-links', modelName],
    queryFn: async () => {
      const response = await fetch(`/api/models/${encodeURIComponent(modelName)}/sheet-links`);
      if (!response.ok) {
        throw new Error('Failed to fetch sheet links');
      }
      return response.json();
    },
    enabled: !!modelName,
    select: (data) => {
      // If API returns array, treat as legacy, else expect launchesPodFolderId
      if (Array.isArray(data)) return { sheetLinks: data };
      return data;
    }
  });

  // Filtered and sorted sheetLinks (guard against undefined)
  const filteredLinks = Array.isArray(sheetLinksData?.sheetLinks)
    ? sheetLinksData.sheetLinks
        .filter(link =>
          (!filterType || (link.sheetType && link.sheetType.toLowerCase() === filterType)) &&
          (!filterFolder || (link.folderName && link.folderName.toLowerCase() === filterFolder))
        )
        .sort((a, b) => {
          if (sortBy === 'name') {
            const nameA = (a.sheetName || '').toLowerCase();
            const nameB = (b.sheetName || '').toLowerCase();
            if (nameA < nameB) return sortOrder === 'asc' ? -1 : 1;
            if (nameA > nameB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
          } else {
            const dateA = new Date(a.updatedAt).getTime();
            const dateB = new Date(b.updatedAt).getTime();
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
          }
        })
    : [];
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'MODERATOR';

  // Remove duplicate useQuery for sheetLinks

  const getSheetTypeColor = (type: string | null) => {
    switch (type?.toLowerCase()) {
      case 'pricing':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'content':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'analytics':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'schedule':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!isAdmin) return;
    
    try {
      const response = await fetch(`/api/models/${encodeURIComponent(modelName)}/sheet-links/${linkId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete sheet link');
      }

      toast.success('Sheet link deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['model-sheet-links', modelName] });
    } catch (error) {
      console.error('Error deleting sheet link:', error);
      toast.error('Failed to delete sheet link');
    }
  };

  if (sheetLinksLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300"><Skeleton className="h-4 w-24" /></th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300"><Skeleton className="h-4 w-20" /></th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300"><Skeleton className="h-4 w-20" /></th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300"><Skeleton className="h-4 w-20" /></th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300"><Skeleton className="h-4 w-20" /></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {[...Array(6)].map((_, i) => (
                <tr key={i} className="hover:bg-pink-50 dark:hover:bg-gray-800 transition">
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-5 h-5" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-4 h-4" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-3.5 h-3.5" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-4 h-4" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (sheetLinksError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-red-100 dark:bg-red-900/20">
          <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Failed to load sheet links
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
          {error instanceof Error ? error.message : 'Unable to fetch sheet links'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Sheet Links
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {(sheetLinksData?.sheetLinks?.length || 0)} {(sheetLinksData?.sheetLinks?.length === 1 ? 'sheet' : 'sheets')} linked to {modelName}
          </p>
          {/* External link to Launches POD parent folder */}
          {sheetLinksData?.launchesPodFolderId && (
            <a
              href={`https://drive.google.com/drive/folders/${sheetLinksData.launchesPodFolderId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-2 px-3 py-1 border rounded text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-pink-100 dark:hover:bg-pink-900 transition"
            >
              <Folder className="w-4 h-4 text-pink-600 dark:text-pink-400" />
              View Launches POD Folder
            </a>
          )}
        </div>
        {isAdmin && (
          <Button onClick={() => setIsWizardOpen(true)} className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white">
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Sheets
          </Button>
        )}
      </div>
        
        {/* Sheet Generation Wizard */}
        <SheetGenerationWizard 
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          modelName={modelName}
        />
        
  {/* Filter and Sort Controls */}
  {sheetLinksData?.sheetLinks && sheetLinksData.sheetLinks.length > 0 ? (
          <>
            <div className="flex flex-wrap gap-4 items-center mb-4">
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mr-2">Filter by Type:</label>
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="px-2 py-1 border rounded text-sm bg-white dark:bg-gray-900 dark:text-gray-100"
                >
                  <option value="">All</option>
                  <option value="analyst sheet">Analyst Sheet</option>
                  <option value="creator sheet">Creator Sheet</option>
                  <option value="scheduler sheet">Scheduler Sheet</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mr-2">Filter by Folder:</label>
                <select
                  value={filterFolder}
                  onChange={e => setFilterFolder(e.target.value)}
                  className="px-2 py-1 border rounded text-sm bg-white dark:bg-gray-900 dark:text-gray-100"
                >
                  <option value="">All</option>
                  {/* Dynamically list unique folder names */}
                  {Array.isArray(sheetLinksData?.sheetLinks) &&
                    Array.from(new Set(sheetLinksData.sheetLinks.map((l: SheetLink) => l.folderName).filter((f): f is string => !!f))).map(folder => (
                      <option key={folder} value={folder.toLowerCase()}>{folder}</option>
                    ))}
                </select>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => { setFilterType(''); setFilterFolder(''); }}
                  className="px-3 py-1 border rounded text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-pink-100 dark:hover:bg-pink-900 transition"
                >
                  Clear Filters
                </button>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mr-2">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as 'name' | 'updatedAt')}
                  className="px-2 py-1 border rounded text-sm bg-white dark:bg-gray-900 dark:text-gray-100 mr-2"
                >
                  <option value="name">Name</option>
                  <option value="updatedAt">Updated</option>
                </select>
                <button
                  type="button"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-2 py-1 border rounded text-sm bg-white dark:bg-gray-900 dark:text-gray-100"
                  title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Folder</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Updated</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredLinks.map((link) => (
                    <tr key={link.id} className="hover:bg-pink-50 dark:hover:bg-gray-800 transition">
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                          <span className="font-semibold text-gray-900 dark:text-gray-100 truncate" title={link.sheetName || 'Untitled Sheet'}>
                            {link.sheetName || 'Untitled Sheet'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {link.sheetType && (
                          <Badge className={`${getSheetTypeColor(link.sheetType)} w-fit`} variant="secondary">
                            {link.sheetType}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {link.folderName && (
                            <>
                              <Folder className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                              <span className="text-gray-700 dark:text-gray-300 truncate">
                                {link.folderName}
                              </span>
                              {link.folderId && (
                                <a
                                  href={`https://drive.google.com/drive/folders/${link.folderId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 flex-shrink-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>Updated {formatDate(link.updatedAt)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <a
                            href={link.sheetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button 
                              variant="outline" 
                              className="group-hover:bg-gradient-to-r group-hover:from-pink-500 group-hover:to-purple-500 group-hover:text-white group-hover:border-transparent transition-all"
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Open
                            </Button>
                          </a>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteLink(link.id)}
                              className="transition-opacity"
                            >
                              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <FileSpreadsheet className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No sheet links found
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-4">
              There are no sheets linked to this model yet.
            </p>
            {isAdmin && (
              <Button onClick={() => setIsWizardOpen(true)} className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white">
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Your First Sheet
              </Button>
            )}
          </div>
        )}
    </div>
  );
}

