
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Bell, Mail, MessageSquare, AlertTriangle, CheckCircle, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminNotificationsPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <div className="min-h-screen p-6 space-y-6 bg-gradient-to-br from-gray-50 via-white to-pink-50">
      {/* Header */}
      <div className="mb-8 p-6 bg-gradient-to-r from-gray-50 to-pink-50 rounded-lg border">
        <div className="flex items-center space-x-3 mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <Bell className="h-6 w-6 text-pink-500" />
        </div>
        <p className="text-gray-600">
          Manage system notifications, alerts, and communication settings
        </p>
      </div>

      {/* Notification Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Notifications */}
        <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Bell className="h-8 w-8 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-2xl font-bold text-blue-600">247</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Total Alerts</h3>
            <p className="text-sm text-gray-600">System notifications sent</p>
          </CardContent>
        </Card>

        {/* Email Notifications */}
        <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Mail className="h-8 w-8 text-green-500 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-2xl font-bold text-green-600">156</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Email Sent</h3>
            <p className="text-sm text-gray-600">Email notifications delivered</p>
          </CardContent>
        </Card>

        {/* In-App Messages */}
        <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <MessageSquare className="h-8 w-8 text-pink-500 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-2xl font-bold text-pink-600">91</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">In-App Messages</h3>
            <p className="text-sm text-gray-600">Messages within the app</p>
          </CardContent>
        </Card>

        {/* Active Alerts */}
        <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <AlertTriangle className="h-8 w-8 text-orange-500 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-2xl font-bold text-orange-600">3</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Active Alerts</h3>
            <p className="text-sm text-gray-600">Unresolved system alerts</p>
          </CardContent>
        </Card>
      </div>

      {/* Notification Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Status */}
        <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="h-8 w-8 text-green-500 group-hover:scale-110 transition-transform duration-300" />
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-green-600">Active</span>
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">System Status</h3>
            <p className="text-sm text-gray-600">All notification services operational</p>
            <p className="text-xs text-gray-500 mt-2">Last checked: 5 minutes ago</p>
          </CardContent>
        </Card>

        {/* Delivery Rate */}
        <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Mail className="h-8 w-8 text-purple-500 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-2xl font-bold text-purple-600">97.8%</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Delivery Rate</h3>
            <p className="text-sm text-gray-600">Successful notification delivery</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: '97.8%' }}></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notification Center Section */}
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
            Advanced Notification Center Coming Soon
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            This section will contain notification management tools, alert configuration, message templates, delivery tracking, and comprehensive communication analytics.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
