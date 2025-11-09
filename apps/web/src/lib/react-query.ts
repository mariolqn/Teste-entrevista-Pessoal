import { QueryClient } from '@tanstack/react-query';

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          if (error instanceof Error && /4\d{2}/.test(error.message)) {
            return false;
          }
          return failureCount < 3;
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
      },
      mutations: {
        retry: 1,
      },
    },
  });

export const queryClient = createQueryClient();

export const getQueryClient = () => queryClient;

