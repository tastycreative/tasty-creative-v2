"use client";

import Image from "next/image";
import UserProfile from '@/components/ui/UserProfile';
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
  createdBy?: { id: string; name?: string | null; image?: string | null } | null;
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

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
        className="rounded-lg px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
        disabled={isLoading}
      >
        <option value="all">All Models</option>
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
    enabled: true,
  });

  const items: LiveFlyerItem[] = (data as GalleryResponse | undefined)?.items || [];
  const pagination = (data as GalleryResponse | undefined)?.pagination;

  const formatDateShort = (d?: string) => {
    if (!d) return '';
    try {
      const date = new Date(d);
      const parts = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).formatToParts(date);
      const mon = parts.find(p => p.type === 'month')?.value || '';
      const day = parts.find(p => p.type === 'day')?.value || '';
      const year = parts.find(p => p.type === 'year')?.value || '';
      return `${mon} ${day}, ${year}`.trim();
    } catch (e) {
      return d;
    }
  };

  function resolveModelNameForItem(item: LiveFlyerItem) {
    if (item.clientModel?.clientName) return item.clientModel.clientName;
    if (clientModelName) return clientModelName;
    if (selectedModel && selectedModel !== 'all') return selectedModel as string;
    return item.clientModelId || 'Model';
  }

  const displayNameMap = useMemo(() => {
    const freq = new Map<string, number>();
    const bases: Record<string, string> = {};
    items.forEach((item) => {
      const base = item.fileName && item.fileName.length ? item.fileName : `${resolveModelNameForItem(item)}`;
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
    const src = selectedItem.finalOutputThumbnail || selectedItem.finalOutput || null;
    setPreviewSrc(src);
    setPreviewTriedProxy(false);
    setPreviewError(null);
  }, [selectedItem]);

  useEffect(() => {
    if (selectedItem) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedItem]);

  useEffect(() => {
    if (!selectedItem) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        setSelectedItem(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedItem]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 ">
      <div className=" mx-auto space-y-8">
        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                LiveFlyer Gallery
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {isLoading ? 'Loading...' : `${pagination?.totalItems ?? items.length} creative designs`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <ModelSelector
                selected={selectedModel}
                onChange={(v) => { setSelectedModel(v); setPage(1); }}
                overrideName={clientModelName}
              />
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  showFilters 
                    ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30' 
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-pink-600 dark:hover:border-pink-500'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filters
                </span>
              </button>

              <div className="flex items-center bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 p-1 shadow-sm">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-md font-medium transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-pink-600 text-white shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-pink-600'
                  }`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM13 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-md font-medium transition-all ${
                    viewMode === 'list' 
                      ? 'bg-pink-600 text-white shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-pink-600'
                  }`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-6">
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search designs..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="mt-6 p-6 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-700 dark:to-gray-800 border border-pink-200 dark:border-gray-600 rounded-xl">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={favoritesOnly} 
                    onChange={(e) => setFavoritesOnly(e.target.checked)} 
                    className="w-5 h-5 text-pink-600 rounded focus:ring-pink-500 focus:ring-2"
                  />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Show Favorites Only</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Grid */}
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-600 border-t-transparent"></div>
                <span className="text-lg font-medium text-gray-700 dark:text-gray-300">Loading designs...</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {items.length === 0 ? (
              <div className="col-span-full text-center py-20">
                <div className="text-6xl mb-4">🎨</div>
                <p className="text-xl text-gray-500 dark:text-gray-400">No designs found</p>
              </div>
            ) : (
              items.map((item) => (
                <div 
                  key={item.id} 
                  className="group relative rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-2xl hover:shadow-pink-600/20 hover:-translate-y-2 transition-all duration-300 bg-white dark:bg-gray-800 cursor-pointer"
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center overflow-hidden relative">
                    {item.finalOutputThumbnail ? (
                      <Image src={item.finalOutputThumbnail} alt={item.id} fill className="object-cover group-hover:scale-110 transition-transform duration-300" />
                    ) : item.finalOutput ? (
                      <Image src={item.finalOutput} alt={item.id} fill className="object-cover group-hover:scale-110 transition-transform duration-300" />
                    ) : (
                      <div className="text-gray-400">No image</div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate mb-2">
                      {displayNameMap.get(item.id) || (item.fileName && item.fileName.length ? item.fileName : resolveModelNameForItem(item))}
                    </h3>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>{formatDateShort(item.createdAt || item.date)}</span>
                      {item.createdBy && (
                        <div className="flex items-center gap-2">
                          <UserProfile 
                            user={{ 
                              id: item.createdBy.id, 
                              name: item.createdBy.name ?? undefined, 
                              email: null, 
                              image: item.createdBy?.image ?? undefined 
                            }} 
                            size="xs" 
                            className="ring-2 ring-white dark:ring-gray-800" 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Page <span className="font-semibold text-pink-600">{page}</span> of <span className="font-semibold">{pagination.totalPages}</span>
                <span className="mx-2">•</span>
                <span className="font-semibold">{pagination.totalItems}</span> total items
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1 || isLoading}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-gray-700 hover:border-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  First
                </button>

                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || isLoading}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-gray-700 hover:border-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>

                <div className="hidden sm:flex items-center gap-1">
                  {(() => {
                    const pages: (number | '...')[] = [];
                    const total = pagination.totalPages;
                    const current = page;
                    const range = 1;
                    const start = Math.max(1, current - range);
                    const end = Math.min(total, current + range);

                    if (start > 1) {
                      pages.push(1);
                      if (start > 2) pages.push('...');
                    }

                    for (let i = start; i <= end; i++) pages.push(i);

                    if (end < total) {
                      if (end < total - 1) pages.push('...');
                      pages.push(total);
                    }

                    return pages.map((p, idx) => (
                      p === '...' ? (
                        <span key={`e-${idx}`} className="px-3 py-2 text-sm text-gray-500">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPage(p as number)}
                          disabled={p === page}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            p === page 
                              ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' 
                              : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-gray-700 hover:border-pink-600'
                          }`}
                        >
                          {p}
                        </button>
                      )
                    ));
                  })()}
                </div>

                <button
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages || isLoading}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-gray-700 hover:border-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>

                <button
                  onClick={() => setPage(pagination.totalPages)}
                  disabled={page === pagination.totalPages || isLoading}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-gray-700 hover:border-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Last
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {selectedItem && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, margin: 0, padding: 0 }}
          onClick={() => setSelectedItem(null)}
        >
          <div className="h-full w-full flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-800" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-4">
                {selectedItem.createdBy && (
                  <UserProfile 
                    user={{ 
                      id: selectedItem.createdBy.id, 
                      name: selectedItem.createdBy.name ?? undefined, 
                      email: null, 
                      image: selectedItem.createdBy?.image ?? undefined 
                    }} 
                    size="md" 
                    className="ring-2 ring-gray-700" 
                    showTooltip 
                  />
                )}
                <div className="text-white">
                  <h3 className="text-xl font-bold">
                    {displayNameMap.get(selectedItem.id) || selectedItem.fileName || resolveModelNameForItem(selectedItem)}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {formatDateShort(selectedItem.createdAt || selectedItem.date)}
                    {selectedItem.createdBy && <span className="ml-2">by {selectedItem.createdBy.name}</span>}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={async (e) => { 
                    e.stopPropagation(); 
                    if (selectedItem?.finalOutput) {
                      await navigator.clipboard?.writeText(selectedItem.finalOutput);
                    }
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-700 text-white bg-white/5 hover:bg-white/10 transition-all flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Link
                </button>

                {selectedItem.psdFile && (
                  <a
                    href={selectedItem.psdFile}
                    download
                    onClick={(e) => e.stopPropagation()}
                    className="px-4 py-2 rounded-lg border border-gray-700 text-white bg-white/5 hover:bg-white/10 transition-all flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PSD
                  </a>
                )}

                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedItem(null); }}
                  className="ml-2 text-white hover:text-gray-300 transition-colors bg-white/10 hover:bg-white/20 rounded-full p-3"
                  aria-label="Close preview (ESC)"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Image Container */}
            <div className="flex-1 flex items-center justify-center p-8 overflow-auto" onClick={(e) => e.stopPropagation()}>
              <div className="relative max-w-full max-h-full">
                {previewError ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-900 rounded-2xl">
                    <svg className="w-16 h-16 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-red-400 text-lg mb-4">Failed to load preview image</div>
                    {selectedItem?.finalOutput && (
                      <a 
                        href={selectedItem.finalOutput} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-pink-400 hover:text-pink-300 underline flex items-center gap-2"
                      >
                        Open original image in new tab
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>
                ) : previewSrc ? (
                  <img
                    src={previewSrc}
                    alt="preview"
                    className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                    onError={() => {
                      const orig = selectedItem?.finalOutput || selectedItem?.finalOutputThumbnail;
                      if (orig && !previewTriedProxy) {
                        setPreviewTriedProxy(true);
                        setPreviewSrc(`/api/media-proxy?url=${encodeURIComponent(orig)}`);
                        return;
                      }
                      setPreviewError('failed');
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center p-12 bg-gray-900 rounded-2xl">
                    <div className="text-gray-400 text-lg">No preview available</div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer hint */}
            <div className="flex-shrink-0 p-4 text-center">
              <div className="inline-flex items-center gap-2 text-white text-sm bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
                Press <kbd className="px-3 py-1 bg-white/20 rounded-md font-mono">ESC</kbd> to close
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}