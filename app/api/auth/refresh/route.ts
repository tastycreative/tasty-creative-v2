// app/api/auth/refresh/route.ts
import { auth } from "@/auth"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }
  
  // Force a new sign-in to refresh the JWT token
  return NextResponse.json({ 
    message: "Please sign out and sign back in to refresh your permissions" 
  })
}