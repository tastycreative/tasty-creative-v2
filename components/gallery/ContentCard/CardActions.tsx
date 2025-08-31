'use client';

import React from 'react';
import { Heart, Package, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CardActionsProps } from '@/types/gallery';
import { cn } from '@/lib/utils';

const CardActions: React.FC<CardActionsProps> = ({
  content,
  onToggleFavorite,
  onTogglePTR,
  onMarkPTRAsSent
}) => {

  return (
    <div className="flex items-center gap-1">
      <TooltipProvider>
        {/* Favorite Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "p-1.5 h-8 w-8 transition-all duration-200 bg-black/40 hover:bg-black/50 backdrop-blur-sm rounded-full",
                content.isFavorite 
                  ? "text-red-400 hover:text-red-300" 
                  : "text-white hover:text-red-400"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              aria-label={content.isFavorite ? "Remove from favorites" : "Add to favorites"}
              aria-pressed={content.isFavorite}
            >
              <Heart 
                className={cn(
                  "w-4 h-4 transition-all",
                  content.isFavorite && "fill-current"
                )} 
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{content.isFavorite ? 'Remove from favorites' : 'Add to favorites'}</p>
          </TooltipContent>
        </Tooltip>

        {/* PTR Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "p-1.5 h-8 w-8 transition-all duration-200 bg-black/40 hover:bg-black/50 backdrop-blur-sm rounded-full",
                content.isPTR 
                  ? "text-purple-300 hover:text-purple-200" 
                  : "text-white hover:text-purple-300"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onTogglePTR();
              }}
              aria-label={content.isPTR ? "Remove from PTR" : "Mark as PTR"}
              aria-pressed={content.isPTR}
            >
              <Package 
                className={cn(
                  "w-4 h-4 transition-all",
                  content.isPTR && "fill-current"
                )} 
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{content.isPTR ? 'Remove from PTR' : 'Mark as Priority Tape Release'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Mark PTR as Sent Button (only show if item is PTR) */}
        {content.isPTR && onMarkPTRAsSent && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "p-1.5 h-8 w-8 transition-all duration-200 bg-black/40 hover:bg-black/50 backdrop-blur-sm rounded-full",
                  content.ptrSent 
                    ? "text-green-300 hover:text-green-200" 
                    : "text-white hover:text-blue-300"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkPTRAsSent();
                }}
                aria-label={content.ptrSent ? "PTR already sent" : "Mark PTR as sent"}
                disabled={content.ptrSent}
              >
                {content.ptrSent ? (
                  <CheckCircle className="w-4 h-4 fill-current" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {content.ptrSent ? (
                <div>
                  <p>PTR sent</p>
                  {content.dateMarkedSent && (
                    <p className="text-xs text-gray-400">
                      {new Date(content.dateMarkedSent).toLocaleDateString()}
                    </p>
                  )}
                  {content.markedBy && (
                    <p className="text-xs text-gray-400">by {content.markedBy}</p>
                  )}
                </div>
              ) : (
                <p>Mark PTR as sent</p>
              )}
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
};

export default CardActions;