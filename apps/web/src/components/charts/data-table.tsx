/**
 * Data Table Component
 */

import type { ComponentProps } from 'react';
import { useState } from 'react';
import { ChevronUp, ChevronDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';

import { formatCurrency, formatNumber } from '@dashboard/shared';
import type { TableResponse } from '@dashboard/types';

import { cn } from '@/lib/utils';

interface DataTableProps extends ComponentProps<'div'> {
  data: TableResponse;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  onLoadMore?: () => void;
  loading?: boolean;
  hasMore?: boolean;
}

type SortConfig = {
  column: string;
  direction: 'asc' | 'desc';
} | null;

/**
 * Format cell value based on column type
 */
function formatCellValue(value: any, column: string): React.ReactNode {
  if (value == null) return '--';

  const columnLower = column.toLowerCase();

  if (columnLower.includes('receita') || columnLower.includes('revenue')) {
    return (
      <div className="flex items-center gap-1 font-semibold text-emerald-600">
        <ArrowUpRight className="h-3 w-3" />
        {typeof value === 'number' ? formatCurrency(value) : value}
      </div>
    );
  }

  if (columnLower.includes('despesa') || columnLower.includes('expense')) {
    return (
      <div className="flex items-center gap-1 font-semibold text-rose-600">
        <ArrowDownRight className="h-3 w-3" />
        {typeof value === 'number' ? formatCurrency(value) : value}
      </div>
    );
  }

  if (columnLower.includes('resultado') || columnLower.includes('profit')) {
    const isNegative = typeof value === 'number' && value < 0;
    return (
      <div className={cn(
        'flex items-center gap-1 font-semibold',
        isNegative ? 'text-rose-600' : 'text-emerald-600'
      )}>
        {isNegative ? (
          <ArrowDownRight className="h-3 w-3" />
        ) : (
          <ArrowUpRight className="h-3 w-3" />
        )}
        {typeof value === 'number' ? formatCurrency(value) : value}
      </div>
    );
  }

  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return formatNumber(value, { maximumFractionDigits: 0 });
    }
    return formatNumber(value);
  }

  return String(value);
}

/**
 * Data Table Component
 */
export function DataTable({
  data,
  onSort,
  onLoadMore,
  loading = false,
  hasMore = false,
  className,
  ...props
}: DataTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  const handleSort = (column: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig?.column === column && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ column, direction });
    onSort?.(column, direction);
  };

  const getSortIcon = (column: string) => {
    if (sortConfig?.column !== column) {
      return null;
    }
    
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    );
  };

  if (!data.columns.length || !data.rows.length) {
    return (
      <div className={cn(
        'flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50',
        className
      )} {...props}>
        <div className="text-center">
          <p className="text-sm font-medium text-slate-600">Nenhum dado disponível</p>
          <p className="text-xs text-slate-500">
            Ajuste os filtros para ver os resultados
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('w-full overflow-hidden rounded-2xl border border-slate-200', className)} {...props}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-100/70">
            <tr>
              {data.columns.map((column) => {
                const columnKey = typeof column === 'string' ? column : column.key;
                const columnLabel = typeof column === 'string' ? column : column.label;
                return (
                  <th
                    key={columnKey}
                    className={cn(
                      'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500',
                      onSort && 'cursor-pointer hover:bg-slate-200/50'
                    )}
                    onClick={() => onSort && handleSort(columnKey)}
                  >
                    <div className="flex items-center gap-1">
                      {columnLabel}
                      {getSortIcon(columnKey)}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {data.rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="transition-colors hover:bg-slate-50"
              >
                {data.columns.map((column) => {
                  const columnKey = typeof column === 'string' ? column : column.key;
                  return (
                    <td
                      key={columnKey}
                      className="px-4 py-3 text-sm text-slate-600"
                    >
                      {formatCellValue((row as any)[columnKey], columnKey)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className={cn(
              'w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50',
              loading && 'cursor-not-allowed opacity-50'
            )}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                Carregando...
              </div>
            ) : (
              'Carregar mais'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
