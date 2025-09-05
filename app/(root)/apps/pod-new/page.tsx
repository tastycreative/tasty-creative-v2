"use client"

import { redirect } from "next/navigation"

export default function PodNewPage() {
  // Redirect to dashboard by default
  redirect("/apps/pod-new/dashboard")
}