"use client";

import Image from "next/image";
import UserProfile from '@/components/ui/UserProfile';
import { useEffect, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

interface LiveFlyerItem {
  id: string;
  date: string;
  clientModelId?: string;
  clientModel?: { id: string; clientName?: string | null } | null;
  finalOutput: string;
  template?: string | null;
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
  controlledSelectedModel?: string | 'all';
  onModelChange?: (model: string | 'all') => void;
}

export default function LiveFlyerGallery({
  clientModelId,
  clientModelName,
  controlledSelectedModel,
  onModelChange
}: Props) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [perPage] = useState(24);
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<LiveFlyerItem | null>(null);

  // Use controlled state if provided, otherwise use internal state
  const [internalSelectedModel, setInternalSelectedModel] = useState<string | 'all'>(clientModelName ?? 'all');
  const selectedModel = controlledSelectedModel !== undefined ? controlledSelectedModel : internalSelectedModel;
  const setSelectedModel = onModelChange || setInternalSelectedModel;
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [previewTriedProxy, setPreviewTriedProxy] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Track if component is mounted (for portal rendering)
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  function ModelSelector({ selected, onChange, overrideName }: { selected: string | 'all'; onChange: (val: string | 'all') => void; overrideName?: string | null }) {
    const { data, isLoading, error } = useQuery<{ success: boolean; clientModels: { id: string; clientName?: string | null; name?: string | null; status?: string | null }[] }>(
      {
        queryKey: ['client-models-active'],
        queryFn: async () => {
          const res = await fetch('/api/client-models?status=active');
          if (!res.ok) throw new Error('Failed to fetch models');
          return res.json();
        },
      }
    );

    const models = Array.isArray(data?.clientModels)
      ? data!.clientModels.filter(m => m.status?.toLowerCase() === 'active')
      : [];

    return (
      <select
        value={selected}
        onChange={(e) => onChange((e.target.value as string) || 'all')}
        className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all text-sm"
        disabled={isLoading}
      >
        <option value="all">All Models</option>
        {overrideName && <option value={overrideName}>{overrideName}</option>}
        {models.map((m: { id: string; clientName?: string | null; name?: string | null; status?: string | null }) => (
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

    // Prioritize user's selection over props
    if (selectedModel && selectedModel !== 'all') {
      params.append("clientModelName", selectedModel as string);
    } else if (clientModelId) {
      params.append("clientModelId", clientModelId);
    } else if (clientModelName && selectedModel === clientModelName) {
      // Only use clientModelName prop if selectedModel hasn't been changed by user
      params.append("clientModelName", clientModelName);
    }

    const res = await fetch(`/api/liveflyer/items?${params.toString()}`);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Failed to fetch');
    }
    return (await res.json()) as GalleryResponse;
  };

  const { data, isLoading, error, refetch } = useQuery<GalleryResponse, Error>({
    queryKey: ["liveflyer-gallery", clientModelId || clientModelName || selectedModel, page, perPage, search],
    queryFn: fetcher,
    enabled: true,
  });

  const items: LiveFlyerItem[] = (data as GalleryResponse | undefined)?.items || [];
  const pagination = (data as GalleryResponse | undefined)?.pagination;

  // Handle refresh with animation
  const handleRefresh = () => {
    setIsRefreshing(true);
    refetch();
    // Reset animation after 600ms
    setTimeout(() => setIsRefreshing(false), 600);
  };

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

  // Handle ESC key
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

  // Handle template selection and navigation
  const handleSelectTemplate = (item: LiveFlyerItem) => {
    if (!item.template) return;

    const modelName = item.clientModel?.clientName || clientModelName || '';
    const params = new URLSearchParams({
      template: item.template,
      model: modelName,
      tab: 'create'
    });

    router.push(`/live?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 bg-clip-text text-transparent">
            LiveFlyer Gallery
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isLoading ? 'Loading...' : `${pagination?.totalItems ?? items.length} ${pagination?.totalItems === 1 ? 'design' : 'designs'}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ModelSelector
            selected={selectedModel}
            onChange={(v) => { setSelectedModel(v); setPage(1); }}
            overrideName={clientModelName}
          />

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            title="Refresh data"
          >
            <svg
              className={`h-4 w-4 transition-transform ${isRefreshing || isLoading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-800 text-pink-600 dark:text-pink-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM13 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-800 text-pink-600 dark:text-pink-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search designs..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all"
            />
          </div>

          {/* Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg transition-all ${
              showFilters
                ? 'bg-pink-50 dark:bg-pink-900/20 border-pink-300 dark:border-pink-700 text-pink-700 dark:text-pink-300'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={favoritesOnly}
                onChange={(e) => setFavoritesOnly(e.target.checked)}
                className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500 focus:ring-2"
              />
              <span>Show Favorites Only</span>
            </label>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="relative">
        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 animate-pulse"
              >
                {/* Image skeleton */}
                <div className="aspect-[3/4] bg-gray-200 dark:bg-gray-700"></div>

                {/* Info skeleton */}
                <div className="p-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No designs found
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
              {search ? `No results found for "${search}"` : 'No designs available yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-200 bg-white dark:bg-gray-800 cursor-pointer"
                onClick={() => setSelectedItem(item)}
              >
                {/* Image */}
                <div className="aspect-[3/4] overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-700 relative">
                  {item.finalOutputThumbnail ? (
                    <Image
                      src={item.finalOutputThumbnail}
                      alt={item.id}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                      className="object-cover transition-opacity duration-300"
                      loading="lazy"
                    />
                  ) : item.finalOutput ? (
                    <Image
                      src={item.finalOutput}
                      alt={item.id}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                      className="object-cover transition-opacity duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <svg className="h-12 w-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-gray-800/90 rounded-full p-3">
                      <svg className="h-6 w-6 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate mb-1">
                    {displayNameMap.get(item.id) || (item.fileName && item.fileName.length ? item.fileName : resolveModelNameForItem(item))}
                  </h3>

                  {/* Template Badge */}
                  {item.template && (
                    <div className="mb-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                        {item.template}
                      </span>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                    <span>{formatDateShort(item.createdAt || item.date)}</span>
                    {item.createdBy && (
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
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="relative">
          {isLoading && (
            <div className="absolute -top-1 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-pink-600 animate-progress-bar"></div>
            </div>
          )}

          <div className="flex items-center justify-between py-6 px-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span>Page {page} of {pagination.totalPages} • {pagination.totalItems} designs total</span>
              {isLoading && (
                <span className="inline-flex items-center gap-1 text-pink-600 dark:text-pink-400">
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-pink-600"></div>
                  Loading...
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1 || isLoading}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                First
              </button>

              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      disabled={isLoading}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed ${
                        page === pageNum
                          ? 'bg-pink-600 text-white'
                          : 'border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages || isLoading}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>

              <button
                onClick={() => setPage(pagination.totalPages)}
                disabled={page === pagination.totalPages || isLoading}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Last
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal - Rendered via Portal */}
      {isMounted && selectedItem && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex flex-col"
          style={{ margin: 0, padding: 0 }}
          onClick={() => setSelectedItem(null)}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-800" onClick={(e) => e.stopPropagation()}>
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
                <div className="text-white min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold truncate">
                    {displayNameMap.get(selectedItem.id) || selectedItem.fileName || resolveModelNameForItem(selectedItem)}
                  </h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedItem.template && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 border border-pink-500/30">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                        {selectedItem.template}
                      </span>
                    )}
                    <p className="text-xs sm:text-sm text-gray-400 truncate">
                      {formatDateShort(selectedItem.createdAt || selectedItem.date)}
                      {selectedItem.createdBy && <span className="ml-2">by {selectedItem.createdBy.name}</span>}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedItem.template && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectTemplate(selectedItem);
                    }}
                    className="px-3 sm:px-4 py-2 rounded-lg border border-pink-500/50 bg-gradient-to-r from-pink-600/20 to-purple-600/20 hover:from-pink-600/30 hover:to-purple-600/30 text-pink-300 hover:text-pink-200 transition-all flex items-center gap-2 shadow-lg shadow-pink-500/20"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                    <span className="hidden sm:inline text-sm font-medium">Use Template</span>
                  </button>
                )}

                {selectedItem.finalOutput && (
                  <a
                    href={selectedItem.finalOutput}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="px-3 sm:px-4 py-2 rounded-lg border border-gray-700 text-white bg-white/5 hover:bg-white/10 transition-all flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span className="hidden sm:inline text-sm">View Image</span>
                  </a>
                )}

                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (selectedItem?.finalOutput) {
                      await navigator.clipboard?.writeText(selectedItem.finalOutput);
                    }
                  }}
                  className="px-3 sm:px-4 py-2 rounded-lg border border-gray-700 text-white bg-white/5 hover:bg-white/10 transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span className="hidden sm:inline text-sm">Copy Link</span>
                </button>

                {selectedItem.psdFile && (
                  <a
                    href={selectedItem.psdFile}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="px-3 sm:px-4 py-2 rounded-lg border border-gray-700 text-white bg-white/5 hover:bg-white/10 transition-all flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span className="hidden sm:inline text-sm">Open PSD</span>
                  </a>
                )}

                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-white hover:text-gray-300 transition-colors bg-white/10 hover:bg-white/20 rounded-full p-2"
                  aria-label="Close"
                >
                  <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
          </div>

          {/* Image Container */}
          <div className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="relative w-full h-full flex items-center justify-center">
              {previewError ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
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
                <div className="flex items-center justify-center p-12">
                  <div className="text-gray-400 text-lg">No preview available</div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center py-4 border-t border-gray-800 text-sm text-gray-400">
            Press <kbd className="px-2 py-1 bg-white/10 rounded">ESC</kbd> to close
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}