import type { ReactNode } from 'react';
import { Calendar, ChevronLeft, FileDown, Search } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function FiltersToolbar() {
  return (
    <Card className="flex flex-wrap items-center gap-4 bg-gradient-to-r from-brand-50/70 to-white px-6 py-5 shadow-soft">
      <button
        aria-label="Selecionar período anterior"
        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-soft transition hover:bg-brand-600"
        type="button"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <FilterField label="Centro de custo">
        <button
          className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-500 shadow-sm transition hover:border-brand-200 hover:text-brand-700"
          type="button"
        >
          <span>Selecione...</span>
          <ChevronLeft className="h-4 w-4 rotate-180 text-slate-400" />
        </button>
      </FilterField>

      <FilterField label="Data Inicial">
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-500">dd/mm/aaaa</span>
        </div>
      </FilterField>

      <FilterField label="Data Final">
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-500">dd/mm/aaaa</span>
        </div>
      </FilterField>

      <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm transition hover:border-brand-200 hover:text-brand-700">
        <input
          checked
          readOnly
          className="h-4 w-4 rounded border-brand-500 text-brand-500"
          type="checkbox"
        />
        Emitidos
      </label>

      <div className="ml-auto flex items-center gap-3">
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
}

function FilterField({ children, label }: FilterFieldProps) {
  return (
    <div className={cn('flex min-w-[180px] flex-col gap-1')}>
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </div>
  );
}
