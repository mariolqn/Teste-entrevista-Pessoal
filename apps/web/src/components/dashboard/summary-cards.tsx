import { ArrowDownRight, ArrowUpRight, ThumbsUp, Wallet, Wallet2 } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

import { formatCurrency } from '@dashboard/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KpiCardConfig {
  gradient: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  value: number;
}

const KPI_CARDS: KpiCardConfig[] = [
  {
    gradient: 'from-emerald-400 to-emerald-500',
    icon: ArrowUpRight,
    label: 'Total Receita',
    value: 41_954.26,
  },
  {
    gradient: 'from-rose-400 to-rose-500',
    icon: ArrowDownRight,
    label: 'Total Despesa',
    value: 67_740.79,
  },
  {
    gradient: 'from-amber-400 to-amber-500',
    icon: ThumbsUp,
    label: 'Lucro Líquido',
    value: -25_786.53,
  },
];

export function SummaryCards() {
  return (
    <section className="grid gap-4 lg:grid-cols-5">
      {KPI_CARDS.map((card) => (
        <KpiCard
          key={card.label}
          gradientClassName={card.gradient}
          icon={card.icon}
          label={card.label}
          value={card.value}
        />
      ))}

      <AccountsCard
        icon={Wallet}
        label="Contas Vencidas"
        payable={34_853}
        receivable={7_500}
        tone="sky"
      />

      <AccountsCard
        icon={Wallet2}
        label="Contas a Vencer"
        payable={0}
        receivable={0}
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
    <Card className="relative overflow-hidden">
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 z-0 h-1 rounded-b-3xl opacity-80',
          'bg-gradient-to-r',
          gradientClassName,
        )}
      />
      <CardHeader className="relative z-10 flex flex-row items-center justify-between">
        <CardTitle>{label}</CardTitle>
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
    <Card className="relative overflow-hidden">
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 z-0 h-1 rounded-b-3xl opacity-80',
          'bg-gradient-to-r',
          toneClasses,
        )}
      />
      <CardHeader className="relative z-10 flex flex-row items-center justify-between">
        <CardTitle>{label}</CardTitle>
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
          <span className="text-base font-semibold text-rose-600">{formatCurrency(payable)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
