import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Suspense } from 'react';
import { Toaster } from 'sonner';
import type { ReactNode } from 'react';

import { env } from '@/lib/env';
import { getQueryClient } from '@/lib/react-query';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<div className="p-6 text-sm text-slate-500">Carregando...</div>}>
        {children}
      </Suspense>
      <Toaster expand={false} position="top-right" richColors />
      {env.isDev ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  );
}
