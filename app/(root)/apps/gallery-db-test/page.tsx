'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface GalleryItem {
  id: string
  title: string
  sheetName: string
  messageType: string
  contentStyle: string
  caption: string
  price: number
  outcome: string
  contentPreviewUrl: string
  category: string
}

interface GalleryResponse {
  items: GalleryItem[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
  }
  availableTables: string[]
  currentTable: string
  breakdown: {
    favorites: number
    releases: number
    library: number
  }
}

export default function GalleryDBTestPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<GalleryResponse | null>(null)
  const [selectedTable, setSelectedTable] = useState('gs_dakota_free')
  const [error, setError] = useState<string | null>(null)

  const fetchData = async (tableName?: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        table: tableName || selectedTable,
        page: '1',
        limit: '20'
      })

      const response = await fetch(`/api/gallery-db?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch data')
      }

      setData(result)
      console.log('Gallery DB Data:', result)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleTableChange = (table: string) => {
    setSelectedTable(table)
    fetchData(table)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gallery Database Test</h1>
        <Button onClick={() => fetchData()} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Refresh Data
        </Button>
      </div>

      {/* Table Selector */}
      {data?.availableTables && (
        <Card>
          <CardHeader>
            <CardTitle>Select Table</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedTable} onValueChange={handleTableChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a table" />
              </SelectTrigger>
              <SelectContent>
                {data.availableTables.map((table) => (
                  <SelectItem key={table} value={table}>
                    {table}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-600 mt-2">
              Available tables: {data.availableTables.join(', ')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Total Items</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{data.breakdown.library}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Current Table</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">{data.currentTable}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Pages</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{data.pagination.totalPages}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-500 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Data Display */}
      {data && data.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Gallery Items (First {data.items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">ID</th>
                    <th className="text-left p-2">Title</th>
                    <th className="text-left p-2">Message Type</th>
                    <th className="text-left p-2">Content Style</th>
                    <th className="text-left p-2">Price</th>
                    <th className="text-left p-2">Outcome</th>
                    <th className="text-left p-2">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-mono text-xs">{item.id}</td>
                      <td className="p-2">{item.title}</td>
                      <td className="p-2">{item.messageType}</td>
                      <td className="p-2">{item.contentStyle}</td>
                      <td className="p-2">${item.price}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          item.outcome === 'Good' ? 'bg-green-100 text-green-800' : 
                          item.outcome === 'Bad' ? 'bg-red-100 text-red-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.outcome || 'N/A'}
                        </span>
                      </td>
                      <td className="p-2">{item.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Raw JSON Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Raw Response (Debug)</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs overflow-auto max-h-96 bg-gray-100 p-4 rounded">
            {JSON.stringify(data, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}