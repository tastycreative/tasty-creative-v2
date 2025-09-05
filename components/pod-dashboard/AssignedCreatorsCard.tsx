"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, Users, Crown, Sparkles } from "lucide-react";
import { usePodData } from "@/lib/stores/podStore";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

const getCreatorColor = (name: string, guaranteed?: boolean): string => {
  if (guaranteed) {
    return "bg-gradient-to-br from-yellow-400 to-orange-500";
  }

  const colors = [
    "bg-gradient-to-br from-pink-500 to-rose-500",
    "bg-gradient-to-br from-purple-500 to-indigo-500",
    "bg-gradient-to-br from-blue-500 to-cyan-500",
    "bg-gradient-to-br from-green-500 to-emerald-500",
    "bg-gradient-to-br from-orange-500 to-red-500",
    "bg-gradient-to-br from-violet-500 to-purple-500",
  ];

  const hash = name.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

const getInitials = (name: string): string => {
  return name
    .split(/[_\s]/)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

export function AssignedCreatorsCard() {
  const { podData, loading } = usePodData();

  const handleCreatorClick = (creator: any) => {
    console.log("Creator clicked:", creator);
  };

  if (loading && !podData) {
    return (
      <Card className="bg-slate-900/70 border border-white/10 shadow-sm">
        <CardHeader className="pb-4 pt-5">
          <div className="flex items-center gap-2.5">
            <Star className="w-5 h-5 text-pink-400" />
            <CardTitle className="text-sm text-pink-400">
              Assigned Creators
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  const creators = podData?.creators || [];
  const guaranteedCreators = creators.filter((c) => c.guaranteed);
  const regularCreators = creators.filter((c) => !c.guaranteed);

  return (
    <Card className="bg-slate-900/70 border border-white/10 shadow-sm overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Star className="w-5 h-5 text-pink-400" />
            <CardTitle className="text-sm text-pink-400">
              Assigned Creators
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {guaranteedCreators.length > 0 && (
              <Badge
                variant="secondary"
                className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20 border-0 font-medium"
              >
                <Crown className="w-3 h-3 mr-1" />
                {guaranteedCreators.length}
              </Badge>
            )}
            <Badge
              variant="secondary"
              className="bg-pink-500/20 text-pink-400 hover:bg-pink-500/20 border-0 font-medium min-w-[2rem] justify-center"
            >
              {creators.length}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-0 pb-0">
        {creators.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-12 px-6">
            <Users className="w-8 h-8 mx-auto mb-3 text-gray-600" />
            <p>No creators assigned</p>
          </div>
        ) : (
          <div className="space-y-0">
            {/* Guaranteed Creators First */}
            {guaranteedCreators.map((creator, index) => {
              const initials = getInitials(creator.name);
              const gradientColor = getCreatorColor(creator.name, true);

              return (
                <div key={creator.id || `guaranteed-${index}`}>
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <div
                        className={cn(
                          "w-full flex items-center gap-4 px-6 py-4",
                          "hover:bg-white/5 transition-all duration-200",
                          "cursor-pointer group/creator"
                        )}
                        onClick={() => handleCreatorClick(creator)}
                      >
                        <Avatar className="w-10 h-10 ring-2 ring-yellow-400/50">
                          <AvatarFallback
                            className={cn(
                              gradientColor,
                              "text-white text-sm font-bold"
                            )}
                          >
                            {initials}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white group-hover/creator:text-pink-400 transition-colors truncate">
                              {creator.name}
                            </span>
                            <Crown className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge
                              variant="secondary"
                              className="bg-yellow-500/20 text-yellow-400 border-0 text-xs font-medium"
                            >
                              Guaranteed
                            </Badge>
                            {creator.rowNumber && (
                              <span className="text-xs text-gray-500">
                                Row {creator.rowNumber}
                              </span>
                            )}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "opacity-0 group-hover/creator:opacity-100 transition-all duration-200",
                            "bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 hover:text-pink-300",
                            "h-7 px-2"
                          )}
                        >
                          <Sparkles className="h-3 w-3" />
                        </Button>
                      </div>
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
                                gradientColor,
                                "text-white font-bold"
                              )}
                            >
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                              {creator.name}
                              <Crown className="w-3 h-3 text-yellow-400" />
                            </h4>
                            <Badge
                              variant="secondary"
                              className="bg-yellow-500/20 text-yellow-400 border-0 text-xs mt-1"
                            >
                              Guaranteed Creator
                            </Badge>
                          </div>
                        </div>

                        <div className="h-px bg-white/10" />

                        <div className="text-xs text-gray-300">
                          <p>
                            This creator is guaranteed to be assigned to your
                            content.
                          </p>
                          {creator.rowNumber && (
                            <p className="mt-1 text-gray-400">
                              Sheet Row: {creator.rowNumber}
                            </p>
                          )}
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>

                  {(index < guaranteedCreators.length - 1 ||
                    regularCreators.length > 0) && (
                    <div className="h-px bg-white/10" />
                  )}
                </div>
              );
            })}

            {/* Regular Creators */}
            {regularCreators.map((creator, index) => {
              const initials = getInitials(creator.name);
              const gradientColor = getCreatorColor(creator.name, false);

              return (
                <div key={creator.id || `regular-${index}`}>
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <div
                        className={cn(
                          "w-full flex items-center gap-4 px-6 py-4",
                          "hover:bg-white/5 transition-all duration-200",
                          "cursor-pointer group/creator"
                        )}
                        onClick={() => handleCreatorClick(creator)}
                      >
                        <Avatar className="w-10 h-10 ring-2 ring-white/10">
                          <AvatarFallback
                            className={cn(
                              gradientColor,
                              "text-white text-sm font-medium"
                            )}
                          >
                            {initials}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white group-hover/creator:text-pink-400 transition-colors truncate">
                              {creator.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge
                              variant="secondary"
                              className="bg-gray-500/20 text-gray-400 border-0 text-xs font-medium"
                            >
                              Assigned
                            </Badge>
                            {creator.rowNumber && (
                              <span className="text-xs text-gray-500">
                                Row {creator.rowNumber}
                              </span>
                            )}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "opacity-0 group-hover/creator:opacity-100 transition-all duration-200",
                            "bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 hover:text-pink-300",
                            "h-7 px-2"
                          )}
                        >
                          <Star className="h-3 w-3" />
                        </Button>
                      </div>
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
                                gradientColor,
                                "text-white font-medium"
                              )}
                            >
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="text-sm font-semibold text-white">
                              {creator.name}
                            </h4>
                            <Badge
                              variant="secondary"
                              className="bg-gray-500/20 text-gray-400 border-0 text-xs mt-1"
                            >
                              Assigned Creator
                            </Badge>
                          </div>
                        </div>

                        <div className="h-px bg-white/10" />

                        <div className="text-xs text-gray-300">
                          <p>
                            This creator is assigned to your pod for content
                            creation.
                          </p>
                          {creator.rowNumber && (
                            <p className="mt-1 text-gray-400">
                              Sheet Row: {creator.rowNumber}
                            </p>
                          )}
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>

                  {index < regularCreators.length - 1 && (
                    <div className="h-px bg-white/10" />
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
