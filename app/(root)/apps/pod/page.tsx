"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PodPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/apps/pod/dashboard");
  }, [router]);

  return null;
}
