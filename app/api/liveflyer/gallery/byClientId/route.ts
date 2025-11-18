import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const clientModelId = url.searchParams.get('clientModelId');
    const page = Number(url.searchParams.get('page') || '1');
    const perPage = Number(url.searchParams.get('perPage') || '24');
    const q = url.searchParams.get('q') || '';

    if (!clientModelId) {
      return NextResponse.json({ error: 'clientModelId query param required' }, { status: 400 });
    }

    const where: any = { clientModelId };
    if (q) {
      where.OR = [
        { requestId: { contains: q, mode: 'insensitive' } },
        { finalOutput: { contains: q, mode: 'insensitive' } },
      ];
    }

    const total = await prisma.liveFlyerGallery.count({ where });

    const items = await prisma.liveFlyerGallery.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    return NextResponse.json({ items, pagination: { page, perPage, total } });
  } catch (err) {
    console.error('liveflyer/byClientId error', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
