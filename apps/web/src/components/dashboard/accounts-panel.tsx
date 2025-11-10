import { formatCurrency } from '@dashboard/shared';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, EllipsisVertical } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ROWS = [
  {
    expense: 53_549.47,
    name: 'Suzano Transporte Florestal',
    revenue: 41_954.26,
  },
  {
    expense: 14_191.32,
    name: 'Transporte de Agregados Itabira MG',
    revenue: 0,
  },
];

const TOTALS = {
  expense: 67_740.79,
  revenue: 41_954.26,
};

export function AccountsPanel() {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Contas vencidas</CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            Visão rápida dos principais centros de custo.
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 shadow-sm"
          type="button"
        >
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          Emitir alerta
        </button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-[1.5fr_1fr_1fr_40px] items-center rounded-2xl bg-slate-100/70 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span>Nome</span>
          <span className="flex items-center gap-1">
            <ArrowDownRight className="h-3 w-3 text-rose-500" />
            Despesa
          </span>
          <span className="flex items-center gap-1">
            <ArrowUpRight className="h-3 w-3 text-emerald-500" />
            Receita
          </span>
          <span className="text-center text-slate-400">Ação</span>
        </div>

        <div className="space-y-2">
          {ROWS.map((row) => (
            <div
              key={row.name}
              className="grid grid-cols-[1.5fr_1fr_1fr_40px] items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm"
            >
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-slate-800">{row.name}</span>
                <span className="text-xs uppercase tracking-wide text-slate-400">
                  Centro de custo
                </span>
              </div>
              <span className="text-rose-600">{formatCurrency(row.expense)}</span>
              <span className="text-emerald-600">{formatCurrency(row.revenue)}</span>
              <button
                aria-label="Mais ações"
                className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:text-brand-600"
                type="button"
              >
                <EllipsisVertical className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[1.5fr_1fr_1fr_40px] items-center rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-soft">
          <span>Total:</span>
          <span>{formatCurrency(TOTALS.expense)}</span>
          <span>{formatCurrency(TOTALS.revenue)}</span>
          <span className="text-center text-white/80">—</span>
        </div>
      </CardContent>
    </Card>
  );
}
