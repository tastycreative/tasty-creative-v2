import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function getSession() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  return session;
}
