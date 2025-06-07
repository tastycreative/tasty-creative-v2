// app/apps/forms/[formId]/results/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, Download, Loader2 } from "lucide-react";

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

export default function FormResultsPage() {
  const params = useParams();
  const router = useRouter();
  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFormAndResponses();
  }, [params.formId]);

  const fetchFormAndResponses = async () => {
    try {
      // Fetch form details
      const formResponse = await fetch(`/api/forms/${params.formId}`);
      const formData = await formResponse.json();
      
      if (formData.error) {
        throw new Error(formData.error);
      }
      
      setForm(formData.form);

      // Fetch responses
      const responsesResponse = await fetch(`/api/forms/responses?spreadsheetId=${formData.form.spreadsheetId}`);
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

  const exportToCSV = () => {
    if (!form || responses.length === 0) return;

    // Create CSV content
    const headers = ['User', 'Timestamp', ...form.questions.map(q => q.title)];
    const csvContent = [
      headers.join(','),
      ...responses.map(response => 
        headers.map(header => {
          const value = response.data[header] || '';
          // Escape commas and quotes in CSV
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form.title.replace(/ - .*/, '')}_responses_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
        <p className="text-lg text-gray-600 dark:text-gray-400">Form not found</p>
      </div>
    );
  }

  const displayTitle = form.title.replace(` - ${form.creatorEmail}`, '');

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/apps/forms')}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </motion.button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              {displayTitle} - Results
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {responses.length} responses
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm rounded-lg hover:bg-white/20 dark:hover:bg-gray-800/50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </motion.button>
      </div>

      {/* Results Content */}
      {responses.length === 0 ? (
        <div className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30 p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">No responses yet</p>
        </div>
      ) : (
        <div className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800 dark:text-white">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800 dark:text-white">
                    Timestamp
                  </th>
                  {form.questions.map((q: Question) => (
                    <th key={q.id} className="px-6 py-4 text-left text-sm font-semibold text-gray-800 dark:text-white">
                      {q.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {responses.map((response, index) => (
                  <tr key={response.id} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {response.data.User}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {new Date(response.data.Timestamp).toLocaleString()}
                    </td>
                    {form.questions.map((q: Question) => (
                      <td key={q.id} className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {response.data[q.title] || '-'}
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