"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  FileText,
  File,
  Loader2,
  Check,
  AlertCircle,
  Calendar,
  User,
  MessageSquare,
  Tag,
  Settings,
  Eye,
  ThumbsUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface Thread {
  id: string;
  title: string;
  author: {
    username: string;
    role?: string;
  };
  category: {
    name: string;
    key: string;
  };
  tags?: Array<{
    name: string;
    color: string;
  }>;
  createdAt: string;
  updatedAt: string;
  views: number;
  pinned: boolean;
  locked: boolean;
  solved: boolean;
  posts: Array<{
    id: string;
    author: {
      username: string;
      role?: string;
    };
    content_md: string;
    content_html: string;
    createdAt: string;
    reactions: Array<{
      emoji: string;
      count: number;
    }>;
  }>;
}

interface ExportOptions {
  format: 'pdf' | 'markdown';
  includeMetadata: boolean;
  includeReactions: boolean;
  includeAuthors: boolean;
  includeTimestamps: boolean;
  includeTags: boolean;
  template: 'standard' | 'minimal' | 'detailed';
}

interface ThreadExporterProps {
  thread: Thread;
  modelName?: string;
  className?: string;
}

export function ThreadExporter({ thread, modelName, className }: ThreadExporterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'markdown',
    includeMetadata: true,
    includeReactions: true,
    includeAuthors: true,
    includeTimestamps: true,
    includeTags: true,
    template: 'standard',
  });

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      if (exportOptions.format === 'markdown') {
        await exportToMarkdown();
      } else {
        await exportToPDF();
      }
      
      toast.success(`Thread exported successfully as ${exportOptions.format.toUpperCase()}`);
      setIsOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(`Failed to export thread: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToMarkdown = async () => {
    const markdown = generateMarkdown(thread, exportOptions, modelName);
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const filename = `${sanitizeFilename(thread.title)}.md`;
    downloadBlob(blob, filename);
  };

  const exportToPDF = async () => {
    // For PDF export, we'll generate HTML and use the browser's print API
    const htmlContent = generateHTML(thread, exportOptions, modelName);
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Unable to open print window. Please allow popups.');
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${thread.title}</title>
          <style>
            ${getPrintStyles()}
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
  };

  const generateMarkdown = (thread: Thread, options: ExportOptions, modelName?: string): string => {
    let markdown = '';

    // Header
    markdown += `# ${thread.title}\n\n`;

    // Metadata
    if (options.includeMetadata) {
      markdown += '## Thread Information\n\n';
      
      if (modelName) {
        markdown += `**Model:** ${modelName}\n\n`;
      }
      
      markdown += `**Category:** ${thread.category.name}\n\n`;
      
      if (options.includeAuthors) {
        markdown += `**Started by:** ${thread.author.username}`;
        if (thread.author.role && thread.author.role !== 'USER') {
          markdown += ` (${thread.author.role})`;
        }
        markdown += '\n\n';
      }

      if (options.includeTimestamps) {
        markdown += `**Created:** ${formatDate(thread.createdAt)}\n\n`;
        markdown += `**Last Updated:** ${formatDate(thread.updatedAt)}\n\n`;
      }

      markdown += `**Views:** ${thread.views}\n\n`;
      markdown += `**Replies:** ${thread.posts.length - 1}\n\n`;

      // Status badges
      const statuses = [];
      if (thread.pinned) statuses.push('📌 Pinned');
      if (thread.locked) statuses.push('🔒 Locked');
      if (thread.solved) statuses.push('✅ Solved');
      
      if (statuses.length > 0) {
        markdown += `**Status:** ${statuses.join(', ')}\n\n`;
      }

      // Tags
      if (options.includeTags && thread.tags && thread.tags.length > 0) {
        markdown += `**Tags:** ${thread.tags.map(tag => `#${tag.name}`).join(', ')}\n\n`;
      }

      markdown += '---\n\n';
    }

    // Posts
    thread.posts.forEach((post, index) => {
      if (index === 0) {
        markdown += '## Original Post\n\n';
      } else {
        markdown += `## Reply ${index}\n\n`;
      }

      // Author and timestamp
      if (options.includeAuthors || options.includeTimestamps) {
        const authorInfo = [];
        
        if (options.includeAuthors) {
          let authorText = post.author.username;
          if (post.author.role && post.author.role !== 'USER') {
            authorText += ` (${post.author.role})`;
          }
          authorInfo.push(`**Author:** ${authorText}`);
        }

        if (options.includeTimestamps) {
          authorInfo.push(`**Posted:** ${formatDate(post.createdAt)}`);
        }

        if (authorInfo.length > 0) {
          markdown += authorInfo.join(' | ') + '\n\n';
        }
      }

      // Post content
      markdown += post.content_md + '\n\n';

      // Reactions
      if (options.includeReactions && post.reactions && post.reactions.length > 0) {
        const reactions = post.reactions
          .map(reaction => `${reaction.emoji} ${reaction.count}`)
          .join(' ');
        markdown += `**Reactions:** ${reactions}\n\n`;
      }

      if (index < thread.posts.length - 1) {
        markdown += '---\n\n';
      }
    });

    // Footer
    markdown += `\n---\n\n*Exported from ${modelName || 'Forum'} on ${formatDate(new Date().toISOString())}*\n`;

    return markdown;
  };

  const generateHTML = (thread: Thread, options: ExportOptions, modelName?: string): string => {
    let html = `<div class="thread-export">`;

    // Header
    html += `<h1 class="thread-title">${escapeHtml(thread.title)}</h1>`;

    // Metadata
    if (options.includeMetadata) {
      html += `<div class="thread-metadata">`;
      
      if (modelName) {
        html += `<p><strong>Model:</strong> ${escapeHtml(modelName)}</p>`;
      }
      
      html += `<p><strong>Category:</strong> ${escapeHtml(thread.category.name)}</p>`;
      
      if (options.includeAuthors) {
        html += `<p><strong>Started by:</strong> ${escapeHtml(thread.author.username)}`;
        if (thread.author.role && thread.author.role !== 'USER') {
          html += ` (${escapeHtml(thread.author.role)})`;
        }
        html += '</p>';
      }

      if (options.includeTimestamps) {
        html += `<p><strong>Created:</strong> ${formatDate(thread.createdAt)}</p>`;
        html += `<p><strong>Last Updated:</strong> ${formatDate(thread.updatedAt)}</p>`;
      }

      html += `<p><strong>Views:</strong> ${thread.views}</p>`;
      html += `<p><strong>Replies:</strong> ${thread.posts.length - 1}</p>`;

      // Status badges
      const statuses = [];
      if (thread.pinned) statuses.push('📌 Pinned');
      if (thread.locked) statuses.push('🔒 Locked');
      if (thread.solved) statuses.push('✅ Solved');
      
      if (statuses.length > 0) {
        html += `<p><strong>Status:</strong> ${statuses.join(', ')}</p>`;
      }

      // Tags
      if (options.includeTags && thread.tags && thread.tags.length > 0) {
        html += `<p><strong>Tags:</strong> ${thread.tags.map(tag => `#${escapeHtml(tag.name)}`).join(', ')}</p>`;
      }

      html += `</div><hr>`;
    }

    // Posts
    thread.posts.forEach((post, index) => {
      html += `<div class="post">`;
      
      if (index === 0) {
        html += `<h2>Original Post</h2>`;
      } else {
        html += `<h2>Reply ${index}</h2>`;
      }

      // Author and timestamp
      if (options.includeAuthors || options.includeTimestamps) {
        html += `<div class="post-meta">`;
        
        if (options.includeAuthors) {
          html += `<span class="author">${escapeHtml(post.author.username)}`;
          if (post.author.role && post.author.role !== 'USER') {
            html += ` (${escapeHtml(post.author.role)})`;
          }
          html += '</span>';
        }

        if (options.includeTimestamps) {
          html += `<span class="timestamp">${formatDate(post.createdAt)}</span>`;
        }

        html += `</div>`;
      }

      // Post content (use HTML version)
      html += `<div class="post-content">${post.content_html}</div>`;

      // Reactions
      if (options.includeReactions && post.reactions && post.reactions.length > 0) {
        html += `<div class="reactions">`;
        html += `<strong>Reactions:</strong> `;
        html += post.reactions
          .map(reaction => `${reaction.emoji} ${reaction.count}`)
          .join(' ');
        html += `</div>`;
      }

      html += `</div>`;
      
      if (index < thread.posts.length - 1) {
        html += `<hr>`;
      }
    });

    // Footer
    html += `<div class="export-footer">`;
    html += `<p><em>Exported from ${escapeHtml(modelName || 'Forum')} on ${formatDate(new Date().toISOString())}</em></p>`;
    html += `</div>`;

    html += `</div>`;

    return html;
  };

  const getPrintStyles = (): string => {
    return `
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }
      
      .thread-title {
        font-size: 2em;
        margin-bottom: 1em;
        color: #1a1a1a;
        border-bottom: 2px solid #e5e7eb;
        padding-bottom: 0.5em;
      }
      
      .thread-metadata {
        background: #f9fafb;
        padding: 1em;
        border-radius: 8px;
        margin-bottom: 2em;
      }
      
      .thread-metadata p {
        margin: 0.5em 0;
      }
      
      .post {
        margin-bottom: 2em;
      }
      
      .post h2 {
        font-size: 1.3em;
        color: #374151;
        margin-bottom: 0.5em;
      }
      
      .post-meta {
        font-size: 0.9em;
        color: #6b7280;
        margin-bottom: 1em;
        display: flex;
        gap: 1em;
      }
      
      .post-content {
        margin: 1em 0;
      }
      
      .post-content h1, .post-content h2, .post-content h3 {
        margin-top: 1.5em;
        margin-bottom: 0.5em;
      }
      
      .post-content p {
        margin: 1em 0;
      }
      
      .post-content blockquote {
        border-left: 4px solid #d1d5db;
        padding-left: 1em;
        margin: 1em 0;
        color: #6b7280;
      }
      
      .post-content pre {
        background: #f3f4f6;
        padding: 1em;
        border-radius: 6px;
        overflow-x: auto;
        font-size: 0.9em;
      }
      
      .post-content code {
        background: #f3f4f6;
        padding: 0.2em 0.4em;
        border-radius: 3px;
        font-size: 0.9em;
      }
      
      .reactions {
        font-size: 0.9em;
        color: #6b7280;
        margin-top: 1em;
      }
      
      .export-footer {
        margin-top: 3em;
        padding-top: 1em;
        border-top: 1px solid #e5e7eb;
        text-align: center;
        color: #6b7280;
        font-size: 0.9em;
      }
      
      hr {
        border: none;
        height: 1px;
        background: #e5e7eb;
        margin: 2em 0;
      }
      
      @media print {
        body {
          print-color-adjust: exact;
        }
        
        .post {
          break-inside: avoid;
        }
      }
    `;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("gap-2", className)}>
          <Download className="w-4 h-4" />
          Export
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-purple-600" />
            Export Thread
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Format Selection */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Export Format</Label>
            <RadioGroup
              value={exportOptions.format}
              onValueChange={(value: 'pdf' | 'markdown') =>
                setExportOptions({ ...exportOptions, format: value })
              }
              className="grid grid-cols-2 gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="markdown" id="markdown" />
                <Label htmlFor="markdown" className="flex items-center gap-2 cursor-pointer">
                  <FileText className="w-4 h-4" />
                  Markdown
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer">
                  <File className="w-4 h-4" />
                  PDF
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Export Options */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Include in Export</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="metadata"
                  checked={exportOptions.includeMetadata}
                  onCheckedChange={(checked) =>
                    setExportOptions({ ...exportOptions, includeMetadata: !!checked })
                  }
                />
                <Label htmlFor="metadata" className="text-sm">Thread metadata (category, stats, etc.)</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="authors"
                  checked={exportOptions.includeAuthors}
                  onCheckedChange={(checked) =>
                    setExportOptions({ ...exportOptions, includeAuthors: !!checked })
                  }
                />
                <Label htmlFor="authors" className="text-sm">Author information</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="timestamps"
                  checked={exportOptions.includeTimestamps}
                  onCheckedChange={(checked) =>
                    setExportOptions({ ...exportOptions, includeTimestamps: !!checked })
                  }
                />
                <Label htmlFor="timestamps" className="text-sm">Timestamps</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reactions"
                  checked={exportOptions.includeReactions}
                  onCheckedChange={(checked) =>
                    setExportOptions({ ...exportOptions, includeReactions: !!checked })
                  }
                />
                <Label htmlFor="reactions" className="text-sm">Post reactions</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tags"
                  checked={exportOptions.includeTags}
                  onCheckedChange={(checked) =>
                    setExportOptions({ ...exportOptions, includeTags: !!checked })
                  }
                />
                <Label htmlFor="tags" className="text-sm">Thread tags</Label>
              </div>
            </div>
          </div>

          {/* Preview Info */}
          <Card className="bg-gray-50 dark:bg-gray-800/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 text-sm">
                  <p className="font-medium text-gray-900 dark:text-white mb-1">
                    Export Preview
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    <strong>{thread.title}</strong>
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {thread.posts.length} posts
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {thread.views} views
                    </span>
                    {thread.tags && thread.tags.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {thread.tags.length} tags
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Button */}
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export as {exportOptions.format.toUpperCase()}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Utility functions
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}