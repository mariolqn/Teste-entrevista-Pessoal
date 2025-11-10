/**
 * Summary Cards Component - Connected to global state
 */

import type { ComponentType, SVGProps } from 'react';
import { ArrowDownRight, ArrowUpRight, TrendingUp, Wallet, Wallet2 } from 'lucide-react';

import { formatCurrency } from '@dashboard/shared';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardSummary } from '@/hooks/use-chart-data';
import { useChartAPIParams } from '@/stores/dashboard-store';
import { cn } from '@/lib/utils';

/**
 * Loading skeleton for KPI cards
 */
function KPISkeleton() {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-x-0 bottom-0 h-1 animate-pulse rounded-b-3xl bg-slate-200" />
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
        <div className="h-11 w-11 animate-pulse rounded-2xl bg-slate-200" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-24 animate-pulse rounded bg-slate-200" />
      </CardContent>
    </Card>
  );
}

/**
 * Error fallback with static data
 */
function SummaryCardsError() {
  const fallbackData = {
    totalRevenue: 41954.26,
    totalExpense: 67740.79,
    liquidProfit: -25786.53,
    overdueAccounts: {
      receivable: 7500,
      payable: 34853,
    },
    upcomingAccounts: {
      receivable: 0,
      payable: 0,
    },
  };

  return (
    <section className="grid gap-4 lg:grid-cols-5">
      <div className="col-span-5 mb-2">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 px-4 py-2">
          <p className="text-sm text-amber-700">
            <strong>Atenção:</strong> Exibindo dados de exemplo. Verifique a conexão com a API.
          </p>
        </div>
      </div>

      <KpiCard
        gradientClassName="from-emerald-400 to-emerald-500"
        icon={ArrowUpRight}
        label="Total Receita"
        value={fallbackData.totalRevenue}
      />

      <KpiCard
        gradientClassName="from-rose-400 to-rose-500"
        icon={ArrowDownRight}
        label="Total Despesa"
        value={fallbackData.totalExpense}
      />

      <KpiCard
        gradientClassName="from-amber-400 to-amber-500"
        icon={TrendingUp}
        label="Lucro Líquido"
        value={fallbackData.liquidProfit}
      />

      <AccountsCard
        icon={Wallet}
        label="Contas Vencidas"
        payable={fallbackData.overdueAccounts.payable}
        receivable={fallbackData.overdueAccounts.receivable}
        tone="sky"
      />

      <AccountsCard
        icon={Wallet2}
        label="Contas a Vencer"
        payable={fallbackData.upcomingAccounts.payable}
        receivable={fallbackData.upcomingAccounts.receivable}
        tone="violet"
      />
    </section>
  );
}

/**
 * Summary Cards Component
 */
export function SummaryCards() {
  const apiParams = useChartAPIParams();
  // Build params object only with defined values
  const summaryParams = {
    start: apiParams.start,
    end: apiParams.end,
    ...(apiParams.categoryId && { categoryId: apiParams.categoryId }),
    ...(apiParams.productId && { productId: apiParams.productId }),
    ...(apiParams.customerId && { customerId: apiParams.customerId }),
    ...(apiParams.region && { region: apiParams.region }),
  };
  
  const { data, isLoading, error } = useDashboardSummary(summaryParams);

  if (isLoading) {
    return (
      <section className="grid gap-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <KPISkeleton key={index} />
        ))}
      </section>
    );
  }

  if (error || !data) {
    return <SummaryCardsError />;
  }

  return (
    <section className="grid gap-4 lg:grid-cols-5">
      <KpiCard
        gradientClassName="from-emerald-400 to-emerald-500"
        icon={ArrowUpRight}
        label="Total Receita"
        value={data.totalRevenue}
      />

      <KpiCard
        gradientClassName="from-rose-400 to-rose-500"
        icon={ArrowDownRight}
        label="Total Despesa"
        value={data.totalExpense}
      />

      <KpiCard
        gradientClassName="from-amber-400 to-amber-500"
        icon={TrendingUp}
        label="Lucro Líquido"
        value={data.liquidProfit}
      />

      <AccountsCard
        icon={Wallet}
        label="Contas Vencidas"
        payable={data.overdueAccounts?.payable || 0}
        receivable={data.overdueAccounts?.receivable || 0}
        tone="sky"
      />

      <AccountsCard
        icon={Wallet2}
        label="Contas a Vencer"
        payable={data.upcomingAccounts?.payable || 0}
        receivable={data.upcomingAccounts?.receivable || 0}
        tone="violet"
      />
    </section>
  );
}

interface KpiCardProps {
  gradientClassName: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  value: number;
}

function KpiCard({ gradientClassName, icon: Icon, label, value }: KpiCardProps) {
  const formattedValue = formatCurrency(value);

  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-md">
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 z-0 h-1 rounded-b-3xl opacity-80',
          'bg-gradient-to-r',
          gradientClassName,
        )}
      />
      <CardHeader className="relative z-10 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-slate-600">{label}</CardTitle>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold text-slate-900">{formattedValue}</p>
      </CardContent>
    </Card>
  );
}

interface AccountsCardProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  payable: number;
  receivable: number;
  tone: 'sky' | 'violet';
}

function AccountsCard({ icon: Icon, label, payable, receivable, tone }: AccountsCardProps) {
  const toneClasses = tone === 'sky' ? 'from-sky-400 to-brand-500' : 'from-brand-400 to-brand-600';

  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-md">
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 z-0 h-1 rounded-b-3xl opacity-80',
          'bg-gradient-to-r',
          toneClasses,
        )}
      />
      <CardHeader className="relative z-10 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-slate-600">{label}</CardTitle>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent className="relative z-10 flex flex-col gap-3">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span className="font-medium uppercase tracking-wide text-slate-400">Receber</span>
          <span className="text-base font-semibold text-brand-600">
            {formatCurrency(receivable)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span className="font-medium uppercase tracking-wide text-slate-400">A Pagar</span>
          <span className="text-base font-semibold text-rose-600">
            {formatCurrency(payable)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}