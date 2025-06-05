"use client";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";

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
    setTimeout(() => {
      router.push("/apps");
    }, 200);
  };

  return (
    <div className="relative w-full h-full">
      {/* Animated Background Gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20"
        animate={{
          background: [
            "radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.1) 0%, transparent 50%)",
            "radial-gradient(circle at 80% 50%, rgba(120, 119, 198, 0.1) 0%, transparent 50%)",
            "radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.1) 0%, transparent 50%)",
          ],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />

      {/* Back Button - Only show on sub-pages */}
      {isSubPage && (
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          onClick={handleBack}
          className="fixed top-4 left-4 z-50 group flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50"
        >
          <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          <span className="font-medium text-gray-700 dark:text-gray-200">
            Back to Apps
          </span>
        </motion.button>
      )}

      {/* Page Content */}
      <div className="relative w-full h-full">
        {/* Fluid Animation Overlay */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-transparent" />
        </motion.div>

        {/* Children Content */}
        <div
          className={`relative z-10 h-full ${
            isSubPage ? "pt-12" : ""
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}