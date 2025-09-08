"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileSpreadsheet,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface SheetLink {
  id: string;
  sheetUrl: string;
  sheetName?: string;
  sheetType: string;
  createdAt: string;
  updatedAt: string;
}

interface ModelSheetLinksTabProps {
  modelName: string;
}

const SHEET_TYPES = [
  "POD Team",
  "Betterfans Sheet", 
  "Analyst",
  "Scheduler",
  "Creator"
];

export default function ModelSheetLinksTab({ modelName }: ModelSheetLinksTabProps) {
  const [sheetLinks, setSheetLinks] = useState<SheetLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [modelId, setModelId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<SheetLink | null>(null);
  const [formData, setFormData] = useState({
    sheetUrl: "",
    sheetType: "",
    sheetName: "",
  });
  const [isFetchingSheetName, setIsFetchingSheetName] = useState(false);
  const [fetchedSheetName, setFetchedSheetName] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Fetch model ID based on model name
  useEffect(() => {
    const fetchModelId = async () => {
      try {
        const response = await fetch('/api/client-models');
        const data = await response.json();
        
        if (data.success && data.clientModels) {
          const model = data.clientModels.find((m: any) => m.clientName === modelName);
          if (model) {
            setModelId(model.id);
          }
        }
      } catch (error) {
        console.error('Error fetching model ID:', error);
      }
    };

    if (modelName) {
      fetchModelId();
    }
  }, [modelName]);

  // Fetch sheet links when model ID is available
  useEffect(() => {
    const fetchSheetLinks = async () => {
      if (!modelId) return;
      
      setLoading(true);
      try {
        const response = await fetch(`/api/client-model-sheets?clientModelId=${modelId}`);
        const data = await response.json();
        
        if (data.success) {
          setSheetLinks(data.sheetLinks || []);
        }
      } catch (error) {
        console.error('Error fetching sheet links:', error);
        setStatus({
          type: "error",
          message: "Failed to load sheet links"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSheetLinks();
  }, [modelId]);

  // Auto-fetch sheet name when URL changes
  useEffect(() => {
    if (formData.sheetUrl && isValidGoogleSheetsUrl(formData.sheetUrl)) {
      setIsFetchingSheetName(true);
      fetchSheetName(formData.sheetUrl)
        .then((name) => {
          if (name) {
            setFetchedSheetName(name);
            setFormData(prev => ({ ...prev, sheetName: name }));
          }
        })
        .catch(() => {
          setFetchedSheetName("");
        })
        .finally(() => {
          setIsFetchingSheetName(false);
        });
    } else {
      setFetchedSheetName("");
      setIsFetchingSheetName(false);
    }
  }, [formData.sheetUrl]);

  const extractSpreadsheetId = (url: string): string | null => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  const isValidGoogleSheetsUrl = (url: string) => {
    return url.includes("docs.google.com/spreadsheets") && url.includes("/d/");
  };

  const fetchSheetName = async (url: string): Promise<string | null> => {
    try {
      const response = await fetch('/api/sheets/get-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetUrl: url })
      });

      if (response.ok) {
        const data = await response.json();
        return data.sheetName || null;
      }
    } catch (error) {
      console.error("Error fetching sheet name:", error);
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!modelId || !formData.sheetUrl || !formData.sheetType) {
      setStatus({
        type: "error",
        message: "Please fill in all required fields"
      });
      return;
    }

    if (!isValidGoogleSheetsUrl(formData.sheetUrl)) {
      setStatus({
        type: "error",
        message: "Please enter a valid Google Sheets URL"
      });
      return;
    }

    setFormLoading(true);
    setStatus(null);

    try {
      // Use the current form sheet name (which gets auto-populated from fetchedSheetName)
      let sheetName = formData.sheetName;
      if (!sheetName && !editingLink) {
        // Only fetch if we don't have a name and it's a new link
        sheetName = await fetchSheetName(formData.sheetUrl) || "";
      }

      const method = editingLink ? 'PUT' : 'POST';
      const body = editingLink 
        ? {
            action: 'updateSheetLink',
            id: editingLink.id,
            sheetUrl: formData.sheetUrl,
            sheetType: formData.sheetType,
            sheetName
          }
        : {
            action: 'saveSheetLink',
            clientModelId: modelId,
            sheetUrl: formData.sheetUrl,
            sheetType: formData.sheetType,
            sheetName
          };

      const response = await fetch('/api/client-model-sheets', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStatus({
          type: "success",
          message: editingLink ? "Sheet link updated successfully!" : "Sheet link added successfully!"
        });

        // Refresh the list
        const listResponse = await fetch(`/api/client-model-sheets?clientModelId=${modelId}`);
        const listData = await listResponse.json();
        if (listData.success) {
          setSheetLinks(listData.sheetLinks || []);
        }

        // Reset form
        setFormData({ sheetUrl: "", sheetType: "", sheetName: "" });
        setFetchedSheetName("");
        setEditingLink(null);
        setIsDialogOpen(false);
      } else {
        setStatus({
          type: "error",
          message: result.error || "Failed to save sheet link"
        });
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: "Network error. Please try again."
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (link: SheetLink) => {
    setEditingLink(link);
    setFormData({
      sheetUrl: link.sheetUrl,
      sheetType: link.sheetType,
      sheetName: link.sheetName || "",
    });
    setFetchedSheetName(link.sheetName || "");
    setStatus(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sheet link?")) return;

    try {
      const response = await fetch('/api/client-model-sheets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteSheetLink', id })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStatus({
          type: "success",
          message: "Sheet link deleted successfully!"
        });

        // Refresh the list
        setSheetLinks(prev => prev.filter(link => link.id !== id));
      } else {
        setStatus({
          type: "error",
          message: result.error || "Failed to delete sheet link"
        });
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: "Network error. Please try again."
      });
    }
  };

  const openNewDialog = () => {
    setEditingLink(null);
    setFormData({ sheetUrl: "", sheetType: "", sheetName: "" });
    setFetchedSheetName("");
    setStatus(null);
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-pink-200 dark:border-pink-500/30">
        <Loader2 className="h-6 w-6 animate-spin text-pink-600 dark:text-pink-400" />
        <span className="ml-2 text-gray-500 dark:text-gray-400">Loading sheet links...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Sheet Links for {modelName}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage Google Sheets links for this model
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog} size="sm" className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Link
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingLink ? "Edit Sheet Link" : "Add New Sheet Link"}
              </DialogTitle>
              <DialogDescription>
                {editingLink 
                  ? "Update the sheet link details below."
                  : "Add a new Google Sheets link for this model."
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sheet Type *
                </label>
                <Select value={formData.sheetType} onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, sheetType: value }))
                }>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Select sheet type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SHEET_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Google Sheets URL *
                </label>
                <Input
                  type="url"
                  value={formData.sheetUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, sheetUrl: e.target.value }))}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="mt-1"
                  required
                />
                {/* URL Validation */}
                {formData.sheetUrl && (
                  <div className="mt-2">
                    <div
                      className={`flex items-center space-x-2 p-2 rounded-md text-sm ${
                        isValidGoogleSheetsUrl(formData.sheetUrl)
                          ? "bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-800 dark:text-green-200"
                          : "bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200"
                      }`}
                    >
                      {isValidGoogleSheetsUrl(formData.sheetUrl) ? (
                        <>
                          <CheckCircle className="h-4 w-4 flex-shrink-0" />
                          <span>Valid Google Sheets URL</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 flex-shrink-0" />
                          <span>Please enter a valid Google Sheets URL</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sheet Name
                </label>
                <div className="relative mt-1">
                  <Input
                    value={formData.sheetName}
                    onChange={(e) => setFormData(prev => ({ ...prev, sheetName: e.target.value }))}
                    placeholder={isFetchingSheetName ? "Fetching sheet name..." : "Enter sheet name or leave empty to auto-fetch"}
                    className="pr-10"
                    disabled={isFetchingSheetName}
                  />
                  {isFetchingSheetName && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-pink-600 dark:text-pink-400" />
                    </div>
                  )}
                </div>
                {fetchedSheetName && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-md border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm text-blue-800 dark:text-blue-200">
                        Auto-fetched: <strong>{fetchedSheetName}</strong>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {status && (
                <div className={`p-3 rounded-md border ${
                  status.type === "success" 
                    ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-800 dark:text-green-200"
                    : status.type === "error"
                    ? "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200"
                    : "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200"
                }`}>
                  <div className="flex items-center">
                    {status.type === "success" ? (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <AlertCircle className="h-4 w-4 mr-2" />
                    )}
                    <span className="text-sm">{status.message}</span>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={formLoading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={formLoading || isFetchingSheetName}
                  className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white"
                >
                  {formLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {editingLink ? "Updating..." : "Adding..."}
                    </>
                  ) : isFetchingSheetName ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Fetching name...
                    </>
                  ) : (
                    editingLink ? "Update" : "Add"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Status Alert */}
      {status && (
        <div className={`p-4 rounded-lg border backdrop-blur-sm ${
          status.type === "success" 
            ? "bg-green-50/80 dark:bg-green-900/30 border-green-200 dark:border-green-700"
            : status.type === "error"
            ? "bg-red-50/80 dark:bg-red-900/30 border-red-200 dark:border-red-700"
            : "bg-blue-50/80 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700"
        }`}>
          <div className="flex items-center">
            {status.type === "success" ? (
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-3" />
            )}
            <span className={`text-sm font-medium ${
              status.type === "success" ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"
            }`}>
              {status.message}
            </span>
          </div>
        </div>
      )}

      {/* Sheet Links Table */}
      {sheetLinks.length === 0 ? (
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-pink-200 dark:border-pink-500/30">
          <CardContent className="p-8 text-center">
            <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No sheet links yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Add your first Google Sheets link to get started.
            </p>
            <Button onClick={openNewDialog} className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add First Link
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-pink-200 dark:border-pink-500/30">
          <CardHeader className="bg-gradient-to-r from-pink-50/50 to-rose-50/50 dark:from-pink-900/20 dark:to-rose-900/20 border-b border-pink-200 dark:border-pink-500/30">
            <CardTitle className="text-base font-medium text-gray-900 dark:text-gray-100">Sheet Links ({sheetLinks.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0 bg-white/50 dark:bg-gray-800/50">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50 dark:bg-gray-900/50">
                  <TableHead className="text-gray-700 dark:text-gray-300">Name</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Type</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Created</TableHead>
                  <TableHead className="w-[100px] text-gray-700 dark:text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sheetLinks.map((link) => (
                  <TableRow key={link.id} className="hover:bg-pink-50/50 dark:hover:bg-pink-900/10 transition-colors">
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <FileSpreadsheet className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                        <div>
                          <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                            {link.sheetName || "Untitled Sheet"}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                            {link.sheetUrl}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200">
                        {link.sheetType}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(link.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(link.sheetUrl, '_blank')}
                          className="h-8 w-8 p-0 hover:bg-pink-100 dark:hover:bg-pink-900/30"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(link)}
                          className="h-8 w-8 p-0 hover:bg-pink-100 dark:hover:bg-pink-900/30"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(link.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
