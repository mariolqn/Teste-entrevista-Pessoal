/**
 * Filters Toolbar Component
 */

import type { ReactNode } from 'react';
import { ChevronLeft, FileDown, RotateCcw, Search } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { InfiniteScrollSelect } from '@/components/ui/infinite-scroll-select';
import { useDashboardStore } from '@/stores/dashboard-store';
import { cn } from '@/lib/utils';

/**
 * Quick date range presets
 */
const DATE_PRESETS = [
  {
    label: 'Últimos 7 dias',
    getValue: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 7);
      return { start: start.toISOString(), end: end.toISOString() };
    },
  },
  {
    label: 'Últimos 30 dias',
    getValue: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      return { start: start.toISOString(), end: end.toISOString() };
    },
  },
  {
    label: 'Últimos 90 dias',
    getValue: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 90);
      return { start: start.toISOString(), end: end.toISOString() };
    },
  },
  {
    label: 'Este mês',
    getValue: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start: start.toISOString(), end: end.toISOString() };
    },
  },
  {
    label: 'Mês anterior',
    getValue: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: start.toISOString(), end: end.toISOString() };
    },
  },
] as const;

/**
 * Filters Toolbar Component
 */
export function FiltersToolbar() {
  const {
    filters,
    setDateRange,
    setSelectedCategory,
    setSelectedProduct,
    setSelectedCustomer,
    setIncludeEmitted,
    resetFilters,
  } = useDashboardStore();

  const handlePresetClick = (preset: typeof DATE_PRESETS[number]) => {
    const dateRange = preset.getValue();
    setDateRange(dateRange);
  };

  const handlePreviousPeriod = () => {
    const start = new Date(filters.dateRange.start);
    const end = new Date(filters.dateRange.end);
    const diffInDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    const newEnd = new Date(start);
    newEnd.setDate(newEnd.getDate() - 1);
    
    const newStart = new Date(newEnd);
    newStart.setDate(newStart.getDate() - diffInDays + 1);
    
    setDateRange({
      start: newStart.toISOString(),
      end: newEnd.toISOString(),
    });
  };

  return (
    <Card className="flex flex-wrap items-center gap-4 bg-gradient-to-r from-brand-50/70 to-white px-6 py-5 shadow-soft">
      {/* Previous period button */}
      <button
        onClick={handlePreviousPeriod}
        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-soft transition hover:bg-brand-600"
        type="button"
        title="Período anterior"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {/* Date range picker */}
      <FilterField label="Período" required>
        <DateRangePicker
          value={filters.dateRange}
          onChange={(dateRange) => dateRange && setDateRange(dateRange)}
          required
          className="min-w-[220px]"
        />
      </FilterField>

      {/* Quick date presets */}
      <div className="flex items-center gap-2">
        {DATE_PRESETS.slice(0, 3).map((preset) => (
          <button
            key={preset.label}
            onClick={() => handlePresetClick(preset)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-brand-50 hover:text-brand-700"
            type="button"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Category filter */}
      <FilterField label="Centro de custo">
        <InfiniteScrollSelect
          entity="categories"
          label="Centro de custo"
          value={filters.selectedCategory ?? null}
          onChange={(option) => setSelectedCategory(option)}
          placeholder="Todos os centros"
          className="min-w-[180px]"
        />
      </FilterField>

      {/* Product filter */}
      <FilterField label="Produto">
        <InfiniteScrollSelect
          entity="products"
          label="Produto"
          value={filters.selectedProduct ?? null}
          onChange={(option) => setSelectedProduct(option)}
          placeholder="Todos os produtos"
          className="min-w-[180px]"
        />
      </FilterField>

      {/* Customer filter */}
      <FilterField label="Cliente">
        <InfiniteScrollSelect
          entity="customers"
          label="Cliente"
          value={filters.selectedCustomer ?? null}
          onChange={(option) => setSelectedCustomer(option)}
          placeholder="Todos os clientes"
          className="min-w-[180px]"
        />
      </FilterField>

      {/* Emitted checkbox */}
      <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm transition hover:border-brand-200 hover:text-brand-700">
        <input
          checked={filters.includeEmitted}
          onChange={(e) => setIncludeEmitted(e.target.checked)}
          className="h-4 w-4 rounded border-brand-500 text-brand-500"
          type="checkbox"
        />
        Emitidos
      </label>

      {/* Actions */}
      <div className="ml-auto flex items-center gap-3">
        <button
          onClick={resetFilters}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
          type="button"
          title="Limpar filtros"
        >
          <RotateCcw className="h-4 w-4" />
          Limpar
        </button>

        <button
          className="inline-flex items-center gap-2 rounded-2xl border border-brand-500 bg-white px-4 py-3 text-sm font-semibold text-brand-600 shadow-sm transition hover:bg-brand-50"
          type="button"
        >
          <FileDown className="h-4 w-4" />
          PDF
        </button>

        <button
          className="inline-flex items-center gap-2 rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-600"
          type="button"
        >
          <Search className="h-4 w-4" />
          Pesquisar
        </button>
      </div>
    </Card>
  );
}

interface FilterFieldProps {
  children: ReactNode;
  label: string;
  required?: boolean;
}

function FilterField({ children, label, required = false }: FilterFieldProps) {
  return (
    <div className={cn('flex min-w-[180px] flex-col gap-1')}>
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </span>
      {children}
    </div>
  );
}