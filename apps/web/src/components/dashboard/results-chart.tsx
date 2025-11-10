/**
 * Results Chart Component - Connected to global state
 */

import { useMemo, useState } from 'react';
import { TrendingUp, BarChart3, LineChart, PieChart } from 'lucide-react';

import type { BarChartResponse, LineChartResponse, PieChartResponse } from '@dashboard/types';

import {
  LineChart as LineChartComponent,
  BarChart as BarChartComponent,
  PieChart as PieChartComponent,
} from '@/components/charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useChartData } from '@/hooks/use-chart-data';
import { useChartAPIParams } from '@/stores/dashboard-store';
import { cn } from '@/lib/utils';

/**
 * Chart type options
 */
const CHART_TYPES = [
  { key: 'line', label: 'Linha', icon: LineChart },
  { key: 'bar', label: 'Barras', icon: BarChart3 },
  { key: 'pie', label: 'Pizza', icon: PieChart },
] as const;

/**
 * Loading skeleton for chart
 */
function ChartSkeleton() {
  return (
    <div className="flex h-80 flex-col justify-between">
      <div className="relative flex-1 animate-pulse overflow-hidden rounded-3xl border border-dashed border-brand-200 bg-gradient-to-br from-white via-brand-50/30 to-white">
        <div className="absolute inset-0">
          <div className="grid h-full grid-cols-12">
            {Array.from({ length: 12 }).map((_, index) => (
              <div className="border-l border-dashed border-slate-200/40" key={`v-${index}`} />
            ))}
          </div>
          <div className="absolute inset-0 grid grid-rows-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="border-t border-dashed border-slate-200/40" key={`h-${index}`} />
            ))}
          </div>
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white/90 px-4 py-2 shadow">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
            Carregando dados...
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Error state for chart
 */
function ChartError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex h-80 flex-col justify-between">
      <div className="relative flex-1 overflow-hidden rounded-3xl border border-dashed border-rose-200 bg-gradient-to-br from-rose-50/30 to-white">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="mb-3 rounded-2xl bg-white/90 px-4 py-3 shadow">
            <p className="text-sm font-medium text-rose-600">
              Erro ao carregar dados
            </p>
            <p className="text-xs text-slate-500">
              {error.message}
            </p>
          </div>
          <button
            onClick={onRetry}
            className="rounded-full bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-brand-600"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Results Chart Component
 */
export function ResultsChart() {
  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie'>('line');
  const apiParams = useChartAPIParams();

  const chartConfig = useMemo(() => {
    switch (chartType) {
      case 'bar':
        return {
          groupBy: 'category' as const,
          dimension: 'type',
          topN: 10,
        };
      case 'pie':
        return {
          groupBy: 'category' as const,
          topN: 10,
        };
      case 'line':
      default:
        return {
          groupBy: 'day' as const,
        };
    }
  }, [chartType]);

  const {
    data,
    isLoading,
    error,
    refetch,
    dataUpdatedAt,
  } = useChartData(chartType, {
    ...apiParams,
    metric: 'revenue',
    ...chartConfig,
  });

  // Calculate time since last update
  const getTimeAgo = () => {
    if (!dataUpdatedAt) return 'Nunca';
    
    const now = Date.now();
    const diff = Math.floor((now - dataUpdatedAt) / 1000 / 60);
    
    if (diff < 1) return 'Agora';
    if (diff === 1) return '1 minuto atrás';
    if (diff < 60) return `${diff} minutos atrás`;
    
    const hours = Math.floor(diff / 60);
    if (hours === 1) return '1 hora atrás';
    return `${hours} horas atrás`;
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Resultados por período</CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            Comparativo entre receitas e despesas ao longo do período selecionado.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Chart type selector */}
          <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
            {CHART_TYPES.map((type) => (
              <button
                key={type.key}
                onClick={() => setChartType(type.key)}
                className={cn(
                  'flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition',
                  chartType === type.key
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                )}
                title={type.label}
              >
                <type.icon className="h-3 w-3" />
                <span className="hidden sm:inline">{type.label}</span>
              </button>
            ))}
          </div>

          {/* Last updated indicator */}
          <div className="flex items-center gap-2 rounded-full bg-brand-50 px-3 py-2 text-xs font-medium text-brand-600">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Atualizado {getTimeAgo()}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading && <ChartSkeleton />}
        
        {error && !isLoading && (
          <ChartError 
            error={error as Error} 
            onRetry={() => refetch()} 
          />
        )}
        
        {data && !isLoading && !error && chartType === 'line' && 'series' in data && Array.isArray(data.series) && data.series.every(s => 'points' in s) && (
          <LineChartComponent 
            data={data as LineChartResponse} 
            height={320}
            colors={{
              revenue: '#8B5CF6',
              expense: '#06B6D4',
              profit: '#10B981',
            }}
          />
        )}

        {data && !isLoading && !error && chartType === 'bar' && 'categories' in data && Array.isArray((data as BarChartResponse).categories) && (
          <BarChartComponent
            data={data as BarChartResponse}
            height={320}
            layout="vertical"
          />
        )}

        {data && !isLoading && !error && chartType === 'pie' && 'series' in data && Array.isArray((data as PieChartResponse).series) && (
          <PieChartComponent
            data={data as PieChartResponse}
            height={320}
            innerRadius={80}
            showPercentage
          />
        )}
        
        {!data && !isLoading && !error && (
          <div className="flex h-80 items-center justify-center">
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600">
                Nenhum dado disponível
              </p>
              <p className="text-xs text-slate-500">
                Ajuste o período para ver os resultados
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}