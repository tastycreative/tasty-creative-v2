"use client";

import React from "react";
import { Calendar, Clock, DollarSign, Tag, FileText, Upload, X } from "lucide-react";
import MarkdownEditor from "./MarkdownEditor";
import ReactMarkdown from 'react-markdown';
import ModelsDropdownList from "@/components/ModelsDropdownList";
import AttachmentViewer from "@/components/ui/AttachmentViewer";
import { ContentEvent } from "@/app/(root)/(pod)/content-dates/page";

interface EventViewProps {
  mode: "edit" | "view";
  formData?: any;
  setFormData?: (data: any) => void;
  isDragging?: boolean;
  handleDragOver?: (e: React.DragEvent) => void;
  handleDragLeave?: (e: React.DragEvent) => void;
  handleDrop?: (e: React.DragEvent) => void;
  handleFileChange?: (files: FileList | null) => void;
  staticAttachments?: any[];
  staticNotes?: string;
}

export default function EventView({ mode, formData, setFormData, isDragging, handleDragOver, handleDragLeave, handleDrop, handleFileChange, staticAttachments, staticNotes }: EventViewProps) {
  const isView = mode === 'view';

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div>
      <div className="grid grid-cols-4 gap-4">
        {/* Event Type */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Event Type{!isView && ' *'}</label>
          {isView ? (
            <div className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border rounded-lg text-gray-900 dark:text-gray-100">{formData?.type}</div>
          ) : (
            <select value={formData.type} onChange={(e) => setFormData?.({ ...formData, type: e.target.value })} className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border rounded-lg">
              <option value="PPV">PPV</option>
              <option value="LIVESTREAM">Livestream</option>
            </select>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5"><Calendar className="h-3.5 w-3.5" /> Date{!isView && ' *'}</label>
          {isView ? (
            <div className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border rounded-lg text-gray-900 dark:text-gray-100">{formData?.date ? formatDate(new Date(formData.date)) : 'Not set'}</div>
          ) : (
            <input type="date" value={formData.date} onChange={(e) => setFormData?.({ ...formData, date: e.target.value })} className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border rounded-lg" required />
          )}
        </div>

        {/* Time */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5"><Clock className="h-3.5 w-3.5" /> Time</label>
          {isView ? (
            <div className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border rounded-lg text-gray-900 dark:text-gray-100">{formData?.time || 'Not set'}</div>
          ) : (
            <input type="time" value={formData.time} onChange={(e) => setFormData?.({ ...formData, time: e.target.value })} className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border rounded-lg" />
          )}
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
          {isView ? (
            <div className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium border bg-blue-100 text-blue-700">{formData?.status === 'PROCESSING' ? 'Processing' : formData?.status === 'IN_QUEUE' ? 'In queue' : formData?.status}</div>
          ) : (
            <select value={formData.status} onChange={(e) => setFormData?.({ ...formData, status: e.target.value })} className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border rounded-lg">
              <option value="IN_QUEUE">In queue</option>
              <option value="PROCESSING">Processing</option>
            </select>
          )}
        </div>

        {/* Creator */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Creator</label>
          {isView ? (
            <div className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border rounded-lg text-gray-900 dark:text-gray-100">{formData?.creator || 'Not set'}</div>
          ) : (
            <ModelsDropdownList className="w-full" value={formData.creator} onValueChange={(value) => setFormData?.({ ...formData, creator: value })} placeholder="Choose creator..." />
          )}
        </div>

        {/* Price */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5"><DollarSign className="h-3.5 w-3.5" /> Price</label>
          {isView ? (
            <div className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border rounded-lg text-gray-900 dark:text-gray-100">{formData?.price ? `$${Number(formData.price).toFixed(2)}` : 'Free'}</div>
          ) : (
            <input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData?.({ ...formData, price: e.target.value })} className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border rounded-lg" placeholder="0.00" />
          )}
        </div>

        {/* Color */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Color</label>
          {isView ? (
            <div className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border rounded-lg text-gray-900 dark:text-gray-100">{formData?.color}</div>
          ) : (
            <select value={formData.color} onChange={(e) => setFormData?.({ ...formData, color: e.target.value })} className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border rounded-lg">
              <option value="pink">Pink</option>
              <option value="purple">Purple</option>
              <option value="blue">Blue</option>
              <option value="green">Green</option>
              <option value="orange">Orange</option>
            </select>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5"><Tag className="h-3.5 w-3.5" /> Tags</label>
          {isView ? (
            <div className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border rounded-lg text-gray-900 dark:text-gray-100">{formData?.tags || 'No tags'}</div>
          ) : (
            <input type="text" value={formData.tags} onChange={(e) => setFormData?.({ ...formData, tags: e.target.value })} className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border rounded-lg" placeholder="tag1, tag2" />
          )}
        </div>

        {/* Attachments */}
        <div className="col-span-4">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5"><Upload className="h-3.5 w-3.5" /> Attachments</label>

          {isView ? (
            <AttachmentViewer attachments={staticAttachments || []} showTitle compact />
          ) : (
            (formData.attachments && formData.attachments.length === 0) ? (
              <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`relative rounded-lg border-2 border-dashed transition-all ${isDragging ? 'border-pink-500 bg-pink-50/50 dark:bg-pink-900/20' : 'border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50'}`}>
                <input type="file" multiple onChange={(e) => handleFileChange?.(e.target.files)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" id="file-upload" />
                <label htmlFor="file-upload" className="flex flex-col items-center justify-center py-6 px-4 cursor-pointer">
                  <div className="p-2 rounded-full bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20 mb-2"><Upload className="h-5 w-5 text-pink-600 dark:text-pink-400" /></div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">PNG, JPG, PDF, or any file type</p>
                </label>
              </div>
            ) : (
              <div className="space-y-2">
                {formData.attachments.map((file: File, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg group hover:border-pink-300 dark:hover:border-pink-500/50 transition-colors">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="p-1.5 rounded bg-pink-50 dark:bg-pink-900/30"><FileText className="h-3.5 w-3.5 text-pink-600 dark:text-pink-400" /></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{file.name}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{(file.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <button type="button" onClick={() => setFormData?.({ ...formData, attachments: formData.attachments.filter((_: any, i: number) => i !== idx) })} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"><X className="h-4 w-4" /></button>
                  </div>
                ))}

                <div className="relative">
                  <input type="file" multiple onChange={(e) => handleFileChange?.(e.target.files)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" id="file-upload-more" />
                  <label htmlFor="file-upload-more" className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-pink-500 dark:hover:border-pink-500 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-pink-50/50 dark:hover:bg-pink-900/20 transition-all cursor-pointer"><Upload className="h-4 w-4 text-pink-600 dark:text-pink-400" /><span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Add more files</span></label>
                </div>
              </div>
            )
          )}
        </div>

        {/* Notes */}
        <div className="col-span-4">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5"><FileText className="h-3.5 w-3.5" /> Notes / Requests</label>
          {isView ? (
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 border rounded-lg prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
              <ReactMarkdown>{staticNotes || formData?.notes || ''}</ReactMarkdown>
            </div>
          ) : (
            <MarkdownEditor value={formData.notes} onChange={(value) => setFormData?.({ ...formData, notes: value })} placeholder="Add any notes or special requests here..." />
          )}
        </div>
      </div>
    </div>
  );
}
