/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  FileText,
  Plus,
  Edit3,
  Users,
  Calendar,
  ChevronLeft,
  CheckCircle,
  BarChart3,
  Download,
  Send,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";

type ViewType = "list" | "form" | "results" | "create";

interface Question {
  id: string;
  title: string;
  required: boolean;
  column: string; // Spreadsheet column letter
}

interface Form {
  id: string;
  spreadsheetId: string;
  title: string;
  fullTitle: string; // Title with email
  creatorEmail: string;
  createdAt: Date;
  updatedAt: Date;
  questions: Question[];
  responses: number;
}

interface FormResponse {
  id: string;
  formId: string;
  submittedAt: Date;
  data: Record<string, any>;
}

export default function FormsApp() {
  const { data: session } = useSession();
  const [currentView, setCurrentView] = useState<ViewType>("list");
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredForm, setHoveredForm] = useState<string | null>(null);

  // Fetch forms from Google Drive folder
  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setLoading(true);
      // This would be your API call to fetch spreadsheets from the Google Drive folder
      const response = await fetch(`/api/forms/list`);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setForms(data.forms);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch forms");
    } finally {
      setLoading(false);
    }
  };

  const handleFormClick = (form: Form) => {
    // Navigate to form with ID in URL
    window.location.href = `/apps/forms/${form.id}`;
  };

  const handleViewResults = (form: Form) => {
    // Navigate to results with ID in URL
    window.location.href = `/apps/forms/${form.id}/results`;
  };

  const handleEdit = (form: Form) => {
    // Check if user can edit (creator email matches session email)
    if (session?.user?.email === form.creatorEmail) {
      setSelectedForm(form);
      setCurrentView("create");
    } else {
      alert("You can only edit forms you created");
    }
  };

  const handleBack = () => {
    setCurrentView("list");
    setSelectedForm(null);
  };

  const handleCreateNew = () => {
    setSelectedForm(null);
    setCurrentView("create");
  };

  return (
    <div className="w-full h-full min-h-screen">
      <AnimatePresence mode="wait">
        {currentView === "list" && (
          <FormsList
            key="list"
            forms={forms}
            loading={loading}
            error={error}
            hoveredForm={hoveredForm}
            setHoveredForm={setHoveredForm}
            handleFormClick={handleFormClick}
            handleViewResults={handleViewResults}
            handleEdit={handleEdit}
            handleCreateNew={handleCreateNew}
            session={session}
          />
        )}
        {currentView === "form" && selectedForm && (
          <FormView
            key="form"
            form={selectedForm}
            handleBack={handleBack}
            session={session}
          />
        )}
        {currentView === "results" && selectedForm && (
          <ResultsView
            key="results"
            form={selectedForm}
            handleBack={handleBack}
          />
        )}
        {currentView === "create" && (
          <CreateEditForm
            key="create"
            form={selectedForm}
            handleBack={handleBack}
            session={session}
            onSuccess={() => {
              fetchForms();
              handleBack();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Forms List Component
function FormsList({
  forms,
  loading,
  error,
  hoveredForm,
  setHoveredForm,
  handleFormClick,
  handleViewResults,
  handleEdit,
  handleCreateNew,
  session,
}: any) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen px-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-lg font-medium text-gray-800 dark:text-white mb-2 text-center">
          Error loading forms
        </p>
        <p className="text-gray-600 dark:text-gray-400 text-center">{error}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-4 sm:p-6 min-h-screen"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Forms
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
            Manage your Google Sheets forms
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCreateNew}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium hover:shadow-lg transition-shadow w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          <span className="whitespace-nowrap">Create Form</span>
        </motion.button>
      </div>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {forms.map((form: Form, index: number) => {
          const canEdit = session?.user?.email === form.creatorEmail;
          const displayTitle = form.title.replace(
            ` - ${form.creatorEmail}`,
            ""
          );

          return (
            <motion.div
              key={form.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
              onMouseEnter={() => setHoveredForm(form.id)}
              onMouseLeave={() => setHoveredForm(null)}
            >
              <div
                className="h-full bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30 p-4 sm:p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] min-h-[200px] sm:min-h-[220px]"
                onClick={() => handleFormClick(form)}
              >
                {/* Form Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 bg-opacity-20">
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded-full">
                      Active
                    </span>
                  </div>
                </div>

                {/* Form Info */}
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-2 line-clamp-2 leading-tight">
                  {displayTitle}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 truncate">
                  Created by {form.creatorEmail.split("@")[0]}
                </p>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{form.responses || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">
                        {new Date(form.updatedAt).toLocaleDateString()}
                      </span>
                      <span className="sm:hidden">
                        {new Date(form.updatedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mobile Action Buttons - Always visible on mobile */}
                <div className="sm:hidden mt-4 flex gap-2">
                  {canEdit && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewResults(form);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg text-xs font-medium hover:bg-white dark:hover:bg-gray-800 transition-colors"
                      >
                        <BarChart3 className="w-3 h-3" />
                        Results
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(form);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg text-xs font-medium hover:bg-white dark:hover:bg-gray-800 transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                        Edit
                      </button>
                    </>
                  )}
                </div>

                {/* Desktop Hover Actions */}
                {canEdit && (
                  <AnimatePresence>
                    {hoveredForm === form.id && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="hidden sm:flex absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 gap-2"
                      >
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewResults(form);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg text-sm font-medium hover:bg-white dark:hover:bg-gray-800 transition-colors"
                        >
                          <BarChart3 className="w-4 h-4" />
                          Results
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(form);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg text-sm font-medium hover:bg-white dark:hover:bg-gray-800 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                          Edit
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {forms.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-12 sm:py-16">
          <FileText className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-2">
            No forms yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-6 px-4">
            Create your first form to get started collecting responses
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium hover:shadow-lg transition-shadow"
          >
            <Plus className="w-5 h-5" />
            Create Your First Form
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}

// Form View Component
function FormView({ form, handleBack, session }: any) {
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const displayTitle = form.title.replace(` - ${form.creatorEmail}`, "");

  const handleInputChange = (questionId: string, value: any) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      // Add User (email and name) and Timestamp
      const formData = {
        User: `${session?.user?.name || ""} (${session?.user?.email || ""})`,
        Timestamp: new Date().toISOString(),
        ...responses,
      };

      // Submit to API
      const response = await fetch("/api/forms/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spreadsheetId: form.spreadsheetId,
          data: formData,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit form");

      alert("Form submitted successfully!");
      handleBack();
    } catch {
      alert("Error submitting form");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-3xl mx-auto p-4 sm:p-6 min-h-screen"
    >
      {/* Back Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleBack}
        className="flex items-center gap-2 mb-4 sm:mb-6 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="hidden sm:inline">Back to Forms</span>
        <span className="sm:hidden">Back</span>
      </motion.button>

      {/* Form Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 p-6 sm:p-8 mb-6 text-white"
      >
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 leading-tight">
          {displayTitle}
        </h1>
        <p className="text-white/90 text-sm sm:text-base">
          Please fill out this form
        </p>
      </motion.div>

      {/* Form Questions */}
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {form.questions.map((question: Question, index: number) => (
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30 p-4 sm:p-6"
          >
            <div className="mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-1 leading-tight">
                {question.title}
                {question.required && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </h3>
            </div>

            {/* Dynamic Input based on question type */}
            {question.title.toLowerCase().includes("email") ? (
              <input
                type="email"
                required={question.required}
                onChange={(e) =>
                  handleInputChange(
                    question.title.replace(" - required", "").trim(),
                    e.target.value
                  )
                }
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm sm:text-base"
                placeholder="your@email.com"
              />
            ) : question.title.toLowerCase().includes("phone") ? (
              <input
                type="tel"
                required={question.required}
                onChange={(e) =>
                  handleInputChange(
                    question.title.replace(" - required", "").trim(),
                    e.target.value
                  )
                }
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm sm:text-base"
                placeholder="Your phone number"
              />
            ) : question.title.toLowerCase().includes("date") ? (
              <input
                type="date"
                required={question.required}
                onChange={(e) =>
                  handleInputChange(
                    question.title.replace(" - required", "").trim(),
                    e.target.value
                  )
                }
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm sm:text-base"
              />
            ) : question.title.toLowerCase().includes("description") ||
              question.title.toLowerCase().includes("comment") ||
              question.title.toLowerCase().includes("message") ? (
              <textarea
                required={question.required}
                onChange={(e) =>
                  handleInputChange(
                    question.title.replace(" - required", "").trim(),
                    e.target.value
                  )
                }
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none text-sm sm:text-base"
                rows={4}
                placeholder="Your answer"
              />
            ) : (
              <input
                type="text"
                required={question.required}
                onChange={(e) =>
                  handleInputChange(
                    question.title.replace(" - required", "").trim(),
                    e.target.value
                  )
                }
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm sm:text-base"
                placeholder="Your answer"
              />
            )}
          </motion.div>
        ))}

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-end"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium hover:shadow-lg transition-shadow disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            {submitting ? "Submitting..." : "Submit"}
          </motion.button>
        </motion.div>
      </form>
    </motion.div>
  );
}

// Results View Component
function ResultsView({ form, handleBack }: any) {
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const displayTitle = form.title.replace(` - ${form.creatorEmail}`, "");

  useEffect(() => {
    fetchResponses();
  }, []);

  const fetchResponses = async () => {
    try {
      const response = await fetch(
        `/api/forms/responses?spreadsheetId=${form.spreadsheetId}`
      );
      const data = await response.json();
      setResponses(data.responses || []);
    } catch (error) {
      console.error("Error fetching responses:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    // Export functionality
    //console.log("Exporting to CSV...");
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-4 sm:p-6 min-h-screen"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
        <div className="flex items-center gap-2 sm:gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBack}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </motion.button>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white leading-tight">
              <span className="hidden sm:inline">{displayTitle} - Results</span>
              <span className="sm:hidden">Results</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              {responses.length} responses
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={exportToCSV}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm rounded-lg hover:bg-white/20 dark:hover:bg-gray-800/50 transition-colors text-sm sm:text-base"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </motion.button>
        </div>
      </div>

      {/* Results Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : responses.length === 0 ? (
        <div className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30 p-8 sm:p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">No responses yet</p>
        </div>
      ) : (
        <div className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30 overflow-hidden">
          {/* Mobile Card View */}
          <div className="sm:hidden">
            <div className="space-y-4 p-4">
              {responses.map((response, index) => (
                <div
                  key={response.id}
                  className="bg-white/5 dark:bg-gray-700/20 rounded-lg p-4 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="text-sm font-medium text-gray-800 dark:text-white">
                      Response #{index + 1}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {new Date(response.data.Timestamp).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {response.data.User}
                  </div>
                  <div className="space-y-2">
                    {form.questions.map((q: Question) => (
                      <div key={q.id} className="text-sm">
                        <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {q.title}:
                        </div>
                        <div className="text-gray-600 dark:text-gray-400 pl-2">
                          {response.data[q.column] || "-"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 lg:px-6 py-4 text-left text-sm font-semibold text-gray-800 dark:text-white">
                    Timestamp
                  </th>
                  {form.questions.map((q: Question) => (
                    <th
                      key={q.id}
                      className="px-4 lg:px-6 py-4 text-left text-sm font-semibold text-gray-800 dark:text-white min-w-[120px]"
                    >
                      <div className="truncate" title={q.title}>
                        {q.title}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {responses.map((response) => (
                  <tr
                    key={response.id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-white/5 dark:hover:bg-gray-700/20 transition-colors"
                  >
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-[200px]">
                      <div className="truncate" title={response.data.User}>
                        {response.data.User}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      <div className="whitespace-nowrap">
                        {new Date(response.data.Timestamp).toLocaleString()}
                      </div>
                    </td>
                    {form.questions.map((q: Question) => (
                      <td
                        key={q.id}
                        className="px-4 lg:px-6 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-[200px]"
                      >
                        <div
                          className="truncate"
                          title={response.data[q.column] || "-"}
                        >
                          {response.data[q.column] || "-"}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Create/Edit Form Component
function CreateEditForm({ form, handleBack, session, onSuccess }: any) {
  const [title, setTitle] = useState(
    form ? form.title.replace(` - ${form.creatorEmail}`, "") : ""
  );
  const [headers, setHeaders] = useState<string[]>(
    form ? form.questions.map((q: Question) => q.title) : [""]
  );
  const [submitting, setSubmitting] = useState(false);

  const addHeader = () => {
    setHeaders([...headers, ""]);
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const updateHeader = (index: number, value: string) => {
    const newHeaders = [...headers];
    newHeaders[index] = value;
    setHeaders(newHeaders);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please enter a form title");
      return;
    }

    if (headers.filter((h) => h.trim()).length === 0) {
      alert("Please add at least one question");
      return;
    }

    try {
      setSubmitting(true);

      const formData = {
        title: `${title} - ${session?.user?.email}`,
        headers: ["User", "Timestamp", ...headers.filter((h) => h.trim())],
        spreadsheetId: form?.spreadsheetId,
      };

      const response = await fetch("/api/forms/create", {
        method: form ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to save form");

      onSuccess();
    } catch {
      alert("Error saving form");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-3xl mx-auto p-4 sm:p-6 min-h-screen"
    >
      {/* Back Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleBack}
        className="flex items-center gap-2 mb-4 sm:mb-6 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="hidden sm:inline">Back to Forms</span>
        <span className="sm:hidden">Back</span>
      </motion.button>

      {/* Form Header */}
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-6 sm:mb-8">
        {form ? "Edit Form" : "Create New Form"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Form Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30 p-4 sm:p-6"
        >
          <label className="block text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Form Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm sm:text-base"
            placeholder="Enter form title"
            required
          />
          <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Your email will be automatically added to the title
          </p>
        </motion.div>

        {/* Headers/Questions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30 p-4 sm:p-6"
        >
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-2 sm:space-y-0">
            <label className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">
              Form Questions
            </label>
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={addHeader}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors w-full sm:w-auto justify-center sm:justify-start"
            >
              <Plus className="w-4 h-4" />
              Add Question
            </motion.button>
          </div>

          <div className="space-y-3">
            {headers.map((header, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={header}
                  onChange={(e) => updateHeader(index, e.target.value)}
                  className="flex-1 px-3 sm:px-4 py-2 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm sm:text-base"
                  placeholder={`Question ${index + 1} (add ' - required' for required fields)`}
                />
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => removeHeader(index)}
                  className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.button>
              </motion.div>
            ))}
          </div>

          <p className="mt-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Add &quot; - required&quot; to the end of a question to make it
            required
          </p>
        </motion.div>

        {/* Submit Button */}
        {(session?.user?.role === "ADMIN" ||
          session?.user?.role === "MODERATOR") && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row justify-end gap-4"
          >
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBack}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors order-2 sm:order-1"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium hover:shadow-lg transition-shadow disabled:opacity-50 order-1 sm:order-2"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle className="w-5 h-5" />
              )}
              {submitting ? "Saving..." : form ? "Update Form" : "Create Form"}
            </motion.button>
          </motion.div>
        )}
      </form>
    </motion.div>
  );
}

// API helper function to parse headers
export function parseFormHeaders(headers: string[]): Question[] {
  // Skip User and Timestamp columns (A and B)
  const questions: Question[] = [];
  const columnLetters = "CDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  headers.slice(2).forEach((header, index) => {
    if (header.trim()) {
      const isRequired = header.includes(" - required");
      const title = header.replace(" - required", "").trim();

      questions.push({
        id: `q${index + 1}`,
        title,
        required: isRequired,
        column: columnLetters[index],
      });
    }
  });

  return questions;
}

// API helper to parse form from spreadsheet data
export function parseFormFromSpreadsheet(spreadsheet: any): Form {
  const fullTitle = spreadsheet.properties.title;
  const parts = fullTitle.split(" - ");
  const creatorEmail = parts[parts.length - 1];
  // const title = parts.slice(0, -1).join(" - ");

  return {
    id: spreadsheet.spreadsheetId,
    spreadsheetId: spreadsheet.spreadsheetId,
    title: fullTitle,
    fullTitle,
    creatorEmail,
    createdAt: new Date(spreadsheet.createdTime || Date.now()),
    updatedAt: new Date(spreadsheet.modifiedTime || Date.now()),
    questions: [], // Will be populated when headers are fetched
    responses: 0, // Will be calculated from rows
  };
}
