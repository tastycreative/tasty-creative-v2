import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'SSE stream removed' }, { status: 404 });
}