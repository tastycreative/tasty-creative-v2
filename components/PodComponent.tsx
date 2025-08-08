'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileSpreadsheet, Copy, CheckCircle, AlertCircle } from 'lucide-react';

const PodComponent = () => {
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
        // Handle the new multiple Schedule #1 sheets API response format
        const successMessage = result.scheduleSheets && result.sheetsCount > 1
          ? `Successfully processed ${result.sheetsCount} Schedule #1 sheets with real-time sync!`
          : `Successfully set up real-time sync for your spreadsheet!`;
        
        setStatus({
          type: 'success',
          message: successMessage
        });
        setNewSpreadsheetUrl(result.spreadsheetUrl); // Use spreadsheetUrl from new API response
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

  return (
    <div className="min-h-screen p-6 space-y-6 bg-gradient-to-br from-gray-50 via-white to-pink-50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 p-6 bg-gradient-to-r from-gray-50 to-pink-50 rounded-lg border">
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-2">
              Scheduler POD
            </h1>
            <p className="text-gray-600 text-lg">
              Copy data from any Google Spreadsheet to the POD destination template
            </p>
          </div>
        </div>

        {/* Main Card */}
        <Card className="border border-gray-200 shadow-xl bg-white relative group overflow-hidden">
          {/* Animated background effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-100/25 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
          
          <CardHeader className="bg-gradient-to-r from-gray-50 to-pink-50 border-b border-gray-200 relative">
            <CardTitle className="text-gray-900 font-bold flex items-center text-xl">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mr-3">
                <FileSpreadsheet className="h-4 w-4 text-white" />
              </div>
              Source Spreadsheet
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 relative">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* URL Input */}
              <div className="space-y-3">
                <label 
                  htmlFor="spreadsheet-url" 
                  className="text-sm font-semibold text-gray-700 flex items-center"
                >
                  <div className="h-2 w-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 mr-2"></div>
                  Google Spreadsheet URL
                </label>
                <Input
                  id="spreadsheet-url"
                  type="url"
                  value={spreadsheetUrl}
                  onChange={(e) => setSpreadsheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/your-spreadsheet-id/edit?gid=123456#gid=123456"
                  className="w-full h-12 text-base border-2 border-gray-200 focus:border-pink-500 transition-colors duration-300 rounded-lg bg-gray-50 focus:bg-white"
                  disabled={isLoading}
                />
                <p className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <strong>💡 Tip:</strong> Enter the Google Sheets URL to automatically detect and sync all Schedule #1 sheets with real-time updates!
                </p>
              </div>

              {/* URL Validation */}
              {spreadsheetUrl && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-4 rounded-lg border-2 transition-all duration-300" style={{
                    backgroundColor: isValidGoogleSheetsUrl(spreadsheetUrl) ? '#f0fdf4' : '#fef2f2',
                    borderColor: isValidGoogleSheetsUrl(spreadsheetUrl) ? '#16a34a' : '#dc2626'
                  }}>
                    {isValidGoogleSheetsUrl(spreadsheetUrl) ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span className="text-green-700 font-medium">Valid Google Sheets URL ✨</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                        <span className="text-red-700 font-medium">Please enter a valid Google Sheets URL</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Status Alert */}
              {status && (
                <div className={`p-6 rounded-xl border-2 transition-all duration-500 ${
                  status.type === 'success' 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 shadow-lg shadow-green-100'
                    : status.type === 'error'
                    ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-300 shadow-lg shadow-red-100'
                    : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 shadow-lg shadow-blue-100'
                }`}>
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {status.type === 'success' ? (
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                      ) : status.type === 'error' ? (
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
                          <AlertCircle className="h-4 w-4 text-white" />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                          <Loader2 className="h-4 w-4 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        status.type === 'success' ? 'text-green-800' 
                        : status.type === 'error' ? 'text-red-800' 
                        : 'text-blue-800'
                      }`}>
                        {status.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Success URL Display */}
              {newSpreadsheetUrl && status?.type === 'success' && (
                <div className="space-y-4 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-300 shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <FileSpreadsheet className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-green-800">
                      🎉 Real-Time Sync Spreadsheet Created!
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <p className="text-green-700 font-medium">
                      Your IMPORTRANGE formulas have been set up for real-time data synchronization:
                    </p>
                    <div className="p-3 bg-green-100 rounded-lg border border-green-300">
                      <p className="text-sm text-green-800">
                        <strong>✨ Real-Time Updates:</strong> Any changes to the source spreadsheet will automatically appear in your new destination spreadsheet!
                      </p>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-green-300 shadow-sm">
                      <Input
                        value={newSpreadsheetUrl}
                        readOnly
                        className="flex-1 text-sm bg-transparent border-none focus:ring-0 text-blue-600 font-mono"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(newSpreadsheetUrl)}
                        className="shrink-0 border-green-400 text-green-700 hover:bg-green-100 transition-all duration-300 hover:scale-105"
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <div className="flex space-x-3">
                      <Button
                        type="button"
                        size="lg"
                        onClick={() => window.open(newSpreadsheetUrl, '_blank')}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Open Spreadsheet
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={() => {
                          setNewSpreadsheetUrl(null);
                          setStatus(null);
                        }}
                        className="border-green-400 text-green-700 hover:bg-green-100 transition-all duration-300 hover:scale-105"
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
                size="lg"
                className="w-full h-14 text-lg bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={isLoading || !spreadsheetUrl || !isValidGoogleSheetsUrl(spreadsheetUrl)}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    Processing Your Request...
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5 mr-3" />
                    ✨ Copy Data to Destination
                  </>
                )}
              </Button>
            </form>

            {/* Info Section */}
            <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center text-lg">
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-3">
                  <span className="text-white text-xs">?</span>
                </div>
                How it works:
              </h3>
                <div className="space-y-4 text-sm text-gray-600">
                  <p className="flex items-center"><span className="text-pink-500 mr-2">•</span> Automatically detects all Schedule #1 sheets in your spreadsheet</p>
                  <p className="flex items-center"><span className="text-pink-500 mr-2">•</span> Creates a copy of the destination template for each sheet</p>
                  <p className="flex items-center"><span className="text-pink-500 mr-2">•</span> Sets up IMPORTRANGE formulas for real-time sync</p>
                  <p className="flex items-center"><span className="text-purple-500 mr-2">•</span> Maps columns with intelligent data transformation</p>
                  <p className="flex items-center"><span className="text-purple-500 mr-2">•</span> Auto-updates when source data changes</p>
                  <p className="flex items-center"><span className="text-purple-500 mr-2">•</span> Returns the URL of the new live-sync spreadsheet</p>
                </div>
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  <strong>� IMPORTRANGE Mapping:</strong> E→B, D→C, F→D, G→E, I→G, K→I, N→K, M→L, O→M, P→N, R→O, T→P (Real-time sync from range C12:T)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PodComponent;
