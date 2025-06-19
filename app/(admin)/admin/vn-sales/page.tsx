import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { FileText, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default async function VNSalesPage() {
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

      {/* Coming Soon Section */}
      <Card className="border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-pink-300 group bg-white relative">
        {/* Glass reflection effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 via-pink-100/25 to-transparent -translate-x-full group-hover:animate-[slideGlassRight_700ms_ease-in-out_forwards] animate-[slideGlassLeft_700ms_ease-in-out_forwards]"></div>
        </div>
        <CardContent className="p-12 text-center">
          <div className="flex justify-center mb-6">
            <Sparkles className="h-16 w-16 text-pink-500 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            VN Sales Tracker Coming Soon
          </h2>
          <p className="text-gray-600 max-w-lg mx-auto text-lg">
            We&apos;re developing comprehensive video note sales tracking features including revenue analytics, performance metrics, and automated reporting tools. Stay tuned for exciting updates!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}