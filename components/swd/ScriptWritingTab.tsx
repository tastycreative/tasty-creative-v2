
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Loader2
} from "lucide-react";

interface ScriptWritingTabProps {
  onDocumentSaved?: () => void;
}

export const ScriptWritingTab: React.FC<ScriptWritingTabProps> = ({ onDocumentSaved }) => {
  const [documentTitle, setDocumentTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [uploadedDocUrl, setUploadedDocUrl] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set default title with timestamp
    const now = new Date();
    const defaultTitle = `Script Draft - ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    setDocumentTitle(defaultTitle);
  }, []);

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleFontSizeChange = (size: string) => {
    executeCommand('fontSize', size);
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
      lastSaved: new Date().toISOString()
    };
    localStorage.setItem('swd-script-draft', JSON.stringify(saveData));
    
    // Show brief save confirmation
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
      const originalText = saveBtn.textContent;
      saveBtn.textContent = 'Saved!';
      setTimeout(() => {
        saveBtn.textContent = originalText;
      }, 1000);
    }
  };

  const loadFromLocalStorage = () => {
    const saved = localStorage.getItem('swd-script-draft');
    if (saved) {
      const saveData = JSON.parse(saved);
      setDocumentTitle(saveData.title);
      setDocumentContent(saveData.content);
    }
  };

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
      // Convert HTML to plain text for Google Docs
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      const plainTextContent = tempDiv.textContent || tempDiv.innerText || '';

      const response = await fetch('/api/google/upload-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: documentTitle,
          content: plainTextContent,
          htmlContent: content
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload to Google Drive');
      }

      const result = await response.json();
      setUploadedDocUrl(result.webViewLink);
      setShowSuccessModal(true);
      
      if (onDocumentSaved) {
        onDocumentSaved();
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Failed to upload document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const createNewDocument = () => {
    const now = new Date();
    const newTitle = `Script Draft - ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    setDocumentTitle(newTitle);
    setDocumentContent("");
    localStorage.removeItem('swd-script-draft');
  };

  useEffect(() => {
    // Load saved content on component mount
    loadFromLocalStorage();
  }, []);

  return (
    <div className="space-y-6">
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
            <div className="flex gap-2 items-end">
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
                onClick={() => executeCommand('bold')}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Bold className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => executeCommand('italic')}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Italic className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => executeCommand('underline')}
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
                onClick={() => executeCommand('justifyLeft')}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <AlignLeft className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => executeCommand('justifyCenter')}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <AlignCenter className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => executeCommand('justifyRight')}
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
                onClick={() => executeCommand('insertUnorderedList')}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => executeCommand('insertOrderedList')}
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
                <option value="1">Small</option>
                <option value="3" selected>Normal</option>
                <option value="4">Medium</option>
                <option value="5">Large</option>
                <option value="6">X-Large</option>
              </select>
            </div>

            <Separator orientation="vertical" className="h-8 bg-gray-700" />

            {/* Undo/Redo */}
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => executeCommand('undo')}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Undo className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => executeCommand('redo')}
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
        <CardContent className="relative p-0">
          <div
            ref={editorRef}
            contentEditable
            className="min-h-[500px] p-6 text-white bg-transparent outline-none resize-none leading-relaxed"
            style={{
              fontSize: '16px',
              lineHeight: '1.6',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
            // placeholder="Start writing your script here..."
            onInput={saveToLocalStorage}
            onBlur={saveToLocalStorage}
          />
        </CardContent>
      </Card>

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
              Your script &quot;{documentTitle}&quot; has been successfully uploaded to Google Drive as a Google Doc.
            </p>
            {uploadedDocUrl && (
              <div className="space-y-2">
                <Button
                  onClick={() => window.open(uploadedDocUrl, '_blank')}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Open in Google Docs
                </Button>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(uploadedDocUrl);
                    alert('Link copied to clipboard!');
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
