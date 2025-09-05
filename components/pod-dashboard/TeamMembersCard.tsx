"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users } from "lucide-react";

const teamMembers = [
  { name: "Jake", role: "Team Lead", avatar: "J", color: "bg-pink-500" },
  { name: "Vanessa", role: "Creator", avatar: "V", color: "bg-purple-500" },
  { name: "Sarah", role: "Analyst", avatar: "S", color: "bg-blue-500" },
];

export function TeamMembersCard() {
  return (
    <Card className="bg-slate-900/70 border border-white/10 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-pink-400" />
          <CardTitle className="text-sm text-pink-400">
            Team Members ({teamMembers.length})
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {teamMembers.map((member) => (
          <div key={member.name} className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className={`${member.color} text-white text-sm`}>
                {member.avatar}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-medium text-white">
                {member.name}
              </div>
              <div className="text-xs text-gray-400">({member.role})</div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
