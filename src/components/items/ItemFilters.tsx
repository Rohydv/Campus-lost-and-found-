import React from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import type { ItemFilters, ItemCategory, ItemStatus } from '../../types';
import { ITEM_CATEGORIES, CAMPUS_LOCATIONS } from '../../lib/utils';
import { Input, Select } from '../ui/Input';
import { Button } from '../ui/Button';

interface ItemFiltersProps {
  filters: ItemFilters;
  onChange: (filters: ItemFilters) => void;
  showTypeFilter?: boolean;
}

const STATUS_OPTIONS: { value: ItemStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'expired', label: 'Expired' },
];

export function ItemFiltersPanel({ filters, onChange, showTypeFilter = false }: ItemFiltersProps) {
  const hasActiveFilters =
    (filters.search && filters.search.length > 0) ||
    filters.category ||
    filters.location ||
    filters.dateFrom ||
    filters.dateTo ||
    (showTypeFilter && filters.type);

  const clearFilters = () => {
    onChange({});
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700">Filters</h3>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-blue-500" />
          )}
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            <X size={12} />
            Clear all
          </button>
        )}
      </div>

      {/* Search */}
      <Input
        placeholder="Search items, locations…"
        value={filters.search ?? ''}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        leftIcon={<Search size={15} />}
        rightIcon={
          filters.search ? (
            <button onClick={() => onChange({ ...filters, search: '' })}>
              <X size={14} />
            </button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
        {/* Type filter */}
        {showTypeFilter && (
          <Select
            label="Type"
            value={filters.type ?? ''}
            onChange={(e) => onChange({ ...filters, type: e.target.value as ItemFilters['type'] })}
            options={[
              { value: 'lost', label: '🔴 Lost Items' },
              { value: 'found', label: '🔵 Found Items' },
            ]}
            placeholder="All Types"
          />
        )}

        {/* Category */}
        <Select
          label="Category"
          value={filters.category ?? ''}
          onChange={(e) =>
            onChange({ ...filters, category: e.target.value as ItemCategory | undefined })
          }
          options={ITEM_CATEGORIES}
          placeholder="All Categories"
        />

        {/* Location */}
        <Select
          label="Location"
          value={filters.location ?? ''}
          onChange={(e) => onChange({ ...filters, location: e.target.value })}
          options={CAMPUS_LOCATIONS.map((l) => ({ value: l, label: l }))}
          placeholder="All Locations"
        />

        {/* Status */}
        <Select
          label="Status"
          value={filters.status ?? ''}
          onChange={(e) =>
            onChange({ ...filters, status: e.target.value as ItemStatus | undefined })
          }
          options={STATUS_OPTIONS}
          placeholder="Active Items"
        />

        {/* Date range */}
        <Input
          label="From Date"
          type="date"
          value={filters.dateFrom ?? ''}
          onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
        />
        <Input
          label="To Date"
          type="date"
          value={filters.dateTo ?? ''}
          onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
        />
      </div>
    </div>
  );
}
