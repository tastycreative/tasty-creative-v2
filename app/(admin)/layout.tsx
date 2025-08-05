import { AdminSidebar } from "@/components/admin/AdminSidebar";
import PermissionGoogle from "@/components/PermissionGoogle";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Decorative background elements - subtle pink accents */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-40 right-20 w-96 h-96 bg-pink-100/30 dark:bg-pink-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-40 w-80 h-80 bg-pink-50/40 dark:bg-pink-800/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gray-100/30 dark:bg-gray-800/30 rounded-full blur-3xl" />
      </div>

      {/* Flex container for sidebar and main content */}
      <div className="flex min-h-screen">
        <AdminSidebar />

        {/* Main Content */}
        <div className="flex-1 transition-all duration-300">
          <main className="min-h-screen">
            <PermissionGoogle apiEndpoint={`/api/forms/list`}>
              {children}
            </PermissionGoogle>
          </main>
        </div>
      </div>
    </div>
  );
}
