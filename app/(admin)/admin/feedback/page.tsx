import { auth } from "@/auth";
import { redirect } from "next/navigation";
import FeedbackAdminClient from "@/components/admin/FeedbackAdminClient";

export default async function FeedbackAdminPage() {
  const session = await auth();

  // Check if user is admin
  if (session?.user?.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return <FeedbackAdminClient />;
}
