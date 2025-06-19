
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Settings, Shield, Palette, Globe, Key, Users, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminSettingsPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <div className="min-h-screen p-6 space-y-6 bg-gradient-to-br from-gray-50 via-white to-pink-50">
      {/* Header */}
      <div className="mb-8 p-6 bg-gradient-to-r from-gray-50 to-pink-50 rounded-lg border">
        <div className="flex items-center space-x-3 mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
          <Settings className="h-6 w-6 text-pink-500" />
        </div>
        <p className="text-gray-600">
          Configure application settings, security, and system preferences
        </p>
      </div>

      {/* Settings Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Security Settings */}
        <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Shield className="h-8 w-8 text-red-500 group-hover:scale-110 transition-transform duration-300" />
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-green-600">Secure</span>
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Security</h3>
            <p className="text-sm text-gray-600">Authentication & access control</p>
            <p className="text-xs text-gray-500 mt-2">2FA enabled, SSL active</p>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Palette className="h-8 w-8 text-pink-500 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-sm font-semibold text-pink-600">Light</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Appearance</h3>
            <p className="text-sm text-gray-600">Theme & UI customization</p>
            <p className="text-xs text-gray-500 mt-2">Creators Link branding active</p>
          </CardContent>
        </Card>

        {/* General Settings */}
        <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Globe className="h-8 w-8 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-sm font-semibold text-blue-600">EN</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">General</h3>
            <p className="text-sm text-gray-600">Language & regional settings</p>
            <p className="text-xs text-gray-500 mt-2">English (US), UTC timezone</p>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* API Configuration */}
        <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Key className="h-8 w-8 text-yellow-500 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-sm font-semibold text-yellow-600">Active</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">API Keys</h3>
            <p className="text-sm text-gray-600">Manage external service integrations</p>
            <p className="text-xs text-gray-500 mt-2">12 active integrations</p>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Google API</span>
                <span className="text-green-600">Connected</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">OpenAI API</span>
                <span className="text-green-600">Connected</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Management */}
        <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-8 w-8 text-purple-500 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-sm font-semibold text-purple-600">3,421</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">User Roles</h3>
            <p className="text-sm text-gray-600">Manage user permissions & access</p>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Admins</span>
                <span className="text-black font-semibold">5</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Moderators</span>
                <span className="text-yellow-600">12</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Users</span>
                <span className="text-green-600">3,404</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Settings Section */}
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
            Advanced Configuration Coming Soon
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            This section will contain advanced system configuration, environment variables, feature flags, integration settings, and comprehensive administrative controls.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
