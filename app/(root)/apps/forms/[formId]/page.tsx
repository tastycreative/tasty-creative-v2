/* eslint-disable @typescript-eslint/no-explicit-any */
// app/apps/forms/[formId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, Send, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

interface Question {
  id: string;
  title: string;
  required: boolean;
  column: string;
}

interface Form {
  id: string;
  spreadsheetId: string;
  title: string;
  fullTitle: string;
  creatorEmail: string;
  questions: Question[];
}

export default function FormViewPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [responses, setResponses] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchForm();
  }, [params?.formId]);

  const fetchForm = async () => {
    try {
      const response = await fetch(`/api/forms/${params?.formId}`);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setForm(data.form);
    } catch (error) {
      console.error("Error fetching form:", error);
      alert("Error loading form");
      router.push("/apps/forms");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (questionTitle: string, value: any) => {
    setResponses((prev) => ({
      ...prev,
      [questionTitle]: value,
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
          spreadsheetId: form?.spreadsheetId,
          formId: form?.id,
          formTitle: form?.title,
          creatorEmail: form?.creatorEmail,
          data: formData,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit form");

      alert("Form submitted successfully!");
      router.push("/apps/forms");
    } catch {
      alert("Error submitting form");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Form not found
        </p>
      </div>
    );
  }

  const displayTitle = form.title.replace(` - ${form.creatorEmail}`, "");

  return (
    <div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-3xl mx-auto p-6"
    >
      {/* Back Button */}
      <button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => router.push("/apps/forms")}
        className="flex items-center gap-2 mb-6 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
        Back to Forms
      </button>

      {/* Form Header */}
      <div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 p-8 mb-6 text-white"
      >
        <h1 className="text-3xl font-bold mb-2">{displayTitle}</h1>
        <p className="text-white/90">Please fill out this form</p>
      </div>

      {/* Form Questions */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {form.questions.map((question: Question, index: number) => (
          <div
            key={question.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30 p-6"
          >
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
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
                  handleInputChange(question.title, e.target.value)
                }
                className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="your@email.com"
              />
            ) : question.title.toLowerCase().includes("phone") ? (
              <input
                type="tel"
                required={question.required}
                onChange={(e) =>
                  handleInputChange(question.title, e.target.value)
                }
                className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Your phone number"
              />
            ) : question.title.toLowerCase().includes("date") ? (
              <input
                type="date"
                required={question.required}
                onChange={(e) =>
                  handleInputChange(question.title, e.target.value)
                }
                className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            ) : question.title.toLowerCase().includes("description") ||
              question.title.toLowerCase().includes("comment") ||
              question.title.toLowerCase().includes("message") ? (
              <textarea
                required={question.required}
                onChange={(e) =>
                  handleInputChange(question.title, e.target.value)
                }
                className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                rows={4}
                placeholder="Your answer"
              />
            ) : (
              <input
                type="text"
                required={question.required}
                onChange={(e) =>
                  handleInputChange(question.title, e.target.value)
                }
                className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Your answer"
              />
            )}
          </div>
        ))}

        {/* Submit Button */}
        <div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-end"
        >
          <button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium hover:shadow-lg transition-shadow disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
