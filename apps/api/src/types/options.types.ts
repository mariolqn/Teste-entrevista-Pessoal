/**
 * Types and schemas for options endpoints
 */

import { z } from 'zod';

/**
 * Supported option entities for dropdowns/autocomplete
 */
export const optionsEntitySchema = z.enum(['categories', 'products', 'customers', 'regions']);

/**
 * Path parameters schema
 */
export const optionsParamsSchema = z.object({
  entity: optionsEntitySchema,
});

/**
 * Query string schema
 */
export const optionsQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(1, 'Search term must contain at least 1 character')
    .max(100, 'Search term must be at most 100 characters')
    .optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit must be at most 100')
    .default(20),
  cursor: z.string().optional(),
  includeInactive: z.coerce.boolean().optional(),
  categoryId: z.string().uuid().optional(),
  region: z.string().optional(),
});

export type OptionsEntity = z.infer<typeof optionsEntitySchema>;
export type OptionsParams = z.infer<typeof optionsParamsSchema>;
export type OptionsQuery = z.infer<typeof optionsQuerySchema>;

export interface OptionItem {
  id: string;
  label: string;
  value: string;
  metadata?: Record<string, unknown>;
}

export interface OptionsResponse {
  items: OptionItem[];
  nextCursor?: string;
  hasMore: boolean;
  total: number;
}
