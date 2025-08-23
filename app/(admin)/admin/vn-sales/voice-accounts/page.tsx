"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  User,
  Edit,
  Trash2,
  Plus,
  Mic,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

interface VoiceModel {
  id: string;
  accountName: string;
  accountKey: string;
  voiceName: string;
  voiceId: string;
  apiKey: string;
  description: string;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EditFormData {
  accountName: string;
  voiceName: string;
  voiceId: string;
  apiKey: string;
  description: string;
  category: string;
}

export default function VoiceAccountsPage() {
  const [voiceModels, setVoiceModels] = useState<VoiceModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingModel, setEditingModel] = useState<VoiceModel | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    accountName: "",
    voiceName: "",
    voiceId: "",
    apiKey: "",
    description: "",
    category: "professional",
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [deleteConfirmModel, setDeleteConfirmModel] =
    useState<VoiceModel | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Fetch voice models
  const fetchVoiceModels = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/voice-models");
      const data = await response.json();

      if (response.ok && data.success) {
        setVoiceModels(data.models);
      } else {
        setError(data.error || "Failed to fetch voice models");
      }
    } catch (err: any) {
      setError(err.message || "Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Handle edit model
  const handleEditModel = (model: VoiceModel) => {
    setEditingModel(model);
    setEditFormData({
      accountName: model.accountName,
      voiceName: model.voiceName,
      voiceId: model.voiceId,
      apiKey: "***ENCRYPTED***", // Show encrypted placeholder
      description: model.description,
      category: model.category,
    });
    setIsEditDialogOpen(true);
  };

  // Handle form change
  const handleFormChange = (field: keyof EditFormData, value: string) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle update model
  const handleUpdateModel = async () => {
    if (!editingModel) return;

    setIsUpdating(true);

    try {
      const response = await fetch("/api/voice-models", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingModel.id,
          ...editFormData,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage("Voice model updated successfully");
        setTimeout(() => setSuccessMessage(""), 3000);

        setIsEditDialogOpen(false);
        setEditingModel(null);
        await fetchVoiceModels(); // Refresh the list
      } else {
        setErrorMessage(data.error || "Failed to update voice model");
        setTimeout(() => setErrorMessage(""), 5000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error occurred");
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle delete model
  const handleDeleteModel = async (model: VoiceModel) => {
    setIsDeleting(true);

    try {
      const response = await fetch("/api/voice-models", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: model.id,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage("Voice model deleted successfully");
        setTimeout(() => setSuccessMessage(""), 3000);

        await fetchVoiceModels(); // Refresh the list
      } else {
        setErrorMessage(data.error || "Failed to delete voice model");
        setTimeout(() => setErrorMessage(""), 5000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error occurred");
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmModel(null);
    }
  };

  // Toggle API key visibility
  const toggleApiKeyVisibility = (modelId: string) => {
    setShowApiKey((prev) => ({
      ...prev,
      [modelId]: !prev[modelId],
    }));
  };

  // Get category badge variant
  const getCategoryBadgeVariant = (category: string) => {
    switch (category.toLowerCase()) {
      case "professional":
        return "default";
      case "casual":
        return "secondary";
      case "entertainment":
        return "outline";
      default:
        return "secondary";
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    fetchVoiceModels();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Voice Generation Accounts
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your ElevenLabs voice generation accounts and configurations
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Message */}
        {successMessage && (
          <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {errorMessage && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Card className="shadow-lg border-pink-200 dark:border-pink-500/30">
          <CardHeader className="bg-gradient-to-r from-pink-500 to-rose-500 text-white">
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Voice Models Database
            </CardTitle>
            <CardDescription className="text-pink-100">
              {voiceModels.length} voice models configured
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {voiceModels.length === 0 ? (
              <div className="p-8 text-center">
                <Mic className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  No Voice Models Found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  You haven't added any voice generation accounts yet.
                </p>
                <Button
                  onClick={() =>
                    (window.location.href = "/admin/vn-sales/add-model")
                  }
                  className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Voice Model
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Voice Name</TableHead>
                    <TableHead>Voice ID</TableHead>
                    <TableHead>API Key</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {voiceModels.map((model) => (
                    <TableRow key={model.id}>
                      <TableCell className="font-medium">
                        {model.accountName}
                      </TableCell>
                      <TableCell>{model.voiceName}</TableCell>
                      <TableCell>
                        <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                          {model.voiceId}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                            {showApiKey[model.id]
                              ? model.apiKey
                              : "***ENCRYPTED***"}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleApiKeyVisibility(model.id)}
                          >
                            {showApiKey[model.id] ? (
                              <EyeOff className="h-3 w-3" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getCategoryBadgeVariant(model.category)}
                        >
                          {model.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={model.isActive ? "default" : "secondary"}
                          className={
                            model.isActive
                              ? "bg-green-500 hover:bg-green-600"
                              : ""
                          }
                        >
                          {model.isActive ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(model.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditModel(model)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeleteConfirmModel(model)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Voice Model</DialogTitle>
              <DialogDescription>
                Update the configuration for this voice generation account.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="accountName" className="text-right">
                  Account Name
                </Label>
                <Input
                  id="accountName"
                  value={editFormData.accountName}
                  onChange={(e) =>
                    handleFormChange("accountName", e.target.value)
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="voiceName" className="text-right">
                  Voice Name
                </Label>
                <Input
                  id="voiceName"
                  value={editFormData.voiceName}
                  onChange={(e) =>
                    handleFormChange("voiceName", e.target.value)
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="voiceId" className="text-right">
                  Voice ID
                </Label>
                <Input
                  id="voiceId"
                  value={editFormData.voiceId}
                  onChange={(e) => handleFormChange("voiceId", e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="apiKey" className="text-right">
                  API Key
                </Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={editFormData.apiKey}
                  onChange={(e) => handleFormChange("apiKey", e.target.value)}
                  placeholder="Leave as is to keep current key"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Category
                </Label>
                <Select
                  value={editFormData.category}
                  onValueChange={(value) => handleFormChange("category", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={editFormData.description}
                  onChange={(e) =>
                    handleFormChange("description", e.target.value)
                  }
                  className="col-span-3"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateModel}
                disabled={isUpdating}
                className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Model"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={!!deleteConfirmModel}
          onOpenChange={() => setDeleteConfirmModel(null)}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete Voice Model</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the voice model "
                {deleteConfirmModel?.accountName}"? This action cannot be undone
                and will remove all associated configurations.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteConfirmModel(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={() =>
                  deleteConfirmModel && handleDeleteModel(deleteConfirmModel)
                }
                className="bg-red-500 hover:bg-red-600"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
