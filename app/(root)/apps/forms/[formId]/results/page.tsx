/* eslint-disable @typescript-eslint/no-explicit-any */
// app/apps/forms/[formId]/results/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Download,
  Loader2,
  FileText,
  Calendar,
  User,
  Eye,
  EyeOff,
} from "lucide-react";

interface Form {
  id: string;
  spreadsheetId: string;
  title: string;
  fullTitle: string;
  creatorEmail: string;
  questions: Question[];
}

interface Question {
  id: string;
  title: string;
  required: boolean;
  column: string;
}

interface FormResponse {
  id: string;
  formId: string;
  submittedAt: Date;
  data: Record<string, any>;
}

// Add CSS for line-clamp utility
const styles = `
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

export default function FormResultsPage() {
  const params = useParams();
  const router = useRouter();
  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCells, setExpandedCells] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchFormAndResponses();
  }, [params?.formId]);

  const fetchFormAndResponses = async () => {
    try {
      // Fetch form details
      const formResponse = await fetch(`/api/forms/${params?.formId}`);
      const formData = await formResponse.json();

      if (formData.error) {
        throw new Error(formData.error);
      }

      setForm(formData.form);

      // Fetch responses
      const responsesResponse = await fetch(
        `/api/forms/responses?spreadsheetId=${formData.form.spreadsheetId}`
      );
      const responsesData = await responsesResponse.json();
      setResponses(responsesData.responses || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Error loading form results");
      router.push("/apps/forms");
    } finally {
      setLoading(false);
    }
  };

  const toggleCellExpansion = (responseId: string, questionId: string) => {
    const cellKey = `${responseId}-${questionId}`;
    const newExpanded = new Set(expandedCells);
    if (newExpanded.has(cellKey)) {
      newExpanded.delete(cellKey);
    } else {
      newExpanded.add(cellKey);
    }
    setExpandedCells(newExpanded);
  };

  const isCellExpanded = (responseId: string, questionId: string) => {
    return expandedCells.has(`${responseId}-${questionId}`);
  };

  const exportToCSV = () => {
    if (!form || responses.length === 0) return;

    // Create CSV content
    const headers = [
      "User",
      "Timestamp",
      ...form.questions.map((q) => q.title),
    ];
    const csvContent = [
      headers.join(","),
      ...responses.map((response) =>
        headers
          .map((header) => {
            const value = response.data[header] || "";
            // Escape commas and quotes in CSV
            return `"${String(value).replace(/"/g, '""')}"`;
          })
          .join(",")
      ),
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form.title.replace(/ - .*/, "")}_responses_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const displayTitle = form
    ? form.title.replace(` - ${form.creatorEmail}`, "")
    : "";

  // Inject CSS for line-clamp
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
    return () => {
      if (document.head.contains(styleSheet)) {
        document.head.removeChild(styleSheet);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex items-center justify-center h-screen px-4">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Form not found
          </p>
          <button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/apps/forms")}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Back to Forms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-4 sm:p-6 min-h-screen"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/apps/forms")}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white leading-tight">
              <span className="hidden sm:inline">{displayTitle} - Results</span>
              <span className="sm:hidden truncate block">{displayTitle}</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              {responses.length}{" "}
              {responses.length === 1 ? "response" : "responses"}
            </p>
          </div>
        </div>

        {/* Export Button */}
        <button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={exportToCSV}
          disabled={responses.length === 0}
          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm rounded-lg hover:bg-white/20 dark:hover:bg-gray-800/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
        >
          <Download className="w-4 h-4" />
          <span className="text-sm sm:text-base">Export CSV</span>
        </button>
      </div>

      {/* Results Content */}
      {responses.length === 0 ? (
        <div className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30 p-8 sm:p-12 text-center">
          <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-2">
            No responses yet
          </h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Share your form to start collecting responses
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-4">
            {responses.map((response, index) => {
              const MobileResponseCard = () => {
                const [expandedQuestions, setExpandedQuestions] = useState<
                  Set<string>
                >(new Set());

                const toggleQuestionExpansion = (questionId: string) => {
                  const newExpanded = new Set(expandedQuestions);
                  if (newExpanded.has(questionId)) {
                    newExpanded.delete(questionId);
                  } else {
                    newExpanded.add(questionId);
                  }
                  setExpandedQuestions(newExpanded);
                };

                return (
                  <div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30 p-4"
                  >
                    {/* Response Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-800 dark:text-white truncate">
                            {response.data.User || "Anonymous"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-gray-500 flex-shrink-0" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {new Date(
                              response.data.Timestamp
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs font-medium text-blue-500 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full flex-shrink-0 ml-2">
                        #{index + 1}
                      </div>
                    </div>

                    {/* Response Data */}
                    <div className="space-y-3">
                      {form.questions.map((question) => {
                        const answer = response.data[question.title];
                        const isLongAnswer =
                          answer && String(answer).length > 100;
                        const isExpanded = expandedQuestions.has(question.id);

                        return (
                          <div
                            key={question.id}
                            className="border-t border-gray-200 dark:border-gray-700 pt-3 first:border-t-0 first:pt-0"
                          >
                            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">
                              {question.title}
                            </div>
                            <div className="text-sm text-gray-800 dark:text-white">
                              {answer ? (
                                <div className="space-y-2">
                                  <div
                                    className={`${isLongAnswer && !isExpanded ? "line-clamp-3" : ""} whitespace-pre-wrap break-words leading-relaxed`}
                                  >
                                    {String(answer)}
                                  </div>
                                  {isLongAnswer && (
                                    <button
                                      onClick={() =>
                                        toggleQuestionExpansion(question.id)
                                      }
                                      className="flex items-center gap-1 text-blue-500 hover:text-blue-600 text-xs font-medium transition-colors"
                                    >
                                      {isExpanded ? (
                                        <>
                                          <EyeOff className="w-3 h-3" />
                                          Show less
                                        </>
                                      ) : (
                                        <>
                                          <Eye className="w-3 h-3" />
                                          Show more
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-500 italic">
                                  No response
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              };

              return <MobileResponseCard key={response.id} />;
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-4 lg:px-6 py-4 text-left text-sm font-semibold text-gray-800 dark:text-white sticky left-0 bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm min-w-[200px]">
                      User
                    </th>
                    <th className="px-4 lg:px-6 py-4 text-left text-sm font-semibold text-gray-800 dark:text-white min-w-[180px]">
                      Timestamp
                    </th>
                    {form.questions.map((q: Question) => (
                      <th
                        key={q.id}
                        className="px-4 lg:px-6 py-4 text-left text-sm font-semibold text-gray-800 dark:text-white min-w-[150px] max-w-[250px]"
                      >
                        <div className="truncate" title={q.title}>
                          {q.title}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {responses.map((response, index) => (
                    <tr
                      key={response.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-white/5 dark:hover:bg-gray-700/20 transition-colors"
                    >
                      <td className="px-4 lg:px-6 py-4 text-sm text-gray-700 dark:text-gray-300 sticky left-0 bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-xs font-medium text-white flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div
                              className="truncate font-medium"
                              title={response.data.User}
                            >
                              {response.data.User || "Anonymous"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        <div className="whitespace-nowrap">
                          <div className="font-medium">
                            {new Date(
                              response.data.Timestamp
                            ).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(
                              response.data.Timestamp
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </td>
                      {form.questions.map((q: Question) => {
                        const answer = response.data[q.title];
                        const isLongAnswer =
                          answer && String(answer).length > 150;
                        // const cellKey = `${response.id}-${q.id}`;
                        const isExpanded = isCellExpanded(response.id, q.id);

                        return (
                          <td
                            key={q.id}
                            className="px-4 lg:px-6 py-4 text-sm text-gray-700 dark:text-gray-300 relative group"
                          >
                            <div className="max-w-[250px]">
                              {answer ? (
                                <div className="space-y-1">
                                  <div
                                    className={`${isLongAnswer && !isExpanded ? "line-clamp-2" : ""} whitespace-pre-wrap break-words leading-relaxed`}
                                  >
                                    {String(answer)}
                                  </div>
                                  {isLongAnswer && (
                                    <button
                                      onClick={() =>
                                        toggleCellExpansion(response.id, q.id)
                                      }
                                      className="flex items-center gap-1 text-blue-500 hover:text-blue-600 text-xs font-medium transition-colors mt-1"
                                    >
                                      {isExpanded ? (
                                        <>
                                          <EyeOff className="w-3 h-3" />
                                          Less
                                        </>
                                      ) : (
                                        <>
                                          <Eye className="w-3 h-3" />
                                          More
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-500 italic text-xs">
                                  No response
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Response Summary for Mobile */}
          <div className="block sm:hidden mt-6 bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30 p-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
              Summary
            </h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-white/10 dark:bg-gray-700/20 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-500">
                  {responses.length}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Total Responses
                </div>
              </div>
              <div className="bg-white/10 dark:bg-gray-700/20 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-500">
                  {form.questions.length}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Questions
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
