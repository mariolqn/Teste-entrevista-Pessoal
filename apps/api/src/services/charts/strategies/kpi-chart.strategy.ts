/**
 * KPI Chart Strategy Implementation
 * Generates key performance indicators with trend analysis
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { BaseChartStrategy } from '../chart.strategy.js';
import type {
  ChartRequest,
  KPIChartResponse,
  KPIValue,
} from '../../../types/charts.types.js';

export class KPIChartStrategy extends BaseChartStrategy {
  getName(): string {
    return 'KPIChartStrategy';
  }

  canHandle(params: ChartRequest): boolean {
    return params.chartType === 'kpi';
  }

  async execute(
    params: ChartRequest,
    prisma: PrismaClient,
  ): Promise<KPIChartResponse> {
    const { start, end } = params;

    // Calculate previous period for comparison
    const startDate = new Date(start);
    const endDate = new Date(end);
    const periodDuration = endDate.getTime() - startDate.getTime();
    
    const previousStartDate = new Date(startDate.getTime() - periodDuration);
    const previousEndDate = new Date(startDate.getTime() - 1); // Day before current period

    // Build filters
    const currentFilter = this.buildDateFilter(start, end);
    const previousFilter = this.buildDateFilter(
      previousStartDate.toISOString().split('T')[0],
      previousEndDate.toISOString().split('T')[0],
    );
    const dimensionFilters = this.buildDimensionFilters(params);

    // Fetch current period data
    const currentData = await this.fetchPeriodData(
      prisma,
      currentFilter,
      dimensionFilters,
    );

    // Fetch previous period data
    const previousData = await this.fetchPeriodData(
      prisma,
      previousFilter,
      dimensionFilters,
    );

    // Calculate KPIs
    const metrics: Record<string, KPIValue> = {
      revenue: this.calculateKPI(
        currentData.revenue,
        previousData.revenue,
        'Receita Total',
      ),
      expense: this.calculateKPI(
        currentData.expense,
        previousData.expense,
        'Despesa Total',
      ),
      profit: this.calculateKPI(
        currentData.profit,
        previousData.profit,
        'Lucro Líquido',
      ),
      transactions: this.calculateKPI(
        currentData.transactionCount,
        previousData.transactionCount,
        'Total de Transações',
      ),
      avgTicket: this.calculateKPI(
        currentData.avgTicket,
        previousData.avgTicket,
        'Ticket Médio',
      ),
      customers: this.calculateKPI(
        currentData.customerCount,
        previousData.customerCount,
        'Clientes Ativos',
      ),
      products: this.calculateKPI(
        currentData.productCount,
        previousData.productCount,
        'Produtos Vendidos',
      ),
      overdueReceivables: this.calculateKPI(
        currentData.overdueReceivables,
        previousData.overdueReceivables,
        'Contas a Receber Vencidas',
      ),
      overduePayables: this.calculateKPI(
        currentData.overduePayables,
        previousData.overduePayables,
        'Contas a Pagar Vencidas',
      ),
      pendingReceivables: this.calculateKPI(
        currentData.pendingReceivables,
        previousData.pendingReceivables,
        'Contas a Receber',
      ),
      pendingPayables: this.calculateKPI(
        currentData.pendingPayables,
        previousData.pendingPayables,
        'Contas a Pagar',
      ),
    };

    return {
      metrics,
      period: {
        current: {
          start: start,
          end: end,
        },
        previous: {
          start: previousStartDate.toISOString().split('T')[0],
          end: previousEndDate.toISOString().split('T')[0],
        },
      },
    };
  }

  /**
   * Fetch aggregated data for a period
   */
  private async fetchPeriodData(
    prisma: PrismaClient,
    dateFilter: Prisma.DateTimeFilter,
    dimensionFilters: Record<string, any>,
  ) {
    const where = {
      occurredAt: dateFilter,
      ...dimensionFilters,
    };

    // Use aggregation queries for better performance
    const [
      revenueData,
      expenseData,
      transactionStats,
      customerCount,
      productCount,
      overdueAccounts,
      pendingAccounts,
    ] = await Promise.all([
      // Revenue
      prisma.transaction.aggregate({
        where: {
          ...where,
          type: 'REVENUE',
        },
        _sum: {
          amount: true,
        },
        _count: true,
      }),

      // Expense
      prisma.transaction.aggregate({
        where: {
          ...where,
          type: 'EXPENSE',
        },
        _sum: {
          amount: true,
        },
        _count: true,
      }),

      // Transaction stats
      prisma.transaction.aggregate({
        where,
        _count: true,
        _avg: {
          amount: true,
        },
      }),

      // Unique customers
      prisma.transaction.groupBy({
        by: ['customerId'],
        where: {
          ...where,
          customerId: { not: null },
        },
        _count: true,
      }),

      // Unique products
      prisma.transaction.groupBy({
        by: ['productId'],
        where: {
          ...where,
          productId: { not: null },
        },
        _count: true,
      }),

      // Overdue accounts
      this.fetchOverdueAccounts(prisma, dateFilter.lte as Date),

      // Pending accounts
      this.fetchPendingAccounts(prisma, dateFilter.lte as Date),
    ]);

    return {
      revenue: Number(revenueData._sum.amount || 0),
      expense: Number(expenseData._sum.amount || 0),
      profit: Number(revenueData._sum.amount || 0) - Number(expenseData._sum.amount || 0),
      transactionCount: transactionStats._count,
      avgTicket: Number(transactionStats._avg.amount || 0),
      customerCount: customerCount.length,
      productCount: productCount.length,
      overdueReceivables: overdueAccounts.receivables,
      overduePayables: overdueAccounts.payables,
      pendingReceivables: pendingAccounts.receivables,
      pendingPayables: pendingAccounts.payables,
    };
  }

  /**
   * Fetch overdue accounts
   */
  private async fetchOverdueAccounts(
    prisma: PrismaClient,
    asOfDate: Date,
  ): Promise<{ receivables: number; payables: number }> {
    const [overdueReceivables, overduePayables] = await Promise.all([
      // Overdue receivables
      prisma.transaction.aggregate({
        where: {
          type: 'REVENUE',
          paymentStatus: 'OVERDUE',
          dueDate: {
            lt: asOfDate,
          },
          paidAt: null,
        },
        _sum: {
          amount: true,
        },
      }),

      // Overdue payables
      prisma.transaction.aggregate({
        where: {
          type: 'EXPENSE',
          paymentStatus: 'OVERDUE',
          dueDate: {
            lt: asOfDate,
          },
          paidAt: null,
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    return {
      receivables: Number(overdueReceivables._sum.amount || 0),
      payables: Number(overduePayables._sum.amount || 0),
    };
  }

  /**
   * Fetch pending accounts
   */
  private async fetchPendingAccounts(
    prisma: PrismaClient,
    asOfDate: Date,
  ): Promise<{ receivables: number; payables: number }> {
    const [pendingReceivables, pendingPayables] = await Promise.all([
      // Pending receivables
      prisma.transaction.aggregate({
        where: {
          type: 'REVENUE',
          paymentStatus: 'PENDING',
          dueDate: {
            gte: asOfDate,
          },
          paidAt: null,
        },
        _sum: {
          amount: true,
        },
      }),

      // Pending payables
      prisma.transaction.aggregate({
        where: {
          type: 'EXPENSE',
          paymentStatus: 'PENDING',
          dueDate: {
            gte: asOfDate,
          },
          paidAt: null,
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    return {
      receivables: Number(pendingReceivables._sum.amount || 0),
      payables: Number(pendingPayables._sum.amount || 0),
    };
  }

  /**
   * Calculate KPI with comparison
   */
  private calculateKPI(
    current: number,
    previous: number,
    label?: string,
  ): KPIValue {
    const change = current - previous;
    const changePercentage = previous !== 0
      ? ((change / previous) * 100)
      : (current > 0 ? 100 : 0);

    let trend: 'up' | 'down' | 'stable';
    if (change > 0) {
      trend = 'up';
    } else if (change < 0) {
      trend = 'down';
    } else {
      trend = 'stable';
    }

    return {
      current: Math.round(current * 100) / 100, // Round to 2 decimal places
      previous: Math.round(previous * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercentage: Math.round(changePercentage * 100) / 100,
      trend,
    };
  }
}
