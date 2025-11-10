import { ChevronDown, ClipboardList, CreditCard, FileText, Plus } from 'lucide-react';

const NAV_ITEMS = [
  { icon: Plus, label: 'Cadastro' },
  { icon: CreditCard, label: 'Contas à Pagar' },
  { icon: ClipboardList, label: 'Contas à Receber' },
  { icon: FileText, label: 'Relatórios' },
];

export function TopNavigation() {
  return (
    <header className="border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <nav className="flex items-center gap-3">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-brand-50 hover:text-brand-700"
              type="button"
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 shadow-sm transition hover:bg-slate-100"
            type="button"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-lg font-semibold text-white">
              A
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Admin
              </span>
              <span className="text-sm font-medium text-slate-700">Financeiro</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
