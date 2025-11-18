import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const model = url.searchParams.get('model');
    const take = Number(url.searchParams.get('take') || '50');

    if (!model) {
      return NextResponse.json({ error: 'model query param required' }, { status: 400 });
    }

    // Find the client model by name, then fetch LiveFlyerGallery by clientModelId
    const client = await prisma.clientModel.findFirst({ where: { clientName: model } });

    if (!client) {
      return NextResponse.json({ items: [] });
    }

    const items = await prisma.liveFlyerGallery.findMany({
      where: { clientModelId: client.id },
      orderBy: { createdAt: 'desc' },
      take,
    });

    return NextResponse.json(items);
  } catch (err) {
    console.error('liveflyer/gallery error', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
