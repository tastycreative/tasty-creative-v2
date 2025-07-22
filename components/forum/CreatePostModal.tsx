"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bold, Italic, Link, Image as ImageIcon } from "lucide-react";
import { ForumCategory } from "../../lib/forum-api";

export interface ForumType {
  type: "general" | "model";
  name?: string; // model name if type is "model"
}

interface ModelOption {
  name: string;
  id?: string;
}

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    content: string;
    categoryId: number;
    modelName?: string;
  }) => Promise<void>;
  categories: ForumCategory[];
  forum: ForumType;
  loading?: boolean;
  models?: ModelOption[];
}

export function CreatePostModal({
  isOpen,
  onClose,
  onSubmit,
  categories,
  forum,
  loading = false,
  models = [],
}: CreatePostModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedForum, setSelectedForum] = useState("General");

  // Auto-select the first category when categories load
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].name);
    }
  }, [categories, selectedCategory]);

  // Reset selectedForum when forum changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (forum.type === "model" && forum.name) {
        setSelectedForum(forum.name);
      } else if (forum.type === "general" && forum.name !== "All Forums") {
        setSelectedForum("General");
      } else {
        setSelectedForum("General");
      }
    }
  }, [isOpen, forum]);

  const handleSubmit = async () => {
    console.log('Submit clicked', { title: title.trim(), content: content.trim(), loading });
    
    if (!title.trim() || !content.trim()) {
      console.log('Form validation failed:', { 
        titleEmpty: !title.trim(), 
        contentEmpty: !content.trim() 
      });
      return;
    }

    const categoryId = categories.find(c => c.name === selectedCategory)?.id;
    if (!categoryId) {
      console.log('Category not found:', selectedCategory);
      return;
    }

    const postData = {
      title,
      content,
      categoryId,
      modelName: (forum.type === "model" && forum.name) 
        ? forum.name 
        : (forum.name === "All Forums" && selectedForum !== "General") 
          ? selectedForum 
          : undefined,
    };

    console.log('Submitting post data:', postData);
    await onSubmit(postData);
    
    // Reset form
    setTitle("");
    setContent("");
    setSelectedCategory(categories.length > 0 ? categories[0].name : "");
    setSelectedForum("General");
  };

  const getModalTitle = () => {
    if (forum.name === "All Forums") {
      return "Create New Post";
    }
    if (forum.type === "general") {
      return "Create New Post";
    }
    return `Create New Post in ${forum.name} Forum`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl border border-pink-200 p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto relative shadow-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {getModalTitle()}
              </h3>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-pink-50 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Forum Context */}
              {forum.type === "model" && (
                <div className="bg-gradient-to-r from-pink-100 to-rose-100 border border-pink-300 rounded-lg p-3">
                  <p className="text-sm text-gray-700">
                    👤 Posting in <span className="font-semibold">{forum.name}</span> forum
                  </p>
                </div>
              )}

              {/* Forum Selection for All Forums view */}
              {forum.name === "All Forums" && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Choose Forum
                  </label>
                  <select
                    value={selectedForum}
                    onChange={(e) => setSelectedForum(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-pink-200 rounded-lg text-gray-900 focus:outline-none focus:border-pink-500 shadow-sm"
                  >
                    {models.map((model) => (
                      <option
                        key={model.name}
                        value={model.name}
                        className="bg-white"
                      >
                        {model.name === "General"
                          ? "🌍 General Forum"
                          : `👤 ${model.name} Forum`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-100/80 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-purple-500"
                >
                  {categories.map((category) => (
                    <option
                      key={category.id}
                      value={category.name}
                      className="bg-gray-100"
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter your post title..."
                  className="w-full px-3 py-2 bg-white border border-pink-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-pink-500 shadow-sm"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Content
                </label>
                <div className="border border-pink-200 rounded-lg overflow-hidden">
                  {/* Formatting toolbar */}
                  <div className="bg-pink-50 px-3 py-2 border-b border-pink-200 flex items-center gap-2">
                    <button className="p-1 rounded text-gray-600 hover:text-gray-900 hover:bg-pink-100">
                      <Bold className="w-4 h-4" />
                    </button>
                    <button className="p-1 rounded text-gray-600 hover:text-gray-900 hover:bg-pink-100">
                      <Italic className="w-4 h-4" />
                    </button>
                    <button className="p-1 rounded text-gray-600 hover:text-gray-900 hover:bg-pink-100">
                      <Link className="w-4 h-4" />
                    </button>
                    <button className="p-1 rounded text-gray-600 hover:text-gray-900 hover:bg-pink-100">
                      <ImageIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={
                      forum.type === "model" 
                        ? `Share your thoughts about ${forum.name}, tips, or questions...`
                        : forum.name === "All Forums" && selectedForum !== "General"
                          ? `Share your thoughts about ${selectedForum}, tips, or questions...`
                          : "Share your thoughts, tips, or questions..."
                    }
                    rows={6}
                    className="w-full px-3 py-2 bg-transparent text-gray-900 placeholder-gray-500 focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!title.trim() || !content.trim() || loading}
                  className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg hover:from-pink-600 hover:to-rose-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  title={`Post button - Title: "${title.trim()}", Content: "${content.trim()}", Loading: ${loading}`}
                >
                  {loading ? "Creating..." : "Post"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
