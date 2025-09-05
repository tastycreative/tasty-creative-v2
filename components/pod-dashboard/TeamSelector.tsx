"use client"

import React from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Settings, ChevronDown } from "lucide-react"

export function TeamSelector() {
  return (
    <div className="flex items-center gap-3">
      <Avatar className="w-10 h-10">
        <AvatarFallback className="bg-purple-500 text-white">T</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-white">Team #1</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
        <div className="text-sm text-gray-400">Team #1</div>
      </div>
      <Settings className="w-5 h-5 text-gray-400 cursor-pointer hover:text-white" />
    </div>
  )
}