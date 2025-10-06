"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tag,
  Plus,
  X,
  Edit,
  Trash2,
  Hash,
  Palette,
  Check,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useForumTags, useCreateTag } from "@/hooks/useForumTags";

interface TagManagerProps {
  modelId: string;
  onTagSelect?: (tagId: string) => void;
  selectedTags?: string[];
  mode?: "view" | "select" | "manage";
}

const colorPresets = [
  "#EF4444", // Red
  "#F97316", // Orange  
  "#EAB308", // Yellow
  "#22C55E", // Green
  "#06B6D4", // Cyan
  "#3B82F6", // Blue
  "#6366F1", // Indigo
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#64748B", // Slate
];

export function TagManager({
  modelId,
  onTagSelect,
  selectedTags = [],
  mode = "view",
}: TagManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#6366F1");
  const [showColorPicker, setShowColorPicker] = useState(false);

  const { data: tagsData, isLoading } = useForumTags(modelId);
  const createTag = useCreateTag();

  const tags = tagsData?.tags || [];

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      await createTag.mutateAsync({
        modelId,
        name: newTagName.trim(),
        color: newTagColor,
      });

      setNewTagName("");
      setNewTagColor("#6366F1");
      setIsCreating(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleTagClick = (tagId: string) => {
    if (mode === "select" && onTagSelect) {
      onTagSelect(tagId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-2">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-full animate-pulse"
            style={{ width: `${60 + i * 20}px` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tags Display */}
      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {tags.map((tag) => {
            const isSelected = selectedTags.includes(tag.id);
            return (
              <motion.div
                key={tag.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <Badge
                  variant={isSelected ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:scale-105",
                    mode === "select" && "hover:shadow-md",
                    isSelected && "ring-2 ring-offset-2 ring-purple-500"
                  )}
                  style={{
                    backgroundColor: isSelected ? tag.color : "transparent",
                    borderColor: tag.color,
                    color: isSelected ? "white" : tag.color,
                  }}
                  onClick={() => handleTagClick(tag.id)}
                >
                  <Hash className="w-3 h-3 mr-1" />
                  {tag.name}
                  {tag.threadCount > 0 && (
                    <span className="ml-1 text-xs opacity-75">
                      {tag.threadCount}
                    </span>
                  )}
                </Badge>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Create New Tag */}
        {mode === "manage" && (
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs border-dashed border-gray-300 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
              >
                <Plus className="w-3 h-3 mr-1" />
                New Tag
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-purple-600" />
                  Create New Tag
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleCreateTag} className="space-y-4">
                {/* Tag Name */}
                <div className="space-y-2">
                  <Label htmlFor="tag-name">Tag Name</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="tag-name"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="Enter tag name..."
                      className="pl-10"
                      maxLength={50}
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    {newTagName.length}/50 characters
                  </p>
                </div>

                {/* Color Picker */}
                <div className="space-y-2">
                  <Label>Tag Color</Label>
                  <div className="flex items-center gap-3">
                    <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-20 h-8 p-1"
                        >
                          <div
                            className="w-full h-full rounded border"
                            style={{ backgroundColor: newTagColor }}
                          />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3">
                        <div className="space-y-3">
                          <div className="grid grid-cols-5 gap-2">
                            {colorPresets.map((color) => (
                              <button
                                key={color}
                                type="button"
                                className={cn(
                                  "w-8 h-8 rounded border-2 transition-all",
                                  newTagColor === color
                                    ? "border-gray-900 dark:border-gray-100 scale-110"
                                    : "border-gray-300 dark:border-gray-600 hover:scale-105"
                                )}
                                style={{ backgroundColor: color }}
                                onClick={() => {
                                  setNewTagColor(color);
                                  setShowColorPicker(false);
                                }}
                              >
                                {newTagColor === color && (
                                  <Check className="w-4 h-4 text-white mx-auto" />
                                )}
                              </button>
                            ))}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="custom-color" className="text-sm">
                              Custom Color
                            </Label>
                            <Input
                              id="custom-color"
                              type="color"
                              value={newTagColor}
                              onChange={(e) => setNewTagColor(e.target.value)}
                              className="w-full h-8"
                            />
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>

                    {/* Preview */}
                    <Badge
                      style={{
                        backgroundColor: newTagColor,
                        color: "white",
                      }}
                      className="text-xs"
                    >
                      <Hash className="w-3 h-3 mr-1" />
                      {newTagName || "preview"}
                    </Badge>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreating(false)}
                    disabled={createTag.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!newTagName.trim() || createTag.isPending}
                    className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                  >
                    {createTag.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Tag className="w-4 h-4 mr-2" />
                        Create Tag
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Empty State */}
      {tags.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No tags created yet</p>
          {mode === "manage" && (
            <p className="text-xs mt-1 opacity-70">
              Create your first tag to organize discussions
            </p>
          )}
        </div>
      )}

      {/* Tag Statistics (for manage mode) */}
      {mode === "manage" && tags.length > 0 && (
        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <MessageSquare className="w-4 h-4" />
            <span>
              {tags.length} tag{tags.length !== 1 ? "s" : ""} •{" "}
              {tags.reduce((sum, tag) => sum + tag.threadCount, 0)} tagged threads
            </span>
          </div>
        </div>
      )}
    </div>
  );
}