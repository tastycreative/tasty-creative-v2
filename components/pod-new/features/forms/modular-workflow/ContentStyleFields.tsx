"use client";

import { UseFormRegister } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ModularFormData, ContentStyle } from "./types";

interface ContentStyleFieldsProps {
  contentStyle: ContentStyle;
  register: UseFormRegister<ModularFormData>;
}

export function ContentStyleFields({ contentStyle, register }: ContentStyleFieldsProps) {
  switch (contentStyle) {
    case "poll":
      return (
        <div className="space-y-4 p-4 bg-gradient-to-r from-green-50 to-cyan-50 dark:from-green-950 dark:to-cyan-950 rounded-lg border border-green-200 dark:border-green-800">
          <h4 className="font-semibold text-green-800 dark:text-green-200">Poll Configuration</h4>
          <div>
            <Label htmlFor="pollQuestion" className="block mb-2 font-medium">Poll Question</Label>
            <Input
              id="pollQuestion"
              placeholder="What would you like to see next?"
              {...register("pollQuestion")}
            />
          </div>
          <div>
            <Label htmlFor="pollOptions" className="block mb-2 font-medium">Poll Options (one per line)</Label>
            <Textarea
              id="pollOptions"
              placeholder="Option 1&#10;Option 2&#10;Option 3"
              {...register("pollOptions")}
              rows={4}
            />
          </div>
        </div>
      );

    case "game":
      return (
        <div className="space-y-4 p-4 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950 dark:to-rose-950 rounded-lg border border-pink-200 dark:border-pink-800">
          <h4 className="font-semibold text-pink-800 dark:text-pink-200">Game Configuration</h4>
          <div>
            <Label htmlFor="gameRules" className="block mb-2 font-medium">Game Rules</Label>
            <Textarea
              id="gameRules"
              placeholder="Describe how the game works..."
              {...register("gameRules")}
              rows={4}
            />
          </div>
          <div>
            <Label htmlFor="gameRewards" className="block mb-2 font-medium">Rewards</Label>
            <Input
              id="gameRewards"
              placeholder="What do winners get?"
              {...register("gameRewards")}
            />
          </div>
        </div>
      );

    case "livestream":
      return (
        <div className="space-y-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950 dark:to-pink-950 rounded-lg border border-red-200 dark:border-red-800">
          <h4 className="font-semibold text-red-800 dark:text-red-200">Livestream Configuration</h4>
          <div>
            <Label htmlFor="streamTitle" className="block mb-2 font-medium">Stream Title</Label>
            <Input
              id="streamTitle"
              placeholder="Your livestream title..."
              {...register("streamTitle")}
            />
          </div>
          <div>
            <Label htmlFor="streamDescription" className="block mb-2 font-medium">Stream Description</Label>
            <Textarea
              id="streamDescription"
              placeholder="Describe what viewers can expect..."
              {...register("streamDescription")}
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="scheduledTime" className="block mb-2 font-medium">Scheduled Time</Label>
            <Input
              id="scheduledTime"
              type="datetime-local"
              {...register("scheduledTime")}
            />
          </div>
        </div>
      );

    default:
      return null;
  }
}
