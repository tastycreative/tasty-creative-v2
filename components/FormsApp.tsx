"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Plus,
  MoreVertical,
  Eye,
  Edit3,
  Trash2,
  Copy,
  Users,
  Calendar,
  ChevronLeft,
  CheckCircle,
  Circle,
  Square,
  ChevronDown,
  BarChart3,
  PieChart,
  Download,
  Filter,
  Share2,
  Settings,
  Star,
  Clock,
  Send,
  GripVertical,
  Type,
  Hash,
  Mail,
  Phone,
  Link2,
  AlignLeft,
  List,
  ToggleLeft,
  Upload,
} from "lucide-react";

type ViewType = "list" | "form" | "results";
type QuestionType = "text" | "textarea" | "number" | "email" | "phone" | "url" | "radio" | "checkbox" | "dropdown" | "date" | "time" | "file";

interface Question {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  options?: string[];
}

interface Form {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  responses: number;
  status: "active" | "closed";
  questions: Question[];
  theme: string;
}

interface FormResponse {
  id: string;
  formId: string;
  submittedAt: Date;
  answers: Record<string, any>;
}

export default function FormsApp() {
  const [currentView, setCurrentView] = useState<ViewType>("list");
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [hoveredForm, setHoveredForm] = useState<string | null>(null);

  // Sample forms data
  const [forms] = useState<Form[]>([
    {
      id: "1",
      title: "Customer Feedback Survey",
      description: "Help us improve our services",
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-20"),
      responses: 156,
      status: "active",
      questions: [
        {
          id: "q1",
          type: "text",
          title: "What's your name?",
          required: true,
        },
        {
          id: "q2",
          type: "email",
          title: "Email address",
          description: "We'll send you a copy of your responses",
          required: true,
        },
        {
          id: "q3",
          type: "radio",
          title: "How satisfied are you with our service?",
          required: true,
          options: ["Very satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very dissatisfied"],
        },
        {
          id: "q4",
          type: "textarea",
          title: "Any suggestions for improvement?",
          description: "Your feedback helps us serve you better",
          required: false,
        },
      ],
      theme: "from-blue-500 to-indigo-500",
    },
    {
      id: "2",
      title: "Event Registration",
      description: "Register for our upcoming webinar",
      createdAt: new Date("2024-01-10"),
      updatedAt: new Date("2024-01-18"),
      responses: 89,
      status: "active",
      questions: [],
      theme: "from-purple-500 to-pink-500",
    },
    {
      id: "3",
      title: "Employee Satisfaction",
      description: "Annual employee survey",
      createdAt: new Date("2024-01-05"),
      updatedAt: new Date("2024-01-05"),
      responses: 234,
      status: "closed",
      questions: [],
      theme: "from-green-500 to-emerald-500",
    },
  ]);

  const handleFormClick = (form: Form) => {
    setSelectedForm(form);
    setCurrentView("form");
  };

  const handleViewResults = (form: Form) => {
    setSelectedForm(form);
    setCurrentView("results");
  };

  const handleBack = () => {
    setCurrentView("list");
    setSelectedForm(null);
  };

  return (
    <div className="w-full h-full">
      <AnimatePresence mode="wait">
        {currentView === "list" && (
          <FormsList
            key="list"
            forms={forms}
            hoveredForm={hoveredForm}
            setHoveredForm={setHoveredForm}
            handleFormClick={handleFormClick}
            handleViewResults={handleViewResults}
          />
        )}
        {currentView === "form" && selectedForm && (
          <FormView
            key="form"
            form={selectedForm}
            handleBack={handleBack}
          />
        )}
        {currentView === "results" && selectedForm && (
          <ResultsView
            key="results"
            form={selectedForm}
            handleBack={handleBack}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Forms List Component
function FormsList({
  forms,
  hoveredForm,
  setHoveredForm,
  handleFormClick,
  handleViewResults,
}: {
  forms: Form[];
  hoveredForm: string | null;
  setHoveredForm: (id: string | null) => void;
  handleFormClick: (form: Form) => void;
  handleViewResults: (form: Form) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Forms
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Create and manage your forms
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium hover:shadow-lg transition-shadow"
        >
          <Plus className="w-5 h-5" />
          Create Form
        </motion.button>
      </div>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forms.map((form, index) => (
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
              className="h-full bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30 p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
              onClick={() => handleFormClick(form)}
            >
              {/* Form Header */}
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${form.theme} bg-opacity-20`}>
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-2">
                  {form.status === "active" ? (
                    <span className="px-2 py-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded-full">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30 rounded-full">
                      Closed
                    </span>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle menu
                    }}
                    className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </motion.button>
                </div>
              </div>

              {/* Form Info */}
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                {form.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                {form.description}
              </p>

              {/* Stats */}
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{form.responses}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{form.updatedAt.toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Hover Actions */}
              <AnimatePresence>
                {hoveredForm === form.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-6 left-6 right-6 flex gap-2"
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
                        // Handle edit
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg text-sm font-medium hover:bg-white dark:hover:bg-gray-800 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// Form View Component
function FormView({ form, handleBack }: { form: Form; handleBack: () => void }) {
  const [responses, setResponses] = useState<Record<string, any>>({});

  const handleInputChange = (questionId: string, value: any) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", responses);
    // Handle form submission
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-3xl mx-auto p-6"
    >
      {/* Back Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleBack}
        className="flex items-center gap-2 mb-6 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
        Back to Forms
      </motion.button>

      {/* Form Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`rounded-2xl bg-gradient-to-r ${form.theme} p-8 mb-6 text-white`}
      >
        <h1 className="text-3xl font-bold mb-2">{form.title}</h1>
        <p className="text-white/90">{form.description}</p>
      </motion.div>

      {/* Form Questions */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {form.questions.map((question, index) => (
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30 p-6"
          >
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
                {question.title}
                {question.required && <span className="text-red-500 ml-1">*</span>}
              </h3>
              {question.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {question.description}
                </p>
              )}
            </div>

            {/* Question Input */}
            {question.type === "text" && (
              <input
                type="text"
                required={question.required}
                onChange={(e) => handleInputChange(question.id, e.target.value)}
                className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Your answer"
              />
            )}

            {question.type === "email" && (
              <input
                type="email"
                required={question.required}
                onChange={(e) => handleInputChange(question.id, e.target.value)}
                className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="your@email.com"
              />
            )}

            {question.type === "textarea" && (
              <textarea
                required={question.required}
                onChange={(e) => handleInputChange(question.id, e.target.value)}
                className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                rows={4}
                placeholder="Your answer"
              />
            )}

            {question.type === "radio" && question.options && (
              <div className="space-y-3">
                {question.options.map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={option}
                      required={question.required}
                      onChange={(e) => handleInputChange(question.id, e.target.value)}
                      className="w-5 h-5 text-blue-500 border-gray-300 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                      {option}
                    </span>
                  </label>
                ))}
              </div>
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
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium hover:shadow-lg transition-shadow"
          >
            <Send className="w-5 h-5" />
            Submit
          </motion.button>
        </motion.div>
      </form>
    </motion.div>
  );
}

// Results View Component
function ResultsView({ form, handleBack }: { form: Form; handleBack: () => void }) {
  const [activeTab, setActiveTab] = useState<"summary" | "responses">("summary");

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
            onClick={handleBack}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </motion.button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              {form.title} - Results
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {form.responses} responses
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm rounded-lg hover:bg-white/20 dark:hover:bg-gray-800/50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm rounded-lg hover:bg-white/20 dark:hover:bg-gray-800/50 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share
          </motion.button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("summary")}
          className={`pb-3 px-1 font-medium transition-colors ${
            activeTab === "summary"
              ? "text-blue-500 border-b-2 border-blue-500"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          }`}
        >
          Summary
        </button>
        <button
          onClick={() => setActiveTab("responses")}
          className={`pb-3 px-1 font-medium transition-colors ${
            activeTab === "responses"
              ? "text-blue-500 border-b-2 border-blue-500"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          }`}
        >
          Individual Responses
        </button>
      </div>

      {/* Content */}
      {activeTab === "summary" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Response Rate Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30 p-6"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-blue-500" />
              Response Overview
            </h3>
            <div className="text-center">
              <div className="text-5xl font-bold text-gray-800 dark:text-white mb-2">
                {form.responses}
              </div>
              <p className="text-gray-600 dark:text-gray-400">Total Responses</p>
            </div>
          </motion.div>

          {/* Completion Rate */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30 p-6"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Completion Rate
            </h3>
            <div className="text-center">
              <div className="text-5xl font-bold text-gray-800 dark:text-white mb-2">
                92%
              </div>
              <p className="text-gray-600 dark:text-gray-400">Average completion</p>
            </div>
          </motion.div>

          {/* Question Analytics */}
          {form.questions.map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30 p-6 lg:col-span-2"
            >
              <h3 className="text-lg font-semibold mb-4">{question.title}</h3>
              {question.type === "radio" && question.options && (
                <div className="space-y-3">
                  {question.options.map((option) => (
                    <div key={option} className="flex items-center justify-between">
                      <span className="text-gray-700 dark:text-gray-300">{option}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${Math.random() * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {Math.floor(Math.random() * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {activeTab === "responses" && (
        <div className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/30 p-6">
          <p className="text-gray-600 dark:text-gray-400 text-center py-8">
            Individual responses view coming soon...
          </p>
        </div>
      )}
    </motion.div>
  );
}