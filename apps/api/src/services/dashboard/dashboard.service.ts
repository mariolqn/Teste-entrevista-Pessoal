/**
 * Dashboard Service
 * Provides summary metrics for KPI cards.
 */

import {
  Prisma,
  PrismaClient,
  TransactionType,
  PaymentStatus,
} from '@prisma/client';
import type { DashboardSummaryResponse } from '../../types/dashboard.types.js';
import { cacheService } from '../../lib/redis.js';
import { config } from '../../config/index.js';

export interface DashboardSummaryParams {
  start: Date;
  end: Date;
  categoryId?: string;
  productId?: string;
  customerId?: string;
  region?: string;
}

/**
 * Service responsible for aggregating dashboard KPI metrics.
 */
export class DashboardService {
  constructor(private readonly prisma: PrismaClient) {}

  getCacheControlHeader(): string {
    if (!config.featureCacheEnabled) {
      return 'private, no-store';
    }

    const ttl = this.getCacheTtl();
    const staleWhileRevalidate = Math.max(5, Math.round(ttl / 2));
    return `private, max-age=${ttl}, stale-while-revalidate=${staleWhileRevalidate}`;
  }

  /**
   * Compute dashboard summary given a date range and optional filters.
   */
  async getSummary(params: DashboardSummaryParams): Promise<DashboardSummaryResponse> {
    const cacheKey = this.buildCacheKey('summary', params);

    if (config.featureCacheEnabled) {
      const cached = await cacheService.get<DashboardSummaryResponse>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const now = new Date();
    const baseFilter = this.buildBaseFilter(params);

    const [
      revenue,
      expense,
      overdueReceivable,
      overduePayable,
      upcomingReceivable,
      upcomingPayable,
    ] = await Promise.all([
      this.sumTransactions([
        baseFilter,
        { type: TransactionType.REVENUE },
      ]),
      this.sumTransactions([
        baseFilter,
        { type: TransactionType.EXPENSE },
      ]),
      this.sumTransactions([
        baseFilter,
        { type: TransactionType.REVENUE },
        this.buildOverdueFilter(now),
      ]),
      this.sumTransactions([
        baseFilter,
        { type: TransactionType.EXPENSE },
        this.buildOverdueFilter(now),
      ]),
      this.sumTransactions([
        baseFilter,
        { type: TransactionType.REVENUE },
        this.buildUpcomingFilter(now),
      ]),
      this.sumTransactions([
        baseFilter,
        { type: TransactionType.EXPENSE },
        this.buildUpcomingFilter(now),
      ]),
    ]);

    const totalRevenue = this.roundCurrency(revenue);
    const totalExpense = this.roundCurrency(expense);
    const liquidProfit = this.roundCurrency(revenue - expense);

    const overdueReceivableRounded = this.roundCurrency(overdueReceivable);
    const overduePayableRounded = this.roundCurrency(overduePayable);

    const upcomingReceivableRounded = this.roundCurrency(upcomingReceivable);
    const upcomingPayableRounded = this.roundCurrency(upcomingPayable);

    const response: DashboardSummaryResponse = {
      totalRevenue,
      totalExpense,
      liquidProfit,
      overdueAccounts: {
        receivable: overdueReceivableRounded,
        payable: overduePayableRounded,
        total: this.roundCurrency(overdueReceivableRounded + overduePayableRounded),
      },
      upcomingAccounts: {
        receivable: upcomingReceivableRounded,
        payable: upcomingPayableRounded,
        total: this.roundCurrency(upcomingReceivableRounded + upcomingPayableRounded),
      },
      metadata: {
        period: {
          start: params.start.toISOString(),
          end: params.end.toISOString(),
        },
        generatedAt: new Date().toISOString(),
      },
    };

    if (config.featureCacheEnabled) {
      await cacheService.set(cacheKey, response, this.getCacheTtl());
    }

    return response;
  }

  /**
   * Build the base Prisma where filter based on provided params.
   */
  private buildBaseFilter(params: DashboardSummaryParams): Prisma.TransactionWhereInput {
    const filter: Prisma.TransactionWhereInput = {
      occurredAt: {
        gte: params.start,
        lte: params.end,
      },
    };

    if (params.categoryId) {
      filter.categoryId = params.categoryId;
    }

    if (params.productId) {
      filter.productId = params.productId;
    }

    if (params.customerId) {
      filter.customerId = params.customerId;
    }

    if (params.region) {
      filter.customer = {
        is: {
          region: params.region,
        },
      };
    }

    return filter;
  }

  /**
   * Build filter for overdue transactions (due date in the past and unpaid).
   */
  private buildOverdueFilter(now: Date): Prisma.TransactionWhereInput {
    return {
      dueDate: {
        not: null,
        lt: now,
      },
      OR: [
        { paymentStatus: PaymentStatus.OVERDUE },
        {
          AND: [
            { paymentStatus: PaymentStatus.PENDING },
            { paidAt: null },
          ],
        },
      ],
    };
  }

  /**
   * Build filter for upcoming transactions (future due date and pending).
   */
  private buildUpcomingFilter(now: Date): Prisma.TransactionWhereInput {
    return {
      dueDate: {
        not: null,
        gt: now,
      },
      paymentStatus: PaymentStatus.PENDING,
      paidAt: null,
    };
  }

  /**
   * Aggregate sum of transaction amounts given a list of filters.
   * Filters are combined via AND semantics.
   */
  private async sumTransactions(
    filters: Array<Prisma.TransactionWhereInput | undefined>,
  ): Promise<number> {
    const definedFilters = filters.filter(
      (filter): filter is Prisma.TransactionWhereInput => Boolean(filter),
    );

    const where =
      definedFilters.length === 0
        ? undefined
        : definedFilters.length === 1
        ? definedFilters[0]
        : { AND: definedFilters };

    const aggregateArgs: Prisma.TransactionAggregateArgs = {
      _sum: { amount: true },
    };

    if (where) {
      aggregateArgs.where = where;
    }

    const result = await this.prisma.transaction.aggregate(aggregateArgs);

    return this.decimalToNumber(result._sum?.amount);
  }

  /**
   * Convert Prisma decimal to number safely.
   */
  private decimalToNumber(value: Prisma.Decimal | null | undefined): number {
    if (!value) {
      return 0;
    }

    if (typeof value === 'number') {
      return value;
    }

    if ('toNumber' in value && typeof value.toNumber === 'function') {
      return value.toNumber();
    }

    return Number(value);
  }

  /**
   * Round a numeric value to 2 decimal places.
   */
  private roundCurrency(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private buildCacheKey(scope: string, params: DashboardSummaryParams): string {
    const parts = [
      'dashboard',
      scope,
      params.start.toISOString(),
      params.end.toISOString(),
      params.categoryId ?? 'all',
      params.productId ?? 'all',
      params.customerId ?? 'all',
      params.region ?? 'all',
    ];

    return parts.join(':');
  }

  private getCacheTtl(): number {
    return Math.min(60, Math.max(10, config.redisTtl));
  }
}

