/**
 * Accounts Panel Component - Real data implementation
 */

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/charts';
import { useTableData } from '@/hooks/use-chart-data';

/**
 * Default date range (last 30 days)
 */
const getDefaultDateRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
};

/**
 * Fallback static data (matching the seed values)
 */
const FALLBACK_DATA = {
  columns: ['Nome', 'Despesa', 'Receita', 'Resultado'],
  rows: [
    {
      Nome: 'Suzano Transporte Florestal',
      Despesa: 53549.47,
      Receita: 41954.26,
      Resultado: -11595.21,
    },
    {
      Nome: 'Transporte de Agregados Itabira MG',
      Despesa: 14191.32,
      Receita: 0,
      Resultado: -14191.32,
    },
  ],
  cursor: undefined,
};

/**
 * Accounts Panel Component
 */
export function AccountsPanel() {
  const [dateRange] = useState(getDefaultDateRange);
  
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTableData({
    ...dateRange,
    metric: 'revenue',
    limit: 10,
  });

  // Transform infinite query data to table format
  const tableData = data
    ? {
        columns: (data.pages[0] as any)?.columns || FALLBACK_DATA.columns,
        rows: data.pages.flatMap(page => (page as any)?.rows || []),
        cursor: (data.pages[data.pages.length - 1] as any)?.cursor,
      }
    : FALLBACK_DATA;

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Contas por centro de custo</CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            Visão detalhada dos principais centros de custo e seus resultados financeiros.
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 shadow-sm transition hover:bg-slate-50"
          type="button"
        >
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          Exportar
        </button>
      </CardHeader>
      
      <CardContent>
        {error && !isLoading ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-rose-200 bg-rose-50/30">
            <div className="text-center">
              <p className="text-sm font-medium text-rose-600">
                Erro ao carregar dados
              </p>
              <p className="text-xs text-slate-500">
                Exibindo dados de exemplo
              </p>
            </div>
          </div>
        ) : null}

        <DataTable
          data={tableData}
          loading={isLoading || isFetchingNextPage}
          hasMore={hasNextPage}
          onLoadMore={handleLoadMore}
          className="border-0 shadow-none"
        />
      </CardContent>
    </Card>
  );
}