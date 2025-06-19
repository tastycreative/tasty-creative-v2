
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Database, TableIcon, Users, FileText, BarChart3, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminDatabasePage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <div className="min-h-screen p-6 space-y-6 bg-gradient-to-br from-gray-50 via-white to-pink-50">
      {/* Header */}
      <div className="mb-8 p-6 bg-gradient-to-r from-gray-50 to-pink-50 rounded-lg border">
        <div className="flex items-center space-x-3 mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Database Management</h1>
          <Database className="h-6 w-6 text-pink-500" />
        </div>
        <p className="text-gray-600">
          Monitor database performance, manage data, and view system statistics
        </p>
      </div>

      {/* Database Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Records */}
        <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Database className="h-8 w-8 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-2xl font-bold text-blue-600">12,547</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Total Records</h3>
            <p className="text-sm text-gray-600">All database entries</p>
          </CardContent>
        </Card>

        {/* Active Tables */}
        <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <TableIcon className="h-8 w-8 text-green-500 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-2xl font-bold text-green-600">24</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Active Tables</h3>
            <p className="text-sm text-gray-600">Database tables in use</p>
          </CardContent>
        </Card>

        {/* User Accounts */}
        <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-8 w-8 text-pink-500 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-2xl font-bold text-pink-600">3,421</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">User Accounts</h3>
            <p className="text-sm text-gray-600">Registered users</p>
          </CardContent>
        </Card>

        {/* Data Growth */}
        <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="h-8 w-8 text-purple-500 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-2xl font-bold text-purple-600">+12%</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Data Growth</h3>
            <p className="text-sm text-gray-600">Monthly increase</p>
          </CardContent>
        </Card>
      </div>

      {/* Database Operations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backup Status */}
        <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <FileText className="h-8 w-8 text-green-500 group-hover:scale-110 transition-transform duration-300" />
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-green-600">Active</span>
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Backup Status</h3>
            <p className="text-sm text-gray-600">Last backup: 2 hours ago</p>
            <p className="text-xs text-gray-500 mt-2">Next scheduled: Tonight at 2:00 AM</p>
          </CardContent>
        </Card>

        {/* Query Performance */}
        <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="h-8 w-8 text-orange-500 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-2xl font-bold text-orange-600">42ms</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Avg Query Time</h3>
            <p className="text-sm text-gray-600">Database response time</p>
            <p className="text-xs text-gray-500 mt-2">Optimal performance range</p>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Database Tools Section */}
      <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
        {/* Glass reflection effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
        </div>
        <CardContent className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <Sparkles className="h-12 w-12 text-pink-500 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Advanced Database Tools Coming Soon
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            This section will contain database administration tools, query builders, data visualization, backup management, and performance optimization features.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
