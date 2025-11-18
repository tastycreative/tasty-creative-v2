"use client";

import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface LiveFlyerItem {
  id: string;
  date: string;
  clientModelId?: string;
  clientModel?: { id: string; clientName?: string | null } | null;
  finalOutput: string;
  fileName?: string | null;
  finalOutputThumbnail?: string | null;
  psdFile?: string | null;
  createdById?: string;
  requestId?: string;
  createdAt?: string;
}

interface Props {
  clientModelId?: string | null;
  clientModelName?: string | null;
}

export default function LiveFlyerGallery({ clientModelId, clientModelName }: Props) {
  const [page, setPage] = useState(1);
  const [perPage] = useState(24);
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<LiveFlyerItem | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | 'all'>(clientModelName ?? 'all');
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [previewTriedProxy, setPreviewTriedProxy] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Small inline component to choose model (or 'all')
  function ModelSelector({ selected, onChange, overrideName }: { selected: string | 'all'; onChange: (val: string | 'all') => void; overrideName?: string | null }) {
    const { data, isLoading, error } = useQuery<{ success: boolean; clientModels: { id: string; clientName?: string | null; name?: string | null }[] }>(
      {
        queryKey: ['client-models'],
        queryFn: async () => {
          const res = await fetch('/api/client-models');
          if (!res.ok) throw new Error('Failed to fetch models');
          return res.json();
        },
      }
    );

    const models = Array.isArray(data?.clientModels) ? data!.clientModels : [];

    return (
      <select
        value={selected}
        onChange={(e) => onChange((e.target.value as string) || 'all')}
        className="rounded px-2 py-1 border"
        disabled={isLoading}
      >
        <option value="all">All</option>
        {overrideName && <option value={overrideName}>{overrideName}</option>}
        {models.map((m: { id: string; clientName?: string | null; name?: string | null }) => (
          <option key={m.id} value={m.clientName || m.name || m.id}>{m.clientName || m.name || m.id}</option>
        ))}
      </select>
    );
  }

  const queryClient = useQueryClient();

  interface GalleryResponse {
    items: LiveFlyerItem[];
    pagination?: {
      page: number;
      perPage: number;
      totalPages: number;
      totalItems: number;
    };
  }

  const fetcher = async (): Promise<GalleryResponse> => {
    const params = new URLSearchParams();
    params.append("page", String(page));
    params.append("perPage", String(perPage));
    if (search) params.append("search", search);
  // priority: explicit prop clientModelId > prop clientModelName > selectedModel dropdown
  if (clientModelId) params.append("clientModelId", clientModelId);
  else if (clientModelName) params.append("clientModelName", clientModelName);
  else if (selectedModel && selectedModel !== 'all') params.append("clientModelName", selectedModel as string);

    const res = await fetch(`/api/liveflyer/items?${params.toString()}`);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Failed to fetch');
    }
    return (await res.json()) as GalleryResponse;
  };

  const { data, isLoading, error } = useQuery<GalleryResponse, Error>({
  queryKey: ["liveflyer-gallery", clientModelId || clientModelName || selectedModel, page, perPage, search],
  queryFn: fetcher,
  // enable fetching even when there's no specific model so Outputs can show all items
  enabled: true,
  });

  const items: LiveFlyerItem[] = (data as GalleryResponse | undefined)?.items || [];
  const pagination = (data as GalleryResponse | undefined)?.pagination;

  const formatDateShort = (d?: string) => {
    if (!d) return '';
    try {
      const date = new Date(d);
      // Use 4-digit year
      const parts = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).formatToParts(date);
      const mon = parts.find(p => p.type === 'month')?.value || '';
      const day = parts.find(p => p.type === 'day')?.value || '';
      const year = parts.find(p => p.type === 'year')?.value || '';
      return `${mon} ${day} ${year}`.trim();
    } catch (e) {
      return d;
    }
  };
  // prefer the included relation clientModel.clientName
  function resolveModelNameForItem(item: LiveFlyerItem) {
    if (item.clientModel?.clientName) return item.clientModel.clientName;
    if (clientModelName) return clientModelName;
    if (selectedModel && selectedModel !== 'all') return selectedModel as string;
    return item.clientModelId || 'Model';
  }

  // Build display names and append incremental suffix when duplicates exist
  const displayNameMap = useMemo(() => {
    const freq = new Map<string, number>();
    const bases: Record<string, string> = {};
    items.forEach((item) => {
      const base = item.fileName && item.fileName.length
        ? item.fileName
        : `${resolveModelNameForItem(item)} ${formatDateShort(item.createdAt || item.date)}`;
      bases[item.id] = base;
      freq.set(base, (freq.get(base) || 0) + 1);
    });

    const counters = new Map<string, number>();
    const map = new Map<string, string>();
    items.forEach((item) => {
      const base = bases[item.id] || '';
      const count = freq.get(base) || 0;
      const idx = (counters.get(base) || 0) + 1;
      counters.set(base, idx);
      const display = count > 1 ? `${base} (${idx})` : base;
      map.set(item.id, display);
    });

    return map;
  }, [items, selectedModel, clientModelName]);

  useEffect(() => {
    if (!selectedItem) {
      setPreviewSrc(null);
      setPreviewTriedProxy(false);
      setPreviewError(null);
      return;
    }
    // prefer thumbnail if available for faster load
    const src = selectedItem.finalOutputThumbnail || selectedItem.finalOutput || null;
    setPreviewSrc(src);
    setPreviewTriedProxy(false);
    setPreviewError(null);
  }, [selectedItem]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">LiveFlyer Gallery</h2>
          <div className="text-sm text-gray-500">{isLoading ? 'Loading...' : (pagination?.totalItems ?? items.length) + ' items'}</div>
        </div>
        <div className="flex items-center gap-2">
          <ModelSelector
            selected={selectedModel}
            onChange={(v) => { setSelectedModel(v); setPage(1); }}
            overrideName={clientModelName}
          />
        </div>
      </div>

      {/* Filters & Search */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-3 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className={`relative ${isLoading ? 'opacity-60 pointer-events-none' : ''}`}>
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
            <div className="flex items-center gap-3 bg-white dark:bg-gray-800 px-6 py-3 rounded-full shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-pink-600"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Loading...</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.length === 0 ? (
            <div className="col-span-4 text-sm text-gray-500">No items</div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="group relative rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-200 bg-white dark:bg-gray-800 cursor-pointer" onClick={() => setSelectedItem(item)}>
                <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                  {item.finalOutputThumbnail ? (
                    <Image src={item.finalOutputThumbnail} alt={item.id} width={600} height={800} className="object-contain" />
                  ) : item.finalOutput ? (
                    <Image src={item.finalOutput} alt={item.id} width={600} height={800} className="object-contain" />
                  ) : (
                    <div className="text-sm text-gray-500">No image</div>
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-600 dark:text-gray-300">{displayNameMap.get(item.id) || (item.fileName && item.fileName.length ? item.fileName : `${resolveModelNameForItem(item)} ${formatDateShort(item.createdAt || item.date)}`)}</div>
                    <div className="text-xs text-gray-500">{formatDateShort(item.createdAt || item.date)}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p-1))} className="px-3 py-1 border rounded">Prev</button>
          <div className="text-sm">{page} / {pagination.totalPages}</div>
          <button onClick={() => setPage(p => Math.min(pagination.totalPages, p+1))} className="px-3 py-1 border rounded">Next</button>
        </div>
      )}

      {selectedItem && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
              <div className="bg-white dark:bg-gray-900 rounded-lg max-w-3xl w-full p-4 max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <h3 className="font-semibold">Preview</h3>
              <div className="flex gap-2">
                <button onClick={async () => { if (selectedItem?.finalOutput) await navigator.clipboard?.writeText(selectedItem.finalOutput); }} className="px-3 py-1 border rounded text-sm">Copy Link</button>
                {selectedItem.psdFile && (
                  <a href={selectedItem.psdFile} download className="px-3 py-1 border rounded text-sm">Download PSD</a>
                )}
                <button onClick={() => setSelectedItem(null)} className="px-3 py-1 border rounded text-sm">Close</button>
              </div>
            </div>
                <div className="mt-4">
                  {previewError ? (
                    <div className="flex flex-col items-center justify-center p-6 text-center">
                      <div className="text-red-600 mb-2">Failed to load preview image.</div>
                      {selectedItem?.finalOutput && (
                        <a href={selectedItem.finalOutput} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">Open original image in new tab</a>
                      )}
                    </div>
                  ) : previewSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <div className="w-full flex items-center justify-center">
                      {/* Image constrained to viewport height */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewSrc}
                        alt="preview"
                        className="w-full h-auto max-h-[80vh] object-contain"
                        onError={() => {
                          // if we haven't tried proxy yet, attempt to proxy the original URL once
                          const orig = selectedItem?.finalOutput || selectedItem?.finalOutputThumbnail;
                          if (orig && !previewTriedProxy) {
                            setPreviewTriedProxy(true);
                            setPreviewSrc(`/api/media-proxy?url=${encodeURIComponent(orig)}`);
                            return;
                          }
                          setPreviewError('failed');
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-500">No preview</div>
                  )}
                </div>
          </div>
        </div>
      )}
    </div>
  );
}
