"use client";

import Markdown from "react-markdown";
import remarkBreaks from "remark-breaks";

interface MarkdownViewerProps {
  value: string;
}

export default function MarkdownViewer({ value }: MarkdownViewerProps) {
  if (!value) {
    return (
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-700">
        <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 min-h-[150px]">
          No notes
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-700">
      <div className="px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 min-h-[150px]">
        <Markdown
          remarkPlugins={[remarkBreaks]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-2xl font-bold mb-2 mt-2">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-xl font-bold mb-2 mt-2">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-lg font-bold mb-1 mt-1">{children}</h3>
            ),
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            ul: ({ children }) => <ul className="list-disc ml-6 my-2">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal ml-6 my-2">{children}</ol>,
            li: ({ children }) => <li className="my-1">{children}</li>,
            strong: ({ children }) => <strong className="font-bold">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            code: ({ children, className }) => {
              const isInline = !className;
              return isInline ? (
                <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded text-sm font-mono">
                  {children}
                </code>
              ) : (
                <code className="block bg-gray-200 dark:bg-gray-600 px-3 py-2 rounded text-sm font-mono my-2">
                  {children}
                </code>
              );
            },
            a: ({ href, children }) => (
              <a
                href={href}
                className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            ),
          }}
        >
          {value}
        </Markdown>
      </div>
    </div>
  );
}
