"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Clock,
  Star,
  DollarSign,
  Save,
  Trash2,
  Plus,
  ChevronDown,
  Bookmark,
  Sparkles,
  RefreshCw,
  X,
} from "lucide-react";
import { FilterState } from "@/types/gallery";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// Saved preset type
export interface SavedFilterPreset {
  id: string;
  name: string;
  description?: string;
  filters: Partial<FilterState>;
  isDefault?: boolean;
  createdAt: string;
  icon?: string;
}

// Default presets (built-in)
const DEFAULT_PRESETS: SavedFilterPreset[] = [
  {
    id: "top-performers",
    name: "Top Performers",
    description: "High revenue & good outcomes",
    filters: {
      sortBy: "revenue",
      outcome: "Good",
      revenue: "50",
    },
    isDefault: true,
    createdAt: new Date().toISOString(),
    icon: "trending",
  },
  {
    id: "recent-good",
    name: "Recent Good",
    description: "Latest successful content",
    filters: {
      sortBy: "recent",
      outcome: "Good",
    },
    isDefault: true,
    createdAt: new Date().toISOString(),
    icon: "clock",
  },
  {
    id: "ready-for-rotation",
    name: "Ready for Rotation",
    description: "PTR content ready to send",
    filters: {
      sortBy: "revenue",
      outcome: "all",
    },
    isDefault: true,
    createdAt: new Date().toISOString(),
    icon: "refresh",
  },
  {
    id: "best-roi",
    name: "Best ROI",
    description: "Best return on investment",
    filters: {
      sortBy: "success-rate",
      outcome: "Good",
    },
    isDefault: true,
    createdAt: new Date().toISOString(),
    icon: "star",
  },
];

// Local storage key
const STORAGE_KEY = "gallery-filter-presets";

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  trending: TrendingUp,
  clock: Clock,
  star: Star,
  dollar: DollarSign,
  refresh: RefreshCw,
  bookmark: Bookmark,
  sparkles: Sparkles,
};

interface FilterPresetsProps {
  onApplyPreset: (filters: Partial<FilterState>) => void;
  currentFilters?: FilterState;
  className?: string;
}

