"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { AlertTriangle, Info, Plus, X, Loader2, Paperclip, ChevronDown, ChevronUp } from "lucide-react";
import { useSession } from "next-auth/react";
import UserDropdown from "@/components/UserDropdown";
import CommentFilePreview, { type PreviewFile } from "@/components/ui/CommentFilePreview";
import AttachmentViewer from "@/components/ui/AttachmentViewer";
import { TaskAttachment } from "@/lib/stores/boardStore";
import { useStrikesQuery, useAddStrikeMutation, useDeleteStrikeMutation } from '@/hooks/useBoardQueries';

interface EditorStrike {
  id: string;
  editorName: string;
  editorEmail: string;
  editorImage?: string | null;
  strikes: number;
  reasons: {
    id: string;
    reason: string;
    date: string;
    createdAt: string;
    notes?: string;
    issuedBy: {
      name: string;
      email: string;
      image?: string | null;
    };
    attachments?: TaskAttachment[];
  }[];
}

interface StrikeSystemProps {
  teamId: string;
}

const STRIKE_RULES = [
  "Not completing the first submission for a video by the deadline indicated on the tracker.",
  "Not completing the first revisions for a video within 24 hours.",
  "Not applying the revision instructions correctly.",
  "If you are instructed to use Adobe Premiere Pro, Adobe Photoshop, Adobe After Effects.",
  "If you do not respond to a message by management within 60 minutes of being messaged while clocked in.",
];

