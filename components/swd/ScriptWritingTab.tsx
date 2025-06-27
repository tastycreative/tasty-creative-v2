"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Save,
  Upload,
  FileText,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Undo,
  Redo,
  CheckCircle,
  Loader2,
  FolderOpen,
  Eye,
  Edit,
  RefreshCw,
} from "lucide-react";

interface ScriptWritingTabProps {
  onDocumentSaved?: () => void;
}

interface GoogleDoc {
  id: string;
  name: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink: string;
  size?: string;
}

export const ScriptWritingTab: React.FC<ScriptWritingTabProps> = ({
  onDocumentSaved,
}) => {
  const [documentTitle, setDocumentTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [uploadedDocUrl, setUploadedDocUrl] = useState("");
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);

  // Document management states
  const [documents, setDocuments] = useState<GoogleDoc[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [isLoadingDocContent, setIsLoadingDocContent] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set default title with timestamp
    const now = new Date();
    const defaultTitle = `Script Draft - ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    setDocumentTitle(defaultTitle);
  }, []);

  const fetchDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      const response = await fetch("/api/google/list-scripts");
      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
      alert("Failed to fetch documents. Please try again.");
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const loadDocumentContent = useCallback(async (doc: GoogleDoc) => {
    setIsLoadingDocContent(true);
    try {
      const response = await fetch(
        `/api/google/get-script-content?docId=${doc.id}`
      );
      if (!response.ok) {
        throw new Error("Failed to load document content");
      }
      const data = await response.json();

      // Load the content into the editor, preserving HTML formatting
      setDocumentTitle(doc.name);

      // Use htmlContent if available, otherwise fall back to plain content
      const contentToLoad = data.htmlContent || data.content || "";
      setDocumentContent(contentToLoad);
      setCurrentDocId(doc.id);
      setShowDocumentsModal(false);

      // Save to local storage with both content types
      const saveData = {
        title: doc.name,
        content: contentToLoad,
        htmlContent: data.htmlContent,
        lastSaved: new Date().toISOString(),
        docId: doc.id,
      };
      localStorage.setItem("swd-script-draft", JSON.stringify(saveData));
    } catch (error) {
      console.error("Error loading document content:", error);
      alert("Failed to load document content. Please try again.");
    } finally {
      setIsLoadingDocContent(false);
    }
  }, []);

  const processHtmlContent = (
    htmlContent: string
  ): { plainText: string; processedHtml: string } => {
    // Only run DOM processing in browser environment
    if (typeof window === "undefined")
      return { plainText: "", processedHtml: htmlContent };

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;

    // Convert specific font sizes and ensure they have proper CSS specificity
    const spans = tempDiv.querySelectorAll('span[style*="font-size"]');
    spans.forEach((span) => {
      const style = span.getAttribute("style") || "";
      const fontSizeMatch = style.match(/font-size:\s*(\d+)pt/);
      if (fontSizeMatch) {
        const size = fontSizeMatch[1];
        // Ensure proper font size attribute with !important to override editor defaults
        span.setAttribute("data-font-size", size + "pt");
        // Update the style to use the correct format with higher specificity
        const currentStyle = span.getAttribute("style") || "";
        const updatedStyle = currentStyle.includes("font-size")
          ? currentStyle.replace(
              /font-size:\s*[^;]+/,
              `font-size: ${size}pt !important`
            )
          : `${currentStyle}; font-size: ${size}pt !important`;
        span.setAttribute("style", updatedStyle);
      }
    });

    // Also handle direct font-size styles in other elements
    const allElements = tempDiv.querySelectorAll('*[style*="font-size"]');
    allElements.forEach((element) => {
      const style = element.getAttribute("style") || "";
      if (style.includes("font-size") && !style.includes("!important")) {
        const updatedStyle = style.replace(
          /font-size:\s*([^;]+)/g,
          "font-size: $1 !important"
        );
        element.setAttribute("style", updatedStyle);
      }
    });

    // Get clean text content without duplication
    const plainTextContent = tempDiv.textContent || tempDiv.innerText || "";

    // Clean processed HTML content
    let processedHtmlContent = tempDiv.innerHTML;

    // Remove any duplicate content that might occur
    const textContent = plainTextContent.trim();
    if (textContent !== processedHtmlContent.replace(/<[^>]*>/g, "").trim()) {
      // If there's a mismatch, use the plain text as the source of truth
      tempDiv.textContent = textContent;
      processedHtmlContent = tempDiv.innerHTML;
    }

    return {
      plainText: plainTextContent,
      processedHtml: processedHtmlContent,
    };
  };

  const updateExistingDocument = async () => {
    if (!currentDocId || !documentTitle.trim()) {
      alert("Please make sure you have a document loaded and a title.");
      return;
    }

    const content = getDocumentContent();
    if (!content.trim()) {
      alert("Please write some content before updating.");
      return;
    }

    setIsUploading(true);

    try {
      // Process HTML content on client side
      const { plainText, processedHtml } = processHtmlContent(content);

      const response = await fetch("/api/google/update-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          docId: currentDocId,
          title: documentTitle,
          content: plainText,
          htmlContent: processedHtml,
          preserveFormatting: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update document");
      }

      const result = await response.json();
      setUploadedDocUrl(result.webViewLink);
      setShowSuccessModal(true);

      if (onDocumentSaved) {
        onDocumentSaved();
      }
    } catch (error) {
      console.error("Update error:", error);
      alert(
        `Failed to update document: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsUploading(false);
    }
  };

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleFontSizeChange = (size: string) => {
    // Extract the numeric value from the point size (e.g., "12pt" -> "12")
    // Use the actual point size for better consistency
    if (editorRef.current) {
      document.execCommand("fontSize", false, "7"); // Use a standard HTML size first
      // Then apply the actual point size via CSS
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (!range.collapsed) {
          const span = document.createElement("span");
          span.style.fontSize = size;
          try {
            range.surroundContents(span);
          } catch {
            // If surroundContents fails, extract and wrap contents
            const contents = range.extractContents();
            span.appendChild(contents);
            range.insertNode(span);
          }
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }
    editorRef.current?.focus();
  };

  const getDocumentContent = () => {
    return editorRef.current?.innerHTML || "";
  };

  const setDocumentContent = (content: string) => {
    if (editorRef.current) {
      editorRef.current.innerHTML = content;
    }
  };

  const saveToLocalStorage = () => {
    const content = getDocumentContent();
    const saveData = {
      title: documentTitle,
      content: content,
      htmlContent: content, // Save the HTML content to preserve formatting
      lastSaved: new Date().toISOString(),
      docId: currentDocId,
    };
    localStorage.setItem("swd-script-draft", JSON.stringify(saveData));

    // Show brief save confirmation
    const saveBtn = document.getElementById("save-btn");
    if (saveBtn) {
      const originalText = saveBtn.textContent;
      saveBtn.textContent = "Saved!";
      setTimeout(() => {
        saveBtn.textContent = originalText;
      }, 1000);
    }
  };

  const loadFromLocalStorage = useCallback(() => {
    const saved = localStorage.getItem("swd-script-draft");
    if (saved) {
      const saveData = JSON.parse(saved);
      setDocumentTitle(saveData.title);
      // Use htmlContent if available for better formatting preservation
      const contentToLoad = saveData.htmlContent || saveData.content;
      setDocumentContent(contentToLoad);
      setCurrentDocId(saveData.docId || null);
      return true; // Return true if local draft was loaded
    }
    return false; // Return false if no local draft exists
  }, []);

  const uploadToGoogleDrive = async () => {
    if (!documentTitle.trim()) {
      alert("Please enter a document title before uploading.");
      return;
    }

    const content = getDocumentContent();
    if (!content.trim()) {
      alert("Please write some content before uploading.");
      return;
    }

    setIsUploading(true);

    try {
      // Process HTML content on client side
      const { plainText, processedHtml } = processHtmlContent(content);

      const response = await fetch("/api/google/upload-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: documentTitle,
          content: plainText,
          htmlContent: processedHtml,
          preserveFormatting: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to upload to Google Drive"
        );
      }

      const result = await response.json();
      setUploadedDocUrl(result.webViewLink);

      // Set the document ID so it switches to update mode
      setCurrentDocId(result.documentId);

      // Update local storage with the new document ID
      const saveData = {
        title: documentTitle,
        content: content,
        htmlContent: content,
        lastSaved: new Date().toISOString(),
        docId: result.documentId,
      };
      localStorage.setItem("swd-script-draft", JSON.stringify(saveData));

      setShowSuccessModal(true);

      if (onDocumentSaved) {
        onDocumentSaved();
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert(
        `Failed to upload document: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsUploading(false);
    }
  };

  const createNewDocument = () => {
    const now = new Date();
    const newTitle = `Script Draft - ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    setDocumentTitle(newTitle);
    setDocumentContent("");
    setCurrentDocId(null);
    localStorage.removeItem("swd-script-draft");
  };

  const loadLatestDocument = useCallback(async () => {
    console.log("🔄 Attempting to load latest document...");

    try {
      const response = await fetch("/api/google/list-scripts");
      console.log("📋 List scripts response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Failed to fetch documents for auto-load:", errorText);
        throw new Error(`Failed to fetch documents: ${response.status}`);
      }

      const data = await response.json();
      const documents = data.documents || [];
      console.log("📄 Found documents:", documents.length);

      if (documents.length > 0) {
        // Sort by modifiedTime to get the latest document
        const sortedDocs = documents.sort(
          (a: GoogleDoc, b: GoogleDoc) =>
            new Date(b.modifiedTime).getTime() -
            new Date(a.modifiedTime).getTime()
        );
        const latestDoc = sortedDocs[0];
        console.log(
          "📝 Latest document:",
          latestDoc.name,
          "modified:",
          latestDoc.modifiedTime
        );

        // Load the latest document content
        await loadDocumentContent(latestDoc);
        console.log(`✅ Auto-loaded latest document: ${latestDoc.name}`);
      } else {
        console.log("📭 No documents found");
        throw new Error("No documents found");
      }
    } catch (error) {
      console.error("❌ Error auto-loading latest document:", error);
      throw error; // Re-throw so the useEffect can handle the fallback
    }
  }, [loadDocumentContent]);

  useEffect(() => {
    const initializeEditor = async () => {
      console.log("🚀 Initializing script editor...");
      setIsInitializing(true);

      // Always try to load the latest document from Google Drive first
      // This ensures we get the most up-to-date content
      try {
        await loadLatestDocument();
        console.log("✅ Successfully loaded latest document from Google Drive");
      } catch (error) {
        // If loading from Google Drive fails, fall back to local storage
        console.log(
          "⚠️ Failed to load from Google Drive, checking local storage:",
          error
        );
        const saved = localStorage.getItem("swd-script-draft");
        if (saved) {
          console.log("💾 Loading content from local storage");
          loadFromLocalStorage();
        } else {
          console.log("📄 No local content found, starting with empty editor");
        }
      } finally {
        setIsInitializing(false);
        console.log("🏁 Editor initialization complete");
      }
    };

    initializeEditor();
  }, [loadFromLocalStorage, loadLatestDocument]);

  return (
    <div className="space-y-6">
      {/* Loading indicator during initialization */}
      {isInitializing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
            <span className="text-white">Loading latest script...</span>
          </div>
        </div>
      )}

      {/* Document Header */}
      <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 to-purple-900/10"></div>
        <CardHeader className="relative">
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            Script Writing
          </CardTitle>
        </CardHeader>
        <CardContent className="relative space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label className="text-sm text-gray-400">Document Title</Label>
              <Input
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="Enter document title..."
                className="bg-gray-800/50 border-gray-700 text-white"
              />
            </div>
            <div className="flex gap-2 items-end flex-wrap">
              <Button
                onClick={() => {
                  setShowDocumentsModal(true);
                  fetchDocuments();
                }}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                Open Docs
              </Button>
              <Button
                id="save-btn"
                onClick={saveToLocalStorage}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
              <Button
                onClick={createNewDocument}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <FileText className="w-4 h-4 mr-2" />
                New
              </Button>
              {currentDocId ? (
                <Button
                  onClick={updateExistingDocument}
                  disabled={isUploading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Edit className="w-4 h-4 mr-2" />
                  )}
                  Update Doc
                </Button>
              ) : (
                <Button
                  onClick={uploadToGoogleDrive}
                  disabled={isUploading}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Upload to Drive
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editor Toolbar */}
      <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/10 to-gray-800/10"></div>
        <CardContent className="relative p-4">
          <div className="flex flex-wrap gap-2">
            {/* Text Formatting */}
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => executeCommand("bold")}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Bold className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => executeCommand("italic")}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Italic className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => executeCommand("underline")}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Underline className="w-4 h-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-8 bg-gray-700" />

            {/* Alignment */}
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => executeCommand("justifyLeft")}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <AlignLeft className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => executeCommand("justifyCenter")}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <AlignCenter className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => executeCommand("justifyRight")}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <AlignRight className="w-4 h-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-8 bg-gray-700" />

            {/* Lists */}
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => executeCommand("insertUnorderedList")}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => executeCommand("insertOrderedList")}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <ListOrdered className="w-4 h-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-8 bg-gray-700" />

            {/* Font Size */}
            <div className="flex gap-1">
              <select
                onChange={(e) => handleFontSizeChange(e.target.value)}
                className="px-2 py-1 text-sm bg-gray-800 border border-gray-700 text-gray-300 rounded"
              >
                <option value="8pt">8 pt</option>
                <option value="9pt">9 pt</option>
                <option value="10pt">10 pt</option>
                <option value="11pt">11 pt</option>
                <option value="12pt" selected>
                  12 pt
                </option>
                <option value="14pt">14 pt</option>
                <option value="16pt">16 pt</option>
                <option value="18pt">18 pt</option>
                <option value="20pt">20 pt</option>
                <option value="22pt">22 pt</option>
                <option value="24pt">24 pt</option>
                <option value="26pt">26 pt</option>
                <option value="28pt">28 pt</option>
                <option value="36pt">36 pt</option>
                <option value="48pt">48 pt</option>
                <option value="72pt">72 pt</option>
              </select>
            </div>

            <Separator orientation="vertical" className="h-8 bg-gray-700" />

            {/* Undo/Redo */}
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => executeCommand("undo")}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Undo className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => executeCommand("redo")}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Redo className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editor */}
      <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/10 to-gray-800/10"></div>
        <CardContent className="relative p-0 flex justify-center">
          <div className="w-full max-w-[8.5in] bg-white/5 shadow-lg">
            <div
              ref={editorRef}
              contentEditable
              className="min-h-[11in] text-white bg-transparent outline-none resize-none leading-relaxed text-[12pt]"
              style={{
                lineHeight: "1.15",
                fontFamily: 'Times, "Times New Roman", serif',
                padding: "1in",
                width: "8.5in",
                minHeight: "11in",
                margin: "0 auto",
                boxSizing: "border-box",
                // No inline fontSize - CSS class provides default
              }}
              // placeholder="Start writing your script here..."
              onInput={saveToLocalStorage}
              onBlur={saveToLocalStorage}
            />
          </div>
        </CardContent>
      </Card>

      {/* Documents Modal */}
      <Dialog open={showDocumentsModal} onOpenChange={setShowDocumentsModal}>
        <DialogContent className="bg-gray-900 border-gray-800 max-w-[95vw] sm:max-w-6xl lg:max-w-7xl max-h-[90vh] overflow-hidden w-full">
          <DialogHeader className="border-b border-gray-700 pb-4 sm:pb-6 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FolderOpen className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-white text-base sm:text-lg font-semibold">
                    My Scripts
                  </DialogTitle>
                  <p className="text-gray-400 text-xs sm:text-sm">
                    {documents.length}{" "}
                    {documents.length === 1 ? "document" : "documents"}
                  </p>
                </div>
              </div>
              <Button
                onClick={fetchDocuments}
                disabled={isLoadingDocs}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-gray-800"
              >
                {isLoadingDocs ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            {isLoadingDocs ? (
              <div className="flex items-center justify-center py-12 sm:py-16">
                <div className="text-center">
                  <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-blue-400 mx-auto mb-3 sm:mb-4" />
                  <p className="text-gray-400 text-sm">
                    Loading your scripts...
                  </p>
                </div>
              </div>
            ) : documents.length === 0 ? (
              <div className="flex items-center justify-center py-12 sm:py-16">
                <div className="text-center max-w-sm px-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500" />
                  </div>
                  <h3 className="text-white font-medium mb-2 text-sm sm:text-base">
                    No scripts found
                  </h3>
                  <p className="text-gray-400 text-xs sm:text-sm">
                    Create your first script to see it here. Your documents will
                    appear in this folder.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-[70vh] sm:max-h-[75vh]">
                {/* Document Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 sm:gap-4 lg:gap-6">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="group relative bg-gray-800/30 rounded-lg border border-gray-700/50 hover:border-blue-500/50 hover:bg-gray-800/50 transition-all duration-200 cursor-pointer"
                      onClick={() => loadDocumentContent(doc)}
                    >
                      {/* Document Preview */}
                      <div className="aspect-[3/4] p-3 sm:p-4 lg:p-5 flex flex-col">
                        {/* Document Icon */}
                        <div className="flex-1 flex items-center justify-center mb-2 sm:mb-3 lg:mb-4">
                          <div className="w-14 h-17 sm:w-16 sm:h-20 lg:w-20 lg:h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg flex items-center justify-center relative overflow-hidden">
                            <FileText className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white z-10" />
                            {/* Google Docs style lines */}
                            <div className="absolute inset-0 bg-white/10">
                              <div className="absolute top-3 sm:top-4 lg:top-5 left-1.5 sm:left-2 lg:left-2.5 right-1.5 sm:right-2 lg:right-2.5 h-0.5 bg-white/40 rounded"></div>
                              <div className="absolute top-4.5 sm:top-5.5 lg:top-7 left-1.5 sm:left-2 lg:left-2.5 right-2 sm:right-2.5 lg:right-3 h-0.5 bg-white/30 rounded"></div>
                              <div className="absolute top-6 sm:top-7 lg:top-9 left-1.5 sm:left-2 lg:left-2.5 right-1.5 sm:right-2 lg:right-2.5 h-0.5 bg-white/30 rounded"></div>
                              <div className="absolute top-7.5 sm:top-8.5 lg:top-11 left-1.5 sm:left-2 lg:left-2.5 right-2.5 sm:right-3 lg:right-4 h-0.5 bg-white/25 rounded"></div>
                              <div className="absolute top-9 sm:top-10 lg:top-13 left-1.5 sm:left-2 lg:left-2.5 right-1.5 sm:right-2 lg:right-2.5 h-0.5 bg-white/25 rounded"></div>
                              <div className="absolute top-10.5 sm:top-11.5 lg:top-15 left-1.5 sm:left-2 lg:left-2.5 right-2 sm:right-2.5 lg:right-3.5 h-0.5 bg-white/20 rounded"></div>
                            </div>
                            {/* Google Docs corner fold */}
                            <div className="absolute top-0 right-0 w-0 h-0 border-l-[6px] sm:border-l-[8px] lg:border-l-[10px] border-l-transparent border-t-[6px] sm:border-t-[8px] lg:border-t-[10px] border-t-white/20"></div>
                          </div>
                        </div>

                        {/* Document Info */}
                        <div className="text-center">
                          <h3
                            className="text-white text-xs sm:text-sm font-medium truncate group-hover:text-blue-400 transition-colors mb-1"
                            title={doc.name}
                          >
                            {doc.name}
                          </h3>
                          <p className="text-gray-500 text-xs mb-1 sm:mb-2">
                            Modified{" "}
                            {new Date(doc.modifiedTime).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year:
                                  new Date(doc.modifiedTime).getFullYear() !==
                                  new Date().getFullYear()
                                    ? "numeric"
                                    : undefined,
                              }
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Hover Actions */}
                      <div className="absolute top-1 sm:top-2 right-1 sm:right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="flex gap-0.5 sm:gap-1">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(doc.webViewLink, "_blank");
                            }}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 sm:h-7 sm:w-7 p-0 bg-gray-900/80 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-600"
                            title="Open in Google Docs"
                          >
                            <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              loadDocumentContent(doc);
                            }}
                            disabled={isLoadingDocContent}
                            size="sm"
                            className="h-6 sm:h-7 px-1.5 sm:px-2 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                            title="Edit in Script Writer"
                          >
                            {isLoadingDocContent ? (
                              <Loader2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                            ) : (
                              <>
                                <Edit className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                                <span className="hidden sm:inline">Edit</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Selection indicator */}
                      <div className="absolute inset-0 rounded-lg border-2 border-transparent group-hover:border-blue-500/30 pointer-events-none"></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Script Uploaded Successfully!
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-4">
            <p className="text-gray-300">
              Your script &quot;{documentTitle}&quot; has been successfully
              uploaded to Google Drive as a Google Doc.
            </p>
            {uploadedDocUrl && (
              <div className="space-y-2">
                <Button
                  onClick={() => window.open(uploadedDocUrl, "_blank")}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Open in Google Docs
                </Button>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(uploadedDocUrl);
                    alert("Link copied to clipboard!");
                  }}
                  variant="outline"
                  className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Copy Link
                </Button>
              </div>
            )}
            <Button
              onClick={() => setShowSuccessModal(false)}
              variant="outline"
              className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Continue Writing
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