const FilterPresets: React.FC<FilterPresetsProps> = ({
  onApplyPreset,
  currentFilters,
  className = "",
}) => {
  const [savedPresets, setSavedPresets] = useState<SavedFilterPreset[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [newPresetDescription, setNewPresetDescription] = useState("");
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Load saved presets from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSavedPresets(parsed);
      } catch (e) {
        console.error("Failed to parse saved presets:", e);
      }
    }
  }, []);

  // Save presets to localStorage
  const saveToStorage = (presets: SavedFilterPreset[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    setSavedPresets(presets);
  };

  // Save current filters as new preset
  const handleSavePreset = () => {
    if (!newPresetName.trim()) {
      toast.error("Please enter a preset name");
      return;
    }

    if (!currentFilters) {
      toast.error("No filters to save");
      return;
    }

    const newPreset: SavedFilterPreset = {
      id: `custom-${Date.now()}`,
      name: newPresetName.trim(),
      description: newPresetDescription.trim() || undefined,
      filters: { ...currentFilters },
      isDefault: false,
      createdAt: new Date().toISOString(),
      icon: "bookmark",
    };

    saveToStorage([...savedPresets, newPreset]);
    setShowSaveDialog(false);
    setNewPresetName("");
    setNewPresetDescription("");
    toast.success(`Preset "${newPreset.name}" saved`);
  };

  // Delete a custom preset
  const handleDeletePreset = (id: string) => {
    const preset = savedPresets.find((p) => p.id === id);
    if (preset?.isDefault) {
      toast.error("Cannot delete default presets");
      return;
    }

    const updated = savedPresets.filter((p) => p.id !== id);
    saveToStorage(updated);
    toast.success("Preset deleted");
  };

  // Apply a preset
  const handleApplyPreset = (preset: SavedFilterPreset) => {
    setActivePresetId(preset.id);
    onApplyPreset(preset.filters);
  };

  // Get icon component for preset
  const getIcon = (iconName?: string) => {
    if (!iconName) return Bookmark;
    return iconMap[iconName] || Bookmark;
  };

  // Combine default and saved presets
  const allPresets = [...DEFAULT_PRESETS, ...savedPresets];
  const customPresets = savedPresets.filter((p) => !p.isDefault);

  // Preset color mapping
  const getPresetColors = (index: number, isDefault: boolean) => {
    const colors = [
      {
        bgColor: "bg-green-50 dark:bg-green-900/10 hover:bg-green-100 dark:hover:bg-green-900/20",
        textColor: "text-green-700 dark:text-green-300",
        activeRing: "ring-green-500",
      },
      {
        bgColor: "bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20",
        textColor: "text-blue-700 dark:text-blue-300",
        activeRing: "ring-blue-500",
      },
      {
        bgColor: "bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20",
        textColor: "text-amber-700 dark:text-amber-300",
        activeRing: "ring-amber-500",
      },
      {
        bgColor: "bg-purple-50 dark:bg-purple-900/10 hover:bg-purple-100 dark:hover:bg-purple-900/20",
        textColor: "text-purple-700 dark:text-purple-300",
        activeRing: "ring-purple-500",
      },
    ];

    if (!isDefault) {
      return {
        bgColor: "bg-pink-50 dark:bg-pink-900/10 hover:bg-pink-100 dark:hover:bg-pink-900/20",
        textColor: "text-pink-700 dark:text-pink-300",
        activeRing: "ring-pink-500",
      };
    }

    return colors[index % colors.length];
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Quick Access Presets */}
      <div className="flex flex-wrap items-center gap-2">
        {DEFAULT_PRESETS.slice(0, 4).map((preset, index) => {
          const IconComponent = getIcon(preset.icon);
          const colors = getPresetColors(index, true);
          const isActive = activePresetId === preset.id;

          return (
            <Button
              key={preset.id}
              variant="outline"
              size="sm"
              onClick={() => handleApplyPreset(preset)}
              className={cn(
                colors.bgColor,
                colors.textColor,
                "border-0 transition-all duration-200 hover:scale-105 hover:shadow-md h-auto py-2 px-3",
                isActive && `ring-2 ${colors.activeRing} ring-offset-2`
              )}
            >
              <IconComponent className="w-4 h-4 mr-2 flex-shrink-0" />
              <div className="flex flex-col items-start">
                <span className="font-semibold text-sm">{preset.name}</span>
                {preset.description && (
                  <span className="text-xs opacity-75">{preset.description}</span>
                )}
              </div>
            </Button>
          );
        })}

        {/* More Presets Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-auto py-2 px-3 border-gray-200 dark:border-gray-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="font-medium">More</span>
              <ChevronDown className="w-3.5 h-3.5 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {customPresets.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                  My Presets
                </div>
                {customPresets.map((preset) => {
                  const IconComponent = getIcon(preset.icon);
                  return (
                    <DropdownMenuItem
                      key={preset.id}
                      className="flex items-center justify-between cursor-pointer"
                      onSelect={() => handleApplyPreset(preset)}
                    >
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4 text-pink-500" />
                        <span>{preset.name}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePreset(preset.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={() => setShowSaveDialog(true)}
            >
              <Save className="w-4 h-4 mr-2 text-emerald-500" />
              <span>Save Current Filters</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear Active Preset */}
        {activePresetId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActivePresetId(null)}
            className="h-8 px-2 text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Save Preset Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="w-5 h-5 text-emerald-500" />
              Save Filter Preset
            </DialogTitle>
            <DialogDescription>
              Save your current filter configuration for quick access later.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="preset-name">Preset Name</Label>
              <Input
                id="preset-name"
                placeholder="My Custom Filter"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="preset-description">Description (optional)</Label>
              <Input
                id="preset-description"
                placeholder="What does this filter show?"
                value={newPresetDescription}
                onChange={(e) => setNewPresetDescription(e.target.value)}
                className="h-10"
              />
            </div>
            {currentFilters && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-1">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Current Filter Settings:
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-0.5">
                  {currentFilters.category !== "all" && (
                    <div>Category: {currentFilters.category}</div>
                  )}
                  {currentFilters.creator !== "all" && (
                    <div>Creator: {currentFilters.creator}</div>
                  )}
                  {currentFilters.outcome !== "all" && (
                    <div>Outcome: {currentFilters.outcome}</div>
                  )}
                  {currentFilters.sortBy && (
                    <div>Sort: {currentFilters.sortBy}</div>
                  )}
                  {currentFilters.dataSource !== "all" && (
                    <div>Source: {currentFilters.dataSource}</div>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSavePreset}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FilterPresets;
