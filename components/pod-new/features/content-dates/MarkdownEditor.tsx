"use client";

import { useRef, useEffect, useState } from "react";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Link as LinkIcon,
  Code,
} from "lucide-react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    h1: false,
    h2: false,
    ul: false,
    ol: false,
  });

  // Initialize editor with HTML converted from markdown
  useEffect(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      const currentMarkdown = htmlToMarkdown(editorRef.current.innerHTML);
      if (value !== currentMarkdown) {
        editorRef.current.innerHTML = markdownToHtml(value || "");
      }
    }
  }, [value]);

  const execCommand = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
  };

  const formatBold = () => {
    const isActive = document.queryCommandState("bold");
    execCommand("bold");
    setActiveFormats(prev => ({ ...prev, bold: !isActive }));
    updateMarkdown();
  };

  const formatItalic = () => {
    const isActive = document.queryCommandState("italic");
    execCommand("italic");
    setActiveFormats(prev => ({ ...prev, italic: !isActive }));
    updateMarkdown();
  };

  const formatH1 = () => {
    const isActive = document.queryCommandValue("formatBlock") === "h1";
    execCommand("formatBlock", "h1");
    setActiveFormats(prev => ({ ...prev, h1: !isActive, h2: false }));
    updateMarkdown();
  };

  const formatH2 = () => {
    const isActive = document.queryCommandValue("formatBlock") === "h2";
    execCommand("formatBlock", "h2");
    setActiveFormats(prev => ({ ...prev, h2: !isActive, h1: false }));
    updateMarkdown();
  };

  const formatBulletList = () => {
    const isActive = document.queryCommandState("insertUnorderedList");
    execCommand("insertUnorderedList");
    setActiveFormats(prev => ({ ...prev, ul: !isActive, ol: false }));
    updateMarkdown();
  };

  const formatNumberedList = () => {
    const isActive = document.queryCommandState("insertOrderedList");
    execCommand("insertOrderedList");
    setActiveFormats(prev => ({ ...prev, ol: !isActive, ul: false }));
    updateMarkdown();
  };

  const formatCode = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const code = document.createElement("code");
      code.className = "bg-gray-200 dark:bg-gray-600 px-1 rounded";
      try {
        range.surroundContents(code);
        updateMarkdown();
      } catch (e) {
        // If surroundContents fails, just use execCommand
        console.warn("Could not wrap in code tag");
      }
    }
  };

  const formatLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
      execCommand("createLink", url);
      updateMarkdown();
    }
  };

  const updateMarkdown = () => {
    if (!editorRef.current) return;

    isUpdatingRef.current = true;

    // Convert HTML back to markdown
    const html = editorRef.current.innerHTML;
    const markdown = htmlToMarkdown(html);
    onChange(markdown);

    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 0);
  };

  const markdownToHtml = (markdown: string): string => {
    if (!markdown) return "";

    let html = markdown;

    // Headers (must come before other replacements)
    html = html.replace(/^### (.+)$/gim, "<h3>$1</h3>");
    html = html.replace(/^## (.+)$/gim, "<h2>$1</h2>");
    html = html.replace(/^# (.+)$/gim, "<h1>$1</h1>");

    // Bold (do before italic to handle ** correctly)
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");

    // Italic (handle remaining single *)
    html = html.replace(/\*([^*]+?)\*/g, "<em>$1</em>");
    html = html.replace(/_([^_]+?)_/g, "<em>$1</em>");

    // Code
    html = html.replace(/`([^`]+?)`/g, '<code class="bg-gray-200 dark:bg-gray-600 px-1 rounded">$1</code>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" title="$2" class="text-blue-600 dark:text-blue-400 underline cursor-pointer">$1</a>');

    // Lists - handle line by line
    const lines = html.split('\n');
    let inUl = false;
    let inOl = false;
    const processedLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const ulMatch = line.match(/^[-*]\s+(.+)$/);
      const olMatch = line.match(/^\d+\.\s+(.+)$/);

      if (ulMatch) {
        if (!inUl) {
          processedLines.push('<ul>');
          inUl = true;
        }
        processedLines.push(`<li>${ulMatch[1]}</li>`);
      } else if (olMatch) {
        if (!inOl) {
          processedLines.push('<ol>');
          inOl = true;
        }
        processedLines.push(`<li>${olMatch[1]}</li>`);
      } else {
        if (inUl) {
          processedLines.push('</ul>');
          inUl = false;
        }
        if (inOl) {
          processedLines.push('</ol>');
          inOl = false;
        }
        processedLines.push(line);
      }
    }

    if (inUl) processedLines.push('</ul>');
    if (inOl) processedLines.push('</ol>');

    html = processedLines.join('\n');

    // Paragraphs
    html = html.replace(/\n\n+/g, '<br><br>');
    html = html.replace(/\n/g, '<br>');

    return html;
  };

  const htmlToMarkdown = (html: string): string => {
    let md = html;

    // Preserve line breaks before processing
    md = md.replace(/<br\s*\/?>/gi, "\n");
    md = md.replace(/<\/div>/gi, "</div>\n");
    md = md.replace(/<\/p>/gi, "</p>\n");
    md = md.replace(/<\/li>/gi, "</li>\n");

    // Headers (handle both block headers and inline)
    md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, (match, content) => `# ${content.trim()}\n\n`);
    md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, (match, content) => `## ${content.trim()}\n\n`);
    md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, (match, content) => `### ${content.trim()}\n\n`);

    // Lists - need to handle nested structure
    // First, convert list items
    md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, (match, content) => {
      // Clean the content
      const cleaned = content.trim().replace(/<[^>]*>/g, '');
      return `- ${cleaned}\n`;
    });

    // Remove ul/ol tags
    md = md.replace(/<\/?ul[^>]*>/gi, "");
    md = md.replace(/<\/?ol[^>]*>/gi, "");

    // Links
    md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)");

    // Bold
    md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**");
    md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**");

    // Italic
    md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*");
    md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*");

    // Code
    md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`");

    // Remove paragraphs and divs (keeping their content)
    md = md.replace(/<\/?p[^>]*>/gi, "");
    md = md.replace(/<\/?div[^>]*>/gi, "");

    // Remove any remaining HTML tags
    md = md.replace(/<[^>]*>/g, "");

    // Decode HTML entities
    md = md.replace(/&nbsp;/g, " ");
    md = md.replace(/&quot;/g, '"');
    md = md.replace(/&lt;/g, "<");
    md = md.replace(/&gt;/g, ">");
    md = md.replace(/&amp;/g, "&");

    // Clean up whitespace
    md = md.replace(/\n{3,}/g, "\n\n");
    md = md.replace(/^\n+/, "");
    md = md.replace(/\n+$/, "");

    return md.trim();
  };

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-700">
      {/* Formatting Toolbar */}
      <div className="flex items-center gap-1 px-2 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600 flex-wrap">
          <button
            type="button"
            onClick={formatBold}
            className={`p-1.5 rounded transition-colors ${
              activeFormats.bold
                ? "bg-pink-500 text-white"
                : "hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={formatItalic}
            className={`p-1.5 rounded transition-colors ${
              activeFormats.italic
                ? "bg-pink-500 text-white"
                : "hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </button>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          <button
            type="button"
            onClick={formatH1}
            className={`p-1.5 rounded transition-colors ${
              activeFormats.h1
                ? "bg-pink-500 text-white"
                : "hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={formatH2}
            className={`p-1.5 rounded transition-colors ${
              activeFormats.h2
                ? "bg-pink-500 text-white"
                : "hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </button>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          <button
            type="button"
            onClick={formatBulletList}
            className={`p-1.5 rounded transition-colors ${
              activeFormats.ul
                ? "bg-pink-500 text-white"
                : "hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={formatNumberedList}
            className={`p-1.5 rounded transition-colors ${
              activeFormats.ol
                ? "bg-pink-500 text-white"
                : "hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          <button
            type="button"
            onClick={formatLink}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            title="Link"
          >
            <LinkIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={formatCode}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            title="Inline Code"
          >
            <Code className="h-4 w-4" />
          </button>
        </div>

      {/* Rich Text Editor (WYSIWYG) */}
      <div className="relative min-h-[150px]">
        <div
          ref={editorRef}
          contentEditable
          onInput={updateMarkdown}
          onBlur={updateMarkdown}
          className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 min-h-[150px] focus:outline-none max-w-none [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-gray-400 [&:empty]:before:dark:text-gray-500
          [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-2 [&_h1]:mt-2
          [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-2 [&_h2]:mt-2
          [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-1 [&_h3]:mt-1
          [&_strong]:font-bold [&_b]:font-bold
          [&_em]:italic [&_i]:italic
          [&_code]:bg-gray-200 [&_code]:dark:bg-gray-600 [&_code]:px-1 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono
          [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline
          [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:my-2
          [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:my-2
          [&_li]:my-1"
          suppressContentEditableWarning
          style={{ whiteSpace: "pre-wrap" }}
          data-placeholder={placeholder || "Start typing..."}
        />
      </div>

      {/* Helper text */}
      <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-600">
        <p className="text-[10px] text-gray-500 dark:text-gray-400">
          Use the toolbar buttons to format your text. Markdown is saved automatically.
        </p>
      </div>
    </div>
  );
}
