"use client";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function AppsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isSubPage = pathname !== "/apps";

  // Handle back navigation with animation
  const handleBack = () => {
    router.push("/apps");
  };

  return (
    <div className="relative w-full h-full">
      <title>Apps | Tasty Creative</title>
      {/* Pink themed background with decorative elements */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-pink-50/30 to-rose-50/50 -z-50"></div>
      <div className="fixed top-10 right-10 w-72 h-72 bg-pink-300/20 rounded-full blur-3xl -z-40"></div>
      <div className="fixed bottom-10 left-10 w-96 h-96 bg-rose-300/15 rounded-full blur-3xl -z-40"></div>
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-200/10 rounded-full blur-3xl -z-40"></div>

      {/* Back Button - Only show on sub-pages */}
      {isSubPage && (
        <button
          //initial={{ opacity: 0, x: -20 }}
          //animate={{ opacity: 1, x: 0 }}
          //exit={{ opacity: 0, x: -20 }}
          //transition={{ duration: 0.3 }}
          onClick={handleBack}
          className="fixed top-4 left-4 z-50 group flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border border-pink-200/50 hover:border-pink-300/60"
        >
          <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          <span className="font-medium text-gray-700">
            Back to Apps
          </span>
        </button>
      )}

      {/* Page Content */}
      <div className="relative w-full h-full">
        {/* Fluid Animation Overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          //initial={{ opacity: 0 }}
          //animate={{ opacity: 1 }}
          //transition={{ duration: 0.3 }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-pink-50/10 to-transparent" />
        </div>

        {/* Children Content */}
        <div className={`relative z-10 h-full ${isSubPage ? "pt-12" : ""}`}>
          {children}
        </div>
      </div>

    </div>
  );
}
