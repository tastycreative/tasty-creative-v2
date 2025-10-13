"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WhatsNewButtonProps {
  onClick: () => void;
  showBadge?: boolean;
}

export function WhatsNewButton({ onClick, showBadge = false }: WhatsNewButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            className="relative"
            aria-label="What's new in POD-NEW"
          >
            <Sparkles className="h-5 w-5 text-pink-600 dark:text-pink-400" />
            {showBadge && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-gradient-to-r from-pink-500 to-purple-500 items-center justify-center">
                  <span className="text-[9px] font-bold text-white">NEW</span>
                </span>
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-semibold">What's New in POD-NEW</p>
          <p className="text-xs text-gray-500">Click to see the latest features</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
