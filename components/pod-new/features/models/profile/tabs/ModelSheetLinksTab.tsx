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
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'MODERATOR';

  // Fetch sheet links for the model
  const { data: sheetLinks, isLoading, error } = useQuery<SheetLink[]>({
    queryKey: ['model-sheet-links', modelName],
    queryFn: async () => {
      const response = await fetch(`/api/models/${encodeURIComponent(modelName)}/sheet-links`);
      if (!response.ok) {
        throw new Error('Failed to fetch sheet links');
      }
      return response.json();
    },
    enabled: !!modelName,
  });

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

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-full mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
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
            {sheetLinks?.length || 0} {sheetLinks?.length === 1 ? 'sheet' : 'sheets'} linked to {modelName}
          </p>
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
        
        {/* Sheet Links Grid */}
        {sheetLinks && sheetLinks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sheetLinks.map((link) => (
              <Card 
                key={link.id}
                className="group hover:shadow-lg transition-all duration-300 relative overflow-hidden min-w-0 flex flex-col"
              >
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-pink-50/50 via-purple-50/50 to-blue-50/50 dark:from-gray-800/50 dark:via-purple-900/20 dark:to-blue-900/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <CardHeader className="relative min-w-0">
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                      <div className="p-2 bg-gradient-to-br from-pink-500/10 to-purple-500/10 dark:from-pink-400/20 dark:to-purple-400/20 rounded-lg flex-shrink-0">
                        <FileSpreadsheet className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden space-y-1">
                        <h3 
                          className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate w-full block" 
                          title={link.sheetName || 'Untitled Sheet'}
                        >
                          {link.sheetName || 'Untitled Sheet'}
                        </h3>
                        {link.sheetType && (
                          <Badge className={`${getSheetTypeColor(link.sheetType)} w-fit`} variant="secondary">
                            {link.sheetType}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteLink(link.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="relative space-y-3 flex-1 flex flex-col">
                  <div className="flex-1 space-y-3">
                    {/* Folder Info */}
                    {link.folderName && (
                      <div className="flex items-center gap-2 text-sm">
                        <Folder className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300 truncate flex-1">
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
                      </div>
                    )}

                    {/* Updated Date */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Updated {formatDate(link.updatedAt)}</span>
                    </div>
                  </div>

                  {/* Sheet Link Button - Always at bottom */}
                  <a
                    href={link.sheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mt-auto"
                  >
                    <Button 
                      variant="outline" 
                      className="w-full group-hover:bg-gradient-to-r group-hover:from-pink-500 group-hover:to-purple-500 group-hover:text-white group-hover:border-transparent transition-all"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Sheet
                    </Button>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
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

