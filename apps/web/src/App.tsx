import { TopNavigation } from '@/components/dashboard/top-navigation';

import { AppRouter } from './router';

export function App() {
  return (
    <div className="relative min-h-screen bg-slate-100 text-slate-900">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-brand-100/50 to-transparent" />
      <TopNavigation />
      <main className="relative z-10 pb-16 pt-8">
        <AppRouter />
      </main>
    </div>
  );
}
