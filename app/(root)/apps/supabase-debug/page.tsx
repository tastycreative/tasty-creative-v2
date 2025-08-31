'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function SupabaseDebugPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testConnection = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/gallery-db/test-connection')
      const data = await response.json()
      setResult(data)
      console.log('Connection test result:', data)
    } catch (error) {
      console.error('Test failed:', error)
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  const testGalleryAPI = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/gallery-db?mode=all&limit=5')
      const data = await response.json()
      setResult(data)
      console.log('Gallery API test result:', data)
    } catch (error) {
      console.error('Gallery API test failed:', error)
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Supabase Connection Debug</h1>
      
      <div className="flex gap-4">
        <Button onClick={testConnection} disabled={loading}>
          {loading ? 'Testing...' : 'Test Connection'}
        </Button>
        <Button onClick={testGalleryAPI} disabled={loading} variant="outline">
          {loading ? 'Testing...' : 'Test Gallery API'}
        </Button>
      </div>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Test Results
              {result.success !== undefined && (
                <Badge variant={result.success ? 'default' : 'destructive'}>
                  {result.success ? 'SUCCESS' : 'FAILED'}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.connectionTest && (
              <div className="space-y-4 mb-6">
                <h3 className="font-semibold">Connection Summary:</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Basic Connection</div>
                    <div className="font-bold">{result.connectionTest.basicConnection ? '✅ OK' : '❌ FAILED'}</div>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Tables</div>
                    <div className="font-bold">{result.connectionTest.totalTablesFound}</div>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                    <div className="text-sm text-gray-600 dark:text-gray-400">gs_ Tables</div>
                    <div className="font-bold">{result.connectionTest.gsTablesFound}</div>
                  </div>
                </div>
              </div>
            )}

            <details className="space-y-2">
              <summary className="cursor-pointer font-medium">Raw JSON Response</summary>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-xs overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Environment Check</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>Supabase Anon Key: ❓ Server-side only (cannot check from client)</div>
            <div>Note: Service Role Key is server-side only and won't show here</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}