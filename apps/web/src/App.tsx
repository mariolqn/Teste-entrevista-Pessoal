import { AppRouter } from './router';

export function App() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white shadow-soft">
              <span className="text-lg font-semibold">DF</span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Dashboard Financeiro</p>
              <h1 className="text-lg font-semibold text-slate-900">
                Plataforma de Gestão Econômica
              </h1>
            </div>
          </div>
        </div>
      </header>
      <main className="flex flex-1 justify-center px-6 py-12">
        <AppRouter />
      </main>
    </div>
  );
}

