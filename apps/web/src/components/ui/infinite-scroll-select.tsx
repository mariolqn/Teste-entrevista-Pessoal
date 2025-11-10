import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Command } from 'cmdk';
import { ChevronsUpDown, Loader2, Search, XCircle } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import type { OptionEntity, OptionsEndpointParams, OptionsEndpointResponse } from '@dashboard/types';

import { cn } from '@/lib/utils';
import { useDebouncedValue } from '@/hooks/use-debounce';
import { fetchOptions, type SelectOption } from '@/services/options.service';

interface InfiniteScrollSelectProps<T = string> {
  entity: OptionEntity;
  label: string;
  onChange: (option: SelectOption<T> | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  value?: SelectOption<T> | null;
  disabled?: boolean;
  limit?: number;
}

export function InfiniteScrollSelect<T = string>({
  entity,
  label,
  onChange,
  placeholder = 'Selecione...',
  searchPlaceholder = 'Buscar...',
  value,
  disabled = false,
  limit = 20,
}: InfiniteScrollSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, 300);
  const labelId = useId();

  const {
    data,
    isLoading,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['options', entity, debouncedSearch],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) => {
      const params: OptionsEndpointParams = {
        limit,
        ...(pageParam && { cursor: pageParam }),
        ...(debouncedSearch && { search: debouncedSearch }),
      };
      return fetchOptions<T>(entity, params);
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: open,
    staleTime: 60_000,
  });

  const options = useMemo(
    () => data?.pages.flatMap((page: OptionsEndpointResponse<T>) => page.items) ?? [],
    [data?.pages],
  );

  const { ref: sentinelRef, inView } = useInView({
    rootMargin: '120px',
    triggerOnce: false,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, inView, isFetchingNextPage]);

  const handleSelect = useCallback(
    (itemId: string) => {
      const selected = options.find((item) => String(item.id) === itemId) ?? null;
      onChange(selected);
      setOpen(false);
    },
    [onChange, options],
  );

  const handleClear = useCallback(() => {
    onChange(null);
  }, [onChange]);

  const selectedLabel = value?.label ?? placeholder;

  return (
    <div className="flex min-w-[220px] flex-col gap-1">
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor={labelId}>
        {label}
      </label>
      <Popover.Root onOpenChange={setOpen} open={open}>
        <Popover.Trigger asChild>
          <button
            aria-expanded={open}
            className={cn(
              'flex h-12 w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 text-left text-sm font-medium shadow-sm transition',
              value ? 'text-slate-700' : 'text-slate-500',
              disabled && 'cursor-not-allowed opacity-70',
              !disabled && 'hover:border-brand-200 hover:text-brand-700',
            )}
            disabled={disabled}
            id={labelId}
            type="button"
          >
            <span className="line-clamp-1">{selectedLabel}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
          </button>
        </Popover.Trigger>
        <Popover.Content
          align="start"
          className="z-50 w-[320px] rounded-2xl border border-slate-200 bg-white p-0 shadow-xl focus:outline-none"
          sideOffset={8}
        >
          <Command shouldFilter={false}>
            <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
              <Search className="h-4 w-4 text-slate-400" />
              <Command.Input
                autoFocus
                placeholder={searchPlaceholder}
                value={searchTerm}
                onValueChange={setSearchTerm}
                className="flex-1 border-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
              {value ? (
                <button
                  aria-label="Limpar seleção"
                  className="text-slate-400 transition hover:text-rose-500"
                  type="button"
                  onClick={handleClear}
                >
                  <XCircle className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            <Command.List className="max-h-64 overflow-y-auto px-1 py-2">
              {isLoading ? (
                <div className="flex items-center justify-center px-4 py-6 text-sm text-slate-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Carregando...
                </div>
              ) : null}

              {isError ? (
                <div className="flex flex-col items-center gap-2 px-4 py-6 text-center text-sm text-rose-500">
                  <p>{error instanceof Error ? error.message : 'Não foi possível carregar.'}</p>
                  <button
                    className="rounded-full border border-rose-400 px-3 py-1 text-xs font-semibold text-rose-500 transition hover:bg-rose-50"
                    type="button"
                    onClick={() => refetch()}
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : null}

              {options.length === 0 && !isLoading && !isError ? (
                <Command.Empty className="px-4 py-6 text-center text-sm text-slate-500">
                  Nenhum resultado encontrado
                </Command.Empty>
              ) : null}

              {options.map((option) => (
                <Command.Item
                  key={option.id}
                  value={String(option.id)}
                  onSelect={handleSelect}
                  className={cn(
                    'flex cursor-pointer select-none items-center gap-3 rounded-xl px-4 py-2 text-sm text-slate-600 transition',
                    'data-[selected=true]:bg-brand-50 data-[selected=true]:text-brand-700',
                    value?.id === option.id && 'bg-brand-50 text-brand-700',
                  )}
                >
                  <span className="line-clamp-2 flex-1">{option.label}</span>
                  {value?.id === option.id ? (
                    <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">Selecionado</span>
                  ) : null}
                </Command.Item>
              ))}

              <div ref={sentinelRef} />
              {isFetchingNextPage ? (
                <div className="flex items-center justify-center px-4 py-3 text-xs text-slate-400">
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Carregando mais...
                </div>
              ) : null}
              {!hasNextPage && options.length > 0 ? (
                <div className="px-4 py-3 text-xs text-slate-400">Todos os resultados foram carregados</div>
              ) : null}
            </Command.List>
          </Command>
        </Popover.Content>
      </Popover.Root>
    </div>
  );
}

