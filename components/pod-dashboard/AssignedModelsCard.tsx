"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Users } from "lucide-react"

const assignedModels = [
  { name: "Luna_Dreams", creator: "Jake (Creator)", avatar: "L", color: "bg-orange-500" },
  { name: "Sophia_Blaze", creator: "Vanessa (Creator)", avatar: "S", color: "bg-purple-500" },
  { name: "Maya_Rose", creator: "Jake (Creator)", avatar: "M", color: "bg-green-500" },
  { name: "Emma_Starr", creator: "Sarah (Analyst)", avatar: "E", color: "bg-orange-500" },
]

export function AssignedModelsCard() {
  return (
    <Card className="bg-slate-900/70 border border-white/10 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-pink-400" />
          <CardTitle className="text-sm text-pink-400">Assigned Models ({assignedModels.length})</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {assignedModels.map((model) => (
          <div key={model.name} className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className={`${model.color} text-white text-sm`}>
                {model.avatar}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-medium text-white">{model.name}</div>
              <div className="text-xs text-gray-400">{model.creator}</div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}