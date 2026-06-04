import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useItems } from '../hooks/useItems';
import { ItemGrid } from '../components/items/ItemGrid';
import { ItemFiltersPanel } from '../components/items/ItemFilters';
import type { ItemFilters } from '../types';

interface ItemsPageProps {
  type: 'lost' | 'found';
}

export function ItemsPage({ type }: ItemsPageProps) {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<ItemFilters>({
    type,
    search: searchParams.get('search') ?? undefined,
    category: (searchParams.get('category') as ItemFilters['category']) ?? undefined,
  });
  const [page, setPage] = useState(1);

  const { data, isLoading } = useItems({ ...filters, type }, page);

  const isLost = type === 'lost';

  const handleFiltersChange = (newFilters: ItemFilters) => {
    setFilters({ ...newFilters, type });
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div
            className={`p-2 rounded-xl ${isLost ? 'bg-red-100' : 'bg-blue-100'}`}
          >
            <AlertTriangle
              size={20}
              className={isLost ? 'text-red-600' : 'text-blue-600'}
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isLost ? 'Lost Items' : 'Found Items'}
          </h1>
        </div>
        <p className="text-slate-500 text-sm">
          {isLost
            ? 'Browse all reported lost items. Use filters to narrow your search.'
            : 'Items that have been found and reported on campus. Claim yours today.'}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Filters */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="sticky top-20">
            <ItemFiltersPanel filters={filters} onChange={handleFiltersChange} />
          </div>
        </div>

        {/* Items Grid */}
        <div className="flex-1 min-w-0">
          {/* Results info */}
          {!isLoading && data && (
            <p className="text-sm text-slate-500 mb-4">
              <span className="font-semibold text-slate-900">{data.total}</span>{' '}
              {isLost ? 'lost' : 'found'} items
              {filters.search ? ` matching "${filters.search}"` : ''}
            </p>
          )}

          <ItemGrid
            items={data?.items ?? []}
            isLoading={isLoading}
            total={data?.total ?? 0}
            page={page}
            onPageChange={setPage}
            emptyTitle={`No ${isLost ? 'lost' : 'found'} items`}
            emptyDescription={
              filters.search || filters.category
                ? 'Try adjusting your search filters or clearing them.'
                : `No ${isLost ? 'lost' : 'found'} items have been reported yet.`
            }
          />
        </div>
      </div>
    </div>
  );
}
