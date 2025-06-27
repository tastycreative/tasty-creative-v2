
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
  Loader2,
  FolderOpen,
  Eye,
  Edit,
  RefreshCw
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

export const ScriptWritingTab: React.FC<ScriptWritingTabProps> = ({ onDocumentSaved }) => {
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
      const response = await fetch('/api/google/list-scripts');
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      alert('Failed to fetch documents. Please try again.');
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const loadDocumentContent = async (doc: GoogleDoc) => {
    setIsLoadingDocContent(true);
    try {
      const response = await fetch(`/api/google/get-script-content?docId=${doc.id}`);
      if (!response.ok) {
        throw new Error('Failed to load document content');
      }
      const data = await response.json();
      
      // Load the content into the editor
      setDocumentTitle(doc.name);
      setDocumentContent(data.content || '');
      setCurrentDocId(doc.id);
      setShowDocumentsModal(false);
      
      // Save to local storage
      const saveData = {
        title: doc.name,
        content: data.content || '',
        lastSaved: new Date().toISOString(),
        docId: doc.id
      };
      localStorage.setItem('swd-script-draft', JSON.stringify(saveData));
      
    } catch (error) {
      console.error('Error loading document content:', error);
      alert('Failed to load document content. Please try again.');
    } finally {
      setIsLoadingDocContent(false);
    }
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
      // Convert HTML to plain text for Google Docs
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      const plainTextContent = tempDiv.textContent || tempDiv.innerText || '';

      const response = await fetch('/api/google/update-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          docId: currentDocId,
          title: documentTitle,
          content: plainTextContent,
          htmlContent: content
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update document');
      }

      const result = await response.json();
      setUploadedDocUrl(result.webViewLink);
      setShowSuccessModal(true);
      
      if (onDocumentSaved) {
        onDocumentSaved();
      }
    } catch (error) {
      console.error('Update error:', error);
      alert(`Failed to update document: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    const numericSize = size.replace('pt', '');
    executeCommand('fontSize', numericSize);
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
      lastSaved: new Date().toISOString(),
      docId: currentDocId
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
      setCurrentDocId(saveData.docId || null);
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
    setCurrentDocId(null);
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
                <option value="8pt">8 pt</option>
                <option value="9pt">9 pt</option>
                <option value="10pt">10 pt</option>
                <option value="11pt">11 pt</option>
                <option value="12pt" selected>12 pt</option>
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

      {/* Documents Modal */}
      <Dialog open={showDocumentsModal} onOpenChange={setShowDocumentsModal}>
        <DialogContent className="bg-gray-900 border-gray-800 max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-blue-400" />
              Your Script Documents
              <Button
                onClick={fetchDocuments}
                disabled={isLoadingDocs}
                variant="ghost"
                size="sm"
                className="ml-auto text-gray-400 hover:text-white"
              >
                {isLoadingDocs ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
            {isLoadingDocs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-400">Loading documents...</span>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No script documents found.</p>
                <p className="text-sm">Create your first script to see it here.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {documents.map((doc) => (
                  <Card key={doc.id} className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium truncate">{doc.name}</h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                            <span>Modified: {new Date(doc.modifiedTime).toLocaleDateString()}</span>
                            <span>Created: {new Date(doc.createdTime).toLocaleDateString()}</span>
                            {doc.size && <span>Size: {doc.size}</span>}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            onClick={() => window.open(doc.webViewLink, '_blank')}
                            variant="outline"
                            size="sm"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => loadDocumentContent(doc)}
                            disabled={isLoadingDocContent}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {isLoadingDocContent ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Edit className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
