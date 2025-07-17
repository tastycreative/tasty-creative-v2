"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Plus,
  Download,
  Save,
  Edit,
  Check,
  X,
  Filter,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const voiceStatusOptions = ["NA", "ACTIVE", "UPLOADING", "PITCHED", "DECLINED"];
const accountTypeOptions = ["GMAIL", "ELEVENLABS"];

export default function VoiceGenAccountsPage() {
  const [accountsData, setAccountsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editValue, setEditValue] = useState("");
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const inputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Add custom CSS for line clamping
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Debounce search term
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // Wait 300ms after user stops typing

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Fetch accounts from API
  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append("search", debouncedSearchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await fetch(`/api/voice-gen-accounts?${params}`);
      const data = await response.json();
      setAccountsData(data);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  // Update account in database
  const updateAccount = async (id, field, value) => {
    try {
      const response = await fetch("/api/voice-gen-accounts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, [field]: value }),
      });

      if (response.ok) {
        // Update local state
        setAccountsData((prev) =>
          prev.map((account) =>
            account.id === id ? { ...account, [field]: value } : account
          )
        );
      }
    } catch (error) {
      console.error("Error updating account:", error);
    }
  };

  // Add new account
  const addNewRow = async () => {
    try {
      const response = await fetch("/api/voice-gen-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: "New Client",
          voiceStatus: "NA",
          accountType: "ELEVENLABS",
        }),
      });

      if (response.ok) {
        const newAccount = await response.json();
        setAccountsData((prev) => [newAccount, ...prev]); // Add to top
        // Auto-edit the client name
        setTimeout(() => {
          setEditingCell({ rowId: newAccount.id, field: "clientName" });
          setEditValue("New Client");
        }, 100);
      }
    } catch (error) {
      console.error("Error creating account:", error);
    }
  };

  // Delete single account
  const deleteAccount = async (id) => {
    try {
      const response = await fetch(`/api/voice-gen-accounts?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setAccountsData((prev) => prev.filter((account) => account.id !== id));
        setSelectedRows((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }
    } catch (error) {
      console.error("Error deleting account:", error);
    }
  };

  // Bulk delete accounts
  const bulkDeleteAccounts = async () => {
    try {
      const deletePromises = Array.from(selectedRows).map((id) =>
        fetch(`/api/voice-gen-accounts?id=${id}`, { method: "DELETE" })
      );

      await Promise.all(deletePromises);
      setAccountsData((prev) =>
        prev.filter((account) => !selectedRows.has(account.id))
      );
      setSelectedRows(new Set());
    } catch (error) {
      console.error("Error bulk deleting accounts:", error);
    }
  };

  // Handle row selection
  const toggleRowSelection = (id) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Select all rows
  const toggleSelectAll = () => {
    if (selectedRows.size === accountsData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(accountsData.map((account) => account.id)));
    }
  };

  const handleCellClick = (rowId, field, currentValue) => {
    setEditingCell({ rowId, field });
    setEditValue(currentValue || "");
  };

  const handleSaveCell = async () => {
    if (editingCell) {
      await updateAccount(editingCell.rowId, editingCell.field, editValue);
    }
    setEditingCell(null);
    setEditValue("");
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSaveCell();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  const exportData = () => {
    const dataToExport =
      selectedRows.size > 0
        ? accountsData.filter((account) => selectedRows.has(account.id))
        : accountsData;

    const csv = [
      [
        "Client Name",
        "Email",
        "Password",
        "Voice Status",
        "Account Type",
        "Data Folder",
        "Feedback",
        "Rating",
      ],
      ...dataToExport.map((account) => [
        account.clientName,
        account.email || "",
        account.password || "",
        account.voiceStatus,
        account.accountType,
        account.dataFolder || "",
        account.feedback || "",
        account.rating || "",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `voice-gen-accounts${selectedRows.size > 0 ? "-selected" : ""}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Fetch data on component mount and when filters change
  useEffect(() => {
    fetchAccounts();
    setSelectedRows(new Set()); // Clear selections when filters change
  }, [debouncedSearchTerm, statusFilter]); // Use debouncedSearchTerm instead of searchTerm

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current.tagName === "INPUT") {
        inputRef.current.select();
      }
    }
  }, [editingCell]);

  const renderCell = (account, field, displayName) => {
    const isEditing =
      editingCell?.rowId === account.id && editingCell?.field === field;
    const value = account[field];

    if (isEditing) {
      if (field === "voiceStatus") {
        return (
          <td className="px-3 py-2 text-sm border-b border-r border-gray-200">
            <div className="flex items-center gap-1">
              <select
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSaveCell}
                onKeyDown={handleKeyPress}
                className="w-full px-2 py-1 border border-blue-500 rounded text-xs"
              >
                {voiceStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "NA" ? "N/A" : option}
                  </option>
                ))}
              </select>
            </div>
          </td>
        );
      } else if (field === "accountType") {
        return (
          <td className="px-3 py-2 text-sm border-b border-r border-gray-200">
            <div className="flex items-center gap-1">
              <select
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSaveCell}
                onKeyDown={handleKeyPress}
                className="w-full px-2 py-1 border border-blue-500 rounded text-xs"
              >
                {accountTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "ELEVENLABS" ? "ElevenLabs" : option}
                  </option>
                ))}
              </select>
            </div>
          </td>
        );
      } else if (field === "feedback") {
        return (
          <td className="px-3 py-2 text-sm border-b border-r border-gray-200">
            <div className="flex items-start gap-1">
              <textarea
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSaveCell}
                onKeyDown={(e) => {
                  if (e.key === "Escape") handleCancelEdit();
                  // Don't close on Enter for textarea, only on Ctrl+Enter
                  if (e.key === "Enter" && e.ctrlKey) handleSaveCell();
                }}
                className="w-full px-2 py-1 border border-blue-500 rounded text-xs resize-none"
                rows={2}
                placeholder="Enter feedback..."
              />
              <div className="flex flex-col gap-1 mt-1">
                <button
                  onClick={handleSaveCell}
                  className="text-green-600 hover:text-green-800"
                >
                  <Check size={12} />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="text-red-600 hover:text-red-800"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          </td>
        );
      } else {
        return (
          <td className="px-3 py-2 text-sm border-b border-r border-gray-200">
            <div className="flex items-center gap-1">
              <input
                ref={inputRef}
                type={field === "email" ? "email" : "text"}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSaveCell}
                onKeyDown={handleKeyPress}
                className="w-full px-2 py-1 border border-blue-500 rounded text-xs"
                placeholder={field === "email" ? "email@example.com" : ""}
              />
              <button
                onClick={handleSaveCell}
                className="text-green-600 hover:text-green-800 flex-shrink-0"
              >
                <Check size={12} />
              </button>
              <button
                onClick={handleCancelEdit}
                className="text-red-600 hover:text-red-800 flex-shrink-0"
              >
                <X size={12} />
              </button>
            </div>
          </td>
        );
      }
    }

    let cellContent = value || "";
    let cellClass =
      "px-3 py-2 text-xs cursor-pointer hover:bg-blue-50 border-b border-r border-gray-200";

    // Special styling for different fields
    if (field === "clientName") {
      cellClass =
        "px-3 py-2 text-sm font-medium cursor-pointer hover:bg-blue-50 border-b border-r border-gray-200";
      cellContent = (
        <div className="truncate max-w-[120px]" title={value}>
          {value}
        </div>
      );
    } else if (field === "email") {
      cellContent = (
        <div className="truncate max-w-[180px]" title={value}>
          {value}
        </div>
      );
    } else if (field === "password") {
      cellContent = value ? (
        <div className="font-mono text-xs truncate max-w-[90px]" title={value}>
          {value}
        </div>
      ) : (
        <span className="text-gray-400 text-xs">No password</span>
      );
    } else if (field === "voiceStatus") {
      const statusColors = {
        ACTIVE: "bg-green-100 text-green-800 border-green-200",
        UPLOADING: "bg-yellow-100 text-yellow-800 border-yellow-200",
        PITCHED: "bg-blue-100 text-blue-800 border-blue-200",
        DECLINED: "bg-red-100 text-red-800 border-red-200",
        NA: "bg-gray-100 text-gray-600 border-gray-200",
      };
      cellClass += ` ${statusColors[value] || "bg-gray-100 text-gray-600"}`;
      cellContent = (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[value]}`}
        >
          {value === "NA" ? "N/A" : value}
        </span>
      );
    } else if (field === "accountType") {
      const typeColors = {
        GMAIL: "bg-blue-100 text-blue-800",
        ELEVENLABS: "bg-purple-100 text-purple-800",
      };
      const displayName = value === "ELEVENLABS" ? "ElevenLabs" : value;
      cellContent = (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${typeColors[value] || "bg-gray-100 text-gray-600"}`}
        >
          {displayName}
        </span>
      );
    } else if (field === "dataFolder") {
      if (value && value !== "N/A" && value !== "link drive") {
        cellContent = (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-xs"
            onClick={(e) => e.stopPropagation()}
            title="Open Google Drive folder"
          >
            📁 Drive
          </a>
        );
      } else {
        cellContent = <span className="text-gray-400 text-xs">No folder</span>;
      }
    } else if (field === "rating") {
      if (value) {
        cellClass += " font-semibold text-orange-600";
        cellContent = (
          <div className="flex items-center gap-1">
            <span className="text-xs">⭐</span>
            <span className="text-xs">{value}</span>
          </div>
        );
      } else {
        cellContent = <span className="text-gray-400 text-xs">No rating</span>;
      }
    } else if (field === "feedback") {
      if (value) {
        cellContent = (
          <div
            className="text-xs leading-relaxed max-w-[150px] line-clamp-2 cursor-pointer hover:bg-blue-50 p-1 rounded"
            title={value}
            onClick={(e) => {
              e.stopPropagation();
              handleCellClick(account.id, field, value);
            }}
          >
            {value}
          </div>
        );
      } else {
        cellContent = (
          <span className="text-gray-400 text-xs">No feedback</span>
        );
      }
    }

    return (
      <td
        className={cellClass}
        onClick={() => handleCellClick(account.id, field, value)}
        title={field === "feedback" ? value : undefined}
      >
        {cellContent}
      </td>
    );
  };

  if (loading && accountsData.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-8">
          <p className="text-gray-500">Loading accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Voice Gen Accounts
          </h1>
          <p className="text-sm text-gray-600">
            Click on any cell to edit • Ctrl+Enter to save feedback • Use
            checkboxes for bulk operations
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedRows.size > 0 && (
            <>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm("bulk")}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete ({selectedRows.size})
              </Button>
              <div className="w-px h-6 bg-gray-300" />
            </>
          )}
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV {selectedRows.size > 0 && `(${selectedRows.size})`}
          </Button>
          <Button size="sm" onClick={addNewRow}>
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              {searchTerm !== debouncedSearchTerm && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="UPLOADING">Uploading</option>
              <option value="PITCHED">Pitched</option>
              <option value="DECLINED">Declined</option>
              <option value="NA">N/A</option>
            </select>
          </div>
        </div>
      </div>

      {/* Excel-like Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading && accountsData.length > 0 && (
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              Searching...
            </div>
          </div>
        )}
        <div className="w-full">
          <table className="w-full border-collapse table-fixed">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-2 py-3 text-left border-b border-r border-gray-200 w-8">
                  <input
                    type="checkbox"
                    checked={
                      selectedRows.size === accountsData.length &&
                      accountsData.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r border-gray-200 w-32">
                  Client Name
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r border-gray-200 w-48">
                  Email
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r border-gray-200 w-24">
                  Password
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r border-gray-200 w-24">
                  Status
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r border-gray-200 w-28">
                  Type
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r border-gray-200 w-20">
                  Drive
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r border-gray-200 w-40">
                  Feedback
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r border-gray-200 w-16">
                  Rating
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-12">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {accountsData.map((account, index) => (
                <tr
                  key={account.id}
                  className={`hover:bg-gray-50 ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-25"
                  } ${selectedRows.has(account.id) ? "bg-blue-50" : ""}`}
                >
                  <td className="px-2 py-2 border-b border-r border-gray-200">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(account.id)}
                      onChange={() => toggleRowSelection(account.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  {renderCell(account, "clientName")}
                  {renderCell(account, "email")}
                  {renderCell(account, "password")}
                  {renderCell(account, "voiceStatus")}
                  {renderCell(account, "accountType")}
                  {renderCell(account, "dataFolder")}
                  {renderCell(account, "feedback")}
                  {renderCell(account, "rating")}
                  <td className="px-2 py-2 text-sm border-b border-gray-200">
                    <button
                      onClick={() => setShowDeleteConfirm(account.id)}
                      className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                      title="Delete account"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {accountsData.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-500">
              No accounts found matching your criteria.
            </p>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <p>
          Showing {accountsData.length} account
          {accountsData.length !== 1 ? "s" : ""}
          {(debouncedSearchTerm || statusFilter !== "all") && " (filtered)"}
          {selectedRows.size > 0 && ` • ${selectedRows.size} selected`}
        </p>
        <p>
          Click any cell to edit • Hover over truncated text for full content
        </p>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Confirm Delete
            </h3>
            <p className="text-gray-600 mb-4">
              {showDeleteConfirm === "bulk"
                ? `Are you sure you want to delete ${selectedRows.size} selected accounts? This action cannot be undone.`
                : "Are you sure you want to delete this account? This action cannot be undone."}
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (showDeleteConfirm === "bulk") {
                    bulkDeleteAccounts();
                  } else {
                    deleteAccount(showDeleteConfirm);
                  }
                  setShowDeleteConfirm(null);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
