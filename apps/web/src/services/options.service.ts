import { API_ENDPOINTS, type Option, type OptionEntity, type OptionsEndpointParams, type OptionsEndpointResponse } from '@dashboard/types';
import { z } from 'zod';

import { env } from '@/lib/env';

const optionSchema = z.object({
  id: z.union([z.string(), z.number()]),
  label: z.string(),
  value: z.union([z.string(), z.number(), z.record(z.any()), z.null()]).nullable().optional(),
  metadata: z.record(z.any()).optional(),
  disabled: z.boolean().optional(),
});

const optionsResponseSchema = z.object({
  items: z.array(optionSchema),
  nextCursor: z.string().optional(),
  hasMore: z.boolean(),
  total: z.number(),
});

function toSearchParams(params: OptionsEndpointParams = {}): string {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set('search', params.search);
  if (params.cursor) searchParams.set('cursor', params.cursor);
  if (typeof params.limit === 'number') searchParams.set('limit', String(params.limit));

  return searchParams.toString();
}

export async function fetchOptions<T = string>(
  entity: OptionEntity,
  params: OptionsEndpointParams = {},
): Promise<OptionsEndpointResponse<T>> {
  const baseUrl = `${env.apiUrl}/api/v1${API_ENDPOINTS.OPTIONS}/${entity}`;
  const query = toSearchParams(params);
  const url = query ? `${baseUrl}?${query}` : baseUrl;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const detail = typeof error?.detail === 'string' ? error.detail : 'Failed to load options';
    throw new Error(detail);
  }

  const json = await response.json();
  const parsed = optionsResponseSchema.parse(json) as OptionsEndpointResponse<T>;

  return parsed;
}

export type SelectOption<T = string> = Option<T>;

