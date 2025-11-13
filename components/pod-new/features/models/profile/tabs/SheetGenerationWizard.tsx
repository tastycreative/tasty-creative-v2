"use client";

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Loader2,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface SheetGenerationConfig {
  captionBank: {
    enabled: boolean;
    free: boolean;
    paid: boolean;
  };
  podSheets: {
    free: boolean;
    paid: boolean;
    oftv: boolean;
  };
  schedulerSheets: {
    free: {
      useExisting: boolean;
      existingSheetUrl: string;
      generateNew: boolean;
    };
    paid: {
      useExisting: boolean;
      existingSheetUrl: string;
      generateNew: boolean;
    };
  };
}

interface SheetGenerationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  modelName: string;
}

export function SheetGenerationWizard({ isOpen, onClose, modelName }: SheetGenerationWizardProps) {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [config, setConfig] = useState<SheetGenerationConfig>({
    captionBank: {
      enabled: false,
      free: false,
      paid: false,
    },
    podSheets: {
      free: false,
      paid: false,
      oftv: false,
    },
    schedulerSheets: {
      free: {
        useExisting: false,
        existingSheetUrl: '',
        generateNew: false,
      },
      paid: {
        useExisting: false,
        existingSheetUrl: '',
        generateNew: false,
      },
    },
  });
  const [generationProgress, setGenerationProgress] = useState<{
    currentSheet: string;
    currentStep: string;
    progress: number;
    completedSteps: string[];
    message?: string;
  } | null>(null);

  const totalSteps = 3;

  const steps = [
    { number: 1, title: 'Select Sheets', description: 'Choose which sheets to generate' },
    { number: 2, title: 'Configure', description: 'Set up sheet options' },
    { number: 3, title: 'Review & Generate', description: 'Review and start generation' },
  ];

  // Reset wizard state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      // Reset all state after a short delay to avoid visual glitches
      const timer = setTimeout(() => {
        setCurrentStep(1);
        setIsGenerating(false);
        setGenerationProgress(null);
        setConfig({
          captionBank: {
            enabled: false,
            free: false,
            paid: false,
          },
          podSheets: {
            free: false,
            paid: false,
            oftv: false,
          },
          schedulerSheets: {
            free: {
              useExisting: false,
              existingSheetUrl: '',
              generateNew: false,
            },
            paid: {
              useExisting: false,
              existingSheetUrl: '',
              generateNew: false,
            },
          },
        });
      }, 300); // Match dialog close animation

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Auto-sync Caption Bank free/paid with POD Sheets selection
  useEffect(() => {
    if (config.captionBank.enabled) {
      setConfig(prev => ({
        ...prev,
        captionBank: {
          ...prev.captionBank,
          free: prev.podSheets.free,
          paid: prev.podSheets.paid,
        }
      }));
    }
  }, [config.podSheets.free, config.podSheets.paid, config.captionBank.enabled]);

  // Helper function to validate Google Sheets URL
  const isValidGoogleSheetsUrl = (url: string): boolean => {
    if (!url || !url.trim()) return false;
    
    // Check if it's a valid Google Sheets URL
    const googleSheetsPattern = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9-_]+/;
    return googleSheetsPattern.test(url.trim());
  };

  const handleNext = () => {
    if (currentStep === 1) {
      // Validate at least one sheet type selected
      if (!config.captionBank.enabled && !config.podSheets.free && !config.podSheets.paid && !config.podSheets.oftv) {
        toast.error('Please select at least one sheet type to generate');
        return;
      }
    }

    if (currentStep === 2 && config.captionBank.enabled) {
      // Validate Caption Bank type selection (if no POD Sheets selected)
      if (!config.podSheets.free && !config.podSheets.paid) {
        if (!config.captionBank.free && !config.captionBank.paid) {
          toast.error('Please select at least one Caption Bank type (FREE or PAID)');
          return;
        }
      }

      // Validate POD Scheduler selection for FREE (only if FREE Caption Bank is enabled and FREE POD Sheet is NOT selected)
      if (config.captionBank.free && !config.podSheets.free) {
        if (!config.schedulerSheets.free.useExisting && !config.schedulerSheets.free.generateNew) {
          toast.error('Please select a POD Scheduler option for FREE Caption Bank (use existing or generate new)');
          return;
        }
        if (config.schedulerSheets.free.useExisting) {
          if (!config.schedulerSheets.free.existingSheetUrl.trim()) {
            toast.error('Please provide the Google Sheet URL for FREE POD Scheduler');
            return;
          }
          if (!isValidGoogleSheetsUrl(config.schedulerSheets.free.existingSheetUrl)) {
            toast.error('Invalid Google Sheets URL for FREE POD Scheduler. Please provide a valid URL (e.g., https://docs.google.com/spreadsheets/d/...)');
            return;
          }
        }
      }

      // Validate POD Scheduler selection for PAID (only if PAID Caption Bank is enabled and PAID POD Sheet is NOT selected)
      if (config.captionBank.paid && !config.podSheets.paid) {
        if (!config.schedulerSheets.paid.useExisting && !config.schedulerSheets.paid.generateNew) {
          toast.error('Please select a POD Scheduler option for PAID Caption Bank (use existing or generate new)');
          return;
        }
        if (config.schedulerSheets.paid.useExisting) {
          if (!config.schedulerSheets.paid.existingSheetUrl.trim()) {
            toast.error('Please provide the Google Sheet URL for PAID POD Scheduler');
            return;
          }
          if (!isValidGoogleSheetsUrl(config.schedulerSheets.paid.existingSheetUrl)) {
            toast.error('Invalid Google Sheets URL for PAID POD Scheduler. Please provide a valid URL (e.g., https://docs.google.com/spreadsheets/d/...)');
            return;
          }
        }
      }
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      let podSheetLinks: any[] = [];

      // Determine if we need to generate POD Sheets for scheduler (even if not selected in step 1)
      // This happens if only Caption Bank is selected, and 'generate new' scheduler sheet is chosen for free/paid
      const needFreeSchedulerPod = config.captionBank.enabled && config.captionBank.free && !config.podSheets.free && config.schedulerSheets.free.generateNew;
      const needPaidSchedulerPod = config.captionBank.enabled && config.captionBank.paid && !config.podSheets.paid && config.schedulerSheets.paid.generateNew;

      // Build POD Sheet generation config
      const podConfig = {
        free: config.podSheets.free || needFreeSchedulerPod,
        paid: config.podSheets.paid || needPaidSchedulerPod,
        oftv: config.podSheets.oftv,
      };

      // If any POD Sheet needs to be generated, do it first
      if (podConfig.free || podConfig.paid || podConfig.oftv) {
        podSheetLinks = await generatePODSheetsCustom(podConfig);
        // Reset progress state before starting Caption Bank generation
        if (config.captionBank.enabled) {
          await new Promise(resolve => setTimeout(resolve, 500));
          setGenerationProgress(null);
        }
      }

      // Step 2: Generate Caption Bank if enabled
      if (config.captionBank.enabled) {
        await generateCaptionBank(podSheetLinks);
      }

      // If neither was selected (shouldn't happen due to validation), show error
      if (!config.captionBank.enabled && !podConfig.free && !podConfig.paid && !podConfig.oftv) {
        toast.error('Please select at least one sheet type to generate');
        setIsGenerating(false);
        return;
      }

      // All generation complete
      setTimeout(() => {
        setIsGenerating(false);
        setGenerationProgress(null);
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error('Error generating sheets:', error);
      setIsGenerating(false);
      setGenerationProgress(null);
      toast.error(error.message || 'Failed to generate sheets');
    }
  };

  // Custom POD Sheet generator to accept podConfig
  const generatePODSheetsCustom = (podConfig: { free: boolean; paid: boolean; oftv: boolean }): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const params = new URLSearchParams();
      params.append('free', podConfig.free.toString());
      params.append('paid', podConfig.paid.toString());
      params.append('oftv', podConfig.oftv.toString());

      const eventSource = new EventSource(
        `/api/models/${encodeURIComponent(modelName)}/sheet-links/generate-pod-sheets?${params}`
      );

      // Map backend step names to frontend step IDs
      const stepMap: Record<string, string> = {
        'validate': 'validate',
        'folder': 'folder',
        'copy': 'copy',
        'save': 'save',
        'complete': 'complete',
      };

      let lastStepId: string | null = null;

      eventSource.addEventListener('progress', (e) => {
        const data = JSON.parse(e.data);
        const stepId = stepMap[data.step] || data.step.toLowerCase();
        setGenerationProgress((prev) => {
          const completedSteps = prev?.completedSteps || [];
          if (lastStepId && lastStepId !== stepId && !completedSteps.includes(lastStepId)) {
            completedSteps.push(lastStepId);
          }
          if (stepId !== lastStepId) {
            lastStepId = stepId;
          }
          return {
            currentSheet: 'POD Sheets',
            currentStep: data.step,
            progress: data.progress || 50,
            completedSteps: [...completedSteps],
            message: data.message,
          };
        });
      });

      eventSource.addEventListener('complete', (e) => {
        const data = JSON.parse(e.data);
        setGenerationProgress({
          currentSheet: 'POD Sheets',
          currentStep: 'Complete',
          progress: 100,
          completedSteps: ['validate', 'folder', 'copy', 'save', 'complete'],
        });
        eventSource.close();
        queryClient.invalidateQueries({ queryKey: ['model-sheet-links', modelName] });
        toast.success(data.message || 'POD Sheets generated successfully!');
        if (data.sheetLinks && data.sheetLinks.length > 0 && data.sheetLinks[0].sheetUrl) {
          window.open(data.sheetLinks[0].sheetUrl, '_blank');
        }
        resolve(data.sheetLinks || []);
      });

      eventSource.addEventListener('error', (e: any) => {
        const data = e.data ? JSON.parse(e.data) : { message: 'Unknown error' };
        eventSource.close();
        setGenerationProgress(null);
        toast.error(data.message || 'Failed to generate POD Sheets');
        reject(new Error(data.message || 'Failed to generate POD Sheets'));
      });

      eventSource.onerror = () => {
        eventSource.close();
        setGenerationProgress(null);
        toast.error('Lost connection to server');
        reject(new Error('Lost connection to server'));
      };
    });
  };

  const generatePODSheets = (): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const params = new URLSearchParams();
      params.append('free', config.podSheets.free.toString());
      params.append('paid', config.podSheets.paid.toString());
      params.append('oftv', config.podSheets.oftv.toString());

      const eventSource = new EventSource(
        `/api/models/${encodeURIComponent(modelName)}/sheet-links/generate-pod-sheets?${params}`
      );

      // Map backend step names to frontend step IDs
      const stepMap: Record<string, string> = {
        'validate': 'validate',
        'folder': 'folder',
        'copy': 'copy',
        'save': 'save',
        'complete': 'complete',
      };

      // Track the last step we received
      let lastStepId: string | null = null;

      eventSource.addEventListener('progress', (e) => {
        const data = JSON.parse(e.data);
        const stepId = stepMap[data.step] || data.step.toLowerCase();
        
        setGenerationProgress((prev) => {
          const completedSteps = prev?.completedSteps || [];
          
          // If we have a new step and there was a previous step, mark the previous step as completed
          if (lastStepId && lastStepId !== stepId && !completedSteps.includes(lastStepId)) {
            completedSteps.push(lastStepId);
          }
          
          // Update the last step
          if (stepId !== lastStepId) {
            lastStepId = stepId;
          }
          
          return {
            currentSheet: 'POD Sheets',
            currentStep: data.step,
            progress: data.progress || 50,
            completedSteps: [...completedSteps],
            message: data.message,
          };
        });
      });

      eventSource.addEventListener('complete', (e) => {
        const data = JSON.parse(e.data);
        
        // Mark all steps as completed
        setGenerationProgress({
          currentSheet: 'POD Sheets',
          currentStep: 'Complete',
          progress: 100,
          completedSteps: ['validate', 'folder', 'copy', 'save', 'complete'],
        });

        eventSource.close();
        
        queryClient.invalidateQueries({ queryKey: ['model-sheet-links', modelName] });
        
        toast.success(data.message || 'POD Sheets generated successfully!');
        
        // Open the first generated sheet if available
        if (data.sheetLinks && data.sheetLinks.length > 0 && data.sheetLinks[0].sheetUrl) {
          window.open(data.sheetLinks[0].sheetUrl, '_blank');
        }
        
        // Resolve with the generated sheet links for Caption Bank to use
        resolve(data.sheetLinks || []);
      });

      eventSource.addEventListener('error', (e: any) => {
        const data = e.data ? JSON.parse(e.data) : { message: 'Unknown error' };
        eventSource.close();
        setGenerationProgress(null);
        
        toast.error(data.message || 'Failed to generate POD Sheets');
        reject(new Error(data.message || 'Failed to generate POD Sheets'));
      });

      eventSource.onerror = () => {
        eventSource.close();
        setGenerationProgress(null);
        
        toast.error('Lost connection to server');
        reject(new Error('Lost connection to server'));
      };
    });
  };

  const generateCaptionBank = (podSheetLinks: any[] = []): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Prepare scheduler sheet URLs for the backend
      const schedulerUrls: { free?: string; paid?: string } = {};
      
      // If POD Sheets were generated, extract scheduler URLs from them
      if (podSheetLinks.length > 0) {
        // Find FREE Scheduler Sheet
        const freeScheduler = podSheetLinks.find(
          (link: any) => link.folderName === 'FREE' && link.sheetType === 'Scheduler Sheet'
        );
        if (freeScheduler && config.captionBank.free) {
          schedulerUrls.free = freeScheduler.sheetUrl;
          console.log('📋 Using auto-fetched FREE Scheduler URL:', schedulerUrls.free);
        }
        
        // Find PAID Scheduler Sheet
        const paidScheduler = podSheetLinks.find(
          (link: any) => link.folderName === 'PAID' && link.sheetType === 'Scheduler Sheet'
        );
        if (paidScheduler && config.captionBank.paid) {
          schedulerUrls.paid = paidScheduler.sheetUrl;
          console.log('📋 Using auto-fetched PAID Scheduler URL:', schedulerUrls.paid);
        }
      } else {
        // Fallback to original logic if POD Sheets weren't generated
        // Get FREE scheduler URL (from POD Sheet or user-provided)
        if (config.podSheets.free) {
          // FREE POD Sheet is being generated, backend will handle scheduler URL
          schedulerUrls.free = 'AUTO'; // Flag to indicate it will be auto-generated
        } else if (config.schedulerSheets.free.useExisting && config.schedulerSheets.free.existingSheetUrl) {
          // User provided existing FREE scheduler URL
          schedulerUrls.free = config.schedulerSheets.free.existingSheetUrl;
        } else if (config.schedulerSheets.free.generateNew) {
          // Generate new FREE scheduler (will be implemented later)
          schedulerUrls.free = 'GENERATE_NEW';
        }
        
        // Get PAID scheduler URL (from POD Sheet or user-provided)
        if (config.podSheets.paid) {
          // PAID POD Sheet is being generated, backend will handle scheduler URL
          schedulerUrls.paid = 'AUTO'; // Flag to indicate it will be auto-generated
        } else if (config.schedulerSheets.paid.useExisting && config.schedulerSheets.paid.existingSheetUrl) {
          // User provided existing PAID scheduler URL
          schedulerUrls.paid = config.schedulerSheets.paid.existingSheetUrl;
        } else if (config.schedulerSheets.paid.generateNew) {
          // Generate new PAID scheduler (will be implemented later)
          schedulerUrls.paid = 'GENERATE_NEW';
        }
      }

      // Use the existing generate-stream endpoint for Caption Bank
      const params = new URLSearchParams();
      params.append('free', config.captionBank.free.toString());
      params.append('paid', config.captionBank.paid.toString());
      
      // Add scheduler URLs to params
      if (schedulerUrls.free) {
        params.append('freeSchedulerUrl', schedulerUrls.free);
      }
      if (schedulerUrls.paid) {
        params.append('paidSchedulerUrl', schedulerUrls.paid);
      }

      const eventSource = new EventSource(
        `/api/models/${encodeURIComponent(modelName)}/sheet-links/generate-stream?${params}`
      );

      // Map backend step names to frontend step IDs
      const stepMap: Record<string, string> = {
        'validate': 'validate',
        'folder': 'folder',
        'copy': 'copy',
        'duplicate': 'duplicate',
        'update': 'update',
        'protect': 'protect',
        'formulas': 'formulas',
        'save': 'save',
        'complete': 'complete',
      };

      // Track the last step we received
      let lastStepId: string | null = null;

      eventSource.addEventListener('progress', (e) => {
        const data = JSON.parse(e.data);
        const stepId = stepMap[data.step] || data.step.toLowerCase();
        
        setGenerationProgress((prev) => {
          const completedSteps = prev?.completedSteps || [];
          
          // If we have a new step and there was a previous step, mark the previous step as completed
          if (lastStepId && lastStepId !== stepId && !completedSteps.includes(lastStepId)) {
            completedSteps.push(lastStepId);
          }
          
          // Update the last step
          if (stepId !== lastStepId) {
            lastStepId = stepId;
          }
          
          return {
            currentSheet: 'Caption Bank',
            currentStep: data.step,
            progress: data.progress,
            completedSteps: [...completedSteps],
            message: data.message,
          };
        });
      });

      eventSource.addEventListener('complete', (e) => {
        const data = JSON.parse(e.data);
        
        // Mark all steps as completed
        setGenerationProgress({
          currentSheet: 'Caption Bank',
          currentStep: 'Complete',
          progress: 100,
          completedSteps: ['validate', 'folder', 'copy', 'duplicate', 'update', 'protect', 'formulas', 'save', 'complete'],
        });

        eventSource.close();
        
        queryClient.invalidateQueries({ queryKey: ['model-sheet-links', modelName] });
        
        toast.success('Caption Bank generated successfully!');
        
        // Open the caption bank sheet
        if (data.sheetLink?.sheetUrl) {
          window.open(data.sheetLink.sheetUrl, '_blank');
        } else if (data.sheetUrl) {
          window.open(data.sheetUrl, '_blank');
        }
        
        // Wait a moment before resolving
        setTimeout(() => {
          resolve();
        }, 1000);
      });

      eventSource.addEventListener('error', (e: any) => {
        const data = e.data ? JSON.parse(e.data) : { message: 'Unknown error' };
        eventSource.close();
        setGenerationProgress(null);
        
        toast.error(data.message || 'Failed to generate Caption Bank');
        reject(new Error(data.message || 'Failed to generate Caption Bank'));
      });

      eventSource.onerror = () => {
        eventSource.close();
        setGenerationProgress(null);
        
        toast.error('Lost connection to server');
        reject(new Error('Lost connection to server'));
      };
    });
  };

  const getSummary = () => {
    const items: string[] = [];
    
    if (config.captionBank.enabled) {
      const types = [];
      if (config.captionBank.free) types.push('FREE');
      if (config.captionBank.paid) types.push('PAID');
      items.push(`Caption Bank (${types.join(', ')})`);
    }
    
    const podTypes = [];
    if (config.podSheets.free) podTypes.push('FREE');
    if (config.podSheets.paid) podTypes.push('PAID');
    if (config.podSheets.oftv) podTypes.push('OFTV');
    
    if (podTypes.length > 0) {
      items.push(`POD Sheets (${podTypes.join(', ')})`);
    }
    
    return items;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[1400px] w-[95vw] max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-6 h-6 text-pink-600 dark:text-pink-400" />
            Generate Sheets for {modelName}
          </DialogTitle>
          <DialogDescription>
            Set up and generate all your sheets at once
          </DialogDescription>
        </DialogHeader>

        {/* Main Content with Vertical Timeline on Left */}
        <div className="flex gap-10 flex-1 min-h-0 px-6">
          {/* Vertical Timeline - Left Side */}
          <div className="flex-shrink-0 w-56 pt-6 pb-6">
            <div className="space-y-6">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all flex-shrink-0 ${
                        step.number < currentStep
                          ? 'bg-green-500 text-white shadow-lg'
                          : step.number === currentStep
                          ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white ring-4 ring-pink-100 shadow-lg'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                      }`}
                    >
                      {step.number < currentStep ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        step.number
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-0.5 h-16 mt-3 rounded-full ${
                        step.number < currentStep ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'
                      }`} />
                    )}
                  </div>
                  <div className="flex-1 pt-2">
                    <div className={`text-sm font-semibold leading-tight ${
                      currentStep >= step.number 
                        ? 'text-gray-900 dark:text-gray-100' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                      {step.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Content Area - Right Side */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-2">
            {/* Step Content */}
            <div className="py-6">
              {/* Step 1: Select Sheet Types */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <h3 className="text-lg font-semibold mb-2">What would you like to generate?</h3>
                  
                  <Card 
                    className={`cursor-pointer transition-all ${
                      config.captionBank.enabled 
                        ? 'ring-2 ring-pink-500 bg-pink-50/50 dark:bg-pink-900/10' 
                        : 'hover:border-pink-300 hover:shadow-md'
                    }`}
                    onClick={() => setConfig(prev => ({
                      ...prev,
                      captionBank: { ...prev.captionBank, enabled: !prev.captionBank.enabled }
                    }))}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="text-4xl flex-shrink-0">📝</div>
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-1">Caption Bank</CardTitle>
                            <CardDescription className="text-sm">
                              Generate a caption library with FREE and PAID content templates
                            </CardDescription>
                          </div>
                        </div>
                        <Checkbox 
                          checked={config.captionBank.enabled}
                          className="mt-1 flex-shrink-0"
                        />
                      </div>
                    </CardHeader>
                  </Card>

                  <Card 
                    className={`cursor-pointer transition-all ${
                      (config.podSheets.free || config.podSheets.paid || config.podSheets.oftv)
                        ? 'ring-2 ring-purple-500 bg-purple-50/50 dark:bg-purple-900/10' 
                        : 'hover:border-purple-300 hover:shadow-md'
                    }`}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start gap-4">
                        <div className="text-4xl flex-shrink-0">📊</div>
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">POD Sheets</CardTitle>
                          <CardDescription className="text-sm mb-3">
                            Generate content management sheets for different subscription tiers
                          </CardDescription>
                          
                          {/* Info about what gets created */}
                          <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                            <div className="text-xs text-purple-900 dark:text-purple-100">
                              <strong>Each tier creates 3 sheets:</strong>
                              <ul className="mt-1 ml-4 space-y-0.5 list-disc">
                                <li>Analyst Sheet - Analytics tracking</li>
                                <li>Creator Sheet - Content management</li>
                                <li><strong>Scheduler Sheet</strong> - URL used for Caption Bank imports</li>
                              </ul>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div
                              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                config.podSheets.free
                                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-sm'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-green-300 hover:bg-green-50/50 dark:hover:bg-green-900/10'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfig(prev => ({
                                  ...prev,
                                  podSheets: { ...prev.podSheets, free: !prev.podSheets.free }
                                }));
                              }}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-base">FREE</span>
                                <Checkbox checked={config.podSheets.free} />
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                Free content tracking
                              </p>
                            </div>

                            <div
                              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                config.podSheets.paid
                                  ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20 shadow-sm'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-pink-300 hover:bg-pink-50/50 dark:hover:bg-pink-900/10'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfig(prev => ({
                                  ...prev,
                                  podSheets: { ...prev.podSheets, paid: !prev.podSheets.paid }
                                }));
                              }}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-base">PAID</span>
                                <Checkbox checked={config.podSheets.paid} />
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                Paid content tracking
                              </p>
                            </div>

                            <div
                              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                config.podSheets.oftv
                                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-sm'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 hover:bg-purple-50/50 dark:hover:bg-purple-900/10'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfig(prev => ({
                                  ...prev,
                                  podSheets: { ...prev.podSheets, oftv: !prev.podSheets.oftv }
                                }));
                              }}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-base">OFTV</span>
                                <Checkbox checked={config.podSheets.oftv} />
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                OFTV content tracking
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </div>
              )}

              {/* Step 2: Configure Options */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Configure Your Sheets</h3>
                  
                  {config.captionBank.enabled && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          📝 Caption Bank Configuration
                        </CardTitle>
                        <CardDescription>
                          Caption Bank will be generated based on your POD Sheet selections
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {/* If no POD Sheets selected, show checkboxes to select Caption Bank types */}
                          {!config.podSheets.free && !config.podSheets.paid && (
                            <div className="space-y-3 mb-4">
                              <Label className="text-sm font-medium">Select Caption Bank Types</Label>
                              <div className="space-y-2">
                                <div
                                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                    config.captionBank.free
                                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                      : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                                  }`}
                                  onClick={() => setConfig(prev => ({
                                    ...prev,
                                    captionBank: {
                                      ...prev.captionBank,
                                      free: !prev.captionBank.free
                                    }
                                  }))}
                                >
                                  <Checkbox 
                                    checked={config.captionBank.free}
                                    className="pointer-events-none"
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                        FREE
                                      </Badge>
                                      <span className="text-sm font-semibold">Caption Bank</span>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                      Generate FREE content templates
                                    </p>
                                  </div>
                                </div>

                                <div
                                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                    config.captionBank.paid
                                      ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                                      : 'border-gray-200 dark:border-gray-700 hover:border-pink-300'
                                  }`}
                                  onClick={() => setConfig(prev => ({
                                    ...prev,
                                    captionBank: {
                                      ...prev.captionBank,
                                      paid: !prev.captionBank.paid
                                    }
                                  }))}
                                >
                                  <Checkbox 
                                    checked={config.captionBank.paid}
                                    className="pointer-events-none"
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <Badge className="bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300">
                                        PAID
                                      </Badge>
                                      <span className="text-sm font-semibold">Caption Bank</span>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                      Generate PAID content templates
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Show which Caption Bank types will be generated based on POD Sheet selection */}
                          {config.podSheets.free && (
                            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
                              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                    FREE
                                  </Badge>
                                  <span className="text-sm font-semibold">Caption Bank</span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  Will use FREE POD <strong>Scheduler Sheet</strong> URL for imports (auto-generated with POD Sheets)
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {config.podSheets.paid && (
                            <div className="flex items-center gap-3 p-3 bg-pink-50 dark:bg-pink-900/10 rounded-lg border border-pink-200 dark:border-pink-800">
                              <CheckCircle2 className="w-5 h-5 text-pink-600 flex-shrink-0" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge className="bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300">
                                    PAID
                                  </Badge>
                                  <span className="text-sm font-semibold">Caption Bank</span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  Will use PAID POD <strong>Scheduler Sheet</strong> URL for imports (auto-generated with POD Sheets)
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {/* Show info if no POD Sheets are selected */}
                          {!config.podSheets.free && !config.podSheets.paid && (
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                              <div className="flex gap-2">
                                <AlertCircle className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  No POD Sheets selected. You'll need to configure POD Scheduler sheets below.
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* POD Scheduler Sheet Selection - Only show if Caption Bank is enabled WITHOUT corresponding POD Sheets */}
                  {config.captionBank.enabled && (
                    !config.podSheets.free || !config.podSheets.paid
                  ) && (
                    <Card className="border-purple-200 dark:border-purple-800">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          📅 POD Scheduler Sheets Required
                        </CardTitle>
                        <CardDescription>
                          {!config.podSheets.free && !config.podSheets.paid 
                            ? "Caption Bank needs POD Scheduler sheets for import functionality"
                            : "Additional POD Scheduler sheets needed for Caption Bank types not covered by POD Sheets"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* FREE Scheduler - Only show if FREE Caption Bank is enabled and FREE POD Sheet is NOT selected */}
                        {config.captionBank.free && !config.podSheets.free && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-3">
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                FREE
                              </Badge>
                              <span className="text-sm font-semibold">POD Scheduler Sheet</span>
                            </div>
                            
                            <div className="space-y-3">
                              {/* Option 1: Use Existing Sheet */}
                              <div
                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                  config.schedulerSheets.free.useExisting
                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/10 shadow-sm'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                                }`}
                                onClick={() => setConfig(prev => ({
                                  ...prev,
                                  schedulerSheets: {
                                    ...prev.schedulerSheets,
                                    free: {
                                      ...prev.schedulerSheets.free,
                                      useExisting: !prev.schedulerSheets.free.useExisting,
                                      generateNew: false,
                                    }
                                  }
                                }))}
                              >
                                <div className="flex items-start gap-3">
                                  <Checkbox checked={config.schedulerSheets.free.useExisting} className="mt-0.5" />
                                  <div className="flex-1">
                                    <div className="font-medium text-sm mb-1">Use Existing Sheet</div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                      Link to an existing FREE POD Scheduler sheet
                                    </p>
                                    {config.schedulerSheets.free.useExisting && (
                                      <div className="space-y-1">
                                        <div className="relative">
                                          <input
                                            type="text"
                                            placeholder="https://docs.google.com/spreadsheets/d/..."
                                            value={config.schedulerSheets.free.existingSheetUrl}
                                            onChange={(e) => {
                                              e.stopPropagation();
                                              setConfig(prev => ({
                                                ...prev,
                                                schedulerSheets: {
                                                  ...prev.schedulerSheets,
                                                  free: {
                                                    ...prev.schedulerSheets.free,
                                                    existingSheetUrl: e.target.value
                                                  }
                                                }
                                              }));
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            className={`w-full px-3 py-2 pr-10 text-sm border rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:border-transparent ${
                                              config.schedulerSheets.free.existingSheetUrl && !isValidGoogleSheetsUrl(config.schedulerSheets.free.existingSheetUrl)
                                                ? 'border-red-500 focus:ring-red-500'
                                                : config.schedulerSheets.free.existingSheetUrl && isValidGoogleSheetsUrl(config.schedulerSheets.free.existingSheetUrl)
                                                ? 'border-green-500 focus:ring-green-500'
                                                : 'border-gray-300 dark:border-gray-600 focus:ring-green-500'
                                            }`}
                                          />
                                          {config.schedulerSheets.free.existingSheetUrl && isValidGoogleSheetsUrl(config.schedulerSheets.free.existingSheetUrl) && (
                                            <CheckCircle2 className="w-5 h-5 text-green-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                          )}
                                        </div>
                                        {config.schedulerSheets.free.existingSheetUrl && !isValidGoogleSheetsUrl(config.schedulerSheets.free.existingSheetUrl) && (
                                          <p className="text-xs text-red-600 dark:text-red-400">
                                            Please enter a valid Google Sheets URL
                                          </p>
                                        )}
                                        {config.schedulerSheets.free.existingSheetUrl && isValidGoogleSheetsUrl(config.schedulerSheets.free.existingSheetUrl) && (
                                          <p className="text-xs text-green-600 dark:text-green-400">
                                            Valid Google Sheets URL ✓
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Option 2: Generate New Sheet */}
                              <div
                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                  config.schedulerSheets.free.generateNew
                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/10 shadow-sm'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                                }`}
                                onClick={() => setConfig(prev => ({
                                  ...prev,
                                  schedulerSheets: {
                                    ...prev.schedulerSheets,
                                    free: {
                                      ...prev.schedulerSheets.free,
                                      generateNew: !prev.schedulerSheets.free.generateNew,
                                      useExisting: false,
                                      existingSheetUrl: '',
                                    }
                                  }
                                }))}
                              >
                                <div className="flex items-start gap-3">
                                  <Checkbox checked={config.schedulerSheets.free.generateNew} className="mt-0.5" />
                                  <div className="flex-1">
                                    <div className="font-medium text-sm mb-1">Generate New Sheets</div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                      Create FREE POD Sheets automatically (3 sheets will be generated)
                                    </p>
                                    <ul className="text-xs text-gray-500 dark:text-gray-500 ml-4 list-disc space-y-0.5">
                                      <li>Analyst Sheet</li>
                                      <li>Creator Sheet</li>
                                      <li><strong>Scheduler Sheet</strong> (URL used for Caption Bank)</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* PAID Scheduler - Only show if PAID Caption Bank is enabled and PAID POD Sheet is NOT selected */}
                        {config.captionBank.paid && !config.podSheets.paid && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-3">
                              <Badge className="bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300">
                                PAID
                              </Badge>
                              <span className="text-sm font-semibold">POD Scheduler Sheet</span>
                            </div>
                            
                            <div className="space-y-3">
                              {/* Option 1: Use Existing Sheet */}
                              <div
                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                  config.schedulerSheets.paid.useExisting
                                    ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/10 shadow-sm'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-pink-300'
                                }`}
                                onClick={() => setConfig(prev => ({
                                  ...prev,
                                  schedulerSheets: {
                                    ...prev.schedulerSheets,
                                    paid: {
                                      ...prev.schedulerSheets.paid,
                                      useExisting: !prev.schedulerSheets.paid.useExisting,
                                      generateNew: false,
                                    }
                                  }
                                }))}
                              >
                                <div className="flex items-start gap-3">
                                  <Checkbox checked={config.schedulerSheets.paid.useExisting} className="mt-0.5" />
                                  <div className="flex-1">
                                    <div className="font-medium text-sm mb-1">Use Existing Sheet</div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                      Link to an existing PAID POD Scheduler sheet
                                    </p>
                                    {config.schedulerSheets.paid.useExisting && (
                                      <div className="space-y-1">
                                        <div className="relative">
                                          <input
                                            type="text"
                                            placeholder="https://docs.google.com/spreadsheets/d/..."
                                            value={config.schedulerSheets.paid.existingSheetUrl}
                                            onChange={(e) => {
                                              e.stopPropagation();
                                              setConfig(prev => ({
                                                ...prev,
                                                schedulerSheets: {
                                                  ...prev.schedulerSheets,
                                                  paid: {
                                                    ...prev.schedulerSheets.paid,
                                                    existingSheetUrl: e.target.value
                                                  }
                                                }
                                              }));
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            className={`w-full px-3 py-2 pr-10 text-sm border rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:border-transparent ${
                                              config.schedulerSheets.paid.existingSheetUrl && !isValidGoogleSheetsUrl(config.schedulerSheets.paid.existingSheetUrl)
                                                ? 'border-red-500 focus:ring-red-500'
                                                : config.schedulerSheets.paid.existingSheetUrl && isValidGoogleSheetsUrl(config.schedulerSheets.paid.existingSheetUrl)
                                                ? 'border-green-500 focus:ring-green-500'
                                                : 'border-gray-300 dark:border-gray-600 focus:ring-pink-500'
                                            }`}
                                          />
                                          {config.schedulerSheets.paid.existingSheetUrl && isValidGoogleSheetsUrl(config.schedulerSheets.paid.existingSheetUrl) && (
                                            <CheckCircle2 className="w-5 h-5 text-green-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                          )}
                                        </div>
                                        {config.schedulerSheets.paid.existingSheetUrl && !isValidGoogleSheetsUrl(config.schedulerSheets.paid.existingSheetUrl) && (
                                          <p className="text-xs text-red-600 dark:text-red-400">
                                            Please enter a valid Google Sheets URL
                                          </p>
                                        )}
                                        {config.schedulerSheets.paid.existingSheetUrl && isValidGoogleSheetsUrl(config.schedulerSheets.paid.existingSheetUrl) && (
                                          <p className="text-xs text-green-600 dark:text-green-400">
                                            Valid Google Sheets URL ✓
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Option 2: Generate New Sheet */}
                              <div
                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                  config.schedulerSheets.paid.generateNew
                                    ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/10 shadow-sm'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-pink-300'
                                }`}
                                onClick={() => setConfig(prev => ({
                                  ...prev,
                                  schedulerSheets: {
                                    ...prev.schedulerSheets,
                                    paid: {
                                      ...prev.schedulerSheets.paid,
                                      generateNew: !prev.schedulerSheets.paid.generateNew,
                                      useExisting: false,
                                      existingSheetUrl: '',
                                    }
                                  }
                                }))}
                              >
                                <div className="flex items-start gap-3">
                                  <Checkbox checked={config.schedulerSheets.paid.generateNew} className="mt-0.5" />
                                  <div className="flex-1">
                                    <div className="font-medium text-sm mb-1">Generate New Sheets</div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                      Create PAID POD Sheets automatically (3 sheets will be generated)
                                    </p>
                                    <ul className="text-xs text-gray-500 dark:text-gray-500 ml-4 list-disc space-y-0.5">
                                      <li>Analyst Sheet</li>
                                      <li>Creator Sheet</li>
                                      <li><strong>Scheduler Sheet</strong> (URL used for Caption Bank)</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Info Alert */}
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                          <div className="flex gap-2">
                            <AlertCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-purple-900 dark:text-purple-100">
                              <strong>Important:</strong> Caption Bank requires the <strong>Scheduler Sheet URL</strong> from POD Sheets to enable data imports and content updates. If generating new sheets, the Scheduler Sheet URL will be automatically used.
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {(config.podSheets.free || config.podSheets.paid || config.podSheets.oftv) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          📊 POD Sheets Summary
                        </CardTitle>
                        <CardDescription>
                          These sheets will be created and organized in their respective folders
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {config.podSheets.free && (
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              <span>FREE folder with content tracking sheet</span>
                            </div>
                          )}
                          {config.podSheets.paid && (
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle2 className="w-4 h-4 text-pink-600" />
                              <span>PAID folder with content tracking sheet</span>
                            </div>
                          )}
                          {config.podSheets.oftv && (
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle2 className="w-4 h-4 text-purple-600" />
                              <span>OFTV folder with content tracking sheet</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Step 3: Review & Generate */}
              {currentStep === 3 && !isGenerating && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Review & Confirm</h3>
                  
                  <Card className="border-pink-200 dark:border-pink-800 bg-gradient-to-br from-pink-50/50 to-purple-50/50 dark:from-pink-900/20 dark:to-purple-900/20">
                    <CardHeader>
                      <CardTitle className="text-base">Generation Summary</CardTitle>
                      <CardDescription>
                        The following sheets will be generated for <strong>{modelName}</strong>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {getSummary().map((item, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                            <FileSpreadsheet className="w-5 h-5 text-pink-600 dark:text-pink-400 mt-0.5" />
                            <div className="flex-1">
                              <div className="font-medium text-sm">{item}</div>
                            </div>
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="flex gap-2">
                          <AlertCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-purple-900 dark:text-purple-100">
                            <strong>Note:</strong> This process may take a few minutes. All sheets will be created and configured automatically.
                            {config.captionBank.enabled && ' The Caption Bank will open in a new tab when complete.'}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Generation Progress */}
              {currentStep === 3 && isGenerating && generationProgress && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Generating Your Sheets...</h3>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-6">
                        {/* Step-by-Step Progress */}
                        <div className="space-y-3">
                          {(() => {
                            // Dynamic steps based on what's being generated
                            let steps;
                            
                            if (generationProgress.currentSheet === 'Caption Bank') {
                              // Caption Bank steps
                              steps = [
                                { id: 'validate', label: 'Validating model configuration' },
                                { id: 'folder', label: 'Finding/creating CAPTION BANK folder' },
                                { id: 'copy', label: 'Copying template sheet' },
                                { id: 'duplicate', label: 'Duplicating tabs' },
                                { id: 'update', label: 'Updating headers' },
                                { id: 'protect', label: 'Protecting cells' },
                                { id: 'formulas', label: 'Adding formulas' },
                                { id: 'save', label: 'Saving to database' },
                                { id: 'complete', label: 'Finalizing' },
                              ];
                            } else if (generationProgress.currentSheet === 'POD Sheets') {
                              // POD Sheets steps
                              steps = [
                                { id: 'validate', label: 'Validating model configuration' },
                                { id: 'folder', label: 'Checking/creating tier folders' },
                                { id: 'copy', label: 'Generating sheets' },
                                { id: 'save', label: 'Saving to database' },
                                { id: 'complete', label: 'Finalizing' },
                              ];
                            } else {
                              // Default fallback
                              steps = [
                                { id: 'validate', label: 'Validating model configuration' },
                                { id: 'folder', label: 'Finding/creating folder' },
                                { id: 'copy', label: 'Copying template sheet' },
                                { id: 'save', label: 'Saving to database' },
                                { id: 'complete', label: 'Finalizing' },
                              ];
                            }
                            
                            // Calculate progress based on completed steps
                            const completedCount = generationProgress.completedSteps.length;
                            const totalSteps = steps.length;
                            const calculatedProgress = Math.round((completedCount / totalSteps) * 100);
                            
                            return (
                              <>
                                {/* Overall Progress Header */}
                                <div className="flex items-center gap-3 pb-4 border-b">
                                  <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                                  <div className="flex-1">
                                    <div className="font-medium">{generationProgress.currentSheet}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                      {generationProgress.message || `Step ${Math.min(completedCount + 1, totalSteps)} of ${totalSteps}`}
                                    </div>
                                  </div>
                                  <Badge variant="secondary">{generationProgress.progress || calculatedProgress}%</Badge>
                                </div>

                                {/* Steps List */}
                                {steps.map((step, index, array) => {
                                  const isCompleted = generationProgress.completedSteps.includes(step.id);
                                  
                                  // Check if this is the current step by matching the backend step name
                                  const currentBackendStep = generationProgress.currentStep.toLowerCase();
                                  const isInProgress = !isCompleted && (
                                    currentBackendStep === step.id || 
                                    currentBackendStep.includes(step.id)
                                  );
                                  
                                  return (
                                    <div key={step.id} className="flex items-center gap-3">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                                        isCompleted 
                                          ? 'bg-green-500 text-white' 
                                          : isInProgress
                                          ? 'bg-pink-500 text-white animate-pulse'
                                          : 'bg-gray-200 dark:bg-gray-700'
                                      }`}>
                                        {isCompleted ? (
                                          <CheckCircle2 className="w-4 h-4" />
                                        ) : isInProgress ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <Circle className="w-3 h-3" />
                                        )}
                                      </div>
                                      <div className={`text-sm flex-1 ${
                                        isCompleted || isInProgress
                                          ? 'text-gray-900 dark:text-gray-100 font-medium'
                                          : 'text-gray-500 dark:text-gray-400'
                                      }`}>
                                        {step.label}
                                      </div>
                                      {isCompleted && (
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                      )}
                                    </div>
                                  );
                                })}

                                {/* Progress Bar */}
                                <div className="pt-4 border-t">
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div 
                                      className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${calculatedProgress}%` }}
                                    />
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between px-6 pb-6">
          <div className="flex gap-2">
            {currentStep > 1 && !isGenerating && (
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} disabled={isGenerating}>
              Cancel
            </Button>
            {currentStep < totalSteps ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate All
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
