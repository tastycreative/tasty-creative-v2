"use client";

import { usePathname } from "next/navigation";
import ContentLayout from "@/components/ContentLayout";
import { ProtectedFeature } from "@/components/protected-feature";

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Check if this is a POD route (now at root level)
  const exactPodRoutes = [
    "/dashboard",
    "/board",
    "/forms",
    "/my-models", // Only exact match, not subdirectories
    "/otp-ptr",
    "/pricing",
    "/onboarding",
    "/pod-admin",
    "/gallery",
    "/gif-maker",
    "/sheets",
    "/schedule", // Schedule page with self-contained layout
  ];

  const podRoutesWithSubpaths = [
    "/dashboard",
    "/board",
    "/forms",
    "/otp-ptr",
    "/pricing",
    "/onboarding",
    "/pod-admin",
    "/gallery",
    "/gif-maker",
    "/sheets",
    "/generative-ai",
  ];

  console.log("pathname", pathname);

  // Individual model profile pages use their own standalone layout
  const isModelProfileRoute =
    pathname && pathname.match(/^\/my-models\/[^\/]+/);

  const isPodRoute =
    pathname &&
    !isModelProfileRoute &&
    (exactPodRoutes.includes(pathname) ||
      podRoutesWithSubpaths.some((route) => pathname.startsWith(route + "/")) ||
      pathname.startsWith("/apps/pod-new")); // Keep legacy check

  // Routes that need completely standalone layout (no wrapper)
  const isStandaloneRoute = isModelProfileRoute;

  console.log("isModelProfileRoute", isModelProfileRoute);
  console.log("isPodRoute", isPodRoute);
  console.log("isStandaloneRoute", isStandaloneRoute);

  return (
    <div className="relative z-10">
      {isPodRoute ? (
        <ProtectedFeature>{children}</ProtectedFeature>
      ) : isStandaloneRoute ? (
        <ProtectedFeature>{children}</ProtectedFeature>
      ) : (
        <ContentLayout>{children}</ContentLayout>
      )}
    </div>
  );
}
