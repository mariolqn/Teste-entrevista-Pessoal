/**
 * Accounts Panel Component - Connected to global state
 */

import { AlertTriangle } from 'lucide-react';

import type { TableResponse } from '@dashboard/types';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/charts';
import { useTableData } from '@/hooks/use-chart-data';
import { useChartAPIParams } from '@/stores/dashboard-store';

/**
 * Fallback static data (matching the seed values)
 */
const FALLBACK_DATA: TableResponse = {
  columns: [
    { key: 'Nome', label: 'Nome', type: 'string' },
    { key: 'Despesa', label: 'Despesa', type: 'currency' },
    { key: 'Receita', label: 'Receita', type: 'currency' },
    { key: 'Resultado', label: 'Resultado', type: 'currency' },
  ],
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
};

/**
 * Accounts Panel Component
 */
export function AccountsPanel() {
  const apiParams = useChartAPIParams();
  
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTableData({
    ...apiParams,
    metric: 'revenue',
    limit: 10,
  });

  // Transform infinite query data to table format
  const tableData: TableResponse = data
    ? (() => {
        const result: TableResponse = {
          columns: data.pages[0]?.columns || FALLBACK_DATA.columns,
          rows: data.pages.flatMap(page => page.rows || []),
        };
        const lastPageCursor = data.pages[data.pages.length - 1]?.cursor;
        if (lastPageCursor) {
          result.cursor = lastPageCursor;
        }
        return result;
      })()
    : FALLBACK_DATA;

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const showErrorWarning = error && !isLoading;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Contas por centro de custo</CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            Visão detalhada dos principais centros de custo no período selecionado.
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
        {showErrorWarning && (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/50 px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <p className="text-sm text-amber-700">
                <strong>Atenção:</strong> Erro ao carregar dados da API. Exibindo dados de exemplo.
              </p>
            </div>
          </div>
        )}

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