"use client";

import { usePathname } from "next/navigation";
import ContentLayout from "@/components/ContentLayout";
import { ProtectedFeature } from "@/components/protected-feature";

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  
  return (
    <div className="relative z-10 h-full">
        <ContentLayout>{children}</ContentLayout>
    </div>
  );
}
