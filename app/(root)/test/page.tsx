'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, FileSpreadsheet, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import PermissionGoogle from '@/components/PermissionGoogle';

const TestPage = () => {
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [newSpreadsheetUrl, setNewSpreadsheetUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!spreadsheetUrl.trim()) {
      setStatus({
        type: 'error',
        message: 'Please enter a valid spreadsheet URL'
      });
      return;
    }

    setIsLoading(true);
    setNewSpreadsheetUrl(null); // Clear previous URL
    setStatus({
      type: 'info',
      message: 'Processing spreadsheet data...'
    });

    try {
      const response = await fetch('/api/pod', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceUrl: spreadsheetUrl
        }),
      });

      const result = await response.json();

      if (response.ok) {
        const successMessage = result.sourceSheetName && result.sourceSheetName !== 'Default sheet' 
          ? `Successfully copied data! ${result.rowsCopied} rows transferred from "${result.sourceSheetName}" sheet to destination spreadsheet.`
          : `Successfully copied data! ${result.rowsCopied} rows transferred to destination spreadsheet.`;
        
        setStatus({
          type: 'success',
          message: successMessage
        });
        setNewSpreadsheetUrl(result.newSpreadsheetUrl); // Store the URL
        setSpreadsheetUrl(''); // Clear input on success
      } else {
        // Handle specific error types
        if (result.error === 'GoogleAuthExpired' || result.error === 'GoogleAuthInvalid') {
          setStatus({
            type: 'error',
            message: `${result.message || 'Authentication error occurred.'} Please refresh the page and try again.`
          });
        } else if (result.error === 'GooglePermissionDenied') {
          setStatus({
            type: 'error',
            message: result.message || 'Permission denied. Please ensure you have access to the spreadsheet.'
          });
        } else {
          setStatus({
            type: 'error',
            message: result.error || result.message || 'Failed to process spreadsheet'
          });
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setStatus({
        type: 'error',
        message: 'Network error. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isValidGoogleSheetsUrl = (url: string) => {
    return url.includes('docs.google.com/spreadsheets') && url.includes('/d/');
  };

  const extractSheetInfo = (url: string) => {
    const spreadsheetIdMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    const gidMatch = url.match(/gid=([0-9]+)/);
    
    return {
      spreadsheetId: spreadsheetIdMatch ? spreadsheetIdMatch[1] : null,
      gid: gidMatch ? gidMatch[1] : null,
      hasGid: !!gidMatch
    };
  };

  return (
    <PermissionGoogle apiEndpoint="/api/models">
      <div className="min-h-screen p-6 space-y-6 bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Spreadsheet Data Transfer
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Copy data from any Google Spreadsheet to the destination template
            </p>
          </div>

          {/* Main Card */}
          <Card className="border border-gray-200 dark:border-gray-600 shadow-lg bg-white dark:bg-gray-800">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-600">
              <CardTitle className="text-gray-900 dark:text-gray-100 font-bold flex items-center">
                <FileSpreadsheet className="h-5 w-5 mr-2 text-blue-500" />
                Source Spreadsheet
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* URL Input */}
                <div className="space-y-2">
                  <label 
                    htmlFor="spreadsheet-url" 
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Google Spreadsheet URL
                  </label>
                  <Input
                    id="spreadsheet-url"
                    type="url"
                    value={spreadsheetUrl}
                    onChange={(e) => setSpreadsheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/your-spreadsheet-id/edit?gid=123456#gid=123456"
                    className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Enter the full URL with GID to specify which sheet to copy data from (range C12:T, excluding header)
                  </p>
                </div>

                {/* URL Validation */}
                {spreadsheetUrl && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      {isValidGoogleSheetsUrl(spreadsheetUrl) ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-green-600 dark:text-green-400">Valid Google Sheets URL</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <span className="text-red-600 dark:text-red-400">Please enter a valid Google Sheets URL</span>
                        </>
                      )}
                    </div>
                    {isValidGoogleSheetsUrl(spreadsheetUrl) && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded border">
                        {(() => {
                          const sheetInfo = extractSheetInfo(spreadsheetUrl);
                          return (
                            <div className="space-y-1">
                              <p><strong>Spreadsheet ID:</strong> {sheetInfo.spreadsheetId}</p>
                              {sheetInfo.hasGid ? (
                                <p><strong>Sheet GID:</strong> {sheetInfo.gid} ✅</p>
                              ) : (
                                <p className="text-orange-600 dark:text-orange-400">
                                  <strong>⚠️ No GID found:</strong> Will use the default/first sheet
                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {/* Status Alert */}
                {status && (
                  <Alert className={`${
                    status.type === 'success' 
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 dark:border-green-700'
                      : status.type === 'error'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 dark:border-red-700'
                      : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 dark:border-blue-700'
                  }`}>
                    {status.type === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : status.type === 'error' ? (
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    ) : (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                    )}
                    <AlertDescription>
                      {status.message}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Success URL Display */}
                {newSpreadsheetUrl && status?.type === 'success' && (
                  <div className="space-y-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                    <div className="flex items-center space-x-2">
                      <FileSpreadsheet className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <h3 className="font-semibold text-green-800 dark:text-green-300">
                        New Spreadsheet Created
                      </h3>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-green-700 dark:text-green-400">
                        Your data has been successfully copied to a new spreadsheet:
                      </p>
                      <div className="flex items-center space-x-2 p-2 bg-white dark:bg-gray-800 rounded border border-green-300 dark:border-green-600">
                        <Input
                          value={newSpreadsheetUrl}
                          readOnly
                          className="flex-1 text-sm bg-transparent border-none focus:ring-0 text-blue-600 dark:text-blue-400"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(newSpreadsheetUrl)}
                          className="shrink-0 border-green-300 dark:border-green-600 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => window.open(newSpreadsheetUrl, '_blank')}
                          className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white"
                        >
                          Open Spreadsheet
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setNewSpreadsheetUrl(null);
                            setStatus(null);
                          }}
                          className="border-green-300 dark:border-green-600 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30"
                        >
                          Process Another
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                  disabled={isLoading || !spreadsheetUrl || !isValidGoogleSheetsUrl(spreadsheetUrl)}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Data to Destination
                    </>
                  )}
                </Button>
              </form>

              {/* Info Section */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  How it works:
                </h3>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <p>• Detects the specific sheet using GID from your URL</p>
                  <p>• Reads data from range C12:T in the specified sheet (skips header row)</p>
                  <p>• Creates a copy of the destination template</p>
                  <p>• Maps columns: E→B, D→C, F→D, G→E, I→G, K→I, N→K, M→L, O→M, P→N, R→O, T→P</p>
                  <p>• Auto-resizes columns to fit content</p>
                  <p>• Returns the URL of the newly created spreadsheet</p>
                </div>
                <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>Tip:</strong> Include the GID in your URL (e.g., ?gid=123456#gid=123456) to specify which sheet to copy from. Without GID, the first sheet will be used.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PermissionGoogle>
  );
};

export default TestPage;
