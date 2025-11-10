import { TrendingUp } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const MONTH_LABELS: readonly string[] = [
  'JAN',
  'FEV',
  'MAR',
  'ABR',
  'MAI',
  'JUN',
  'JUL',
  'AGO',
  'SET',
  'OUT',
  'NOV',
  'DEZ',
];

export function ResultsChart() {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Resultados por período</CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            Comparativo entre receitas e despesas ao longo do intervalo selecionado.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-brand-50 px-3 py-2 text-xs font-medium text-brand-600">
          <TrendingUp className="h-4 w-4" />
          Atualizado há 5 minutos
        </div>
      </CardHeader>
      <CardContent className="flex h-80 flex-col justify-between">
        <div className="relative flex-1 overflow-hidden rounded-3xl border border-dashed border-brand-200 bg-gradient-to-br from-white via-brand-50/30 to-white">
          <GridBackground />
          <svg
            aria-label="Gráfico de linhas placeholder"
            className="absolute inset-0 h-full w-full"
            role="img"
          >
            <polyline
              fill="none"
              points="20,190 80,140 140,175 200,100 260,210 320,160 380,220 440,120 500,210 560,150 620,190"
              stroke="#8155DC"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
            />
            <polyline
              fill="none"
              points="20,180 80,220 140,140 200,210 260,160 320,200 380,140 440,210 500,160 560,190 620,150"
              stroke="#2AB3D6"
              strokeDasharray="6 10"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            />
            <defs>
              <linearGradient id="chartGradient" x1="0%" x2="100%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#DDD6FE" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#C4B5FD" stopOpacity={0} />
              </linearGradient>
            </defs>
            <polygon
              fill="url(#chartGradient)"
              points="20,190 80,140 140,175 200,100 260,210 320,160 380,220 440,120 500,210 560,150 620,190 620,260 20,260"
            />
          </svg>
          <Legend />
        </div>
        <div className="mt-4 flex items-center justify-between">
          {MONTH_LABELS.map((month) => (
            <span
              key={month}
              className="text-xs font-semibold uppercase tracking-wide text-slate-400"
            >
              {month}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function GridBackground() {
  return (
    <div className="absolute inset-0">
      <div className="grid h-full grid-cols-12">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={`v-${index}`} className="border-l border-dashed border-slate-200/80" />
        ))}
      </div>
      <div className="absolute inset-0 grid grid-rows-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={`h-${index}`} className="border-t border-dashed border-slate-200/80" />
        ))}
      </div>
    </div>
  );
}

function Legend() {
  const items = [
    { color: 'bg-brand-500', label: 'Receita' },
    { color: 'bg-cyan-400', label: 'Despesa' },
  ];

  return (
    <div className="absolute left-6 top-6 flex items-center gap-4 rounded-full bg-white/90 px-4 py-2 shadow">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600"
        >
          <span className={cn('h-2.5 w-2.5 rounded-full', item.color)} />
          {item.label}
        </div>
      ))}
    </div>
  );
}
