// app/api/auth/refresh/route.ts
import { auth } from "@/auth"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }
  
  // Inform that token refresh is automatic, but provide a fallback
  return NextResponse.json({ 
    message: "Access token refresh is now handled automatically. If you are experiencing issues, please try signing out and signing back in." 
  })
}