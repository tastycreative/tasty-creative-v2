"use client";

import React, { useState } from "react";
import { X, DollarSign, TrendingUp, Package, Calendar, Clock, FileText, Tag, User, Database, Link as LinkIcon, MessageSquare, Star, CheckCircle, Edit3, Save, XCircle, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { GalleryItem } from "@/types/gallery";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ContentDetailModalProps {
  content: GalleryItem;
  isOpen: boolean;
  onClose: () => void;
  onToggleFavorite?: () => void;
  onTogglePTR?: () => void;
  onMarkPTRAsSent?: () => void;
}

export default function ContentDetailModal({
  content,
  isOpen,
  onClose,
  onToggleFavorite,
  onTogglePTR,
  onMarkPTRAsSent,
}: ContentDetailModalProps) {
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<GalleryItem>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    performance: true,
    caption: true,
    rotation: true,
    scheduling: false,
    notes: false,
    metadata: false,
  });

  // Get media URL with fallback chain
  const mediaUrl = content.gifUrl || content.previewUrl || content.mediaUrl || content.thumbnailUrl || "/api/placeholder-image";

  // Check if it's a GIF
  const isGif = mediaUrl.toLowerCase().includes(".gif");

  // Check if it's a video
  const isVideo = mediaUrl.toLowerCase().match(/\.(mp4|mov|webm)$/);

  // Calculate ROI
  const roi = content.price > 0 ? (content.totalRevenue / content.price).toFixed(2) : "N/A";
  const isHighROI = content.price > 0 && content.totalRevenue / content.price > 10;

  // Format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Not available";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  // Handle edit mode toggle
  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset edited data
      setEditedData({});
      setIsEditing(false);
    } else {
      // Enter edit mode - initialize edited data
      setEditedData({
        captionText: content.captionText,
        notes: content.notes,
        price: content.price,
        category: content.category,
        outcome: content.outcome,
        contentStyle: content.contentStyle,
      });
      setIsEditing(true);
    }
  };

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/gallery-db/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: content.id,
          ...editedData,
        }),
      });

      if (!response.ok) throw new Error("Failed to save changes");

      // Optimistic update - apply changes locally
      Object.assign(content, editedData);

      setIsEditing(false);
      setEditedData({});

      // TODO: Show success toast notification
    } catch (error) {
      console.error("Failed to save changes:", error);
      // TODO: Show error toast notification
    } finally {
      setIsSaving(false);
    }
  };

  // Get current value (edited or original)
  const getCurrentValue = <K extends keyof GalleryItem>(key: K): GalleryItem[K] => {
    return (editedData[key] !== undefined ? editedData[key] : content[key]) as GalleryItem[K];
  };

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Collapsible section component
  const CollapsibleSection = ({
    id,
    title,
    icon: Icon,
    children,
    defaultOpen = true,
    iconColor = "text-blue-600 dark:text-blue-400",
    bgGradient = "from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20",
    borderColor = "border-blue-200 dark:border-blue-700"
  }: {
    id: keyof typeof expandedSections;
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
    defaultOpen?: boolean;
    iconColor?: string;
    bgGradient?: string;
    borderColor?: string;
  }) => {
    const isExpanded = expandedSections[id];

    return (
      <div className={cn(
        "bg-gradient-to-br rounded-xl border transition-all duration-200",
        bgGradient,
        borderColor,
        isEditing && isExpanded && "ring-2 ring-pink-500/50 shadow-lg"
      )}>
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 rounded-t-xl transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={cn("p-2 bg-white/60 dark:bg-black/20 rounded-xl shadow-sm", isExpanded && "scale-110 transition-transform")}>
              <Icon className={cn("w-5 h-5", iconColor)} />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
            {isEditing && isExpanded && (
              <Badge variant="outline" className="bg-pink-500/20 text-pink-600 dark:text-pink-400 border-pink-500/50 ml-2">
                <Sparkles className="w-3 h-3 mr-1" />
                Editing
              </Badge>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          )}
        </button>

        {isExpanded && (
          <>
            <Separator className="opacity-50" />
            <div className="p-5">
              {children}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "max-w-[95vw] lg:max-w-[85vw] xl:max-w-[1400px] max-h-[95vh] p-0",
          "bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950",
          "border-2 border-gray-200/50 dark:border-gray-700/50 shadow-2xl overflow-hidden"
        )}
      >
        {/* Fixed Header */}
        <div className="sticky top-0 z-50 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-blue-500/10 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="p-6 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-3xl font-black mb-3 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent leading-tight">
                  {content.title || content.contentStyle || "Content Details"}
                </DialogTitle>

                <DialogDescription className="sr-only">
                  Detailed view of content item including performance metrics, media, and editing capabilities
                </DialogDescription>

                {/* Status Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  {content.category && (
                    <Badge variant="secondary" className={cn(
                      "font-semibold shadow-sm",
                      content.category === "PTR" && "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
                      content.category === "Solo" && "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
                      content.category === "Group" && "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                    )}>
                      {content.category}
                    </Badge>
                  )}
                  {content.outcome && (
                    <Badge variant={content.outcome === "Good" ? "default" : "destructive"} className="font-semibold shadow-sm">
                      {content.outcome === "Good" ? "✓ Good" : "✗ Bad"} Outcome
                    </Badge>
                  )}
                  {content.isPTR && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 font-semibold shadow-sm">
                      <Package className="w-3 h-3 mr-1" />
                      PTR
                    </Badge>
                  )}
                  {content.ptrSent && (
                    <Badge variant="default" className="bg-green-600 text-white font-semibold shadow-sm">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Sent
                    </Badge>
                  )}
                  {isHighROI && (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 font-semibold shadow-sm">
                      🔥 High ROI
                    </Badge>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {!isEditing ? (
                  <Button
                    onClick={handleEditToggle}
                    size="default"
                    className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      size="default"
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      onClick={handleEditToggle}
                      disabled={isSaving}
                      variant="outline"
                      size="default"
                      className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="h-[calc(95vh-180px)]">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 p-6">
            {/* Left Column - Media Preview (2/5 width) */}
            <div className="lg:col-span-2 space-y-4">
              {/* Media Display */}
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 shadow-xl aspect-video group">
                {isVideo ? (
                  <video
                    src={mediaUrl}
                    controls
                    loop
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : isGif ? (
                  <img
                    src={mediaUrl}
                    alt={content.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image
                    src={mediaUrl}
                    alt={content.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 gap-2">
                {onToggleFavorite && (
                  <Button
                    onClick={onToggleFavorite}
                    variant={content.isFavorite ? "default" : "outline"}
                    size="lg"
                    className={cn(
                      "w-full justify-center shadow-sm hover:shadow-md transition-all duration-200",
                      content.isFavorite
                        ? "bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white"
                        : "hover:bg-rose-50 dark:hover:bg-rose-900/20"
                    )}
                  >
                    <Star className={cn("h-5 w-5 mr-2", content.isFavorite && "fill-current")} />
                    {content.isFavorite ? "Favorited" : "Add to Favorites"}
                  </Button>
                )}
                {onTogglePTR && (
                  <Button
                    onClick={onTogglePTR}
                    variant={content.isPTR ? "default" : "outline"}
                    size="lg"
                    className={cn(
                      "w-full justify-center shadow-sm hover:shadow-md transition-all duration-200",
                      content.isPTR
                        ? "bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
                        : "hover:bg-purple-50 dark:hover:bg-purple-900/20"
                    )}
                  >
                    <Package className="h-5 w-5 mr-2" />
                    {content.isPTR ? "PTR Active" : "Mark as PTR"}
                  </Button>
                )}
                {onMarkPTRAsSent && content.isPTR && !content.ptrSent && (
                  <Button
                    onClick={onMarkPTRAsSent}
                    size="lg"
                    className="w-full justify-center bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Mark as Sent
                  </Button>
                )}
              </div>

              {/* Media URLs Section */}
              {(content.gifUrl || content.previewUrl || content.mediaUrl || content.thumbnailUrl) && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Media URLs
                  </h4>
                  <div className="space-y-2 text-xs">
                    {content.gifUrl && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 block mb-0.5">GIF URL:</span>
                        <a href={content.gifUrl} target="_blank" rel="noopener noreferrer" className="block text-blue-600 dark:text-blue-400 hover:underline truncate font-mono">
                          {content.gifUrl}
                        </a>
                      </div>
                    )}
                    {content.previewUrl && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 block mb-0.5">Preview URL:</span>
                        <a href={content.previewUrl} target="_blank" rel="noopener noreferrer" className="block text-blue-600 dark:text-blue-400 hover:underline truncate font-mono">
                          {content.previewUrl}
                        </a>
                      </div>
                    )}
                    {content.mediaUrl && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 block mb-0.5">Media URL:</span>
                        <a href={content.mediaUrl} target="_blank" rel="noopener noreferrer" className="block text-blue-600 dark:text-blue-400 hover:underline truncate font-mono">
                          {content.mediaUrl}
                        </a>
                      </div>
                    )}
                    {content.thumbnailUrl && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 block mb-0.5">Thumbnail URL:</span>
                        <a href={content.thumbnailUrl} target="_blank" rel="noopener noreferrer" className="block text-blue-600 dark:text-blue-400 hover:underline truncate font-mono">
                          {content.thumbnailUrl}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Details (3/5 width) */}
            <div className="lg:col-span-3 space-y-4">
              {/* Basic Info Section */}
              <CollapsibleSection
                id="basic"
                title="Basic Information"
                icon={FileText}
                iconColor="text-blue-600 dark:text-blue-400"
                bgGradient="from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20"
                borderColor="border-blue-200 dark:border-blue-700"
              >
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-blue-600 dark:text-blue-400 font-medium min-w-[120px]">Title:</span>
                    <span className="text-blue-900 dark:text-blue-200 font-semibold text-right">{content.title || content.contentStyle || "Untitled"}</span>
                  </div>
                  {content.creatorName && (
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-blue-600 dark:text-blue-400 font-medium min-w-[120px]">Creator:</span>
                      <span className="text-blue-900 dark:text-blue-200 font-semibold">{content.creatorName}</span>
                    </div>
                  )}
                  {content.type && (
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-blue-600 dark:text-blue-400 font-medium min-w-[120px]">Type:</span>
                      <span className="text-blue-900 dark:text-blue-200 font-semibold">{content.type}</span>
                    </div>
                  )}
                  {content.messageType && (
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-blue-600 dark:text-blue-400 font-medium min-w-[120px]">Message Type:</span>
                      <span className="text-blue-900 dark:text-blue-200 font-semibold text-right">{content.messageType}</span>
                    </div>
                  )}

                  <Separator className="my-3" />

                  {/* Editable Category */}
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-blue-600 dark:text-blue-400 font-medium min-w-[120px]">Category:</span>
                    {isEditing ? (
                      <Select
                        value={getCurrentValue("category") || ""}
                        onValueChange={(value) => setEditedData({ ...editedData, category: value })}
                      >
                        <SelectTrigger className="w-[200px] bg-white dark:bg-gray-800 border-blue-300 dark:border-blue-600">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PTR">PTR</SelectItem>
                          <SelectItem value="Solo">Solo</SelectItem>
                          <SelectItem value="Group">Group</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-blue-900 dark:text-blue-200 font-semibold">{getCurrentValue("category") || "N/A"}</span>
                    )}
                  </div>

                  {/* Editable Outcome */}
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-blue-600 dark:text-blue-400 font-medium min-w-[120px]">Outcome:</span>
                    {isEditing ? (
                      <Select
                        value={getCurrentValue("outcome") || ""}
                        onValueChange={(value) => setEditedData({ ...editedData, outcome: value as "Good" | "Bad" })}
                      >
                        <SelectTrigger className="w-[200px] bg-white dark:bg-gray-800 border-blue-300 dark:border-blue-600">
                          <SelectValue placeholder="Select outcome" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Good">Good</SelectItem>
                          <SelectItem value="Bad">Bad</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-blue-900 dark:text-blue-200 font-semibold">{getCurrentValue("outcome") || "N/A"}</span>
                    )}
                  </div>

                  {/* Editable Content Style */}
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-blue-600 dark:text-blue-400 font-medium min-w-[120px]">Content Style:</span>
                    {isEditing ? (
                      <Input
                        value={getCurrentValue("contentStyle") || ""}
                        onChange={(e) => setEditedData({ ...editedData, contentStyle: e.target.value })}
                        className="w-[200px] bg-white dark:bg-gray-800 border-blue-300 dark:border-blue-600"
                        placeholder="Content style"
                      />
                    ) : (
                      <span className="text-blue-900 dark:text-blue-200 font-semibold">{getCurrentValue("contentStyle") || "N/A"}</span>
                    )}
                  </div>
                </div>
              </CollapsibleSection>

              {/* Performance Metrics Section */}
              <CollapsibleSection
                id="performance"
                title="Performance Metrics"
                icon={TrendingUp}
                iconColor="text-green-600 dark:text-green-400"
                bgGradient="from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20"
                borderColor="border-green-200 dark:border-green-700"
              >
                <div className="grid grid-cols-2 gap-4">
                  {/* Editable Price */}
                  <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-4 border border-green-200/50 dark:border-green-700/50">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium uppercase tracking-wide">Price</span>
                    </div>
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={getCurrentValue("price") || 0}
                        onChange={(e) => setEditedData({ ...editedData, price: parseFloat(e.target.value) || 0 })}
                        className="text-2xl font-black bg-white dark:bg-gray-800 border-green-300 dark:border-green-600"
                      />
                    ) : (
                      <p className="text-3xl font-black text-green-900 dark:text-green-200">${getCurrentValue("price").toFixed(2)}</p>
                    )}
                  </div>

                  <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-4 border border-emerald-200/50 dark:border-emerald-700/50">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wide">Revenue</span>
                    </div>
                    <p className={cn(
                      "text-3xl font-black",
                      content.totalRevenue > 0 ? "text-emerald-900 dark:text-emerald-200" : "text-gray-500 dark:text-gray-400"
                    )}>
                      {content.totalRevenue > 0 ? `$${content.totalRevenue.toFixed(2)}` : "No data"}
                    </p>
                  </div>

                  <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-4 border border-blue-200/50 dark:border-blue-700/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide">Purchases</span>
                    </div>
                    <p className="text-3xl font-black text-blue-900 dark:text-blue-200">{content.totalBuys || 0}</p>
                  </div>

                  <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-4 border border-purple-200/50 dark:border-purple-700/50">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs text-purple-600 dark:text-purple-400 font-medium uppercase tracking-wide">ROI</span>
                    </div>
                    <p className="text-3xl font-black text-purple-900 dark:text-purple-200">{roi}x</p>
                  </div>
                </div>
              </CollapsibleSection>

              {/* Caption Section */}
              {(content.captionText || isEditing) && (
                <CollapsibleSection
                  id="caption"
                  title="Full Caption"
                  icon={MessageSquare}
                  iconColor="text-purple-600 dark:text-purple-400"
                  bgGradient="from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20"
                  borderColor="border-purple-200 dark:border-purple-700"
                >
                  {isEditing ? (
                    <Textarea
                      value={getCurrentValue("captionText") || ""}
                      onChange={(e) => setEditedData({ ...editedData, captionText: e.target.value })}
                      className="min-h-[140px] bg-white dark:bg-gray-800 border-purple-300 dark:border-purple-600 text-sm leading-relaxed resize-none"
                      placeholder="Enter caption text..."
                    />
                  ) : (
                    <p className="text-sm text-purple-800 dark:text-purple-200 leading-relaxed whitespace-pre-wrap">
                      {getCurrentValue("captionText")}
                    </p>
                  )}
                  {content.captionStyle && (
                    <div className="mt-3">
                      <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                        Style: {content.captionStyle}
                      </Badge>
                    </div>
                  )}
                </CollapsibleSection>
              )}

              {/* PTR Rotation Details */}
              {(content.rotationStatus || content.daysSinceLastSent !== null || content.performanceHistory) && (
                <CollapsibleSection
                  id="rotation"
                  title="PTR Rotation Details"
                  icon={Package}
                  iconColor="text-amber-600 dark:text-amber-400"
                  bgGradient="from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20"
                  borderColor="border-amber-200 dark:border-amber-700"
                  defaultOpen={false}
                >
                  <div className="space-y-3 text-sm">
                    {content.rotationStatus && (
                      <div className="flex justify-between items-center">
                        <span className="text-amber-600 dark:text-amber-400 font-medium">Status:</span>
                        <Badge variant={
                          content.rotationStatus === "Active" ? "default" :
                          content.rotationStatus === "Ready" ? "secondary" :
                          "outline"
                        } className={cn(
                          content.rotationStatus === "Active" && "bg-green-600 text-white",
                          content.rotationStatus === "Ready" && "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                        )}>
                          {content.rotationStatus}
                        </Badge>
                      </div>
                    )}
                    {content.daysSinceLastSent !== null && (
                      <div className="flex justify-between">
                        <span className="text-amber-600 dark:text-amber-400 font-medium">Days Since Last Sent:</span>
                        <span className="text-amber-900 dark:text-amber-200 font-semibold">{content.daysSinceLastSent}</span>
                      </div>
                    )}
                    {content.isReadyForRotation !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-amber-600 dark:text-amber-400 font-medium">Ready for Rotation:</span>
                        <span className="text-amber-900 dark:text-amber-200 font-semibold">{content.isReadyForRotation ? "Yes ✓" : "No"}</span>
                      </div>
                    )}
                    {content.dateMarkedSent && (
                      <div className="flex justify-between">
                        <span className="text-amber-600 dark:text-amber-400 font-medium">Date Marked Sent:</span>
                        <span className="text-amber-900 dark:text-amber-200 font-semibold">{formatDate(content.dateMarkedSent)}</span>
                      </div>
                    )}
                    {content.markedBy && (
                      <div className="flex justify-between">
                        <span className="text-amber-600 dark:text-amber-400 font-medium">Marked By:</span>
                        <span className="text-amber-900 dark:text-amber-200 font-semibold">{content.markedBy}</span>
                      </div>
                    )}
                    {content.performanceHistory && content.performanceHistory.length > 0 && (
                      <>
                        <Separator className="my-3" />
                        <div>
                          <span className="text-amber-600 dark:text-amber-400 font-medium block mb-3">Performance History:</span>
                          <div className="space-y-2">
                            {content.performanceHistory.map((entry, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs bg-white/60 dark:bg-gray-800/60 rounded-lg px-3 py-2 border border-amber-200/50 dark:border-amber-700/50">
                                <span className="text-gray-600 dark:text-gray-400">{formatDate(entry.sentDate)}</span>
                                <Badge variant={
                                  entry.result === "good" ? "default" :
                                  entry.result === "bad" ? "destructive" :
                                  "outline"
                                } className="text-xs">
                                  {entry.result || "pending"}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CollapsibleSection>
              )}

              {/* Scheduling Section */}
              {(content.scheduleTab || content.scheduledDate || content.timePST) && (
                <CollapsibleSection
                  id="scheduling"
                  title="Scheduling Details"
                  icon={Calendar}
                  iconColor="text-cyan-600 dark:text-cyan-400"
                  bgGradient="from-cyan-50 to-sky-50 dark:from-cyan-900/20 dark:to-sky-900/20"
                  borderColor="border-cyan-200 dark:border-cyan-700"
                  defaultOpen={false}
                >
                  <div className="space-y-2 text-sm">
                    {content.scheduleTab && (
                      <div className="flex justify-between">
                        <span className="text-cyan-600 dark:text-cyan-400 font-medium">Schedule Tab:</span>
                        <span className="text-cyan-900 dark:text-cyan-200 font-semibold">{content.scheduleTab}</span>
                      </div>
                    )}
                    {content.scheduledDate && (
                      <div className="flex justify-between">
                        <span className="text-cyan-600 dark:text-cyan-400 font-medium">Scheduled Date:</span>
                        <span className="text-cyan-900 dark:text-cyan-200 font-semibold">{content.scheduledDate}</span>
                      </div>
                    )}
                    {content.timePST && (
                      <div className="flex justify-between">
                        <span className="text-cyan-600 dark:text-cyan-400 font-medium">Time (PST):</span>
                        <span className="text-cyan-900 dark:text-cyan-200 font-semibold">{content.timePST}</span>
                      </div>
                    )}
                  </div>
                </CollapsibleSection>
              )}

              {/* Notes Section */}
              {(content.notes || isEditing) && (
                <CollapsibleSection
                  id="notes"
                  title="Notes"
                  icon={FileText}
                  iconColor="text-yellow-600 dark:text-yellow-400"
                  bgGradient="from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20"
                  borderColor="border-yellow-200 dark:border-yellow-700"
                  defaultOpen={false}
                >
                  {isEditing ? (
                    <Textarea
                      value={getCurrentValue("notes") || ""}
                      onChange={(e) => setEditedData({ ...editedData, notes: e.target.value })}
                      className="min-h-[120px] bg-white dark:bg-gray-800 border-yellow-300 dark:border-yellow-600 text-sm leading-relaxed resize-none"
                      placeholder="Enter notes..."
                    />
                  ) : (
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 leading-relaxed whitespace-pre-wrap">
                      {getCurrentValue("notes")}
                    </p>
                  )}
                </CollapsibleSection>
              )}

              {/* Paywall Content Section */}
              {content.paywallContent && (
                <div className="bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/20 rounded-xl p-5 border border-rose-200 dark:border-rose-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-white/60 dark:bg-black/20 rounded-xl shadow-sm">
                      <Tag className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    </div>
                    <h3 className="font-semibold text-rose-900 dark:text-rose-100">Paywall Content</h3>
                  </div>
                  <p className="text-sm text-rose-800 dark:text-rose-200 leading-relaxed">
                    {content.paywallContent}
                  </p>
                </div>
              )}

              {/* Metadata Section */}
              <CollapsibleSection
                id="metadata"
                title="Metadata"
                icon={Database}
                iconColor="text-gray-600 dark:text-gray-400"
                bgGradient="from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50"
                borderColor="border-gray-200 dark:border-gray-700"
                defaultOpen={false}
              >
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Content ID:</span>
                    <span className="text-gray-900 dark:text-gray-200 font-mono text-xs">{content.id}</span>
                  </div>
                  {content.sheetRowId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Sheet Row ID:</span>
                      <span className="text-gray-900 dark:text-gray-200 font-mono text-xs">{content.sheetRowId}</span>
                    </div>
                  )}
                  {content.tableName && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Table Name:</span>
                      <span className="text-gray-900 dark:text-gray-200 font-mono text-xs">{content.tableName}</span>
                    </div>
                  )}
                  {content.usageCount !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Usage Count:</span>
                      <span className="text-gray-900 dark:text-gray-200 font-semibold">{content.usageCount}</span>
                    </div>
                  )}
                  {content.lastUsed && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Last Used:</span>
                      <span className="text-gray-900 dark:text-gray-200 font-semibold">{formatDate(content.lastUsed.toString())}</span>
                    </div>
                  )}
                  {content.dateAdded && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Date Added:</span>
                      <span className="text-gray-900 dark:text-gray-200 font-semibold">{formatDate(content.dateAdded)}</span>
                    </div>
                  )}
                </div>
              </CollapsibleSection>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
