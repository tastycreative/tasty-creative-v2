// app/actions/sign-out.ts
'use server';

import { signIn } from "@/auth";

export async function handleSignIn() {
  await signIn();
}
