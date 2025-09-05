"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ExternalLink,
  Loader2,
  ChevronDown,
  FileSpreadsheet,
  Users,
  Clock,
} from "lucide-react";
import { usePodData } from "@/lib/stores/podStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

interface SheetLinkGroup {
  name: string;
  links: Array<{ name: string; url: string }>;
  count: number;
  initials: string;
  color: string;
}

// Modern Google Sheets Icon Component
function SheetsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2Z"
        fill="currentColor"
        className="text-green-600"
      />
      <path
        d="M14 2V8H20L14 2Z"
        className="text-green-400"
        fill="currentColor"
      />
      <path
        d="M8 10V19H16V10H8ZM15 18H13V16H15V18ZM15 15H13V13H15V15ZM15 12H13V10H15V12ZM12 18H9V16H12V18ZM12 15H9V13H12V15ZM12 12H9V10H12V12Z"
        fill="white"
      />
    </svg>
  );
}

// Generate consistent colors for groups
const getGroupColor = (name: string): string => {
  const colors = [
    "bg-emerald-500",
    "bg-blue-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-indigo-500",
  ];
  const hash = name.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

export function SheetLinksCard() {
  const { podData, loading } = usePodData();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Enhanced smart grouping logic with modern patterns
  const groupedLinks = React.useMemo(() => {
    if (!podData?.sheetLinks || podData.sheetLinks.length === 0) {
      return [];
    }

    // Group by first word with enhanced metadata
    const smartGroups: Record<string, SheetLinkGroup> = {};

    podData.sheetLinks.forEach((link) => {
      // Extract the main group name (e.g., "Zoe", "Nika", "Others")
      const firstWord = link.name.split(/[\s|]/)[0].trim();

      if (!smartGroups[firstWord]) {
        smartGroups[firstWord] = {
          name: firstWord,
          links: [],
          count: 0,
          initials: firstWord.substring(0, 2).toUpperCase(),
          color: getGroupColor(firstWord),
        };
      }

      smartGroups[firstWord].links.push(link);
      smartGroups[firstWord].count++;
    });

    return Object.values(smartGroups).sort((a, b) => {
      // Sort: specific names first, then "Others" last
      if (a.name === "Others") return 1;
      if (b.name === "Others") return -1;
      return a.name.localeCompare(b.name);
    });
  }, [podData?.sheetLinks]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  const handleLinkClick = (url: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  if (loading && !podData) {
    return (
      <Card className="bg-slate-900/70 border border-white/10 shadow-sm">
        <CardHeader className="pb-4 pt-5">
          <div className="flex items-center gap-2.5">
            <SheetsIcon className="w-5 h-5" />
            <CardTitle className="text-sm text-green-400">
              Sheet Links
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/70 border border-white/10 shadow-sm overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <SheetsIcon className="w-5 h-5" />
            <CardTitle className="text-sm text-green-400">
              Sheet Links
            </CardTitle>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Users className="w-3 h-3" />
            <span>{groupedLinks.length}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-0 pb-0">
        {groupedLinks.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-12 px-6">
            <FileSpreadsheet className="w-8 h-8 mx-auto mb-3 text-gray-600" />
            <p>No sheet links available</p>
          </div>
        ) : (
          <div className="space-y-0">
            {groupedLinks.map((group, groupIndex) => {
              const isExpanded = expandedGroups.has(group.name);
              const hasMultipleLinks = group.links.length > 1;

              return (
                <div key={group.name}>
                  <Collapsible
                    open={isExpanded}
                    onOpenChange={() =>
                      hasMultipleLinks && toggleGroup(group.name)
                    }
                  >
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <CollapsibleTrigger
                          className={cn(
                            "w-full flex items-center gap-4 px-6 py-4",
                            "hover:bg-white/5 transition-all duration-200",
                            "focus:outline-none focus:bg-white/5",
                            !hasMultipleLinks && "cursor-default",
                            "group/trigger"
                          )}
                          disabled={!hasMultipleLinks}
                        >
                          <Avatar className="w-10 h-10 ring-2 ring-white/10">
                            <AvatarFallback
                              className={cn(
                                group.color,
                                "text-white text-sm font-medium"
                              )}
                            >
                              {group.initials}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-white group-hover/trigger:text-green-400 transition-colors">
                                {group.name}
                              </span>
                              {hasMultipleLinks && (
                                <ChevronDown
                                  className={cn(
                                    "h-3 w-3 text-gray-400 transition-all duration-200",
                                    "group-hover/trigger:text-green-400",
                                    isExpanded && "rotate-180"
                                  )}
                                />
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-400">
                                {group.count} sheet
                                {group.count !== 1 ? "s" : ""}
                              </span>
                              <Separator
                                orientation="vertical"
                                className="h-3 bg-white/10"
                              />
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-gray-500" />
                                <span className="text-xs text-gray-500">
                                  Active
                                </span>
                              </div>
                            </div>
                          </div>

                          <Badge
                            variant="secondary"
                            className="bg-green-500/20 text-green-400 hover:bg-green-500/20 border-0 font-medium min-w-[2rem] justify-center"
                          >
                            {group.count}
                          </Badge>
                        </CollapsibleTrigger>
                      </HoverCardTrigger>

                      <HoverCardContent
                        className="w-80 p-4 bg-slate-800 border-white/20"
                        side="right"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-12 h-12">
                              <AvatarFallback
                                className={cn(
                                  group.color,
                                  "text-white font-medium"
                                )}
                              >
                                {group.initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="text-sm font-semibold text-white">
                                {group.name}'s Sheets
                              </h4>
                              <p className="text-xs text-gray-400">
                                {group.count} active spreadsheet
                                {group.count !== 1 ? "s" : ""}
                              </p>
                            </div>
                          </div>
                          <Separator className="bg-white/10" />
                          <div className="space-y-2">
                            {group.links.slice(0, 3).map((link, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 text-xs"
                              >
                                <SheetsIcon className="w-3 h-3 text-green-400" />
                                <span className="text-gray-300 truncate">
                                  {link.name}
                                </span>
                              </div>
                            ))}
                            {group.links.length > 3 && (
                              <p className="text-xs text-gray-400">
                                +{group.links.length - 3} more sheets
                              </p>
                            )}
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>

                    {hasMultipleLinks && (
                      <CollapsibleContent
                        className={cn(
                          "overflow-hidden border-t border-white/5",
                          mounted &&
                            "animate-accordion-down data-[state=closed]:animate-accordion-up"
                        )}
                      >
                        <div className="bg-white/5">
                          {group.links.map((link, index) => (
                            <div
                              key={`${group.name}-${index}`}
                              className={cn(
                                "flex items-center gap-4 px-6 py-3 group/link",
                                "hover:bg-white/10 transition-colors",
                                index !== group.links.length - 1 &&
                                  "border-b border-white/5"
                              )}
                            >
                              <div className="w-2 h-8 flex items-center justify-center">
                                <div className="w-0.5 h-4 bg-white/20 rounded-full" />
                              </div>

                              <div className="w-8 h-8 rounded-md bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                <SheetsIcon className="w-4 h-4 text-green-400" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-300 truncate group-hover/link:text-white transition-colors">
                                  {link.name}
                                </p>
                              </div>

                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  "opacity-0 group-hover/link:opacity-100 transition-all duration-200",
                                  "bg-green-400 hover:text-green-400",
                                  "h-7 px-2"
                                )}
                                onClick={(e) => handleLinkClick(link.url, e)}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    )}
                  </Collapsible>

                  {groupIndex < groupedLinks.length - 1 && (
                    <Separator className="bg-white/10" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
