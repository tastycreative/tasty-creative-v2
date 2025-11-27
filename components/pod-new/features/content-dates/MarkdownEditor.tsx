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
  disabled?: boolean;
}

export default function MarkdownEditor({ value, onChange, placeholder, disabled = false }: MarkdownEditorProps) {
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

  // Helper function to normalize markdown by removing excessive line breaks
  const normalizeMarkdown = (markdown: string): string => {
    if (!markdown) return "";
    // Replace 3 or more consecutive newlines with just 2
    return markdown.replace(/\n{3,}/g, "\n\n").trim();
  };

  // Convert markdown to HTML for display
  useEffect(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      const normalizedValue = normalizeMarkdown(value || "");
      const html = markdownToHtml(normalizedValue);
      if (editorRef.current.innerHTML !== html) {
        editorRef.current.innerHTML = html;
      }
    }
  }, [value]);

  // Update active formats on selection change
  useEffect(() => {
    const handleSelectionChange = () => {
      if (editorRef.current?.contains(document.getSelection()?.anchorNode || null)) {
        updateActiveFormats();
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  const markdownToHtml = (markdown: string): string => {
    if (!markdown) return "";

    let html = markdown;

    // Headers
    html = html.replace(/^### (.+)$/gim, "<h3>$1</h3>");
    html = html.replace(/^## (.+)$/gim, "<h2>$1</h2>");
    html = html.replace(/^# (.+)$/gim, "<h1>$1</h1>");

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");

    // Italic
    html = html.replace(/\*([^*]+?)\*/g, "<em>$1</em>");
    html = html.replace(/_([^_]+?)_/g, "<em>$1</em>");

    // Inline code
    html = html.replace(/`([^`]+?)`/g, "<code>$1</code>");

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>');

    // Lists
    const lines = html.split("\n");
    let inUl = false;
    let inOl = false;
    const processedLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const ulMatch = line.match(/^[-*]\s+(.+)$/);
      const olMatch = line.match(/^(\d+)\.\s+(.+)$/);

      if (ulMatch) {
        if (!inUl) {
          processedLines.push("<ul>");
          inUl = true;
        }
        processedLines.push(`<li>${ulMatch[1]}</li>`);
      } else if (olMatch) {
        if (!inOl) {
          processedLines.push("<ol>");
          inOl = true;
        }
        processedLines.push(`<li>${olMatch[2]}</li>`);
      } else {
        if (inUl) {
          processedLines.push("</ul>");
          inUl = false;
        }
        if (inOl) {
          processedLines.push("</ol>");
          inOl = false;
        }
        processedLines.push(line);
      }
    }

    if (inUl) processedLines.push("</ul>");
    if (inOl) processedLines.push("</ol>");

    html = processedLines.join("\n");

    // Line breaks - convert double newlines to paragraph breaks
    // First, normalize multiple newlines to double newlines max
    html = html.replace(/\n{3,}/g, "\n\n");
    // Convert double newlines to paragraph separators
    html = html.replace(/\n\n/g, "<br><br>");
    // Convert single newlines to single line breaks
    html = html.replace(/\n/g, "<br>");

    return html;
  };

  const htmlToMarkdown = (html: string): string => {
    let md = html;

    // First, handle line breaks properly - convert divs and brs to newlines
    // Normalize empty divs (which represent blank lines in contentEditable)
    md = md.replace(/<div><br><\/div>/gi, "\n");
    md = md.replace(/<div>\s*<\/div>/gi, "\n");
    md = md.replace(/<div>/gi, "\n");
    md = md.replace(/<\/div>/gi, "");
    // Convert consecutive <br> tags to single newlines
    md = md.replace(/(<br\s*\/?>\s*){2,}/gi, "\n\n");
    md = md.replace(/<br\s*\/?>/gi, "\n");

    // Headers
    md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n");
    md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n");
    md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n");

    // Helper function to convert inline formatting within text
    const convertInlineFormatting = (text: string): string => {
      let result = text;
      // Links
      result = result.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)");
      // Bold
      result = result.replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**");
      result = result.replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**");
      // Italic
      result = result.replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*");
      result = result.replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*");
      // Code
      result = result.replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`");
      // Remove any remaining HTML tags
      result = result.replace(/<[^>]*>/g, "");
      return result;
    };

    // Ordered lists - convert formatting INSIDE list items
    md = md.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
      let counter = 1;
      const items: string[] = [];
      content.replace(/<li[^>]*>(.*?)<\/li>/gi, (_liMatch: string, liContent: string) => {
        const cleaned = convertInlineFormatting(liContent.trim());
        items.push(`${counter++}. ${cleaned}`);
        return '';
      });
      return items.join('\n');
    });

    // Unordered lists - convert formatting INSIDE list items
    md = md.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
      const items: string[] = [];
      content.replace(/<li[^>]*>(.*?)<\/li>/gi, (_liMatch: string, liContent: string) => {
        const cleaned = convertInlineFormatting(liContent.trim());
        items.push(`- ${cleaned}`);
        return '';
      });
      return items.join('\n');
    });

    // Links (outside lists)
    md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)");

    // Bold (outside lists)
    md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**");
    md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**");

    // Italic (outside lists)
    md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*");
    md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*");

    // Code (outside lists)
    md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`");

    // Paragraphs
    md = md.replace(/<\/p>/gi, "\n\n");
    md = md.replace(/<p[^>]*>/gi, "");

    // Remove any remaining HTML tags
    md = md.replace(/<[^>]*>/g, "");

    // Decode entities
    md = md.replace(/&nbsp;/g, " ");
    md = md.replace(/&quot;/g, '"');
    md = md.replace(/&lt;/g, "<");
    md = md.replace(/&gt;/g, ">");
    md = md.replace(/&amp;/g, "&");

    // Clean up excessive whitespace - normalize to max double line breaks
    md = md.replace(/\n{3,}/g, "\n\n");

    // Remove trailing whitespace from each line
    md = md.split('\n').map(line => line.trimEnd()).join('\n');

    // Final trim
    md = md.trim();

    return md;
  };

  const updateActiveFormats = () => {
    if (!editorRef.current) return;

    setActiveFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      h1: document.queryCommandValue("formatBlock") === "h1",
      h2: document.queryCommandValue("formatBlock") === "h2",
      ul: document.queryCommandState("insertUnorderedList"),
      ol: document.queryCommandState("insertOrderedList"),
    });
  };

  const handleInput = () => {
    if (!editorRef.current) return;

    isUpdatingRef.current = true;
    const html = editorRef.current.innerHTML;
    const markdown = htmlToMarkdown(html);
    // Normalize markdown before saving to prevent excessive line breaks
    const normalizedMarkdown = normalizeMarkdown(markdown);
    onChange(normalizedMarkdown);

    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 0);

    updateActiveFormats();
  };

  const execCommand = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
  };

  const formatBold = () => {
    execCommand("bold");
    handleInput();
    setTimeout(updateActiveFormats, 0);
  };

  const formatItalic = () => {
    execCommand("italic");
    handleInput();
    setTimeout(updateActiveFormats, 0);
  };

  const formatH1 = () => {
    execCommand("formatBlock", "h1");
    handleInput();
    setTimeout(updateActiveFormats, 0);
  };

  const formatH2 = () => {
    execCommand("formatBlock", "h2");
    handleInput();
    setTimeout(updateActiveFormats, 0);
  };

  const formatBulletList = () => {
    execCommand("insertUnorderedList");
    handleInput();
    setTimeout(updateActiveFormats, 0);
  };

  const formatNumberedList = () => {
    execCommand("insertOrderedList");
    handleInput();
    setTimeout(updateActiveFormats, 0);
  };

  const formatCode = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const code = document.createElement("code");
      try {
        range.surroundContents(code);
        handleInput();
      } catch (e) {
        console.warn("Could not wrap in code tag");
      }
    }
  };

  const formatLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
      execCommand("createLink", url);
      handleInput();
    }
  };

  return (
    <div className={`border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-700 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      {/* Formatting Toolbar */}
      <div className="flex items-center gap-1 px-2 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600 flex-wrap">
        <button
          type="button"
          onClick={formatBold}
          disabled={disabled}
          className={`p-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            activeFormats.bold
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
              : 'hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={formatItalic}
          disabled={disabled}
          className={`p-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            activeFormats.italic
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
              : 'hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </button>
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
        <button
          type="button"
          onClick={formatH1}
          disabled={disabled}
          className={`p-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            activeFormats.h1
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
              : 'hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={formatH2}
          disabled={disabled}
          className={`p-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            activeFormats.h2
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
              : 'hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
        <button
          type="button"
          onClick={formatBulletList}
          disabled={disabled}
          className={`p-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            activeFormats.ul
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
              : 'hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={formatNumberedList}
          disabled={disabled}
          className={`p-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            activeFormats.ol
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
              : 'hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
        <button
          type="button"
          onClick={formatLink}
          disabled={disabled}
          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Link"
        >
          <LinkIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={formatCode}
          disabled={disabled}
          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Inline Code"
        >
          <Code className="h-4 w-4" />
        </button>
      </div>

      {/* WYSIWYG Editor */}
      <div className="relative min-h-[150px]">
        <div
          ref={editorRef}
          contentEditable={!disabled}
          onInput={handleInput}
          onBlur={handleInput}
          className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 min-h-[150px] focus:outline-none
          [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-gray-400 [&:empty]:before:dark:text-gray-500
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
          data-placeholder={placeholder || "Start typing..."}
        />
      </div>

      {/* Helper text */}
      <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-600">
        <p className="text-[10px] text-gray-500 dark:text-gray-400">
          Format text as you type. Bold, italic, lists, and more render instantly. Markdown is saved automatically.
        </p>
      </div>
    </div>
  );
}
