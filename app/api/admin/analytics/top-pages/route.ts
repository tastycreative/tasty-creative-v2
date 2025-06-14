
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { getTopPages } from "@/lib/analytics";

export async function GET() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const topPages = await getTopPages(10);
    return NextResponse.json(topPages);
  } catch (error) {
    console.error("Error fetching top pages:", error);
    return NextResponse.json(
      { error: "Failed to fetch top pages" },
      { status: 500 }
    );
  }
}
