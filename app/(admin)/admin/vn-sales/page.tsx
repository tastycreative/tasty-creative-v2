import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { FileText, DollarSign, TrendingUp, Calendar, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminVNSalesPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <div className="min-h-screen p-6 space-y-6 bg-gradient-to-br from-gray-50 via-white to-pink-50">
      {/* Header */}
      <div className="mb-8 p-6 bg-gradient-to-r from-gray-50 to-pink-50 rounded-lg border">
        <div className="flex items-center space-x-3 mb-2">
          <h1 className="text-3xl font-bold text-gray-900">VN Sales Tracker</h1>
          <FileText className="h-6 w-6 text-pink-500" />
        </div>
        <p className="text-gray-600">
          Monitor video note sales performance and revenue tracking
        </p>
      </div>

      {/* Sales Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="h-8 w-8 text-green-500 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-2xl font-bold text-green-600">$12,450</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Total Revenue</h3>
            <p className="text-sm text-gray-600">This month's earnings</p>
          </CardContent>
        </Card>

        {/* Sales Growth */}
        <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="h-8 w-8 text-pink-500 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-2xl font-bold text-pink-600">+18%</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Growth Rate</h3>
            <p className="text-sm text-gray-600">Monthly growth increase</p>
          </CardContent>
        </Card>

        {/* Video Notes Sold */}
        <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <FileText className="h-8 w-8 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-2xl font-bold text-blue-600">234</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Notes Sold</h3>
            <p className="text-sm text-gray-600">Total video notes sold</p>
          </CardContent>
        </Card>

        {/* Active Period */}
        <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="h-8 w-8 text-purple-500 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-2xl font-bold text-purple-600">30</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Active Days</h3>
            <p className="text-sm text-gray-600">Days with sales activity</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Dashboard Section */}
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
            Advanced Sales Tracking Coming Soon
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            This section will contain detailed sales analytics, revenue charts, performance metrics, and comprehensive reporting tools for video note sales tracking.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}