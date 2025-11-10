import { AccountsPanel } from '@/components/dashboard/accounts-panel';
import { FiltersToolbar } from '@/components/dashboard/filters-toolbar';
import { ResultsChart } from '@/components/dashboard/results-chart';
import { SummaryCards } from '@/components/dashboard/summary-cards';

export function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10">
      <FiltersToolbar />
      <SummaryCards />
      <section className="grid gap-6 lg:grid-cols-[minmax(0,_2fr)_minmax(0,_1fr)]">
        <ResultsChart />
        <AccountsPanel />
      </section>
    </div>
  );
}
