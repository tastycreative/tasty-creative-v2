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
import { DollarSign, Edit, Plus, Trash2, Search, RefreshCw, AlertCircle, History, ArrowRight, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

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
  isFree: boolean;
  priceType: string | null;
  priceFixed: number | null;
  priceMin: number | null;
  priceMax: number | null;
  description: string | null;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  pricingHistory?: PriceHistory[];
}

const ContentTypePricingTab = () => {
  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<ContentTypeOption | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state for editing
  const [formData, setFormData] = useState({
    label: '',
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
    category: 'CHEAP_PORN',
    isFree: false,
    priceType: 'FIXED',
    priceFixed: '',
    priceMin: '',
    priceMax: '',
    description: '',
  });

  // Fetch content type options with React Query
  const { data: contentTypeOptions = [], isLoading, refetch } = useQuery({
    queryKey: ['content-type-options', filterCategory],
    queryFn: async () => {
      const url = filterCategory === 'all'
        ? '/api/content-type-options'
        : `/api/content-type-options?category=${filterCategory}`;

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

  // Filter content types based on search query
  const filteredContentTypes = useMemo(() => {
    if (!searchQuery.trim()) return contentTypeOptions;

    const query = searchQuery.toLowerCase();
    return contentTypeOptions.filter(option =>
      option.label.toLowerCase().includes(query) ||
      option.value.toLowerCase().includes(query) ||
      option.description?.toLowerCase().includes(query)
    );
  }, [contentTypeOptions, searchQuery]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (updateData: {
      id: string;
      label: string;
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

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (createData: {
      value: string;
      label: string;
      category: string;
      isFree: boolean;
      priceType: string | null;
      priceFixed: number | null;
      priceMin: number | null;
      priceMax: number | null;
      description: string;
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-type-options'] });
      toast.success('Content type created successfully');
      setAddDialogOpen(false);
      // Reset form
      setAddFormData({
        value: '',
        category: 'CHEAP_PORN',
        priceType: 'RANGE',
        priceFixed: '',
        priceMin: '',
        priceMax: '',
        description: '',
        isFree: false,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create content type');
    },
  });

  // Handle edit button click
  const handleEdit = (option: ContentTypeOption) => {
    setSelectedOption(option);
    setFormData({
      label: option.label,
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

    const updateData = {
      id: selectedOption.id,
      label: formData.label,
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
  };

  // Delete content type (soft delete)
  const handleDelete = () => {
    if (!selectedOption) return;
    deleteMutation.mutate(selectedOption.id);
  };

  // Get category display name
  const getCategoryName = (category: string) => {
    switch (category) {
      case 'CHEAP_PORN':
        return 'Cheap Porn';
      case 'EXPENSIVE_PORN':
        return 'Expensive Porn';
      case 'GF_ACCURATE':
        return 'GF Accurate';
      default:
        return category;
    }
  };

  // Create new content type
  const handleCreate = () => {
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
    const shortCode = inputValue.split(/[\s(]/)[0].toUpperCase();

    // Client-side duplicate validation (check against label field)
    const duplicate = contentTypeOptions.find(
      option => option.label.toLowerCase() === inputValue.toLowerCase() &&
                option.category === addFormData.category
    );

    if (duplicate) {
      toast.error(`Content type "${inputValue}" already exists in the "${getCategoryName(addFormData.category)}" tier`);
      return;
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

    const createData = {
      value: shortCode,
      label: inputValue,
      category: addFormData.category,
      isFree: addFormData.isFree,
      priceType: addFormData.isFree ? null : addFormData.priceType,
      priceFixed: !addFormData.isFree && addFormData.priceType === 'FIXED' ? parseFloat(addFormData.priceFixed) : null,
      priceMin: !addFormData.isFree && (addFormData.priceType === 'RANGE' || addFormData.priceType === 'MINIMUM')
        ? parseFloat(addFormData.priceMin)
        : null,
      priceMax: !addFormData.isFree && addFormData.priceType === 'RANGE' ? parseFloat(addFormData.priceMax) : null,
      description: finalDescription,
    };

    createMutation.mutate(createData);
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
      case 'CHEAP_PORN':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'EXPENSIVE_PORN':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'GF_ACCURATE':
        return 'bg-pink-500/10 text-pink-600 border-pink-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-pink-600" />
                  Content Type Pricing Management
                </CardTitle>
                <CardDescription className="mt-1">
                  Manage pricing for different content types across pricing tiers
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setAddDialogOpen(true)}
                  className="gap-2 bg-pink-600 hover:bg-pink-700"
                >
                  <Plus className="w-4 h-4" />
                  Add New
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isLoading}
                  className="gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search content types..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full sm:w-60">
                  <SelectValue placeholder="Filter by tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="CHEAP_PORN">Cheap Porn</SelectItem>
                  <SelectItem value="EXPENSIVE_PORN">Expensive Porn</SelectItem>
                  <SelectItem value="GF_ACCURATE">GF Accurate</SelectItem>
                </SelectContent>
              </Select>
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

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Content Type</TableHead>
                      <TableHead>Pricing Tier</TableHead>
                      <TableHead>Price Type</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContentTypes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
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
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{option.label}</span>
                              {option.description && (
                                <span className="text-xs text-gray-500 mt-1">{option.description}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getCategoryColor(option.category)}>
                              {getCategoryName(option.category)}
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Add New Content Type Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Content Type</DialogTitle>
            <DialogDescription>
              Create a new content type with pricing information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="add-value">Content Type <span className="text-red-500">*</span></Label>
              <Input
                id="add-value"
                value={addFormData.value}
                onChange={(e) => setAddFormData({ ...addFormData, value: e.target.value })}
                placeholder="e.g., BG (Boy/Girl), BGG, SOLO"
              />
              <p className="text-xs text-gray-500 mt-1">Enter the content type name. You can include a description in parentheses.</p>
            </div>

            <div>
              <Label htmlFor="add-category">Pricing Tier <span className="text-red-500">*</span></Label>
              <Select
                value={addFormData.category}
                onValueChange={(value) => setAddFormData({ ...addFormData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CHEAP_PORN">Cheap Porn</SelectItem>
                  <SelectItem value="EXPENSIVE_PORN">Expensive Porn</SelectItem>
                  <SelectItem value="GF_ACCURATE">GF Accurate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center">
              <Checkbox
                id="add-isFree"
                checked={addFormData.isFree}
                onCheckedChange={(checked) => setAddFormData({ ...addFormData, isFree: checked === true })}
              />
              <Label htmlFor="add-isFree" className="text-sm ml-2 font-medium cursor-pointer">
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
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddDialogOpen(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              className="bg-pink-600 hover:bg-pink-700"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Content Type
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Content Type Pricing</DialogTitle>
            <DialogDescription>
              Update pricing information for {selectedOption?.label}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="label">Content Type <span className="text-red-500">*</span></Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="e.g., BG (Boy/Girl)"
              />
            </div>

            <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
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
                      className={
                        formData.priceMin && formData.priceMax &&
                        parseFloat(formData.priceMin) > parseFloat(formData.priceMax)
                          ? 'border-red-500 focus-visible:ring-red-500'
                          : ''
                      }
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
        <DialogContent className="max-w-md">
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

      {/* Price History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
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
    </>
  );
};

export default ContentTypePricingTab;
