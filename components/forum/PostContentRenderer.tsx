"use client";

import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { MediaEmbed } from "./MediaEmbed";
import { extractEmbedPlaceholders } from "@/lib/media-embed-utils";

interface PostContentRendererProps {
  content: string;
  className?: string;
  allowEmbeds?: boolean;
  maxEmbeds?: number;
}

interface ProcessedContent {
  textContent: string;
  embeds: Array<{
    type: string;
    url: string;
    placeholder: string;
  }>;
}

export function PostContentRenderer({
  content,
  className = "",
  allowEmbeds = true,
  maxEmbeds = 5,
}: PostContentRendererProps) {
  const processedContent = useMemo<ProcessedContent>(() => {
    if (!allowEmbeds) {
      return { textContent: content, embeds: [] };
    }

    const embeds = extractEmbedPlaceholders(content);
    const limitedEmbeds = embeds.slice(0, maxEmbeds);
    
    // Remove excess embed placeholders
    let processedText = content;
    const excessEmbeds = embeds.slice(maxEmbeds);
    for (const embed of excessEmbeds) {
      processedText = processedText.replace(embed.placeholder, `[Link: ${embed.url}]`);
    }

    return {
      textContent: processedText,
      embeds: limitedEmbeds,
    };
  }, [content, allowEmbeds, maxEmbeds]);

  const renderContent = () => {
    let textContent = processedContent.textContent;
    const components: React.ReactNode[] = [];

    // Split content by embed placeholders and render each part
    let lastIndex = 0;
    const sortedEmbeds = [...processedContent.embeds].sort((a, b) => {
      const aIndex = textContent.indexOf(a.placeholder);
      const bIndex = textContent.indexOf(b.placeholder);
      return aIndex - bIndex;
    });

    for (let i = 0; i < sortedEmbeds.length; i++) {
      const embed = sortedEmbeds[i];
      const embedIndex = textContent.indexOf(embed.placeholder, lastIndex);
      
      if (embedIndex === -1) continue;

      // Add text content before this embed
      const beforeText = textContent.slice(lastIndex, embedIndex);
      if (beforeText.trim()) {
        components.push(
          <ReactMarkdown
            key={`text-${i}`}
            remarkPlugins={[remarkGfm, remarkBreaks]}
            components={markdownComponents}
            className="prose prose-sm max-w-none dark:prose-invert"
          >
            {beforeText}
          </ReactMarkdown>
        );
      }

      // Add the media embed
      components.push(
        <div key={`embed-${i}`} className="my-4">
          <MediaEmbed url={embed.url} />
        </div>
      );

      lastIndex = embedIndex + embed.placeholder.length;
    }

    // Add remaining text content
    const remainingText = textContent.slice(lastIndex);
    if (remainingText.trim()) {
      components.push(
        <ReactMarkdown
          key="text-final"
          remarkPlugins={[remarkGfm, remarkBreaks]}
          components={markdownComponents}
          className="prose prose-sm max-w-none dark:prose-invert"
        >
          {remainingText}
        </ReactMarkdown>
      );
    }

    return components;
  };

  const markdownComponents = {
    // Custom code block rendering
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || "");
      const language = match ? match[1] : "";

      if (!inline && language) {
        return (
          <SyntaxHighlighter
            style={tomorrow}
            language={language}
            PreTag="div"
            className="rounded-lg text-sm"
            showLineNumbers={language !== "text"}
            {...props}
          >
            {String(children).replace(/\n$/, "")}
          </SyntaxHighlighter>
        );
      }

      return (
        <code
          className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono"
          {...props}
        >
          {children}
        </code>
      );
    },

    // Custom link rendering
    a: ({ href, children, ...props }: any) => (
      <a
        href={href}
        target={href?.startsWith("http") ? "_blank" : undefined}
        rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
        className="text-blue-600 dark:text-blue-400 hover:underline"
        {...props}
      >
        {children}
      </a>
    ),

    // Custom blockquote rendering
    blockquote: ({ children, ...props }: any) => (
      <blockquote
        className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-2 my-4 bg-gray-50 dark:bg-gray-800/50 rounded-r-lg"
        {...props}
      >
        {children}
      </blockquote>
    ),

    // Custom table rendering
    table: ({ children, ...props }: any) => (
      <div className="overflow-x-auto my-4">
        <table
          className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg"
          {...props}
        >
          {children}
        </table>
      </div>
    ),

    th: ({ children, ...props }: any) => (
      <th
        className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-left text-sm font-semibold text-gray-900 dark:text-white"
        {...props}
      >
        {children}
      </th>
    ),

    td: ({ children, ...props }: any) => (
      <td
        className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700"
        {...props}
      >
        {children}
      </td>
    ),

    // Custom task list rendering
    input: ({ type, checked, ...props }: any) => {
      if (type === "checkbox") {
        return (
          <input
            type="checkbox"
            checked={checked}
            readOnly
            className="mr-2 rounded"
            {...props}
          />
        );
      }
      return <input type={type} {...props} />;
    },

    // Custom image rendering for non-embedded images
    img: ({ src, alt, ...props }: any) => (
      <img
        src={src}
        alt={alt}
        className="max-w-full h-auto rounded-lg shadow-sm"
        loading="lazy"
        {...props}
      />
    ),
  };

  // If no embeds and simple content, use optimized rendering
  if (processedContent.embeds.length === 0) {
    return (
      <div className={className}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          components={markdownComponents}
          className="prose prose-sm max-w-none dark:prose-invert"
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }

  return <div className={className}>{renderContent()}</div>;
}

// Utility function to estimate content complexity
export function getContentComplexity(content: string): 'simple' | 'medium' | 'complex' {
  const hasCodeBlocks = /```[\s\S]*?```/.test(content);
  const hasInlineCode = /`[^`]+`/.test(content);
  const hasLinks = /\[([^\]]+)\]\(([^)]+)\)/.test(content);
  const hasImages = /!\[([^\]]*)\]\(([^)]+)\)/.test(content);
  const hasTables = /\|.*\|/.test(content);
  const hasLists = /^[\s]*[-*+]\s|^[\s]*\d+\.\s/m.test(content);
  
  const complexityScore = [
    hasCodeBlocks,
    hasInlineCode,
    hasLinks,
    hasImages,
    hasTables,
    hasLists,
  ].filter(Boolean).length;

  if (complexityScore === 0) return 'simple';
  if (complexityScore <= 2) return 'medium';
  return 'complex';
}

// Utility function to extract first few words for preview
export function getContentPreview(content: string, wordLimit: number = 50): string {
  // Remove markdown formatting for preview
  const plainText = content
    .replace(/```[\s\S]*?```/g, '[code]')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '[image]')
    .replace(/#{1,6}\s/g, '')
    .replace(/[*_~]/g, '')
    .replace(/^\s*[-*+]\s/gm, '')
    .replace(/^\s*\d+\.\s/gm, '')
    .replace(/\n+/g, ' ')
    .trim();

  const words = plainText.split(/\s+/).filter(word => word.length > 0);
  if (words.length <= wordLimit) return plainText;
  
  return words.slice(0, wordLimit).join(' ') + '...';
}