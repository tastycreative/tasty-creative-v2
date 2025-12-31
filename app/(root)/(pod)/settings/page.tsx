"use client";

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { DollarSign, Edit, Plus, Settings as SettingsIcon, Trash2, User, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ContentTypeOption {
  id: string;
  value: string;
  label: string;
  category: string;
  priceType: string | null;
  priceFixed: number | null;
  priceMin: number | null;
  priceMax: number | null;
  description: string | null;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

const Settings = () => {
  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<ContentTypeOption | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state for editing
  const [formData, setFormData] = useState({
    label: '',
    priceType: 'RANGE',
    priceFixed: '',
    priceMin: '',
    priceMax: '',
    description: '',
  });

  // Form state for adding new content types
  const [addFormData, setAddFormData] = useState({
    value: '',
    label: '',
    category: 'CHEAP_PORN',
    priceType: 'RANGE',
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
      priceType: string;
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

  // Delete mutation (soft delete)..'

  
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
      priceType: string;
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
        label: '',
        category: 'CHEAP_PORN',
        priceType: 'RANGE',
        priceFixed: '',
        priceMin: '',
        priceMax: '',
        description: '',
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
      priceType: option.priceType || 'RANGE',
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

    if (formData.priceType === 'FIXED' && !formData.priceFixed) {
      toast.error('Fixed price is required');
      return;
    }

    if (formData.priceType === 'RANGE' && (!formData.priceMin || !formData.priceMax)) {
      toast.error('Min and max prices are required for range pricing');
      return;
    }

    if (formData.priceType === 'MINIMUM' && !formData.priceMin) {
      toast.error('Minimum price is required');
      return;
    }

    const updateData = {
      id: selectedOption.id,
      label: formData.label,
      priceType: formData.priceType,
      priceFixed: formData.priceType === 'FIXED' ? parseFloat(formData.priceFixed) : null,
      priceMin: formData.priceType === 'RANGE' || formData.priceType === 'MINIMUM'
        ? parseFloat(formData.priceMin)
        : null,
      priceMax: formData.priceType === 'RANGE' ? parseFloat(formData.priceMax) : null,
      description: formData.description,
    };

    updateMutation.mutate(updateData);
  };

  // Delete content type (soft delete)
  const handleDelete = () => {
    if (!selectedOption) return;
    deleteMutation.mutate(selectedOption.id);
  };

  // Create new content type
  const handleCreate = () => {
    // Validation
    if (!addFormData.value.trim()) {
      toast.error('Content type value is required');
      return;
    }

    if (!addFormData.label.trim()) {
      toast.error('Label is required');
      return;
    }

    if (addFormData.priceType === 'FIXED' && !addFormData.priceFixed) {
      toast.error('Fixed price is required');
      return;
    }

    if (addFormData.priceType === 'RANGE' && (!addFormData.priceMin || !addFormData.priceMax)) {
      toast.error('Min and max prices are required for range pricing');
      return;
    }

    if (addFormData.priceType === 'MINIMUM' && !addFormData.priceMin) {
      toast.error('Minimum price is required');
      return;
    }

    // Client-side duplicate validation
    const duplicate = contentTypeOptions.find(
      option => option.value.toLowerCase() === addFormData.value.toLowerCase() &&
                option.category === addFormData.category
    );

    if (duplicate) {
      toast.error(`A content type "${addFormData.value}" already exists in the "${getCategoryName(addFormData.category)}" tier`);
      return;
    }

    const createData = {
      value: addFormData.value.trim(),
      label: addFormData.label.trim(),
      category: addFormData.category,
      priceType: addFormData.priceType,
      priceFixed: addFormData.priceType === 'FIXED' ? parseFloat(addFormData.priceFixed) : null,
      priceMin: addFormData.priceType === 'RANGE' || addFormData.priceType === 'MINIMUM'
        ? parseFloat(addFormData.priceMin)
        : null,
      priceMax: addFormData.priceType === 'RANGE' ? parseFloat(addFormData.priceMax) : null,
      description: addFormData.description.trim(),
    };

    createMutation.mutate(createData);
  };

  // Format price display
  const formatPrice = (option: ContentTypeOption) => {
    if (option.priceType === 'FIXED' && option.priceFixed) {
      return `$${option.priceFixed.toFixed(2)}`;
    } else if (option.priceType === 'RANGE' && option.priceMin && option.priceMax) {
      return `$${option.priceMin.toFixed(2)} - $${option.priceMax.toFixed(2)}`;
    } else if (option.priceType === 'MINIMUM' && option.priceMin) {
      return `$${option.priceMin.toFixed(2)}+`;
    }
    return 'N/A';
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

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-2">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-300">Manage your application settings and preferences</p>
      </div>

      {/* Tabbed Interface */}
      <Tabs defaultValue="pricing" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Content Pricing
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Account
          </TabsTrigger>
        </TabsList>

        {/* Content Pricing Tab */}
        <TabsContent value="pricing">
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
                      Found {filteredContentTypes.length} result{filteredContentTypes.length !== 1 ? 's' : ''} for "{searchQuery}"
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
                                  {option.priceType}
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
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(option)}
                                    className="gap-1"
                                  >
                                    <Edit className="w-3 h-3" />
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteClick(option)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Deactivate
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
        </TabsContent>

        {/* General Settings Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Application-wide settings and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">General settings coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Settings Tab */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">Account settings coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
              <Label htmlFor="add-value">Content Type Value <span className="text-red-500">*</span></Label>
              <Input
                id="add-value"
                value={addFormData.value}
                onChange={(e) => setAddFormData({ ...addFormData, value: e.target.value.toUpperCase() })}
                placeholder="e.g., BG, BGG, SOLO"
                className="uppercase"
              />
              <p className="text-xs text-gray-500 mt-1">Short code for the content type (e.g., BG, BGG)</p>
            </div>

            <div>
              <Label htmlFor="add-label">Label <span className="text-red-500">*</span></Label>
              <Input
                id="add-label"
                value={addFormData.label}
                onChange={(e) => setAddFormData({ ...addFormData, label: e.target.value })}
                placeholder="e.g., BG (Boy/Girl)"
              />
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

            <div>
              <Label htmlFor="add-priceType">Price Type <span className="text-red-500">*</span></Label>
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
                  placeholder="19.99"
                />
              </div>
            )}

            {(addFormData.priceType === 'RANGE' || addFormData.priceType === 'MINIMUM') && (
              <div>
                <Label htmlFor="add-priceMin">Minimum Price ($) <span className="text-red-500">*</span></Label>
                <Input
                  id="add-priceMin"
                  type="number"
                  step="0.01"
                  min="0"
                  value={addFormData.priceMin}
                  onChange={(e) => setAddFormData({ ...addFormData, priceMin: e.target.value })}
                  placeholder="14.99"
                />
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
                  placeholder="19.99"
                />
              </div>
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
              <Label htmlFor="label">Label <span className="text-red-500">*</span></Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="e.g., BG (Boy/Girl)"
              />
            </div>

            <div>
              <Label htmlFor="priceType">Price Type <span className="text-red-500">*</span></Label>
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
                  placeholder="19.99"
                />
              </div>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Content Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate "{selectedOption?.label}"?
            </DialogDescription>
          </DialogHeader>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This will hide the content type from new submissions but won't affect existing workflows.
            </AlertDescription>
          </Alert>
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
    </div>
  );
};

export default Settings;
