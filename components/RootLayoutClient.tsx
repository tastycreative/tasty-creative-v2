"use client";

import { usePathname } from "next/navigation";
import ContentLayout from "@/components/ContentLayout";
import { ProtectedFeature } from "@/components/protected-feature";

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPodNewRoute = pathname?.startsWith("/apps/pod-new");

  return (
    <div className="relative z-10">
      {isPodNewRoute ? (
        <ProtectedFeature>{children}</ProtectedFeature>
      ) : (
        <ContentLayout>{children}</ContentLayout>
      )}
    </div>
  );
}
