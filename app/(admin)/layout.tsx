import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import PermissionGoogle from "@/components/PermissionGoogle";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NextThemesProvider attribute="class" defaultTheme="dark" storageKey="admin-theme">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
          <AdminSidebar />

          {/* Main Content */}
          <div className="md:ml-64 transition-all duration-300">
            <main className="min-h-screen">
               <PermissionGoogle apiEndpoint={`/api/forms/list`}> {children}</PermissionGoogle>

            </main>
          </div>
        </div>
      </NextThemesProvider>
    </>
  );
}