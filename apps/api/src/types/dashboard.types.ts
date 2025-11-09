/**
 * Dashboard summary types and schemas
 */

import { z } from 'zod';

/**
 * Query schema for dashboard summary endpoint.
 * Requires a date range and supports optional dimensional filters.
 */
export const dashboardSummaryQuerySchema = z
  .object({
    start: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    end: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    categoryId: z.string().uuid().optional(),
    productId: z.string().uuid().optional(),
    customerId: z.string().uuid().optional(),
    region: z.string().optional(),
  })
  .refine((data) => new Date(data.start) <= new Date(data.end), {
    message: 'Start date must be before or equal to end date',
    path: ['start'],
  });

export type DashboardSummaryQuery = z.infer<typeof dashboardSummaryQuerySchema>;

export interface AccountsSummary {
  receivable: number;
  payable: number;
  total: number;
}

export interface DashboardSummaryResponse {
  totalRevenue: number;
  totalExpense: number;
  liquidProfit: number;
  overdueAccounts: AccountsSummary;
  upcomingAccounts: AccountsSummary;
  metadata: {
    period: {
      start: string;
      end: string;
    };
    generatedAt: string;
  };
}

