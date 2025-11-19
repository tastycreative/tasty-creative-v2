import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
  let clientModelId = url.searchParams.get('clientModelId');
  const clientModelName = url.searchParams.get('clientModelName');
    const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
    const perPage = Math.min(100, Math.max(1, Number(url.searchParams.get('perPage') || '24')));
    const search = url.searchParams.get('search') || undefined;

    const where: any = {};
    if ((!clientModelId || clientModelId === 'all') && clientModelName) {
      // Try to resolve name -> id for robustness
      const client = await prisma.clientModel.findFirst({ where: { clientName: clientModelName } });
      if (client) clientModelId = client.id;
    }

    if (clientModelId && clientModelId !== 'all') {
      where.clientModelId = clientModelId;
    }
    if (search) {
      where.OR = [
        { requestId: { contains: search } },
        { finalOutput: { contains: search } },
        { psdFile: { contains: search } },
      ];
    }

    const total = await prisma.liveFlyerGallery.count({ where });
    const items = await prisma.liveFlyerGallery.findMany({
        where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * perPage,
    take: perPage,
    include: {
      clientModel: { select: { id: true, clientName: true } },
      createdBy: { select: { id: true, name: true, image: true } },
    },
      });

  return NextResponse.json({ items, pagination: { page, perPage, total, totalItems: total, totalPages: Math.ceil(total / perPage) } });
  } catch (err) {
    console.error('liveflyer/items error', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