export default function StrikeSystem({ teamId }: StrikeSystemProps) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'MODERATOR';
  
  const strikesQuery = useStrikesQuery(teamId);
  const addStrike = useAddStrikeMutation(teamId);
  const deleteStrike = useDeleteStrikeMutation(teamId);
  const [editorStrikes, setEditorStrikes] = useState<EditorStrike[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddStrikeModal, setShowAddStrikeModal] = useState(false);
  const [isAddingStrike, setIsAddingStrike] = useState(false);
  const [showStrikeRules, setShowStrikeRules] = useState(false);
  
  // Add Strike Form State
  const [selectedEditor, setSelectedEditor] = useState("");
  const [selectedEditorId, setSelectedEditorId] = useState("");
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [strikeNotes, setStrikeNotes] = useState("");
  const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  // Function to fetch strikes
  // Map strikes query to EditorStrike structure
  useEffect(() => {
    setIsLoading(strikesQuery.isLoading);
    if (strikesQuery.data?.strikes) {
      const grouped: Record<string, EditorStrike> = {};
      for (const strike of strikesQuery.data.strikes as any[]) {
        const userKey = strike.user.email;
        if (!grouped[userKey]) {
          grouped[userKey] = {
            id: strike.user.id,
            editorName: strike.user.name || strike.user.email,
            editorEmail: strike.user.email,
            editorImage: strike.user.image,
            strikes: 0,
            reasons: [],
          };
        }
        grouped[userKey].strikes += 1;
        grouped[userKey].reasons.push({
          id: strike.id,
          reason: strike.reason,
          date: new Date(strike.createdAt).toLocaleDateString(),
          createdAt: strike.createdAt,
          notes: strike.notes,
          issuedBy: {
            name: strike.issuedBy.name || strike.issuedBy.email,
            email: strike.issuedBy.email,
            image: strike.issuedBy.image,
          },
          attachments: strike.attachments ? JSON.parse(strike.attachments) : undefined,
        });
      }
      setEditorStrikes(Object.values(grouped));
    } else if (strikesQuery.isError) {
      setEditorStrikes([]);
    }
  }, [strikesQuery.data, strikesQuery.isLoading, strikesQuery.isError]);

  useEffect(() => {
    // Trigger refetch when team changes
    if (teamId) strikesQuery.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  const handleAddStrike = async () => {
    // Security check: only admins and moderators can add strikes
    if (!isAdmin) {
      alert("You don't have permission to add strikes");
      return;
    }

    if (!selectedEditorId || (!selectedReason && !customReason)) {
      alert("Please select an editor and provide a reason");
      return;
    }

    setIsAddingStrike(true);
    
    try {
      let uploadedAttachments: TaskAttachment[] = [];
      
      // Upload evidence files to S3 if any
      if (previewFiles.length > 0) {
        setIsUploadingFiles(true);
        
        for (const previewFile of previewFiles) {
          try {
            const formData = new FormData();
            formData.append('file', previewFile.file);

            const response = await fetch('/api/upload/s3', {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              throw new Error('Failed to upload file');
            }

            const { attachment } = await response.json();
            uploadedAttachments.push(attachment);
          } catch (error) {
            console.error('Error uploading file:', error);
            alert(`Failed to upload ${previewFile.file.name}. Please try again.`);
            setIsUploadingFiles(false);
            setIsAddingStrike(false);
            return;
          }
        }
        
        setIsUploadingFiles(false);
      }
      
      // TODO: API call to add strike
      // The API endpoint should:
      // 1. Create strike record in database
      // 2. Send email notification to user using sendStrikeNotificationEmail()
      // 3. Return updated strike count for the user
      const reason = selectedReason === "custom" ? customReason : STRIKE_RULES[parseInt(selectedReason)];
      
      // Call the API to add strike
  const result = await addStrike.mutateAsync({ userId: selectedEditorId, reason, notes: strikeNotes.trim() || null, attachments: uploadedAttachments });
      console.log('Strike added successfully:', result);
      
      // Show success message
      alert(`Strike added successfully! User now has ${result.userStrikeCount} active strike(s). An email notification has been sent to the user.`);

      // Reset form
      setSelectedEditor("");
      setSelectedEditorId("");
      setSelectedReason("");
      setCustomReason("");
      setStrikeNotes("");
      setPreviewFiles([]);
      setShowAddStrikeModal(false);
      
      // Clean up preview URLs
      previewFiles.forEach(file => {
        if (file.previewUrl) {
          URL.revokeObjectURL(file.previewUrl);
        }
      });
      
      // Refresh strikes list
  await strikesQuery.refetch();
      
      // Refresh strikes list
      // fetchStrikes();
    } catch (error) {
      console.error('Error adding strike:', error);
      alert('Failed to add strike. Please try again.');
    } finally {
      setIsAddingStrike(false);
      setIsUploadingFiles(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Strike System
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Track editor performance and strikes. Each violation results in 1 strike.
              </p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowAddStrikeModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Strike</span>
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Strike Rules */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowStrikeRules(!showStrikeRules)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              How Do I Get Strikes?
            </h3>
          </div>
          {showStrikeRules ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>
        
        {showStrikeRules && (
          <div className="p-4 pt-0 space-y-3 border-t border-gray-200 dark:border-gray-700">
            {STRIKE_RULES.map((rule, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold rounded-full text-xs">
                  1
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 pt-0.5">
                  {rule}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Editor Strikes Table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Editor Strike Records
          </h3>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto"></div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading strikes...</p>
          </div>
        ) : editorStrikes.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400">No strikes recorded yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">All editors are in good standing!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Editor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Total Strikes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Strike Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {editorStrikes.map((editor) => (
                  <tr key={editor.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {/* User Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                          {editor.editorImage ? (
                            <Image
                              src={editor.editorImage}
                              alt={editor.editorName}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          ) : (
                            <span className="text-white font-bold text-sm">
                              {editor.editorName.substring(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {editor.editorName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {editor.editorEmail}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                          editor.strikes >= 3
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            : editor.strikes >= 2
                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                        }`}>
                          {editor.strikes} {editor.strikes === 1 ? 'Strike' : 'Strikes'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-4">
                        {editor.reasons.map((reason) => (
                          <div key={reason.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700/30">
                            {/* Reason */}
                            <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">{reason.reason}</p>
                            
                            {/* Meta Information */}
                            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-2">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>
                                  {new Date(reason.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600 dark:text-gray-400">Issued by:</span>
                                {/* IssuedBy Avatar */}
                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                                  {reason.issuedBy.image ? (
                                    <Image
                                      src={reason.issuedBy.image}
                                      alt={reason.issuedBy.name}
                                      fill
                                      className="object-cover"
                                      sizes="20px"
                                    />
                                  ) : (
                                    <span className="text-white font-bold text-[8px]">
                                      {reason.issuedBy.name.substring(0, 2).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <span className="font-medium text-gray-700 dark:text-gray-300">{reason.issuedBy.name}</span>
                              </div>
                            </div>
                            
                            {/* Notes */}
                            {reason.notes && (
                              <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded text-xs">
                                <div className="flex items-start gap-2">
                                  <svg className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                  </svg>
                                  <div className="flex-1">
                                    <p className="font-semibold text-yellow-800 dark:text-yellow-300 mb-1">Notes:</p>
                                    <p className="text-yellow-700 dark:text-yellow-400">{reason.notes}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Display attachments if any */}
                            {reason.attachments && reason.attachments.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Evidence:</p>
                                <AttachmentViewer
                                  attachments={reason.attachments}
                                  showTitle={false}
                                  compact={true}
                                />
                              </div>
                            )}
                            {/* Delete button for admins */}
                            {isAdmin && (
                              <div className="flex justify-end mt-3">
                                <button
                                  onClick={async () => {
                                    if (!confirm('Delete this strike? This action cannot be undone.')) return;
                                    try {
                                      await deleteStrike.mutateAsync({ id: reason.id });
                                      await strikesQuery.refetch();
                                    } catch (err) {
                                      console.error('Failed to delete strike:', err);
                                      alert('Failed to delete strike.');
                                    }
                                  }}
                                  className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                >
                                  Delete Strike
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Strike Modal */}
      {showAddStrikeModal && isAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[10000] overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 my-4 sm:my-8 max-h-[95vh] sm:max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                  Add Strike
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddStrikeModal(false);
                  setSelectedEditor("");
                  setSelectedReason("");
                  setCustomReason("");
                  // Clean up preview URLs
                  previewFiles.forEach(file => {
                    if (file.previewUrl) {
                      URL.revokeObjectURL(file.previewUrl);
                    }
                  });
                  setPreviewFiles([]);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
              {/* Select Editor */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Select Editor <span className="text-red-500">*</span>
                </label>
                <UserDropdown
                  value={selectedEditor}
                  onChange={(userId, email) => {
                    setSelectedEditor(email || "");
                    setSelectedEditorId(userId || "");
                  }}
                  placeholder="Search and select editor..."
                  teamId={teamId}
                />
              </div>

              {/* Select Reason */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Reason for Strike <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all"
                >
                  <option value="">Select a reason...</option>
                  {STRIKE_RULES.map((rule, index) => (
                    <option key={index} value={index.toString()}>
                      {rule}
                    </option>
                  ))}
                  <option value="custom">Custom Reason...</option>
                </select>
              </div>

              {/* Custom Reason Input */}
              {selectedReason === "custom" && (
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Custom Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    rows={3}
                    placeholder="Enter custom reason for strike..."
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all resize-none"
                  />
                </div>
              )}

              {/* Additional Notes */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Additional Notes (Optional)
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Add any additional context, details, or instructions related to this strike
                </p>
                <textarea
                  value={strikeNotes}
                  onChange={(e) => setStrikeNotes(e.target.value)}
                  rows={3}
                  placeholder="Enter additional notes about this strike..."
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all resize-none"
                />
              </div>

              {/* Evidence Attachments */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Evidence (Optional)
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Upload screenshots, documents, or other evidence to support this strike
                </p>
                <CommentFilePreview
                  previewFiles={previewFiles}
                  onPreviewFilesChange={setPreviewFiles}
                  maxFiles={5}
                  maxFileSize={10}
                />
              </div>

              {/* Warning Message */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 sm:p-4">
                <div className="flex gap-2 sm:gap-3">
                  <Info className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-medium text-yellow-800 dark:text-yellow-300">
                      This action will add 1 strike to the selected editor
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                      Make sure you've selected the correct editor and reason before proceeding.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <button
                onClick={() => {
                  setShowAddStrikeModal(false);
                  setSelectedEditor("");
                  setSelectedEditorId("");
                  setSelectedReason("");
                  setCustomReason("");
                  setStrikeNotes("");
                  // Clean up preview URLs
                  previewFiles.forEach(file => {
                    if (file.previewUrl) {
                      URL.revokeObjectURL(file.previewUrl);
                    }
                  });
                  setPreviewFiles([]);
                }}
                disabled={isAddingStrike}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStrike}
                disabled={isAddingStrike || isUploadingFiles || !selectedEditorId || (!selectedReason && !customReason)}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(isAddingStrike || isUploadingFiles) && <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />}
                <span className="whitespace-nowrap">
                  {isUploadingFiles ? "Uploading..." : isAddingStrike ? "Adding..." : "Add Strike"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
