import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text") || "No Preview";
  const width = parseInt(searchParams.get("width") || "300");
  const height = parseInt(searchParams.get("height") || "300");

  // Create a simple SVG placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <rect x="1" y="1" width="${width-2}" height="${height-2}" fill="none" stroke="#e5e7eb" stroke-width="2" stroke-dasharray="5,5"/>
      <g transform="translate(${width/2}, ${height/2})">
        <text x="0" y="-10" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#6b7280">📹</text>
        <text x="0" y="10" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#9ca3af">${text}</text>
      </g>
    </svg>
  `;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400", // Cache for 1 day
    },
  });
}
