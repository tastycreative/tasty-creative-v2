"use client";

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { DollarSign, Edit, Plus, Trash2, Search, RefreshCw, AlertCircle, History, ArrowRight, Clock, LayoutGrid, Table as TableIcon, User, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import ModelsDropdownList from '@/components/ModelsDropdownList';

interface PriceHistoryUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface PriceHistory {
  id: string;
  contentTypeOptionId: string;
  changeType: string;
  oldPriceType: string | null;
  oldPriceFixed: number | null;
  oldPriceMin: number | null;
  oldPriceMax: number | null;
  oldLabel: string | null;
  oldIsFree: boolean | null;
  newPriceType: string | null;
  newPriceFixed: number | null;
  newPriceMin: number | null;
  newPriceMax: number | null;
  newLabel: string | null;
  newIsFree: boolean | null;
  changedById: string | null;
  changedBy: PriceHistoryUser | null;
  reason: string | null;
  createdAt: string;
}

interface ContentTypeOption {
  id: string;
  value: string;
  label: string;
  category: string;
  pageType: string | null;
  isFree: boolean;
  priceType: string | null;
  priceFixed: number | null;
  priceMin: number | null;
  priceMax: number | null;
  description: string | null;
  isActive: boolean;
  order: number;
  clientModelId: string | null;
  clientModel?: {
    id: string;
    clientName: string;
    pricingDescription?: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  pricingHistory?: PriceHistory[];
}

interface ClientModel {
  id: string;
  clientName: string;
  name: string | null;
  status: string;
  profilePicture: string | null;
  pricingDescription?: string | null;
}

const ContentTypePricingTab = () => {
  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<ContentTypeOption | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterModel, setFilterModel] = useState<string>('all');
  const [filterPageType, setFilterPageType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [editingModelDescriptionId, setEditingModelDescriptionId] = useState<string | null>(null);
  const [modelDescriptionText, setModelDescriptionText] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [variationDialogOpen, setVariationDialogOpen] = useState(false);
  const [variationSourceOption, setVariationSourceOption] = useState<ContentTypeOption | null>(null);

  // Form state for editing
  const [formData, setFormData] = useState({
    label: '',
    pageTypes: ['ALL_PAGES'] as string[],
    isFree: false,
    priceType: 'FIXED',
    priceFixed: '',
    priceMin: '',
    priceMax: '',
    description: '',
  });

  // Form state for adding new content types
  const [addFormData, setAddFormData] = useState({
    value: '',
    category: 'PORN_ACCURATE',
    pageTypes: ['ALL_PAGES'] as string[],
    isFree: false,
    priceType: 'FIXED',
    priceFixed: '',
    priceMin: '',
    priceMax: '',
    description: '',
    clientModelId: '',
  });

  // Fetch client models
  const { data: clientModels = [] } = useQuery({
    queryKey: ['client-models'],
    queryFn: async () => {
      const response = await fetch('/api/client-models');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch models');
      }

      return data.clientModels as ClientModel[];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Fetch content type options with React Query
  const { data: contentTypeOptions = [], isLoading, refetch } = useQuery({
    queryKey: ['content-type-options', filterCategory, filterModel],
    queryFn: async () => {
      // Build params
      const params = new URLSearchParams();

      if (filterCategory !== 'all') {
        params.append('category', filterCategory);
      }

      if (filterModel === 'global') {
        // Global only - backend returns only items with clientModelId = null
        // No clientModelId parameter needed
      } else if (filterModel && filterModel !== 'all') {
        // Specific model selected - get that model's prices + global
        params.append('clientModelId', filterModel);
      } else {
        // 'all' is selected - use special parameter to fetch everything efficiently
        params.append('fetchAll', 'true');
      }

      const url = params.toString()
        ? `/api/content-type-options?${params.toString()}`
        : '/api/content-type-options';

      const response = await fetch(url);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch content types');
      }

      return data.contentTypeOptions as ContentTypeOption[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch price history for selected option
  const { data: priceHistoryData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['price-history', selectedOption?.id],
    queryFn: async () => {
      if (!selectedOption?.id) return null;

      const response = await fetch(`/api/content-type-options/${selectedOption.id}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch price history');
      }

      return data.contentTypeOption as ContentTypeOption;
    },
    enabled: !!selectedOption?.id && historyDialogOpen,
  });

  // Filter content types based on search query and pageType
  const filteredContentTypes = useMemo(() => {
    let filtered = contentTypeOptions;

    // Apply pageType filter
    if (filterPageType !== 'all') {
      filtered = filtered.filter(option => option.pageType === filterPageType);
    }

    // Apply search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(option =>
        option.label.toLowerCase().includes(query) ||
        option.value.toLowerCase().includes(query) ||
        option.description?.toLowerCase().includes(query) ||
        option.clientModel?.clientName?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [contentTypeOptions, searchQuery, filterPageType]);

  // Group content types by model for grid view
  const groupedByModel = useMemo(() => {
    const groups: { [key: string]: {
      modelId: string | null;
      modelName: string | null;
      model: ClientModel | null;
      pricingDescription: string | null;
      options: ContentTypeOption[]
    } } = {};

    filteredContentTypes.forEach(option => {
      const key = option.clientModelId || 'global';

      if (!groups[key]) {
        // Find the full model data from clientModels
        const fullModel = option.clientModelId
          ? clientModels.find(m => m.id === option.clientModelId) || null
          : null;

        groups[key] = {
          modelId: option.clientModelId,
          modelName: option.clientModel?.clientName || null,
          model: fullModel,
          pricingDescription: option.clientModel?.pricingDescription || fullModel?.pricingDescription || null,
          options: []
        };
      }

      groups[key].options.push(option);
    });

    // Sort options within each group alphabetically by label
    Object.values(groups).forEach(group => {
      group.options.sort((a, b) => a.label.localeCompare(b.label));
    });

    // Sort: Models alphabetically first, then Global last
    return Object.entries(groups).sort(([keyA, groupA], [keyB, groupB]) => {
      if (keyA === 'global') return 1;  // Global goes to the end
      if (keyB === 'global') return -1;  // Global goes to the end
      return (groupA.modelName || '').localeCompare(groupB.modelName || '');
    });
  }, [filteredContentTypes, clientModels]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (updateData: {
      id: string;
      label: string;
      pageType: string;
      isFree: boolean;
      priceType: string | null;
      priceFixed: number | null;
      priceMin: number | null;
      priceMax: number | null;
      description: string;
    }) => {
      const response = await fetch(`/api/content-type-options/${updateData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update content type');
      }

      return data.contentTypeOption;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-type-options'] });
      toast.success('Content type updated successfully');
      setEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update content type');
    },
  });

  // Delete mutation (soft delete)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/content-type-options/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete content type');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-type-options'] });
      toast.success('Content type deactivated successfully');
      setDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete content type');
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(
        ids.map(id =>
          fetch(`/api/content-type-options/${id}`, {
            method: 'DELETE',
          }).then(res => res.json())
        )
      );

      const failures = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success));

      if (failures.length > 0) {
        throw new Error(`Failed to delete ${failures.length} of ${ids.length} items`);
      }

      return results;
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['content-type-options'] });
      toast.success(`Successfully deactivated ${ids.length} content type${ids.length > 1 ? 's' : ''}`);
      setSelectedIds(new Set());
      setBulkDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete some content types');
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (createData: {
      value: string;
      label: string;
      category: string;
      pageType: string;
      isFree: boolean;
      priceType: string | null;
      priceFixed: number | null;
      priceMin: number | null;
      priceMax: number | null;
      description: string;
      clientModelId: string | null;
    }) => {
      const response = await fetch('/api/content-type-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create content type');
      }

      return data.contentTypeOption;
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create content type');
    },
  });

  // Mutation for updating model pricing description
  const updateModelDescriptionMutation = useMutation({
    mutationFn: async ({ modelId, description }: { modelId: string; description: string }) => {
      const response = await fetch(`/api/models/${modelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pricingDescription: description }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update model description');
      }

      return data.model;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-models'] });
      queryClient.invalidateQueries({ queryKey: ['content-type-options'] });
      toast.success('Model pricing description updated');
      setEditingModelDescriptionId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update model description');
    },
  });

  const handleSaveModelDescription = (modelId: string) => {
    updateModelDescriptionMutation.mutate({ modelId, description: modelDescriptionText });
  };

  const handleEditModelDescription = (modelId: string, currentDescription: string | null | undefined) => {
    setEditingModelDescriptionId(modelId);
    setModelDescriptionText(currentDescription || '');
  };

  const handleCancelModelDescriptionEdit = () => {
    setEditingModelDescriptionId(null);
    setModelDescriptionText('');
  };

  // Handle edit button click
  const handleEdit = (option: ContentTypeOption) => {
    setSelectedOption(option);
    setFormData({
      label: option.label,
      pageTypes: option.pageType ? [option.pageType] : ['ALL_PAGES'],
      isFree: option.isFree || false,
      priceType: option.priceType || 'FIXED',
      priceFixed: option.priceFixed?.toString() || '',
      priceMin: option.priceMin?.toString() || '',
      priceMax: option.priceMax?.toString() || '',
      description: option.description || '',
    });
    setEditDialogOpen(true);
  };

  // Handle delete button click
  const handleDeleteClick = (option: ContentTypeOption) => {
    setSelectedOption(option);
    setDeleteDialogOpen(true);
  };

  // Checkbox selection handlers
  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = (groupOptions: ContentTypeOption[]) => {
    const groupIds = groupOptions.map(opt => opt.id);
    const allSelected = groupIds.every(id => selectedIds.has(id));

    const newSelected = new Set(selectedIds);
    if (allSelected) {
      // Deselect all in this group
      groupIds.forEach(id => newSelected.delete(id));
    } else {
      // Select all in this group
      groupIds.forEach(id => newSelected.add(id));
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = () => {
    bulkDeleteMutation.mutate(Array.from(selectedIds));
  };

  // Save updates
  const handleSave = () => {
    if (!selectedOption) return;

    // Validation
    if (!formData.label.trim()) {
      toast.error('Label is required');
      return;
    }

    // Skip price validation if isFree is checked
    if (!formData.isFree) {
      if (formData.priceType === 'FIXED' && !formData.priceFixed) {
        toast.error('Fixed price is required');
        return;
      }

      if (formData.priceType === 'RANGE' && (!formData.priceMin || !formData.priceMax)) {
        toast.error('Min and max prices are required for range pricing');
        return;
      }

      if (formData.priceType === 'RANGE') {
        const minPrice = parseFloat(formData.priceMin);
        const maxPrice = parseFloat(formData.priceMax);
        if (minPrice > maxPrice) {
          toast.error('Minimum price cannot be greater than maximum price');
          return;
        }
      }

      if (formData.priceType === 'MINIMUM' && !formData.priceMin) {
        toast.error('Minimum price is required');
        return;
      }
    }

    // Extract short code from the label (e.g., "BG (Boy/Girl)" -> "BG")
    const inputValue = formData.label.trim();
    const shortCode = inputValue.toUpperCase();

    // Determine which page types to create/update
    const pageTypesToUpdate = formData.pageTypes.includes('ALL_PAGES')
      ? ['ALL_PAGES']
      : formData.pageTypes.filter(pt => pt !== 'ALL_PAGES');

    // If the page types haven't changed OR only one page type is selected, do a simple update
    const originalPageType = selectedOption.pageType || 'ALL_PAGES';
    const isSinglePageType = pageTypesToUpdate.length === 1;
    const pageTypeUnchanged = isSinglePageType && pageTypesToUpdate[0] === originalPageType;

    if (pageTypeUnchanged || isSinglePageType) {
      // Simple update for single page type
      const finalPageType = pageTypesToUpdate[0];

      const updateData = {
        id: selectedOption.id,
        value: shortCode,
        label: inputValue,
        pageType: finalPageType,
        isFree: formData.isFree,
        priceType: formData.isFree ? null : formData.priceType,
        priceFixed: !formData.isFree && formData.priceType === 'FIXED' ? parseFloat(formData.priceFixed) : null,
        priceMin: !formData.isFree && (formData.priceType === 'RANGE' || formData.priceType === 'MINIMUM')
          ? parseFloat(formData.priceMin)
          : null,
        priceMax: !formData.isFree && formData.priceType === 'RANGE' ? parseFloat(formData.priceMax) : null,
        description: formData.description,
      };

      updateMutation.mutate(updateData);
    } else {
      // Multiple page types selected - need to delete old and create new entries
      // First, validate no duplicates for the new page types (except the current one)
      for (const pageType of pageTypesToUpdate) {
        const duplicate = contentTypeOptions.find(
          option =>
            option.id !== selectedOption.id && // Exclude current entry
            option.value.toLowerCase() === shortCode.toLowerCase() &&
            option.category === selectedOption.category &&
            (option.clientModelId || '') === (selectedOption.clientModelId || '') &&
            (option.pageType || 'ALL_PAGES') === pageType
        );

        if (duplicate) {
          toast.error(`Content type code "${shortCode}" already exists for page type "${getPageTypeName(pageType)}". Please delete it first.`);
          return;
        }
      }

      // Delete the original entry and create new ones
      const deletePromise = fetch(`/api/content-type-options/${selectedOption.id}`, {
        method: 'DELETE',
      }).then(res => res.json());

      deletePromise.then(deleteResult => {
        if (!deleteResult.success) {
          toast.error('Failed to update: ' + deleteResult.error);
          return;
        }

        // Now create new entries for each page type
        const createPromises = pageTypesToUpdate.map(pageType => {
          const createData = {
            value: shortCode,
            label: inputValue,
            category: selectedOption.category,
            pageType: pageType,
            isFree: formData.isFree,
            priceType: formData.isFree ? null : formData.priceType,
            priceFixed: !formData.isFree && formData.priceType === 'FIXED' ? parseFloat(formData.priceFixed) : null,
            priceMin: !formData.isFree && (formData.priceType === 'RANGE' || formData.priceType === 'MINIMUM')
              ? parseFloat(formData.priceMin)
              : null,
            priceMax: !formData.isFree && formData.priceType === 'RANGE' ? parseFloat(formData.priceMax) : null,
            description: formData.description,
            clientModelId: selectedOption.clientModelId || null,
          };

          return fetch('/api/content-type-options', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(createData),
          }).then(res => res.json());
        });

        Promise.all(createPromises).then(results => {
          const failedResults = results.filter(r => !r.success);

          if (failedResults.length > 0) {
            toast.error(`Failed to create ${failedResults.length} content type(s): ${failedResults[0].error}`);
          } else {
            queryClient.invalidateQueries({ queryKey: ['content-type-options'] });
            toast.success(`Successfully updated to ${pageTypesToUpdate.length} page type(s)`);
            setEditDialogOpen(false);
          }
        }).catch(error => {
          toast.error(error.message || 'Failed to create content types');
        });
      }).catch(error => {
        toast.error('Failed to delete original entry: ' + error.message);
      });
    }
  };

  // Delete content type (soft delete)
  const handleDelete = () => {
    if (!selectedOption) return;
    deleteMutation.mutate(selectedOption.id);
  };

  // Get page type display name
  const getPageTypeName = (pageType: string | null) => {
    switch (pageType) {
      case 'ALL_PAGES':
        return 'All Pages';
      case 'FREE':
        return 'Free';
      case 'PAID':
        return 'Paid';
      case 'VIP':
        return 'VIP';
      default:
        return 'All Pages';
    }
  };

  // Get category display name
  const getCategoryName = (category: string) => {
    switch (category) {
      case 'PORN_ACCURATE':
        return 'Porn Accurate';
      case 'PORN_SCAM':
        return 'Porn Scam';
      case 'GF_ACCURATE':
        return 'GF Accurate';
      case 'GF_SCAM':
        return 'GF Scam';
      // Legacy support
      case 'CHEAP_PORN':
        return 'Cheap Porn (Legacy)';
      case 'EXPENSIVE_PORN':
        return 'Expensive Porn (Legacy)';
      case 'PORN_ACCURATE_HIGH':
        return 'Porn Accurate High (Legacy)';
      case 'PORN_ACCURATE_LOW':
        return 'Porn Accurate Low (Legacy)';
      case 'GF_ACCURATE_HIGH':
        return 'GF Accurate High (Legacy)';
      case 'GF_ACCURATE_LOW':
        return 'GF Accurate Low (Legacy)';
      default:
        return category;
    }
  };

  // Create new content type
  const handleCreate = (addAnother = false) => {
    // Validation
    if (!addFormData.value.trim()) {
      toast.error('Content type is required');
      return;
    }

    // Skip price validation if isFree is checked
    if (!addFormData.isFree) {
      if (addFormData.priceType === 'FIXED' && !addFormData.priceFixed) {
        toast.error('Fixed price is required');
        return;
      }

      if (addFormData.priceType === 'RANGE' && (!addFormData.priceMin || !addFormData.priceMax)) {
        toast.error('Min and max prices are required for range pricing');
        return;
      }

      if (addFormData.priceType === 'RANGE') {
        const minPrice = parseFloat(addFormData.priceMin);
        const maxPrice = parseFloat(addFormData.priceMax);
        if (minPrice > maxPrice) {
          toast.error('Minimum price cannot be greater than maximum price');
          return;
        }
      }

      if (addFormData.priceType === 'MINIMUM' && !addFormData.priceMin) {
        toast.error('Minimum price is required');
        return;
      }
    }

    // Extract short code from the input (e.g., "BG (Boy/Girl)" -> "BG")
  const inputValue = addFormData.value.trim();
  const shortCode = inputValue.toUpperCase();

    // Determine which page types to create
    const pageTypesToCreate = addFormData.pageTypes.includes('ALL_PAGES')
      ? ['ALL_PAGES']
      : addFormData.pageTypes.filter(pt => pt !== 'ALL_PAGES');

    // Validate no duplicates for any of the selected page types
    for (const pageType of pageTypesToCreate) {
      const duplicate = contentTypeOptions.find(
        option =>
          option.value.toLowerCase() === shortCode.toLowerCase() &&
          option.category === addFormData.category &&
          (option.clientModelId || '') === (addFormData.clientModelId || '') &&
          (option.pageType || 'ALL_PAGES') === pageType
      );

      if (duplicate) {
        toast.error(`Content type code "${shortCode}" already exists in the "${getCategoryName(addFormData.category)}" tier for this model with page type "${getPageTypeName(pageType)}".`);
        return;
      }
    }

    // Auto-append "+" for minimum price type in description if not already present
    let finalDescription = addFormData.description.trim();
    if (!addFormData.isFree && addFormData.priceType === 'MINIMUM' && addFormData.priceMin) {
      const minPrice = parseFloat(addFormData.priceMin);
      const priceDisplay = `$${minPrice.toFixed(2)}+`;
      if (!finalDescription) {
        finalDescription = `Minimum price: ${priceDisplay}`;
      } else if (!finalDescription.includes('+')) {
        finalDescription = `${finalDescription} (${priceDisplay})`;
      }
    }

    // Create content type for each selected page type
    setIsCreating(true);
    const createPromises = pageTypesToCreate.map(pageType => {
      const createData = {
        value: shortCode,
        label: inputValue,
        category: addFormData.category,
        pageType: pageType,
        isFree: addFormData.isFree,
        priceType: addFormData.isFree ? null : addFormData.priceType,
        priceFixed: !addFormData.isFree && addFormData.priceType === 'FIXED' ? parseFloat(addFormData.priceFixed) : null,
        priceMin: !addFormData.isFree && (addFormData.priceType === 'RANGE' || addFormData.priceType === 'MINIMUM')
          ? parseFloat(addFormData.priceMin)
          : null,
        priceMax: !addFormData.isFree && addFormData.priceType === 'RANGE' ? parseFloat(addFormData.priceMax) : null,
        description: finalDescription,
        clientModelId: addFormData.clientModelId || null,
      };

      return fetch('/api/content-type-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createData),
      }).then(res => res.json());
    });

    // Execute all creates and handle results
    Promise.all(createPromises).then(results => {
      const failedResults = results.filter(r => !r.success);

      if (failedResults.length > 0) {
        toast.error(`Failed to create ${failedResults.length} content type(s): ${failedResults[0].error}`);
      } else {
        queryClient.invalidateQueries({ queryKey: ['content-type-options'] });
        toast.success(`Successfully created ${pageTypesToCreate.length} content type(s)`);

        if (!addAnother) {
          setAddDialogOpen(false);
        }

        // Reset form but keep model and tier selections if adding another
        setAddFormData({
          value: '',
          category: addAnother ? addFormData.category : 'PORN_ACCURATE',
          pageTypes: addAnother ? addFormData.pageTypes : ['ALL_PAGES'],
          priceType: addAnother ? addFormData.priceType : 'FIXED',
          priceFixed: '',
          priceMin: '',
          priceMax: '',
          description: '',
          isFree: addAnother ? addFormData.isFree : false,
          clientModelId: addAnother ? addFormData.clientModelId : '',
        });
      }
    }).catch(error => {
      toast.error(error.message || 'Failed to create content types');
    }).finally(() => {
      setIsCreating(false);
    });

  };

  // Format price display
  const formatPrice = (option: ContentTypeOption) => {
    if (option.isFree) {
      return 'Free';
    } else if (option.priceType === 'FIXED' && option.priceFixed !== null) {
      return `$${option.priceFixed.toFixed(2)}`;
    } else if (option.priceType === 'RANGE' && option.priceMin !== null && option.priceMax !== null) {
      return `$${option.priceMin.toFixed(2)} - $${option.priceMax.toFixed(2)}`;
    } else if (option.priceType === 'MINIMUM' && option.priceMin !== null) {
      return `$${option.priceMin.toFixed(2)}+`;
    }
    return 'N/A';
  };

  // Format price from history record
  const formatHistoryPrice = (
    isFree: boolean | null,
    priceType: string | null,
    priceFixed: number | null,
    priceMin: number | null,
    priceMax: number | null
  ) => {
    if (isFree) {
      return 'Free';
    } else if (priceType === 'FIXED' && priceFixed !== null) {
      return `$${priceFixed.toFixed(2)}`;
    } else if (priceType === 'RANGE' && priceMin !== null && priceMax !== null) {
      return `$${priceMin.toFixed(2)} - $${priceMax.toFixed(2)}`;
    } else if (priceType === 'MINIMUM' && priceMin !== null) {
      return `$${priceMin.toFixed(2)}+`;
    }
    return 'N/A';
  };

  // Get change type badge color
  const getChangeTypeBadge = (changeType: string) => {
    switch (changeType) {
      case 'CREATED':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'PRICE_UPDATE':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'LABEL_UPDATE':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'PRICE_AND_LABEL_UPDATE':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'DEACTIVATED':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'REACTIVATED':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  // Handle view history button click
  const handleViewHistory = (option: ContentTypeOption) => {
    setSelectedOption(option);
    setHistoryDialogOpen(true);
  };

  // Get category badge color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'PORN_ACCURATE':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'PORN_SCAM':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'GF_ACCURATE':
        return 'bg-pink-500/10 text-pink-600 border-pink-500/20';
      case 'GF_SCAM':
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      // Legacy support
      case 'CHEAP_PORN':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'EXPENSIVE_PORN':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'PORN_ACCURATE_HIGH':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'PORN_ACCURATE_LOW':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'GF_ACCURATE_HIGH':
        return 'bg-pink-500/10 text-pink-600 border-pink-500/20';
      case 'GF_ACCURATE_LOW':
        return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-pink-600" />
                  Content Type Pricing Management
                </CardTitle>
                <CardDescription className="mt-1">
                  Manage pricing for different content types across pricing tiers
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {selectedIds.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Delete Selected</span> ({selectedIds.size})
                  </Button>
                )}
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setAddDialogOpen(true)}
                  className="gap-2 bg-pink-600 hover:bg-pink-700"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add New</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isLoading}
                  className="gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search content types..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-full sm:w-40 md:w-48">
                    <SelectValue placeholder="Filter by tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    <SelectItem value="PORN_ACCURATE">Porn Accurate</SelectItem>
                    <SelectItem value="PORN_SCAM">Porn Scam</SelectItem>
                    <SelectItem value="GF_ACCURATE">GF Accurate</SelectItem>
                    <SelectItem value="GF_SCAM">GF Scam</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterPageType} onValueChange={setFilterPageType}>
                  <SelectTrigger className="w-full sm:w-40 md:w-48">
                    <SelectValue placeholder="Filter by page type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Page Types</SelectItem>
                    <SelectItem value="ALL_PAGES">All Pages</SelectItem>
                    <SelectItem value="FREE">Free</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                  </SelectContent>
                </Select>
                <div className="w-full sm:w-40 md:w-48">
                  <Select
                    value={filterModel || 'all'}
                    onValueChange={(value) => {
                      if (value === 'all' || value === 'global') {
                        setFilterModel(value);
                      } else {
                        // Convert clientName to clientModelId
                        const selectedModel = clientModels.find(m => m.clientName === value);
                        setFilterModel(selectedModel?.id || 'all');
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>
                            {!filterModel || filterModel === 'all'
                              ? 'All Models'
                              : filterModel === 'global'
                              ? 'Global Only'
                              : clientModels.find(m => m.id === filterModel)?.clientName || 'Filter by model'}
                          </span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-500" />
                          <span>All Models</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="global">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-blue-600" />
                          <span>Global Only</span>
                        </div>
                      </SelectItem>
                      {clientModels.map((model) => (
                        <SelectItem key={model.id} value={model.clientName}>
                          <div className="flex items-center gap-2">
                            {model.profilePicture ? (
                              <img
                                src={model.profilePicture}
                                alt={model.clientName}
                                className="w-5 h-5 rounded-full object-cover"
                              />
                            ) : (
                              <User className="w-4 h-4 text-pink-600" />
                            )}
                            <span>{model.clientName}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="gap-2 flex-1 sm:flex-initial"
                  >
                    <LayoutGrid className="w-4 h-4" />
                    <span className="hidden xs:inline">By Model</span>
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className="gap-2 flex-1 sm:flex-initial"
                  >
                    <TableIcon className="w-4 h-4" />
                    <span className="hidden xs:inline">Table</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Info Alert */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Updates to pricing will automatically reflect in all future workflows. Existing workflows maintain their original pricing.
              </AlertDescription>
            </Alert>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-pink-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading content types...</p>
            </div>
          ) : (
            <>
              {/* Results Count */}
              {searchQuery && (
                <div className="mb-4 text-sm text-gray-600">
                  Found {filteredContentTypes.length} result{filteredContentTypes.length !== 1 ? 's' : ''} for &quot;{searchQuery}&quot;
                </div>
              )}

              {/* By Model View - One Card Per Model */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                  {filteredContentTypes.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center gap-2 text-gray-500 py-12">
                      <Search className="w-8 h-8 text-gray-300" />
                      <p className="font-medium">
                        {searchQuery ? 'No content types found matching your search' : 'No content types found'}
                      </p>
                      {searchQuery && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSearchQuery('')}
                          className="mt-2"
                        >
                          Clear search
                        </Button>
                      )}
                    </div>
                  ) : (
                    groupedByModel.map(([key, group]) => (
                      <Card key={key} className="flex flex-col hover:shadow-lg transition-shadow">
                        {/* Model Card Header */}
                        <CardHeader className="pb-3 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={group.options.every(opt => selectedIds.has(opt.id))}
                                onCheckedChange={() => handleSelectAll(group.options)}
                                className="border-gray-400"
                              />
                              {group.modelName ? (
                                <>
                                  <User className="w-5 h-5 text-pink-600" />
                                  <CardTitle className="text-base">
                                    {group.modelName}
                                  </CardTitle>
                                </>
                              ) : (
                                <>
                                  <DollarSign className="w-5 h-5 text-blue-600" />
                                  <CardTitle className="text-base">
                                    Global Pricing
                                  </CardTitle>
                                </>
                              )}
                            </div>
                            <Badge variant="outline" className={cn("text-xs font-medium", group.modelName ? '' : 'bg-blue-50 text-blue-600 border-blue-200')}>
                              {group.options.length}
                            </Badge>
                          </div>

                          {/* Model Pricing Description */}
                          {group.modelId && group.model && (
                            <div className="mt-2 ml-7">
                              {editingModelDescriptionId === group.modelId ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={modelDescriptionText}
                                    onChange={(e) => setModelDescriptionText(e.target.value)}
                                    placeholder="Add pricing notes for this model (applies to all content types)..."
                                    className="w-full text-xs p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                                    rows={2}
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleSaveModelDescription(group.modelId!)}
                                      disabled={updateModelDescriptionMutation.isPending}
                                      className="text-xs h-7 bg-pink-600 hover:bg-pink-700"
                                    >
                                      {updateModelDescriptionMutation.isPending ? (
                                        <>
                                          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                                          Saving...
                                        </>
                                      ) : (
                                        'Save'
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={handleCancelModelDescriptionEdit}
                                      disabled={updateModelDescriptionMutation.isPending}
                                      className="text-xs h-7"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-start gap-2 group/desc">
                                  {group.pricingDescription ? (
                                    <>
                                      <p className="text-xs text-gray-600 dark:text-gray-400 italic flex-1">
                                        {group.pricingDescription}
                                      </p>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleEditModelDescription(group.modelId!, group.pricingDescription)}
                                        className="text-xs h-6 px-2 opacity-0 group-hover/desc:opacity-100 transition-opacity"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                    </>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleEditModelDescription(group.modelId!, null)}
                                      className="text-xs h-6 px-2 text-gray-500 hover:text-pink-600"
                                    >
                                      <Plus className="w-3 h-3 mr-1" />
                                      Add pricing notes
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </CardHeader>

                        {/* Content Types List */}
                        <CardContent className="flex-1 p-0">
                          <ScrollArea className="h-[600px]">
                            <div className="p-3 space-y-2">
                              {group.options.map((option) => (
                                <div
                                  key={option.id}
                                  className="p-2.5 rounded-md border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-sm transition-all"
                                >
                                  {/* Content Type Header */}
                                  <div className="flex items-start gap-2 mb-2">
                                    <Checkbox
                                      checked={selectedIds.has(option.id)}
                                      onCheckedChange={() => handleSelectItem(option.id)}
                                      className="mt-1"
                                    />
                                    <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-base leading-tight mb-0.5">{option.label}</h4>
                                        {option.description && (
                                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">{option.description}</p>
                                        )}
                                      </div>
                                      <Badge
                                        variant={option.isActive ? 'default' : 'secondary'}
                                        className="text-[10px] px-1.5 py-0.5 h-5 shrink-0"
                                      >
                                        {option.isActive ? 'Active' : 'Inactive'}
                                      </Badge>
                                    </div>
                                  </div>

                                  {/* Tier & Price Row */}
                                  <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <Badge className={cn(getCategoryColor(option.category), 'text-[10px] px-1.5 py-0.5 h-5')}>
                                        {getCategoryName(option.category)}
                                      </Badge>
                                      <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 h-5 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300">
                                        {getPageTypeName(option.pageType)}
                                      </Badge>
                                      <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 h-5">
                                        {option.isFree ? 'FREE' : option.priceType}
                                      </Badge>
                                    </div>
                                    <div className="flex items-baseline gap-1 shrink-0">
                                      <span className="text-lg font-black text-green-600 dark:text-green-500">
                                        {formatPrice(option)}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Actions Row */}
                                  <div className="flex items-center justify-end gap-0.5 pt-1.5 border-t border-gray-200 dark:border-gray-700">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleViewHistory(option)}
                                      className="h-7 w-7 hover:bg-blue-50 hover:text-blue-600"
                                      title="View price history"
                                    >
                                      <History className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEdit(option)}
                                      className="h-7 w-7 hover:bg-purple-50 hover:text-purple-600"
                                      title="Edit content type"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        setVariationSourceOption(option);
                                        setVariationDialogOpen(true);
                                      }}
                                      className="h-7 w-7 hover:bg-green-50 hover:text-green-600"
                                      title="Add price variation"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeleteClick(option)}
                                      className="h-7 w-7 hover:bg-red-50 hover:text-red-600"
                                      title="Deactivate content type"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}

              {/* Table View */}
              {viewMode === 'table' && (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={filteredContentTypes.length > 0 && filteredContentTypes.every(opt => selectedIds.has(opt.id))}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                // Select all
                                setSelectedIds(new Set(filteredContentTypes.map(opt => opt.id)));
                              } else {
                                // Deselect all
                                setSelectedIds(new Set());
                              }
                            }}
                            className="border-gray-400"
                          />
                        </TableHead>
                        <TableHead>Content Type</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Pricing Tier</TableHead>
                        <TableHead>Page Type</TableHead>
                        <TableHead>Price Type</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContentTypes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <div className="flex flex-col items-center gap-2 text-gray-500">
                              <Search className="w-8 h-8 text-gray-300" />
                              <p className="font-medium">
                                {searchQuery ? 'No content types found matching your search' : 'No content types found'}
                              </p>
                              {searchQuery && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSearchQuery('')}
                                  className="mt-2"
                                >
                                  Clear search
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredContentTypes.map((option) => (
                          <TableRow key={option.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <TableCell>
                              <Checkbox
                                checked={selectedIds.has(option.id)}
                                onCheckedChange={() => handleSelectItem(option.id)}
                                className="border-gray-400"
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="flex flex-col">
                                <span>{option.label}</span>
                                {option.description && (
                                  <span className="text-xs text-gray-500 mt-1">{option.description}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {option.clientModel ? (
                                <Badge variant="outline" className="font-normal">
                                  <User className="w-3 h-3 mr-1" />
                                  {option.clientModel.clientName}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="font-normal bg-blue-50 text-blue-600 border-blue-200">
                                  Global
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className={getCategoryColor(option.category)}>
                                {getCategoryName(option.category)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-normal bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300">
                                {getPageTypeName(option.pageType)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-normal">
                                {option.isFree ? 'FREE' : option.priceType}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold text-green-600">
                              {formatPrice(option)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={option.isActive ? 'default' : 'secondary'}>
                                {option.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleViewHistory(option)}
                                  className="h-8 w-8"
                                  title="View price history"
                                >
                                  <History className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleEdit(option)}
                                  className="h-8 w-8"
                                  title="Edit content type"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => {
                                    setVariationSourceOption(option);
                                    setVariationDialogOpen(true);
                                  }}
                                  className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  title="Add price variation"
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleDeleteClick(option)}
                                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Deactivate content type"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add New Content Type Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[96vw] sm:w-full overflow-x-auto">
          <DialogHeader>
            <DialogTitle>Add New Content Type</DialogTitle>
            <DialogDescription>
              Create a new content type with pricing information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {/* Model Selection First */}
            <div>
              <Label htmlFor="add-model">Model <span className="text-xs text-gray-500">(Optional - leave empty for global)</span></Label>
              <div className="flex items-center gap-2 mt-1.5">
                <ModelsDropdownList
                  value={clientModels.find(m => m.id === addFormData.clientModelId)?.clientName || ''}
                  onValueChange={(clientName) => {
                    const selectedModel = clientModels.find(m => m.clientName === clientName);
                    setAddFormData({
                      ...addFormData,
                      clientModelId: selectedModel?.id || ''
                    });
                  }}
                  placeholder="Global pricing (all models)"
                  className="flex-1"
                />
                {addFormData.clientModelId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAddFormData({ ...addFormData, clientModelId: '' })}
                    className="shrink-0"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <Label htmlFor="add-value">Content Type <span className="text-red-500">*</span></Label>
              <Input
                id="add-value"
                value={addFormData.value}
                onChange={(e) => setAddFormData({ ...addFormData, value: e.target.value })}
                placeholder="e.g., BG (Boy/Girl)"
                className="mt-1.5"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="add-category">Pricing Tier <span className="text-red-500">*</span></Label>
                <Select
                  value={addFormData.category}
                  onValueChange={(value) => setAddFormData({ ...addFormData, category: value })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PORN_ACCURATE">Porn Accurate</SelectItem>
                    <SelectItem value="PORN_SCAM">Porn Scam</SelectItem>
                    <SelectItem value="GF_ACCURATE">GF Accurate</SelectItem>
                    <SelectItem value="GF_SCAM">GF Scam</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="add-pageType">Page Type <span className="text-red-500">*</span></Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between mt-1.5"
                    >
                      <span className="text-sm">
                        {addFormData.pageTypes.includes('ALL_PAGES')
                          ? 'All Pages'
                          : addFormData.pageTypes.length > 0
                          ? addFormData.pageTypes.map(pt => {
                              switch(pt) {
                                case 'FREE': return 'Free';
                                case 'PAID': return 'Paid';
                                case 'VIP': return 'VIP';
                                default: return pt;
                              }
                            }).join(', ')
                          : 'Select...'}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-3">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="add-all-pages"
                          checked={addFormData.pageTypes.includes('ALL_PAGES')}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setAddFormData({ ...addFormData, pageTypes: ['ALL_PAGES'] });
                            } else {
                              setAddFormData({ ...addFormData, pageTypes: [] });
                            }
                          }}
                        />
                        <Label htmlFor="add-all-pages" className="cursor-pointer">All Pages</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="add-free"
                          checked={addFormData.pageTypes.includes('FREE')}
                          onCheckedChange={(checked) => {
                            const newTypes = addFormData.pageTypes.filter(t => t !== 'ALL_PAGES' && t !== 'FREE');
                            if (checked) {
                              setAddFormData({ ...addFormData, pageTypes: [...newTypes, 'FREE'] });
                            } else {
                              setAddFormData({ ...addFormData, pageTypes: newTypes });
                            }
                          }}
                        />
                        <Label htmlFor="add-free" className="cursor-pointer">Free</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="add-paid"
                          checked={addFormData.pageTypes.includes('PAID')}
                          onCheckedChange={(checked) => {
                            const newTypes = addFormData.pageTypes.filter(t => t !== 'ALL_PAGES' && t !== 'PAID');
                            if (checked) {
                              setAddFormData({ ...addFormData, pageTypes: [...newTypes, 'PAID'] });
                            } else {
                              setAddFormData({ ...addFormData, pageTypes: newTypes });
                            }
                          }}
                        />
                        <Label htmlFor="add-paid" className="cursor-pointer">Paid</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="add-vip"
                          checked={addFormData.pageTypes.includes('VIP')}
                          onCheckedChange={(checked) => {
                            const newTypes = addFormData.pageTypes.filter(t => t !== 'ALL_PAGES' && t !== 'VIP');
                            if (checked) {
                              setAddFormData({ ...addFormData, pageTypes: [...newTypes, 'VIP'] });
                            } else {
                              setAddFormData({ ...addFormData, pageTypes: newTypes });
                            }
                          }}
                        />
                        <Label htmlFor="add-vip" className="cursor-pointer">VIP</Label>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
              <Checkbox
                id="add-isFree"
                checked={addFormData.isFree}
                onCheckedChange={(checked) => setAddFormData({ ...addFormData, isFree: checked === true })}
              />
              <Label htmlFor="add-isFree" className="text-sm font-medium cursor-pointer">
                Free content (no charge)
              </Label>
            </div>

            {!addFormData.isFree && (
              <>
                <div>
                  <Label htmlFor="add-priceType">Price Type</Label>
                  <Select
                    value={addFormData.priceType}
                    onValueChange={(value) => setAddFormData({ ...addFormData, priceType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIXED">Fixed Price (e.g., $19.99)</SelectItem>
                      <SelectItem value="RANGE">Price Range (e.g., $14.99 - $19.99)</SelectItem>
                      <SelectItem value="MINIMUM">Minimum Price (e.g., $19.99+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {addFormData.priceType === 'FIXED' && (
                  <div>
                    <Label htmlFor="add-priceFixed">Fixed Price ($) <span className="text-red-500">*</span></Label>
                    <Input
                      id="add-priceFixed"
                      type="number"
                      step="0.01"
                      min="0"
                      value={addFormData.priceFixed}
                      onChange={(e) => setAddFormData({ ...addFormData, priceFixed: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                          e.preventDefault();
                        }
                      }}
                      placeholder="19.99"
                    />
                  </div>
                )}

                {(addFormData.priceType === 'RANGE' || addFormData.priceType === 'MINIMUM') && (
                  <div>
                    <Label htmlFor="add-priceMin">
                      {addFormData.priceType === 'MINIMUM' ? 'Minimum Price ($)' : 'Minimum Price ($)'} <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="add-priceMin"
                        type="number"
                        step="0.01"
                        min="0"
                        value={addFormData.priceMin}
                        onChange={(e) => setAddFormData({ ...addFormData, priceMin: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                            e.preventDefault();
                          }
                        }}
                        placeholder="14.99"
                        className={addFormData.priceType === 'MINIMUM' ? 'pr-8' : ''}
                      />
                      {addFormData.priceType === 'MINIMUM' && addFormData.priceMin && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold pointer-events-none">
                          +
                        </span>
                      )}
                    </div>
                    {addFormData.priceType === 'MINIMUM' && (
                      <p className="text-xs text-gray-500 mt-1">This will be displayed as ${addFormData.priceMin || '0.00'}+</p>
                    )}
                  </div>
                )}

                {addFormData.priceType === 'RANGE' && (
                  <div>
                    <Label htmlFor="add-priceMax">Maximum Price ($) <span className="text-red-500">*</span></Label>
                    <Input
                      id="add-priceMax"
                      type="number"
                      step="0.01"
                      min="0"
                      value={addFormData.priceMax}
                      onChange={(e) => setAddFormData({ ...addFormData, priceMax: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                          e.preventDefault();
                        }
                      }}
                      placeholder="19.99"
                      className={
                        addFormData.priceMin && addFormData.priceMax &&
                        parseFloat(addFormData.priceMin) > parseFloat(addFormData.priceMax)
                          ? 'border-red-500 focus-visible:ring-red-500'
                          : ''
                      }
                    />
                    {addFormData.priceMin && addFormData.priceMax &&
                     parseFloat(addFormData.priceMin) > parseFloat(addFormData.priceMax) && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Minimum price cannot be greater than maximum price
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            <div>
              <Label htmlFor="add-description">Description (Optional)</Label>
              <Input
                id="add-description"
                value={addFormData.description}
                onChange={(e) => setAddFormData({ ...addFormData, description: e.target.value })}
                placeholder="Add a helpful description..."
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col gap-3">
            {/* First Row: Cancel and Create */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setAddDialogOpen(false)}
                disabled={isCreating}
                className="w-full sm:flex-1 order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleCreate(false)}
                className="bg-pink-600 hover:bg-pink-700 w-full sm:flex-1 order-1 sm:order-2"
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create
                  </>
                )}
              </Button>
            </div>

            {/* Second Row: Add Another and Add Variation */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => handleCreate(true)}
                variant="outline"
                className="border-pink-600 text-pink-600 hover:bg-pink-50 w-full sm:flex-1"
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another
                  </>
                )}
              </Button>
              <Button
                onClick={async () => {
                  // Create the content type first
                  const { shortCode, inputValue, pageTypesToCreate } = (() => {
                    const parts = addFormData.value.trim().split(/\s+/);
                    const code = parts.map(word => word.charAt(0).toUpperCase()).join('');
                    const types = addFormData.pageTypes.length > 0 ? addFormData.pageTypes : ['ALL_PAGES'];
                    return { shortCode: code, inputValue: addFormData.value.trim(), pageTypesToCreate: types };
                  })();

                  if (!inputValue) {
                    toast.error('Content type name is required');
                    return;
                  }

                  setIsCreating(true);

                  try {
                    const createPromises = pageTypesToCreate.map(pageType => {
                      const createData = {
                        value: shortCode,
                        label: inputValue,
                        category: addFormData.category,
                        pageType: pageType,
                        priceType: addFormData.isFree ? null : addFormData.priceType,
                        priceFixed: addFormData.isFree ? null : (addFormData.priceFixed ? parseFloat(addFormData.priceFixed) : null),
                        priceMin: addFormData.isFree ? null : (addFormData.priceMin ? parseFloat(addFormData.priceMin) : null),
                        priceMax: addFormData.isFree ? null : (addFormData.priceMax ? parseFloat(addFormData.priceMax) : null),
                        description: addFormData.description || null,
                        order: 0,
                        isFree: addFormData.isFree,
                        clientModelId: addFormData.clientModelId || null,
                      };

                      return fetch('/api/content-type-options', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(createData),
                      }).then(res => res.json());
                    });

                    const results = await Promise.all(createPromises);
                    const allSuccessful = results.every(result => result.success);

                    if (allSuccessful) {
                      const firstCreated = results[0].contentTypeOption;
                      toast.success('Content type created! Opening variation dialog...');
                      queryClient.invalidateQueries({ queryKey: ['content-type-options'] });

                      // Close add dialog
                      setAddDialogOpen(false);

                      // Reset add form
                      setAddFormData({
                        value: '',
                        category: 'PORN_ACCURATE',
                        pageTypes: ['ALL_PAGES'],
                        isFree: false,
                        priceType: 'FIXED',
                        priceFixed: '',
                        priceMin: '',
                        priceMax: '',
                        description: '',
                        clientModelId: '',
                      });

                      // Open variation dialog with the first created option
                      setTimeout(() => {
                        setVariationSourceOption(firstCreated);
                        setVariationDialogOpen(true);
                      }, 300);
                    } else {
                      const errors = results.filter(r => !r.success).map(r => r.error);
                      toast.error('Some content types failed to create: ' + errors.join(', '));
                    }
                  } catch (error) {
                    console.error('Error creating content type:', error);
                    toast.error('Failed to create content type');
                  } finally {
                    setIsCreating(false);
                  }
                }}
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-50 w-full sm:flex-1"
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Variation
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Content Type Pricing</DialogTitle>
            <DialogDescription>
              Update pricing information for {selectedOption?.label}
            </DialogDescription>
          </DialogHeader>

          {/* Model and Category Indicators */}
          {selectedOption && (
            <div className="space-y-2">
              {/* Model Indicator */}
              <div className={cn(
                "flex items-center gap-2 p-3 rounded-lg border-2",
                selectedOption.clientModel
                  ? "bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800"
                  : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
              )}>
                {selectedOption.clientModel ? (
                  <>
                    <User className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-pink-900 dark:text-pink-100">
                        Model-Specific Pricing
                      </p>
                      <p className="text-xs text-pink-700 dark:text-pink-300">
                        {selectedOption.clientModel.clientName}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                        Global Pricing
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Default for all models
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Category Indicator */}
              <div className="flex items-center gap-2 p-2 rounded-lg border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Pricing Tier:
                </span>
                <Badge className={getCategoryColor(selectedOption.category)}>
                  {getCategoryName(selectedOption.category)}
                </Badge>
              </div>
            </div>
          )}

          <div className="space-y-3 py-4">
            <div>
              <Label htmlFor="label">Content Type <span className="text-red-500">*</span></Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="e.g., BG (Boy/Girl)"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="edit-pageType">Page Type</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between mt-1.5"
                  >
                    <span>
                      {formData.pageTypes.includes('ALL_PAGES')
                        ? 'All Pages'
                        : formData.pageTypes.length > 0
                        ? formData.pageTypes.map(pt => {
                            switch(pt) {
                              case 'FREE': return 'Free';
                              case 'PAID': return 'Paid';
                              case 'VIP': return 'VIP';
                              default: return pt;
                            }
                          }).join(', ')
                        : 'Select page types...'}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-3">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-all-pages"
                        checked={formData.pageTypes.includes('ALL_PAGES')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({ ...formData, pageTypes: ['ALL_PAGES'] });
                          } else {
                            setFormData({ ...formData, pageTypes: [] });
                          }
                        }}
                      />
                      <Label htmlFor="edit-all-pages" className="cursor-pointer">All Pages</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-free"
                        checked={formData.pageTypes.includes('FREE')}
                        onCheckedChange={(checked) => {
                          const newTypes = formData.pageTypes.filter(t => t !== 'ALL_PAGES' && t !== 'FREE');
                          if (checked) {
                            setFormData({ ...formData, pageTypes: [...newTypes, 'FREE'] });
                          } else {
                            setFormData({ ...formData, pageTypes: newTypes });
                          }
                        }}
                      />
                      <Label htmlFor="edit-free" className="cursor-pointer">Free</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-paid"
                        checked={formData.pageTypes.includes('PAID')}
                        onCheckedChange={(checked) => {
                          const newTypes = formData.pageTypes.filter(t => t !== 'ALL_PAGES' && t !== 'PAID');
                          if (checked) {
                            setFormData({ ...formData, pageTypes: [...newTypes, 'PAID'] });
                          } else {
                            setFormData({ ...formData, pageTypes: newTypes });
                          }
                        }}
                      />
                      <Label htmlFor="edit-paid" className="cursor-pointer">Paid</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-vip"
                        checked={formData.pageTypes.includes('VIP')}
                        onCheckedChange={(checked) => {
                          const newTypes = formData.pageTypes.filter(t => t !== 'ALL_PAGES' && t !== 'VIP');
                          if (checked) {
                            setFormData({ ...formData, pageTypes: [...newTypes, 'VIP'] });
                          } else {
                            setFormData({ ...formData, pageTypes: newTypes });
                          }
                        }}
                      />
                      <Label htmlFor="edit-vip" className="cursor-pointer">VIP</Label>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
              <Checkbox
                id="edit-isFree"
                checked={formData.isFree}
                onCheckedChange={(checked) => setFormData({ ...formData, isFree: checked === true })}
              />
              <Label htmlFor="edit-isFree" className="text-sm font-medium cursor-pointer">
                Free content (no charge)
              </Label>
            </div>

            {!formData.isFree && (
              <>
                <div>
                  <Label htmlFor="priceType">Price Type</Label>
                  <Select
                    value={formData.priceType}
                    onValueChange={(value) => setFormData({ ...formData, priceType: value })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIXED">Fixed Price (e.g., $19.99)</SelectItem>
                      <SelectItem value="RANGE">Price Range (e.g., $14.99 - $19.99)</SelectItem>
                      <SelectItem value="MINIMUM">Minimum Price (e.g., $19.99+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.priceType === 'FIXED' && (
                  <div>
                    <Label htmlFor="priceFixed">Fixed Price ($) <span className="text-red-500">*</span></Label>
                    <Input
                      id="priceFixed"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.priceFixed}
                      onChange={(e) => setFormData({ ...formData, priceFixed: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                          e.preventDefault();
                        }
                      }}
                      placeholder="19.99"
                      className="mt-1.5"
                    />
                  </div>
                )}

                {(formData.priceType === 'RANGE' || formData.priceType === 'MINIMUM') && (
                  <div>
                    <Label htmlFor="priceMin">Minimum Price ($) <span className="text-red-500">*</span></Label>
                    <Input
                      id="priceMin"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.priceMin}
                      onChange={(e) => setFormData({ ...formData, priceMin: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                          e.preventDefault();
                        }
                      }}
                      placeholder="14.99"
                      className="mt-1.5"
                    />
                  </div>
                )}

                {formData.priceType === 'RANGE' && (
                  <div>
                    <Label htmlFor="priceMax">Maximum Price ($) <span className="text-red-500">*</span></Label>
                    <Input
                      id="priceMax"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.priceMax}
                      onChange={(e) => setFormData({ ...formData, priceMax: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                          e.preventDefault();
                        }
                      }}
                      placeholder="19.99"
                      className={cn(
                        "mt-1.5",
                        formData.priceMin && formData.priceMax &&
                        parseFloat(formData.priceMin) > parseFloat(formData.priceMax)
                          ? 'border-red-500 focus-visible:ring-red-500'
                          : ''
                      )}
                    />
                    {formData.priceMin && formData.priceMax &&
                     parseFloat(formData.priceMin) > parseFloat(formData.priceMax) && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Minimum price cannot be greater than maximum price
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add a helpful description..."
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-pink-600 hover:bg-pink-700"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Deactivate Content Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate &quot;{selectedOption?.label}&quot;? This will not delete it permanently but will remove it from active use.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Deactivating...
                </>
              ) : (
                'Deactivate'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Deactivate Multiple Content Types</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate {selectedIds.size} content type{selectedIds.size > 1 ? 's' : ''}? This will not delete them permanently but will remove them from active use.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkDeleteDialogOpen(false)}
              disabled={bulkDeleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmBulkDelete}
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Deactivating...
                </>
              ) : (
                `Deactivate ${selectedIds.size} Item${selectedIds.size > 1 ? 's' : ''}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Price History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-pink-600" />
              Price History: {selectedOption?.label}
            </DialogTitle>
            <DialogDescription>
              View the complete pricing history and changes for this content type
            </DialogDescription>
          </DialogHeader>

          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-pink-600" />
            </div>
          ) : priceHistoryData?.pricingHistory && priceHistoryData.pricingHistory.length > 0 ? (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {priceHistoryData.pricingHistory.map((history: PriceHistory, index: number) => (
                  <div
                    key={history.id}
                    className={`relative pl-6 pb-4 ${
                      index !== priceHistoryData.pricingHistory!.length - 1
                        ? 'border-l-2 border-gray-200 dark:border-gray-700'
                        : ''
                    }`}
                  >
                    {/* Timeline dot */}
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-pink-600 border-2 border-white dark:border-gray-900" />

                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={getChangeTypeBadge(history.changeType)}>
                          {history.changeType.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(history.createdAt), { addSuffix: true })}
                        </span>
                      </div>

                      {/* Changed by */}
                      <div className="flex items-center gap-2 mb-2 text-sm text-gray-600 dark:text-gray-300">
                        <span className="text-gray-400">Changed by:</span>
                        {history.changedBy ? (
                          <div className="flex items-center gap-2">
                            {history.changedBy.image ? (
                              <img
                                src={history.changedBy.image}
                                alt={history.changedBy.name || 'User'}
                                className="w-5 h-5 rounded-full"
                              />
                            ) : (
                              <div className="shrink-0 mt-1">
                                <div className="w-5 h-5 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                                  <span className="text-xs font-medium text-pink-600">
                                    {(history.changedBy.name || history.changedBy.email).charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            )}
                            <span className="font-medium">{history.changedBy.name || history.changedBy.email}</span>
                          </div>
                        ) : (
                          <span className="font-medium text-gray-400">System / Unknown</span>
                        )}
                      </div>

                      {/* Show price changes */}
                      {(history.changeType === 'PRICE_UPDATE' || history.changeType === 'PRICE_AND_LABEL_UPDATE') && (
                        <div className="flex items-center gap-2 text-sm mb-2">
                          <span className="text-red-500 line-through">
                            {formatHistoryPrice(history.oldIsFree, history.oldPriceType, history.oldPriceFixed, history.oldPriceMin, history.oldPriceMax)}
                          </span>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <span className="text-green-600 font-medium">
                            {formatHistoryPrice(history.newIsFree, history.newPriceType, history.newPriceFixed, history.newPriceMin, history.newPriceMax)}
                          </span>
                        </div>
                      )}

                      {/* Show label changes */}
                      {(history.changeType === 'LABEL_UPDATE' || history.changeType === 'PRICE_AND_LABEL_UPDATE') && (
                        <div className="flex items-center gap-2 text-sm mb-2">
                          <span className="text-red-500 line-through">{history.oldLabel}</span>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <span className="text-green-600 font-medium">{history.newLabel}</span>
                        </div>
                      )}

                      {/* Show created record */}
                      {history.changeType === 'CREATED' && (
                        <div className="text-sm">
                          <span className="text-gray-600 dark:text-gray-300">Initial price: </span>
                          <span className="text-green-600 font-medium">
                            {formatHistoryPrice(history.newIsFree, history.newPriceType, history.newPriceFixed, history.newPriceMin, history.newPriceMax)}
                          </span>
                        </div>
                      )}

                      {/* Show deactivated/reactivated */}
                      {(history.changeType === 'DEACTIVATED' || history.changeType === 'REACTIVATED') && (
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          Content type was {history.changeType.toLowerCase()}
                        </div>
                      )}

                      {history.reason && (
                        <div className="mt-2 text-xs text-gray-500 italic">
                          Reason: {history.reason}
                        </div>
                      )}

                      <div className="mt-2 text-xs text-gray-400">
                        {new Date(history.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <History className="w-12 h-12 text-gray-300 mb-4" />
              <p className="font-medium">No price history found</p>
              <p className="text-sm">Changes to this content type will appear here</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Price Variation Dialog */}
      <Dialog open={variationDialogOpen} onOpenChange={setVariationDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[96vw] sm:w-full overflow-x-auto">
          <DialogHeader>
            <DialogTitle>Add Price Variation</DialogTitle>
            <DialogDescription>
              Create a new pricing option for <span className="font-semibold text-pink-600">{variationSourceOption?.label}</span>.
              The content type, model, tier, and page type will be copied from the original.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Show source info */}
            {variationSourceOption && (
              <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <AlertDescription className="text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="font-semibold">Content Type:</span> {variationSourceOption.label}</div>
                    <div><span className="font-semibold">Tier:</span> {getCategoryName(variationSourceOption.category)}</div>
                    <div><span className="font-semibold">Page Type:</span> {getPageTypeName(variationSourceOption.pageType)}</div>
                    <div><span className="font-semibold">Model:</span> {variationSourceOption.clientModel?.clientName || 'Global'}</div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Description */}
            <div>
              <Label htmlFor="variation-description">Description *</Label>
              <Input
                id="variation-description"
                placeholder="e.g., 40 mixed vids & pics SFW contents"
                value={addFormData.description}
                onChange={(e) => setAddFormData({ ...addFormData, description: e.target.value })}
                className="mt-1.5"
              />
              <p className="text-xs text-gray-500 mt-1">Describe what makes this variation different</p>
            </div>

            {/* Is Free */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="variation-is-free"
                checked={addFormData.isFree}
                onCheckedChange={(checked) =>
                  setAddFormData({
                    ...addFormData,
                    isFree: checked as boolean,
                    priceType: checked ? '' : 'FIXED',
                    priceFixed: '',
                    priceMin: '',
                    priceMax: '',
                  })
                }
              />
              <Label htmlFor="variation-is-free" className="cursor-pointer">
                This is a free content type (no pricing)
              </Label>
            </div>

            {/* Price Type */}
            {!addFormData.isFree && (
              <>
                <div>
                  <Label htmlFor="variation-price-type">Price Type *</Label>
                  <Select
                    value={addFormData.priceType}
                    onValueChange={(value) =>
                      setAddFormData({
                        ...addFormData,
                        priceType: value,
                        priceFixed: '',
                        priceMin: '',
                        priceMax: '',
                      })
                    }
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select price type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIXED">Fixed Price</SelectItem>
                      <SelectItem value="RANGE">Price Range</SelectItem>
                      <SelectItem value="MINIMUM">Minimum Price</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Inputs based on type */}
                {addFormData.priceType === 'FIXED' && (
                  <div>
                    <Label htmlFor="variation-price-fixed">Fixed Price ($) *</Label>
                    <Input
                      id="variation-price-fixed"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="e.g., 10.00"
                      value={addFormData.priceFixed}
                      onChange={(e) => setAddFormData({ ...addFormData, priceFixed: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                )}

                {addFormData.priceType === 'RANGE' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="variation-price-min">Min Price ($) *</Label>
                      <Input
                        id="variation-price-min"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="e.g., 10.00"
                        value={addFormData.priceMin}
                        onChange={(e) => setAddFormData({ ...addFormData, priceMin: e.target.value })}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="variation-price-max">Max Price ($) *</Label>
                      <Input
                        id="variation-price-max"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="e.g., 24.00"
                        value={addFormData.priceMax}
                        onChange={(e) => setAddFormData({ ...addFormData, priceMax: e.target.value })}
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                )}

                {addFormData.priceType === 'MINIMUM' && (
                  <div>
                    <Label htmlFor="variation-price-minimum">Minimum Price ($) *</Label>
                    <Input
                      id="variation-price-minimum"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="e.g., 24.00"
                      value={addFormData.priceMin}
                      onChange={(e) => setAddFormData({ ...addFormData, priceMin: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setVariationDialogOpen(false);
                setVariationSourceOption(null);
                setAddFormData({
                  value: '',
                  category: 'PORN_ACCURATE',
                  pageTypes: ['ALL_PAGES'],
                  isFree: false,
                  priceType: 'FIXED',
                  priceFixed: '',
                  priceMin: '',
                  priceMax: '',
                  description: '',
                  clientModelId: '',
                });
              }}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!variationSourceOption) return;

                // Validation
                if (!addFormData.description.trim()) {
                  toast.error('Description is required');
                  return;
                }

                if (!addFormData.isFree) {
                  if (addFormData.priceType === 'FIXED' && !addFormData.priceFixed) {
                    toast.error('Fixed price is required');
                    return;
                  }
                  if (addFormData.priceType === 'RANGE' && (!addFormData.priceMin || !addFormData.priceMax)) {
                    toast.error('Min and max prices are required');
                    return;
                  }
                  if (addFormData.priceType === 'MINIMUM' && !addFormData.priceMin) {
                    toast.error('Minimum price is required');
                    return;
                  }
                }

                setIsCreating(true);

                // Create the variation
                try {
                  const response = await fetch('/api/content-type-options', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      value: variationSourceOption.value,
                      label: variationSourceOption.label,
                      category: variationSourceOption.category,
                      pageType: variationSourceOption.pageType,
                      clientModelId: variationSourceOption.clientModelId,
                      description: addFormData.description,
                      isFree: addFormData.isFree,
                      priceType: addFormData.isFree ? null : addFormData.priceType,
                      priceFixed: addFormData.isFree ? null : (addFormData.priceFixed ? parseFloat(addFormData.priceFixed) : null),
                      priceMin: addFormData.isFree ? null : (addFormData.priceMin ? parseFloat(addFormData.priceMin) : null),
                      priceMax: addFormData.isFree ? null : (addFormData.priceMax ? parseFloat(addFormData.priceMax) : null),
                      order: variationSourceOption.order,
                    }),
                  });

                  const data = await response.json();

                  if (data.success) {
                    toast.success('Price variation created successfully');
                    queryClient.invalidateQueries({ queryKey: ['content-type-options'] });
                    setVariationDialogOpen(false);
                    setVariationSourceOption(null);
                    setAddFormData({
                      value: '',
                      category: 'PORN_ACCURATE',
                      pageTypes: ['ALL_PAGES'],
                      isFree: false,
                      priceType: 'FIXED',
                      priceFixed: '',
                      priceMin: '',
                      priceMax: '',
                      description: '',
                      clientModelId: '',
                    });
                  } else {
                    toast.error(data.error || 'Failed to create price variation');
                  }
                } catch (error) {
                  console.error('Error creating price variation:', error);
                  toast.error('Failed to create price variation');
                } finally {
                  setIsCreating(false);
                }
              }}
              className="bg-pink-600 hover:bg-pink-700"
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Variation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ContentTypePricingTab;
