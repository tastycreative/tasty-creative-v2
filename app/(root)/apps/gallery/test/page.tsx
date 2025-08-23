'use client';

import React, { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AlertCircle, RefreshCw } from 'lucide-react';

const GalleryTestPage = () => {
  const { data: session } = useSession();
  const [testResults, setTestResults] = useState<any>({});
  const [loading, setLoading] = useState<string | null>(null);

  const testEndpoint = async (endpoint: string, method: string = 'GET', body?: any) => {
    setLoading(endpoint);
    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };
      
      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(endpoint, options);
      const data = await response.json();
      
      setTestResults(prev => ({
        ...prev,
        [endpoint]: {
          status: response.status,
          data,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [endpoint]: {
          error: error.message,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
    } finally {
      setLoading(null);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl mb-4">Gallery API Test</h1>
          <p>Please sign in to test the gallery API</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Gallery API Test Suite</CardTitle>
            <p className="text-gray-400">
              Session: {session.user?.email} | User ID: {session.user?.id}
            </p>
            <div className="flex items-center gap-4 text-gray-400">
              <span>Access Token: {session.accessToken ? '✅ Available' : '❌ Missing'}</span>
              <span>Refresh Token: {session.refreshToken ? '✅ Available' : '❌ Missing'}</span>
            </div>
            
            {/* Re-authentication warning and button */}
            {session && !session.refreshToken && (
              <div className="mt-4 p-4 bg-yellow-900 border border-yellow-600 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-yellow-200 font-semibold">Missing Google Refresh Token</p>
                    <p className="text-yellow-300 text-sm mt-1">
                      Your Google session needs to be refreshed to access spreadsheets.
                    </p>
                    <div className="mt-3 flex gap-3">
                      <Button 
                        onClick={async () => {
                          await signOut({ redirect: false });
                          await signIn('google', { 
                            callbackUrl: window.location.pathname,
                            prompt: 'consent', // Force consent screen to get refresh token
                            access_type: 'offline' // Request offline access for refresh token
                          });
                        }}
                        className="bg-yellow-600 hover:bg-yellow-700"
                        size="sm"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Re-authenticate with Google
                      </Button>
                      <Button 
                        onClick={() => signIn('google', { 
                          callbackUrl: window.location.pathname,
                          prompt: 'consent',
                          access_type: 'offline'
                        })}
                        variant="outline"
                        size="sm"
                      >
                        Sign In Again
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Test Buttons */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">API Tests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => testEndpoint('/api/gallery/debug')}
                disabled={loading === '/api/gallery/debug'}
                className="w-full bg-yellow-600 hover:bg-yellow-700"
              >
                {loading === '/api/gallery/debug' ? 'Testing...' : '🔍 Debug Spreadsheet'}
              </Button>

              <Button 
                onClick={() => testEndpoint('/api/library/search')}
                disabled={loading === '/api/library/search'}
                className="w-full"
              >
                {loading === '/api/library/search' ? 'Testing...' : 'Test Library Search'}
              </Button>

              <Button 
                onClick={() => testEndpoint('/api/gallery')}
                disabled={loading === '/api/gallery'}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading === '/api/gallery' ? 'Testing...' : 'Get All Gallery Items'}
              </Button>

              <Button 
                onClick={() => testEndpoint('/api/gallery?type=favorites')}
                disabled={loading === '/api/gallery?type=favorites'}
                className="w-full"
                variant="secondary"
              >
                {loading === '/api/gallery?type=favorites' ? 'Testing...' : 'Get Favorites Only'}
              </Button>

              <Button 
                onClick={() => testEndpoint('/api/gallery?type=releases')}
                disabled={loading === '/api/gallery?type=releases'}
                className="w-full"
                variant="secondary"
              >
                {loading === '/api/gallery?type=releases' ? 'Testing...' : 'Get Releases Only'}
              </Button>

              <Button 
                onClick={() => testEndpoint('/api/gallery/add', 'POST', {
                  sheetRowIds: ['row_2', 'row_3'],
                  contentType: 'FAVORITE'
                })}
                disabled={loading === '/api/gallery/add'}
                className="w-full"
                variant="outline"
              >
                {loading === '/api/gallery/add' ? 'Testing...' : 'Test Add to Favorites'}
              </Button>

              <Button 
                onClick={() => testEndpoint('/api/gallery/usage', 'POST', {
                  sheetRowId: 'row_2',
                  actionType: 'COPY_CAPTION',
                  contentType: 'favorites'
                })}
                disabled={loading === '/api/gallery/usage'}
                className="w-full"
                variant="outline"
              >
                {loading === '/api/gallery/usage' ? 'Testing...' : 'Test Usage Tracking'}
              </Button>
            </CardContent>
          </Card>

          {/* Results Display */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {Object.entries(testResults).map(([endpoint, result]: [string, any]) => (
                  <div key={endpoint} className="border border-gray-600 rounded p-3">
                    <div className="font-semibold text-sm mb-2 text-blue-400">
                      {endpoint} ({result.timestamp})
                    </div>
                    {result.error ? (
                      <div className="text-red-400 text-sm">
                        ❌ Error: {result.error}
                      </div>
                    ) : (
                      <div className="text-sm">
                        <div className="text-green-400 mb-2">
                          ✅ Status: {result.status}
                        </div>
                        <pre className="bg-gray-900 p-2 rounded text-xs overflow-x-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {Object.keys(testResults).length === 0 && (
                <div className="text-gray-400 text-center py-8">
                  No tests run yet. Click a test button above.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Manual Test Form */}
        <Card className="bg-gray-800 border-gray-700 mt-6">
          <CardHeader>
            <CardTitle className="text-white">Manual API Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Endpoint</label>
                <Input
                  id="manual-endpoint"
                  placeholder="/api/gallery"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div className="flex space-x-4">
                <Button
                  onClick={() => {
                    const input = document.getElementById('manual-endpoint') as HTMLInputElement;
                    if (input?.value) {
                      testEndpoint(input.value);
                    }
                  }}
                  variant="outline"
                >
                  Test GET
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GalleryTestPage;