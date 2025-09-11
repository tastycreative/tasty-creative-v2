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
  X,
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
  const [sheetEntries, setSheetEntries] = useState([{
    id: 1,
    url: "",
    type: "",
    fetchedName: "",
    isFetching: false,
    isEditing: false
  }]);
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

  // Helper functions for managing multiple entries
  const handleUrlChange = async (entryId: number, url: string) => {
    setSheetEntries(prev => prev.map(entry => 
      entry.id === entryId 
        ? { ...entry, url, fetchedName: "", isFetching: false }
        : entry
    ));

    if (url && isValidGoogleSheetsUrl(url)) {
      setSheetEntries(prev => prev.map(entry => 
        entry.id === entryId 
          ? { ...entry, isFetching: true }
          : entry
      ));

      try {
        const name = await fetchSheetName(url);
        if (name) {
          setSheetEntries(prev => prev.map(entry => 
            entry.id === entryId 
              ? { ...entry, fetchedName: name, isFetching: false }
              : entry
          ));
        }
      } catch (error) {
        setSheetEntries(prev => prev.map(entry => 
          entry.id === entryId 
            ? { ...entry, fetchedName: "", isFetching: false }
            : entry
        ));
      }
    }
  };

  const addNewSheetEntry = () => {
    const newId = Math.max(...sheetEntries.map(e => e.id)) + 1;
    setSheetEntries(prev => [...prev, {
      id: newId,
      url: "",
      type: "",
      fetchedName: "",
      isFetching: false,
      isEditing: false
    }]);
  };

  const removeSheetEntry = (id: number) => {
    if (sheetEntries.length > 1) {
      setSheetEntries(prev => prev.filter(entry => entry.id !== id));
    }
  };

  const updateSheetType = (entryId: number, type: string) => {
    setSheetEntries(prev => prev.map(entry => 
      entry.id === entryId 
        ? { ...entry, type }
        : entry
    ));
  };

  const toggleEdit = (entryId: number) => {
    setSheetEntries(prev => prev.map(entry => 
      entry.id === entryId 
        ? { ...entry, isEditing: !entry.isEditing }
        : entry
    ));
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
    
    if (editingLink) {
      // Handle single edit mode
      const validEntry = sheetEntries[0];
      if (!modelId || !validEntry.url || !validEntry.type) {
        setStatus({
          type: "error",
          message: "Please fill in all required fields"
        });
        return;
      }

      if (!isValidGoogleSheetsUrl(validEntry.url)) {
        setStatus({
          type: "error",
          message: "Please enter a valid Google Sheets URL"
        });
        return;
      }

      setFormLoading(true);
      setStatus(null);

      try {
        const response = await fetch('/api/client-model-sheets', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'updateSheetLink',
            id: editingLink.id,
            sheetUrl: validEntry.url,
            sheetType: validEntry.type,
            sheetName: validEntry.fetchedName || ""
          })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          setStatus({
            type: "success",
            message: "Sheet link updated successfully!"
          });

          // Refresh the list
          const listResponse = await fetch(`/api/client-model-sheets?clientModelId=${modelId}`);
          const listData = await listResponse.json();
          if (listData.success) {
            setSheetLinks(listData.sheetLinks || []);
          }

          setEditingLink(null);
          setIsDialogOpen(false);
        } else {
          setStatus({
            type: "error",
            message: result.error || "Failed to update sheet link"
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
    } else {
      // Handle multiple entries mode
      const validEntries = sheetEntries.filter(entry => entry.url && entry.type && entry.fetchedName);
      
      if (!modelId || validEntries.length === 0) {
        setStatus({
          type: "error",
          message: "Please complete all fields before saving"
        });
        return;
      }

      setFormLoading(true);
      setStatus(null);

      try {
        // Save all valid entries
        const promises = validEntries.map(entry => 
          fetch('/api/client-model-sheets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'saveSheetLink',
              clientModelId: modelId,
              sheetUrl: entry.url,
              sheetName: entry.fetchedName,
              sheetType: entry.type
            })
          })
        );
        
        const responses = await Promise.all(promises);
        const results = await Promise.all(responses.map(r => r.json()));
        
        const allSuccessful = responses.every(r => r.ok) && results.every(r => r.success);
        
        if (allSuccessful) {
          setStatus({
            type: "success",
            message: `Successfully added ${validEntries.length} sheet link(s)!`
          });
          
          // Send notification emails to POD team members via API
          if (modelName && modelId) {
            for (const entry of validEntries) {
              try {
                await fetch('/api/notifications/sheet-link', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    clientModelId: modelId,
                    modelName: modelName,
                    sheetName: entry.fetchedName,
                    sheetUrl: entry.url,
                    sheetType: entry.type,
                  })
                });
              } catch (error) {
                console.error('Error sending notification for sheet link:', error);
              }
            }
          }
          
          // Refresh the list
          const listResponse = await fetch(`/api/client-model-sheets?clientModelId=${modelId}`);
          const listData = await listResponse.json();
          if (listData.success) {
            setSheetLinks(listData.sheetLinks || []);
          }
          
          // Reset form to single empty entry
          setSheetEntries([{
            id: 1,
            url: "",
            type: "",
            fetchedName: "",
            isFetching: false,
            isEditing: false
          }]);
          
          setIsDialogOpen(false);
        } else {
          setStatus({
            type: "error",
            message: "Failed to save some sheet links"
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
    }
  };

  const handleEdit = (link: SheetLink) => {
    setEditingLink(link);
    setSheetEntries([{
      id: 1,
      url: link.sheetUrl,
      type: link.sheetType,
      fetchedName: link.sheetName || "",
      isFetching: false,
      isEditing: false
    }]);
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
    setSheetEntries([{
      id: 1,
      url: "",
      type: "",
      fetchedName: "",
      isFetching: false,
      isEditing: false
    }]);
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
          
          <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingLink ? "Edit Sheet Link" : "Add New Sheet Links"}
              </DialogTitle>
              <DialogDescription>
                {editingLink 
                  ? "Update the sheet link details below."
                  : "Add Google Sheets links for this model. You can add multiple sheets at once."
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Sheet Entries */}
              <div className="space-y-4">
                {sheetEntries.map((entry) => (
                  <div key={entry.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start space-x-3">
                      {/* Sheet URL/Name Input */}
                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                          Google Sheets URL *
                        </label>
                        <div className="flex items-center space-x-2">
                          {entry.fetchedName && !entry.isEditing ? (
                            <div className="flex-1 flex items-center space-x-2 p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                              <FileSpreadsheet className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                              <span className="flex-1 text-gray-900 dark:text-gray-100 font-medium">{entry.fetchedName}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleEdit(entry.id)}
                                className="p-1 h-8 w-8"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Input
                              type="url"
                              value={entry.url}
                              onChange={(e) => handleUrlChange(entry.id, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && entry.fetchedName) {
                                  e.preventDefault();
                                  toggleEdit(entry.id);
                                }
                              }}
                              placeholder="https://docs.google.com/spreadsheets/d/..."
                              className="flex-1 h-12 text-base border-2 border-gray-200 dark:border-gray-600 focus:border-pink-500 dark:focus:border-pink-400 transition-colors duration-300 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              required
                            />
                          )}
                          
                          {/* Remove Button */}
                          {!editingLink && sheetEntries.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSheetEntry(entry.id)}
                              className="p-2 h-12 w-12 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        {/* Loading/Status for URL */}
                        {entry.isFetching && (
                          <div className="mt-2 flex items-center space-x-2 text-sm text-pink-600 dark:text-pink-400">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Fetching sheet name...</span>
                          </div>
                        )}
                      </div>

                      {/* Sheet Type Selection */}
                      <div className="w-48">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                          Sheet Type *
                        </label>
                        <Select value={entry.type} onValueChange={(value) => updateSheetType(entry.id, value)}>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select type..." />
                          </SelectTrigger>
                          <SelectContent>
                            {SHEET_TYPES.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Another Sheet Button - Only show in add mode */}
              {!editingLink && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={addNewSheetEntry}
                  className="w-full h-12 text-base border-dashed border-2 border-gray-300 dark:border-gray-600 hover:border-pink-500 dark:hover:border-pink-400 text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Sheet Link
                </Button>
              )}

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
                  disabled={formLoading || !modelId || (editingLink ? false : !sheetEntries.some(entry => entry.url && entry.type && entry.fetchedName))}
                  className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white"
                >
                  {formLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {editingLink ? "Updating..." : "Adding..."}
                    </>
                  ) : sheetEntries.some(entry => entry.isFetching) ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Fetching names...
                    </>
                  ) : (
                    editingLink ? "Update" : `Add ${sheetEntries.filter(entry => entry.url && entry.type && entry.fetchedName).length} Sheet(s)`
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
                  <TableHead className="w-[120px] text-gray-700 dark:text-gray-300">Type</TableHead>
                  <TableHead className="w-[100px] text-gray-700 dark:text-gray-300">Created</TableHead>
                  <TableHead className="w-[100px] text-gray-700 dark:text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sheetLinks.map((link) => (
                  <TableRow key={link.id} className="hover:bg-pink-50/50 dark:hover:bg-pink-900/10 transition-colors">
                    <TableCell className="w-full max-w-0">
                      <div className="flex items-center space-x-2">
                        <FileSpreadsheet className="h-4 w-4 text-pink-600 dark:text-pink-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div 
                            className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate cursor-help"
                            title={link.sheetName || "Untitled Sheet"}
                          >
                            {link.sheetName || "Untitled Sheet"}
                          </div>
                          <div 
                            className="text-xs text-gray-500 dark:text-gray-400 truncate cursor-help"
                            title={link.sheetUrl}
                          >
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
