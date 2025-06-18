import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ThemeProvider } from "@/components/admin/ThemeProvider";
import PermissionGoogle from "@/components/PermissionGoogle";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                const savedTheme = document.cookie
                  .split('; ')
                  .find(row => row.startsWith('admin-theme='))
                  ?.split('=')[1] || 'dark';

                document.documentElement.classList.add(savedTheme);
                document.documentElement.setAttribute('data-theme', savedTheme);
                document.body.classList.add(savedTheme);
              } catch (e) {
                document.documentElement.classList.add('dark');
                document.documentElement.setAttribute('data-theme', 'dark');
                document.body.classList.add('dark');
              }
            })()
          `,
        }}
      />
      <ThemeProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
          <AdminSidebar />

          {/* Main Content */}
          <div className="md:ml-64 transition-all duration-300">
            <main className="min-h-screen">
               <PermissionGoogle apiEndpoint={`/api/forms/list`}> {children}</PermissionGoogle>

            </main>
          </div>
        </div>
      </ThemeProvider>
    </>
  );
}