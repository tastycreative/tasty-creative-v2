"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DollarSign,
  Edit2,
  Trash2,
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertCircle,
  Calendar,
  Volume2,
} from "lucide-react";

interface VoiceNoteSale {
  id: string;
  modelName: string;
  voiceNote: string;
  saleAmount: number;
  soldDate: string;
  status: string;
  generatedDate?: string;
  source?: string;
  createdAt: string;
}

interface SubmittedSalesTabProps {
  onSaleUpdated?: () => void;
}

const SubmittedSalesTab: React.FC<SubmittedSalesTabProps> = ({
  onSaleUpdated,
}) => {
  const [sales, setSales] = useState<VoiceNoteSale[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Edit dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<VoiceNoteSale | null>(null);
  const [editedAmount, setEditedAmount] = useState("");
  const [editedStatus, setEditedStatus] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingSale, setDeletingSale] = useState<VoiceNoteSale | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load user's submitted sales
  const loadSales = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/vn-sales/my-sales");
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Please sign in to view your sales");
        }
        throw new Error("Failed to load sales");
      }
      const data = await response.json();
      setSales(data.sales || []);
    } catch (err: any) {
      console.error("Error loading sales:", err);
      setError(err.message || "Failed to load your sales");
    } finally {
      setIsLoading(false);
    }
  };

  // Open edit dialog
  const handleEditClick = (sale: VoiceNoteSale) => {
    setEditingSale(sale);
    setEditedAmount(sale.saleAmount.toString());
    setEditedStatus(sale.status);
    setEditDialogOpen(true);
  };

  // Handle edit submission
  const handleEditSubmit = async () => {
    if (!editingSale) return;

    const amount = parseFloat(editedAmount);
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid sale amount");
      return;
    }

    setIsUpdating(true);
    setError("");
    try {
      const response = await fetch(`/api/vn-sales/${editingSale.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          saleAmount: amount,
          status: editedStatus,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update sale");
      }

      setSuccessMessage("Sale updated successfully!");
      setEditDialogOpen(false);
      await loadSales();
      if (onSaleUpdated) onSaleUpdated();

      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      console.error("Error updating sale:", err);
      setError(err.message || "Failed to update sale");
    } finally {
      setIsUpdating(false);
    }
  };

  // Open delete dialog
  const handleDeleteClick = (sale: VoiceNoteSale) => {
    setDeletingSale(sale);
    setDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingSale) return;

    setIsDeleting(true);
    setError("");
    try {
      const response = await fetch(`/api/vn-sales/${deletingSale.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete sale");
      }

      setSuccessMessage("Sale deleted successfully!");
      setDeleteDialogOpen(false);
      await loadSales();
      if (onSaleUpdated) onSaleUpdated();

      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      console.error("Error deleting sale:", err);
      setError(err.message || "Failed to delete sale");
    } finally {
      setIsDeleting(false);
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

  // Truncate text
  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Calculate total revenue
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.saleAmount, 0);

  // Load sales on mount
  useEffect(() => {
    loadSales();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-500/10 dark:to-rose-500/10 border-pink-200 dark:border-pink-500/30 rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-pink-500/20">
                <DollarSign
                  size={24}
                  className="text-pink-600 dark:text-pink-400"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Your Submitted Sales
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  View, edit, and manage all your voice note sales. Track your
                  revenue and keep your sales records up to date.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="bg-white dark:bg-gray-700 border-pink-200 dark:border-pink-500/30 text-gray-700 dark:text-gray-200 hover:bg-pink-50 dark:hover:bg-gray-600"
              onClick={loadSales}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : (
                <RefreshCw size={16} className="mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Card */}
      <Card className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm border-pink-200 dark:border-pink-500/30 rounded-xl">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-500/10 dark:to-rose-500/10 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Total Sales
              </p>
              <p className="text-3xl font-bold text-pink-600 dark:text-pink-400">
                {sales.length}
              </p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-500/10 dark:to-emerald-500/10 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Total Revenue
              </p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                ${totalRevenue.toFixed(2)}
              </p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Average Sale
              </p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                $
                {sales.length > 0
                  ? (totalRevenue / sales.length).toFixed(2)
                  : "0.00"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      {error && (
        <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-500/30">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-700 dark:text-red-300">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-500/30">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-700 dark:text-green-300">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Sales Table */}
      <Card className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm border-pink-200 dark:border-pink-500/30 rounded-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-gray-700 dark:text-gray-200">
            Sales History
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            All your submitted voice note sales
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 size={32} className="animate-spin text-pink-600" />
            </div>
          ) : sales.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-pink-200 dark:border-pink-500/30">
                    <TableHead className="text-gray-700 dark:text-gray-300">
                      Model
                    </TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">
                      Voice Note
                    </TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">
                      Amount
                    </TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">
                      Status
                    </TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">
                      Sold Date
                    </TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">
                      Source
                    </TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300 text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow
                      key={sale.id}
                      className="border-pink-200 dark:border-pink-500/30 hover:bg-pink-50/50 dark:hover:bg-gray-700/50"
                    >
                      <TableCell className="text-gray-700 dark:text-gray-200 font-medium">
                        {sale.modelName}
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-300 max-w-xs">
                        <div
                          className="flex items-start gap-2"
                          title={sale.voiceNote}
                        >
                          <Volume2 size={14} className="mt-1 flex-shrink-0" />
                          <span>{truncateText(sale.voiceNote, 40)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-200 font-semibold">
                        ${sale.saleAmount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            sale.status === "Completed"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          }`}
                        >
                          {sale.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-300 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(sale.soldDate)}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-300 text-xs">
                        {sale.source || "Manual"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-white dark:bg-gray-700 border-pink-200 dark:border-pink-500/30 text-gray-700 dark:text-gray-200 hover:bg-pink-50 dark:hover:bg-gray-600"
                            onClick={() => handleEditClick(sale)}
                          >
                            <Edit2 size={14} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-white dark:bg-gray-700 border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-600"
                            onClick={() => handleDeleteClick(sale)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <DollarSign
                size={64}
                className="mx-auto mb-4 text-gray-400 dark:text-gray-500"
              />
              <p className="text-gray-600 dark:text-gray-300 text-lg font-medium mb-2">
                No sales yet
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Submit your first voice note sale in the History & Sales tab
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-white dark:bg-gray-800 border-pink-200 dark:border-pink-500/30">
          <DialogHeader>
            <DialogTitle className="text-gray-700 dark:text-gray-200">
              Edit Sale
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Update the sale amount and status
            </DialogDescription>
          </DialogHeader>
          {editingSale && (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-600 dark:text-gray-300">
                  Model Name
                </Label>
                <Input
                  value={editingSale.modelName}
                  disabled
                  className="bg-gray-100 dark:bg-gray-700 border-pink-200 dark:border-pink-500/30 text-gray-700 dark:text-gray-200 mt-2"
                />
              </div>
              <div>
                <Label className="text-gray-600 dark:text-gray-300">
                  Voice Note
                </Label>
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 border border-pink-200 dark:border-pink-500/30 rounded-lg text-gray-600 dark:text-gray-300 text-sm max-h-24 overflow-y-auto">
                  {editingSale.voiceNote}
                </div>
              </div>
              <div>
                <Label className="text-gray-600 dark:text-gray-300">
                  Sale Amount ($)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editedAmount}
                  onChange={(e) => setEditedAmount(e.target.value)}
                  className="bg-white dark:bg-gray-700 border-pink-200 dark:border-pink-500/30 text-gray-700 dark:text-gray-200 mt-2"
                />
              </div>
              <div>
                <Label className="text-gray-600 dark:text-gray-300">
                  Status
                </Label>
                <select
                  value={editedStatus}
                  onChange={(e) => setEditedStatus(e.target.value)}
                  className="w-full mt-2 px-3 py-2 bg-white dark:bg-gray-700 border border-pink-200 dark:border-pink-500/30 text-gray-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="bg-white dark:bg-gray-700 border-pink-200 dark:border-pink-500/30 text-gray-700 dark:text-gray-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={isUpdating}
              className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white"
            >
              {isUpdating ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white dark:bg-gray-800 border-pink-200 dark:border-pink-500/30">
          <DialogHeader>
            <DialogTitle className="text-gray-700 dark:text-gray-200">
              Delete Sale
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete this sale? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          {deletingSale && (
            <div className="space-y-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg">
              <p className="text-gray-700 dark:text-gray-200 font-medium">
                Model: {deletingSale.modelName}
              </p>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Amount: ${deletingSale.saleAmount.toFixed(2)}
              </p>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Date: {formatDate(deletingSale.soldDate)}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="bg-white dark:bg-gray-700 border-pink-200 dark:border-pink-500/30 text-gray-700 dark:text-gray-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Sale"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubmittedSalesTab;
