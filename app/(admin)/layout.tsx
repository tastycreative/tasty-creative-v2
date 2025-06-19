"use client";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <SessionProvider>
      <div className="flex h-screen bg-gray-50">
        <AdminSidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}