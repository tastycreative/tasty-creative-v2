// app/api/comfyui/history/[promptId]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const COMFYUI_BASE_URL = process.env.COMFYUI_BASE_URL;

interface RouteParams {
  params: Promise<{ promptId: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { promptId } = await params;
    
    console.log('Fetching history for prompt:', promptId);
    
    const response = await fetch(`${COMFYUI_BASE_URL}/history/${promptId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`ComfyUI responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('ComfyUI History Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get history from ComfyUI',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}