
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, User, Calendar, MessageSquare } from "lucide-react";

interface Request {
  timestamp: string;
  user: string;
  requestedBy: string;
  model: string;
  sextingSet: string;
  specialRequest: string;
}

interface SWDRequestsTabProps {
  requests: Request[];
}

export const SWDRequestsTab = ({ requests }: SWDRequestsTabProps) => {
  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timestamp;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 to-cyan-900/10"></div>
        <CardHeader className="relative text-center">
          <CardTitle className="text-white flex items-center justify-center gap-3 text-2xl">
            <div className="p-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            Script Requests
            <div className="p-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
          </CardTitle>
          <p className="text-gray-400">
            Manage and review all script requests from the team
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
              {requests.length} Total Requests
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Requests Table Card */}
      <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableCaption className="text-gray-400 pb-4">
                Complete list of script requests with details
              </TableCaption>
              <TableHeader>
                <TableRow className="border-gray-800 hover:bg-gray-800/30">
                  <TableHead className="text-gray-300 font-semibold">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Timestamp
                    </div>
                  </TableHead>
                  <TableHead className="text-gray-300 font-semibold">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      User
                    </div>
                  </TableHead>
                  <TableHead className="text-gray-300 font-semibold">Requested By</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Model</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Sexting Set</TableHead>
                  <TableHead className="text-gray-300 font-semibold">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Special Request
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-gray-800/50 rounded-full">
                          <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-300">No requests found</h3>
                        <p className="text-gray-500">No script requests have been submitted yet.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((request, index) => (
                    <TableRow 
                      key={index} 
                      className="border-gray-800 hover:bg-gray-800/30 transition-colors"
                    >
                      <TableCell className="font-medium text-gray-300">
                        <div className="text-sm">
                          {formatDate(request.timestamp)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <div className="text-white font-medium truncate">
                            {request.user.split('(')[0].trim()}
                          </div>
                          {request.user.includes('(') && (
                            <div className="text-xs text-gray-400 truncate">
                              {request.user.match(/\((.*?)\)/)?.[1]}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                          {request.requestedBy}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                          {request.model}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                          {request.sextingSet}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[300px]">
                          {request.specialRequest && request.specialRequest.trim() && request.specialRequest !== 'none' ? (
                            <div className="p-2 bg-gray-800/50 rounded-lg border border-gray-700">
                              <p className="text-sm text-gray-300 whitespace-pre-wrap break-words">
                                {request.specialRequest}
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-500 italic text-sm">No special requests</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
