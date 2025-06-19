
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Activity, Server, Database, Cpu, MemoryStick, HardDrive, Wifi, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminSystemPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <div className="min-h-screen p-6 space-y-6 bg-gradient-to-br from-gray-50 via-white to-pink-50">
      {/* Header */}
      <div className="mb-8 p-6 bg-gradient-to-r from-gray-50 to-pink-50 rounded-lg border">
        <div className="flex items-center space-x-3 mb-2">
          <h1 className="text-3xl font-bold text-gray-900">System Monitor</h1>
          <Activity className="h-6 w-6 text-pink-500" />
        </div>
        <p className="text-gray-600">
          Monitor system performance, health, and infrastructure status
        </p>
      </div>

      {/* System Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Server Status */}
        <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Server className="h-8 w-8 text-green-500 group-hover:scale-110 transition-transform duration-300" />
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-green-600">Online</span>
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Server Status</h3>
            <p className="text-sm text-gray-600">All systems operational</p>
          </CardContent>
        </Card>

        {/* Database Status */}
        <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Database className="h-8 w-8 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-green-600">Connected</span>
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Database</h3>
            <p className="text-sm text-gray-600">Connection healthy</p>
          </CardContent>
        </Card>

        {/* Network Status */}
        <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Wifi className="h-8 w-8 text-purple-500 group-hover:scale-110 transition-transform duration-300" />
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-green-600">Stable</span>
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Network</h3>
            <p className="text-sm text-gray-600">Low latency connection</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CPU Usage */}
        <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Cpu className="h-8 w-8 text-orange-500 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-2xl font-bold text-orange-600">34%</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">CPU Usage</h3>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-orange-500 h-2 rounded-full" style={{ width: '34%' }}></div>
            </div>
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <MemoryStick className="h-8 w-8 text-pink-500 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-2xl font-bold text-pink-600">67%</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Memory Usage</h3>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-pink-500 h-2 rounded-full" style={{ width: '67%' }}></div>
            </div>
          </CardContent>
        </Card>

        {/* Disk Usage */}
        <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <HardDrive className="h-8 w-8 text-indigo-500 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-2xl font-bold text-indigo-600">45%</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Disk Usage</h3>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '45%' }}></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Monitoring Section */}
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
            Advanced System Monitoring Coming Soon
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            This section will contain real-time system metrics, detailed performance graphs, alert management, and comprehensive infrastructure monitoring tools.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
