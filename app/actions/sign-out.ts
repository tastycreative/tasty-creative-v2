// app/actions/sign-out.ts
'use server';

import { signOut } from "@/auth";

export async function handleLogout() {
  await signOut();
}
