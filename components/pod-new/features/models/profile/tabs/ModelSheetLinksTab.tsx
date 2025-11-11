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
  Edit2,
  Sparkles,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

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
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [selectedSheetType, setSelectedSheetType] = useState<string | null>(null);
  const [sheetInputMethod, setSheetInputMethod] = useState<'existing' | 'generate' | null>(null);
  const [captionBankOptions, setCaptionBankOptions] = useState({
    free: false,
    paid: false,
  });
  const [newSheetData, setNewSheetData] = useState({
    sheetUrl: '',
    sheetName: '',
    folderName: '',
    folderId: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{
    currentStep: number;
    steps: Array<{ label: string; status: 'pending' | 'in-progress' | 'completed' | 'error' }>;
  } | null>(null);
  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'MODERATOR';

  const sheetTypeOptions = [
    {
      id: 'caption-bank',
      label: 'Caption Bank',
      description: 'Caption templates and content ideas',
      icon: '📝',
    },
    {
      id: 'pod-sheets',
      label: 'POD Sheets',
      description: 'Content management sheets',
      icon: '📊',
      subOptions: [
        { id: 'free', label: 'FREE', description: 'Free content tracking' },
        { id: 'paid', label: 'PAID', description: 'Paid content tracking' },
        { id: 'oftv', label: 'OFTV', description: 'OFTV content tracking' },
      ],
    },
  ];

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

  const handleOpenAddModal = () => {
    setIsAddingLink(true);
    setSelectedSheetType(null);
    setSheetInputMethod(null);
    setCaptionBankOptions({ free: false, paid: false });
    setGenerationProgress(null);
    setNewSheetData({
      sheetUrl: '',
      sheetName: '',
      folderName: '',
      folderId: '',
    });
  };

  const handleCloseAddModal = () => {
    setIsAddingLink(false);
    setSelectedSheetType(null);
    setSheetInputMethod(null);
    setCaptionBankOptions({ free: false, paid: false });
    setGenerationProgress(null);
    setNewSheetData({
      sheetUrl: '',
      sheetName: '',
      folderName: '',
      folderId: '',
    });
  };

  const handleSelectSheetType = (typeId: string) => {
    setSelectedSheetType(typeId);
  };

  const handleAddSheetLink = async () => {
    if (!isAdmin || !selectedSheetType || !sheetInputMethod) return;
    
    if (sheetInputMethod === 'existing') {
      if (!newSheetData.sheetUrl) {
        toast.error('Please provide the sheet URL');
        return;
      }
    } else if (sheetInputMethod === 'generate') {
      // For Caption Bank, validate checkbox selection
      if (selectedSheetType === 'caption-bank') {
        if (!captionBankOptions.free && !captionBankOptions.paid) {
          toast.error('Please select at least one content type (FREE or PAID)');
          return;
        }
      } else if (!newSheetData.sheetName) {
        toast.error('Please provide a sheet name');
        return;
      }
    }

    // Map frontend sheet type IDs to backend format
    // Extract the subtype (free/paid/oftv) for folder organization
    let subType: string | null = null;
    if (selectedSheetType.includes('free')) subType = 'FREE';
    if (selectedSheetType.includes('paid')) subType = 'PAID';
    if (selectedSheetType.includes('oftv')) subType = 'OFTV';

    const sheetTypeMap: { [key: string]: string } = {
      'caption-bank': 'Caption Bank',
      'pod-sheets-free': 'Scheduler',
      'pod-sheets-paid': 'Scheduler',
      'pod-sheets-oftv': 'Scheduler',
      // Fallback for old format (if needed)
      'free': 'Scheduler',
      'paid': 'Scheduler',
      'oftv': 'Scheduler',
    };

    const backendSheetType = sheetTypeMap[selectedSheetType] || selectedSheetType;

    console.log('Frontend sending:', { selectedSheetType, backendSheetType, subType, captionBankOptions });

    setIsSubmitting(true);
    
    // Handle Caption Bank generation with SSE for real-time progress
    if (sheetInputMethod === 'generate' && selectedSheetType === 'caption-bank') {
      // Build dynamic progress steps based on selections
      const baseSteps = [
        { label: 'Validating model configuration', status: 'pending' as const },
        { label: 'Searching for CAPTION BANK folder', status: 'pending' as const },
        { label: 'Copying template sheet', status: 'pending' as const },
      ];

      // Add duplication steps based on checkbox selections
      const selectedTypes = [];
      if (captionBankOptions.free) selectedTypes.push('FREE');
      if (captionBankOptions.paid) selectedTypes.push('PAID');

      if (selectedTypes.length > 0) {
        baseSteps.push({
          label: `Duplicating ${selectedTypes.join(' and ')} tab${selectedTypes.length > 1 ? 's' : ''}`,
          status: 'pending' as const
        });
        baseSteps.push({
          label: 'Updating tab headers with model name',
          status: 'pending' as const
        });
        baseSteps.push({
          label: 'Protecting cells in new tabs',
          status: 'pending' as const
        });
        baseSteps.push({
          label: 'Updating MasterSheet DB formulas',
          status: 'pending' as const
        });
      }

      baseSteps.push(
        { label: 'Saving to database', status: 'pending' as const },
        { label: 'Finalizing', status: 'pending' as const }
      );
      
      setGenerationProgress({ currentStep: 0, steps: baseSteps });

      try {
        // Connect to SSE endpoint for real-time progress
        const params = new URLSearchParams({
          free: captionBankOptions.free.toString(),
          paid: captionBankOptions.paid.toString(),
        });
        
        const eventSource = new EventSource(
          `/api/models/${encodeURIComponent(modelName)}/sheet-links/generate-stream?${params}`
        );

        // Map backend step names to frontend step indices
        const stepMap: Record<string, number> = {
          'validate': 0,
          'folder': 1,
          'copy': 2,
          'duplicate': 3,
          'update': selectedTypes.length > 0 ? 4 : -1,
          'protect': selectedTypes.length > 0 ? 5 : -1,
          'formulas': selectedTypes.length > 0 ? 6 : -1,
          'save': selectedTypes.length > 0 ? 7 : 3,
          'complete': selectedTypes.length > 0 ? 8 : 4,
        };

        eventSource.addEventListener('progress', (e) => {
          const data = JSON.parse(e.data);
          const stepIndex = stepMap[data.step];
          
          if (stepIndex >= 0 && stepIndex < baseSteps.length) {
            setGenerationProgress(prev => {
              if (!prev) return null;
              const updatedSteps = [...prev.steps];
              
              // Mark previous steps as completed
              for (let i = 0; i < stepIndex; i++) {
                if (updatedSteps[i].status !== 'completed') {
                  updatedSteps[i].status = 'completed';
                }
              }
              
              // Mark current step as in-progress
              updatedSteps[stepIndex].status = 'in-progress';
              
              return { currentStep: stepIndex, steps: updatedSteps };
            });
          }
        });

        eventSource.addEventListener('complete', (e) => {
          const data = JSON.parse(e.data);
          
          // Mark all steps as completed
          setGenerationProgress(prev => {
            if (!prev) return null;
            const updatedSteps = prev.steps.map(step => ({ ...step, status: 'completed' as const }));
            return { currentStep: prev.steps.length - 1, steps: updatedSteps };
          });

          eventSource.close();
          
          // Refresh the sheet links list
          queryClient.invalidateQueries({ queryKey: ['model-sheet-links', modelName] });
          
          // Close modal and show success
          handleCloseAddModal();
          setIsSubmitting(false);
          
          // Open the new sheet in a new tab
          if (data.sheetLink?.sheetUrl) {
            window.open(data.sheetLink.sheetUrl, '_blank');
          }

          toast.success(data.message || "Sheet generated successfully");
        });

        eventSource.addEventListener('error', (e: any) => {
          const data = e.data ? JSON.parse(e.data) : { message: 'Unknown error' };
          
          // Mark current step as error
          setGenerationProgress(prev => {
            if (!prev) return null;
            const updatedSteps = [...prev.steps];
            if (prev.currentStep < updatedSteps.length) {
              updatedSteps[prev.currentStep].status = 'error';
            }
            return { ...prev, steps: updatedSteps };
          });

          eventSource.close();
          setIsSubmitting(false);

          toast.error(data.message);
        });

        eventSource.onerror = () => {
          eventSource.close();
          setIsSubmitting(false);
          setGenerationProgress(null);
          
          toast.error("Lost connection to server");
        };

        return; // Exit early since SSE handles everything
      } catch (error: any) {
        console.error("Error setting up SSE:", error);
        setIsSubmitting(false);
        setGenerationProgress(null);
        
        toast.error(error.message || "Failed to start generation");
        return;
      }
    }

    // Handle non-Caption Bank generation (existing logic)
    try {
      const response = await fetch(`/api/models/${encodeURIComponent(modelName)}/sheet-links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newSheetData,
          sheetType: backendSheetType,
          subType, // Pass the subtype for folder organization
          generateNew: sheetInputMethod === 'generate',
          captionBankOptions: selectedSheetType === 'caption-bank' ? captionBankOptions : undefined,
        }),
      });

      // Clear progress interval
      if ((window as any)._progressInterval) {
        clearInterval((window as any)._progressInterval);
        delete (window as any)._progressInterval;
      }

      if (!response.ok) {
        const errorData = await response.json();
        
        // Mark current step as error
        if (generationProgress) {
          setGenerationProgress(prev => {
            if (!prev) return null;
            const updatedSteps = [...prev.steps];
            updatedSteps[prev.currentStep] = { ...updatedSteps[prev.currentStep], status: 'error' };
            return { ...prev, steps: updatedSteps };
          });
        }
        
        throw new Error(errorData.error || 'Failed to add sheet link');
      }

      const result = await response.json();
      
      // Mark all steps as completed
      if (generationProgress) {
        setGenerationProgress(prev => {
          if (!prev) return null;
          const updatedSteps = prev.steps.map(step => ({ ...step, status: 'completed' as const }));
          return { currentStep: prev.steps.length, steps: updatedSteps };
        });
        
        // Keep progress visible for a moment before closing
        setTimeout(() => {
          setGenerationProgress(null);
        }, 1500);
      }
      
      if (result.message) {
        toast.success(result.message);
      } else if (sheetInputMethod === 'generate' && result.sheetUrl) {
        toast.success('Sheet generated and linked successfully!');
      } else {
        toast.success('Sheet link added successfully');
      }
      
      // Open the sheet in a new tab
      if (result.sheetUrl) {
        window.open(result.sheetUrl, '_blank');
      }
      
      queryClient.invalidateQueries({ queryKey: ['model-sheet-links', modelName] });
      
      // Close modal after a brief delay if showing progress
      if (generationProgress) {
        setTimeout(() => {
          handleCloseAddModal();
        }, 2000);
      } else {
        handleCloseAddModal();
      }
    } catch (error: any) {
      console.error('Error adding sheet link:', error);
      toast.error(error.message || 'Failed to add sheet link');
    } finally {
      setIsSubmitting(false);
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
            <Button onClick={handleOpenAddModal}>
              <Plus className="w-4 h-4 mr-2" />
              Add Sheet Link
            </Button>
          )}
        </div>        {/* Sheet Links Grid */}
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
              <Button onClick={handleOpenAddModal}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Sheet Link
              </Button>
            )}
          </div>
        )}

        {/* Add Sheet Link Modal */}
        <Dialog open={isAddingLink} onOpenChange={setIsAddingLink}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Add Sheet Link</DialogTitle>
              <DialogDescription className="text-sm">
                Select a sheet type and provide the details to link a new sheet to {modelName}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
              {!selectedSheetType ? (
                /* Step 1: Select Sheet Type */
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Select Sheet Type</Label>
                  <div className="space-y-3">
                    {sheetTypeOptions.map((option) => (
                      <div key={option.id}>
                        <button
                          onClick={() => {
                            if (!option.subOptions) {
                              handleSelectSheetType(option.id);
                            }
                          }}
                          className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-pink-500 hover:bg-pink-50/50 dark:hover:bg-pink-900/10 transition-all group"
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">{option.icon}</span>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-pink-600 dark:group-hover:text-pink-400">
                                {option.label}
                              </h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {option.description}
                              </p>
                            </div>
                          </div>
                        </button>
                        
                        {/* Sub-options for POD Sheets */}
                        {option.subOptions && (
                          <div className="ml-12 mt-2 space-y-2">
                            {option.subOptions.map((subOption) => (
                              <button
                                key={subOption.id}
                                onClick={() => handleSelectSheetType(`${option.id}-${subOption.id}`)}
                                className="w-full text-left p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-all group"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h5 className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                                      {subOption.label}
                                    </h5>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                      {subOption.description}
                                    </p>
                                  </div>
                                  <Badge variant="outline" className="ml-2">
                                    POD
                                  </Badge>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : !sheetInputMethod ? (
                /* Step 2: Select Input Method */
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b">
                    <div>
                      <Badge variant="outline" className="mb-2">
                        {selectedSheetType}
                      </Badge>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Choose how to add the sheet
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedSheetType(null)}
                    >
                      Change Type
                    </Button>
                  </div>

                  <Label className="text-sm font-medium">Input Method</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setSheetInputMethod('existing')}
                      className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all group text-center"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                          <ExternalLink className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            Link Existing Sheet
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Add a link to an existing Google Sheet
                          </p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setSheetInputMethod('generate')}
                      className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-500 hover:bg-green-50/50 dark:hover:bg-green-900/10 transition-all group text-center"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                          <Plus className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400">
                            Generate New Sheet
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Create a new Google Sheet automatically
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                /* Step 3: Fill Sheet Details */
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">
                          {selectedSheetType}
                        </Badge>
                        <Badge variant="secondary" className={sheetInputMethod === 'existing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'}>
                          {sheetInputMethod === 'existing' ? 'Link Existing' : 'Generate New'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {sheetInputMethod === 'existing' ? 'Provide the existing sheet details' : 'New sheet will be created in Google Drive'}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSheetInputMethod(null)}
                    >
                      Back
                    </Button>
                  </div>

                  {sheetInputMethod === 'existing' ? (
                    <div className="space-y-2">
                      <Label htmlFor="sheetUrl">
                        Google Sheet URL <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="sheetUrl"
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                        value={newSheetData.sheetUrl}
                        onChange={(e) => setNewSheetData({ ...newSheetData, sheetUrl: e.target.value })}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        The sheet name and details will be automatically extracted from the URL
                      </p>
                    </div>
                  ) : selectedSheetType === 'caption-bank' ? (
                    /* Caption Bank Generation Options */
                    <div className="space-y-3 sm:space-y-4">
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">
                          Select Content Types <span className="text-red-500">*</span>
                        </Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Choose which types of caption banks to generate
                        </p>
                        
                        <div className="space-y-2 sm:space-y-3">
                          <div className="flex items-start space-x-2 sm:space-x-3 p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <Checkbox
                              id="caption-free"
                              checked={captionBankOptions.free}
                              onCheckedChange={(checked) => 
                                setCaptionBankOptions({ ...captionBankOptions, free: checked as boolean })
                              }
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <Label 
                                htmlFor="caption-free" 
                                className="text-sm font-medium cursor-pointer flex flex-wrap items-center gap-2"
                              >
                                <span>FREE Content</span>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs">
                                  Free
                                </Badge>
                              </Label>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Caption bank for free content scheduling
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start space-x-2 sm:space-x-3 p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <Checkbox
                              id="caption-paid"
                              checked={captionBankOptions.paid}
                              onCheckedChange={(checked) => 
                                setCaptionBankOptions({ ...captionBankOptions, paid: checked as boolean })
                              }
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <Label 
                                htmlFor="caption-paid" 
                                className="text-sm font-medium cursor-pointer flex flex-wrap items-center gap-2"
                              >
                                <span>PAID Content</span>
                                <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">
                                  Paid
                                </Badge>
                              </Label>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Caption bank for paid content scheduling
                              </p>
                            </div>
                          </div>
                        </div>

                        {!captionBankOptions.free && !captionBankOptions.paid && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 flex-shrink-0" />
                            <span>Please select at least one content type</span>
                          </p>
                        )}
                      </div>

                      <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex gap-2 sm:gap-3">
                          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1">
                              Auto-Generate Caption Bank
                            </h5>
                            <p className="text-xs text-green-700 dark:text-green-300">
                              A caption bank sheet will be created from the template.
                              {(captionBankOptions.free || captionBankOptions.paid) && (
                                <>
                                  {' '}The following tab{(captionBankOptions.free && captionBankOptions.paid) ? 's' : ''} will be duplicated: {[
                                    captionBankOptions.free && 'FREE',
                                    captionBankOptions.paid && 'PAID'
                                  ].filter(Boolean).join(' and ')}.
                                  {' '}Cells D3 and T3 will be protected on each tab.
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* POD Sheets Generation (placeholder for future) */
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="sheetName">
                          Sheet Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="sheetName"
                          placeholder="e.g., New Caption Bank"
                          value={newSheetData.sheetName}
                          onChange={(e) => setNewSheetData({ ...newSheetData, sheetName: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="folderName">Folder Name (Optional)</Label>
                        <Input
                          id="folderName"
                          placeholder="e.g., Content Planning"
                          value={newSheetData.folderName}
                          onChange={(e) => setNewSheetData({ ...newSheetData, folderName: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="folderId">Google Drive Folder ID (Optional)</Label>
                        <Input
                          id="folderId"
                          placeholder="e.g., 1a2b3c4d5e6f..."
                          value={newSheetData.folderId}
                          onChange={(e) => setNewSheetData({ ...newSheetData, folderId: e.target.value })}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Extract from Drive folder URL: drive.google.com/drive/folders/[FOLDER_ID]
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Progress Indicator for Caption Bank Generation */}
            {generationProgress && (
              <div className="border-t pt-4 px-2 sm:px-0">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-4">
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-green-600 dark:text-green-400 flex-shrink-0" />
                    <h4 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100">
                      Generating Caption Bank Sheets
                    </h4>
                  </div>
                  
                  <div className="space-y-2 max-h-[300px] sm:max-h-[400px] overflow-y-auto">
                    {generationProgress.steps.map((step, index) => (
                      <div 
                        key={index}
                        className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-all ${
                          step.status === 'completed' 
                            ? 'bg-green-50 dark:bg-green-900/20' 
                            : step.status === 'in-progress'
                            ? 'bg-blue-50 dark:bg-blue-900/20'
                            : step.status === 'error'
                            ? 'bg-red-50 dark:bg-red-900/20'
                            : 'bg-gray-50 dark:bg-gray-800/50'
                        }`}
                      >
                        {step.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                        ) : step.status === 'in-progress' ? (
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        ) : step.status === 'error' ? (
                          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-600 flex-shrink-0" />
                        )}
                        
                        <span className={`text-xs sm:text-sm flex-1 ${
                          step.status === 'completed'
                            ? 'text-green-900 dark:text-green-100 font-medium'
                            : step.status === 'in-progress'
                            ? 'text-blue-900 dark:text-blue-100 font-medium'
                            : step.status === 'error'
                            ? 'text-red-900 dark:text-red-100 font-medium'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3 sm:mt-4 pt-3 border-t">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium">
                        Step {Math.min(generationProgress.currentStep + 1, generationProgress.steps.length)} of {generationProgress.steps.length}
                      </span>
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Please wait...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button 
                variant="outline" 
                onClick={handleCloseAddModal} 
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              {selectedSheetType && sheetInputMethod && !generationProgress && (
                <Button 
                  onClick={handleAddSheetLink} 
                  disabled={
                    isSubmitting || 
                    (sheetInputMethod === 'generate' && 
                     selectedSheetType === 'caption-bank' && 
                     !captionBankOptions.free && 
                     !captionBankOptions.paid)
                  }
                  className="w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span className="truncate">{sheetInputMethod === 'generate' ? 'Generating...' : 'Adding...'}</span>
                    </>
                  ) : (
                    <>
                      {sheetInputMethod === 'generate' ? (
                        <>
                          <Sparkles className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="truncate">Generate Sheet</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="truncate">Add Sheet Link</span>
                        </>
                      )}
                    </>
                  )}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}
