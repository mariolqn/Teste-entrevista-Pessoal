/**
 * Table Chart Strategy Implementation
 * Generates tabular data with pagination support
 */

import { BaseChartStrategy } from '../chart.strategy.js';

import type {
  ChartRequest,
  TableChartResponse,
  TableColumn,
  TableRow,
} from '../../../types/charts.types.js';
import type { PrismaClient, Prisma } from '@prisma/client';

export class TableChartStrategy extends BaseChartStrategy {
  getName(): string {
    return 'TableChartStrategy';
  }

  canHandle(params: ChartRequest): boolean {
    return params.chartType === 'table';
  }

  async execute(params: ChartRequest, prisma: PrismaClient): Promise<TableChartResponse> {
    const { start, end, limit = 20, cursor, dimension = 'category' } = params;

    // Parse cursor for pagination
    const cursorData = this.parseCursor(cursor);
    const skip = cursorData?.skip || 0;

    // Build filters
    const dateFilter = this.buildDateFilter(start, end);
    const dimensionFilters = this.buildDimensionFilters(params);

    // Determine what data to show based on dimension
    let queryResult: any[];
    let totalCount: number;
    let columns: TableColumn[];

    switch (dimension) {
      case 'transactions': {
        ({
          result: queryResult,
          total: totalCount,
          columns,
        } = await this.getTransactionsTable(prisma, dateFilter, dimensionFilters, skip, limit));
        break;
      }

      case 'category': {
        ({
          result: queryResult,
          total: totalCount,
          columns,
        } = await this.getCategoryTable(prisma, dateFilter, dimensionFilters, skip, limit));
        break;
      }

      case 'product': {
        ({
          result: queryResult,
          total: totalCount,
          columns,
        } = await this.getProductTable(prisma, dateFilter, dimensionFilters, skip, limit));
        break;
      }

      case 'customer': {
        ({
          result: queryResult,
          total: totalCount,
          columns,
        } = await this.getCustomerTable(prisma, dateFilter, dimensionFilters, skip, limit));
        break;
      }

      default: {
        // Default to category summary
        ({
          result: queryResult,
          total: totalCount,
          columns,
        } = await this.getCategoryTable(prisma, dateFilter, dimensionFilters, skip, limit));
      }
    }

    // Transform results to table rows
    const rows: TableRow[] = queryResult;

    // Determine if there are more results
    const hasMore = skip + queryResult.length < totalCount;

    // Create next cursor if there are more results
    const nextCursor = hasMore ? this.encodeCursor({ skip: skip + limit }) : undefined;

    const response: TableChartResponse = {
      columns,
      rows,
      hasMore,
      total: totalCount,
    };

    if (nextCursor !== undefined) {
      response.cursor = nextCursor;
    }

    return response;
  }

  /**
   * Get transactions table data
   */
  private async getTransactionsTable(
    prisma: PrismaClient,
    dateFilter: Prisma.DateTimeFilter,
    dimensionFilters: Record<string, any>,
    skip: number,
    limit: number,
  ): Promise<{ result: any[]; total: number; columns: TableColumn[] }> {
    const where = {
      occurredAt: dateFilter,
      ...dimensionFilters,
    };

    const [result, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: { select: { name: true } },
          product: { select: { name: true } },
          customer: { select: { name: true } },
        },
        orderBy: { occurredAt: 'desc' },
      }),
      prisma.transaction.count({ where }),
    ]);

    const columns: TableColumn[] = [
      { key: 'occurredAt', label: 'Data', type: 'date', sortable: true },
      { key: 'type', label: 'Tipo', type: 'string', sortable: true },
      { key: 'category', label: 'Categoria', type: 'string', sortable: true },
      { key: 'product', label: 'Produto', type: 'string', sortable: true },
      { key: 'customer', label: 'Cliente', type: 'string', sortable: true },
      { key: 'amount', label: 'Valor', type: 'currency', sortable: true, align: 'right' },
      { key: 'quantity', label: 'Quantidade', type: 'number', sortable: true, align: 'right' },
      { key: 'status', label: 'Status', type: 'string', sortable: true },
    ];

    const rows = result.map((transaction) => ({
      id: transaction.id,
      occurredAt: transaction.occurredAt.toISOString(),
      type: transaction.type === 'REVENUE' ? 'Receita' : 'Despesa',
      category: transaction.category.name || '-',
      product: transaction.product?.name || '-',
      customer: transaction.customer?.name || '-',
      amount: Number(transaction.amount),
      quantity: transaction.quantity,
      status: this.formatStatus(transaction.paymentStatus),
    }));

    return { result: rows, total, columns };
  }

  /**
   * Get category summary table data
   */
  private async getCategoryTable(
    prisma: PrismaClient,
    dateFilter: Prisma.DateTimeFilter,
    dimensionFilters: Record<string, any>,
    skip: number,
    limit: number,
  ): Promise<{ result: any[]; total: number; columns: TableColumn[] }> {
    // Build raw query for aggregated data
    const whereConditions = [`occurred_at >= ? AND occurred_at <= ?`];
    const whereParams: any[] = [dateFilter.gte as Date, dateFilter.lte as Date];

    if (dimensionFilters['categoryId']) {
      whereConditions.push('category_id = ?');
      whereParams.push(dimensionFilters['categoryId']);
    }

    const query = `
      SELECT 
        c.id,
        c.name,
        SUM(CASE WHEN t.type = 'EXPENSE' THEN t.amount ELSE 0 END) as expense,
        SUM(CASE WHEN t.type = 'REVENUE' THEN t.amount ELSE 0 END) as revenue,
        SUM(CASE WHEN t.type = 'REVENUE' THEN t.amount ELSE -t.amount END) as profit,
        COUNT(DISTINCT t.id) as transaction_count
      FROM categories c
      LEFT JOIN transactions t ON c.id = t.category_id
        AND t.${whereConditions.join(' AND t.')}
      GROUP BY c.id, c.name
      HAVING (expense > 0 OR revenue > 0)
      ORDER BY profit DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(DISTINCT c.id) as total
      FROM categories c
      INNER JOIN transactions t ON c.id = t.category_id
      WHERE t.${whereConditions.join(' AND t.')}
    `;

    const [result, countResult] = await Promise.all([
      prisma.$queryRawUnsafe<
        {
          id: string;
          name: string;
          expense: number | bigint;
          revenue: number | bigint;
          profit: number | bigint;
          transaction_count: number | bigint;
        }[]
      >(query, ...whereParams, limit, skip),
      prisma.$queryRawUnsafe<[{ total: bigint }]>(countQuery, ...whereParams),
    ]);

    const columns: TableColumn[] = [
      { key: 'name', label: 'Nome', type: 'string', sortable: true },
      { key: 'expense', label: 'Despesa', type: 'currency', sortable: true, align: 'right' },
      { key: 'revenue', label: 'Receita', type: 'currency', sortable: true, align: 'right' },
      { key: 'profit', label: 'Resultado', type: 'currency', sortable: true, align: 'right' },
      {
        key: 'transaction_count',
        label: 'Transações',
        type: 'number',
        sortable: true,
        align: 'right',
      },
    ];

    const rows = result.map((row) => ({
      id: row.id,
      name: row.name,
      expense: Number(row.expense),
      revenue: Number(row.revenue),
      profit: Number(row.profit),
      transaction_count: Number(row.transaction_count),
    }));

    return {
      result: rows,
      total: Number(countResult[0].total),
      columns,
    };
  }

  /**
   * Get product summary table data
   */
  private async getProductTable(
    prisma: PrismaClient,
    dateFilter: Prisma.DateTimeFilter,
    dimensionFilters: Record<string, any>,
    skip: number,
    limit: number,
  ): Promise<{ result: any[]; total: number; columns: TableColumn[] }> {
    const whereConditions = [`occurred_at >= ? AND occurred_at <= ?`];
    const whereParams: any[] = [dateFilter.gte as Date, dateFilter.lte as Date];

    if (dimensionFilters['productId']) {
      whereConditions.push('product_id = ?');
      whereParams.push(dimensionFilters['productId']);
    }

    const query = `
      SELECT 
        p.id,
        p.name,
        c.name as category_name,
        SUM(t.quantity) as total_quantity,
        SUM(t.amount) as total_amount,
        AVG(t.amount / NULLIF(t.quantity, 0)) as avg_price,
        COUNT(DISTINCT t.customer_id) as unique_customers
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN transactions t ON p.id = t.product_id
        AND t.${whereConditions.join(' AND t.')}
      GROUP BY p.id, p.name, c.name
      HAVING total_amount > 0
      ORDER BY total_amount DESC
      LIMIT ? OFFSET ?
    `;

    const [result, countResult] = await Promise.all([
      prisma.$queryRawUnsafe<
        {
          id: string;
          name: string;
          category_name: string;
          total_quantity: number | bigint;
          total_amount: number | bigint;
          avg_price: number | bigint | null;
          unique_customers: number | bigint;
        }[]
      >(query, ...whereParams, limit, skip),
      prisma.product.count(),
    ]);

    const columns: TableColumn[] = [
      { key: 'name', label: 'Produto', type: 'string', sortable: true },
      { key: 'category_name', label: 'Categoria', type: 'string', sortable: true },
      {
        key: 'total_quantity',
        label: 'Quantidade Total',
        type: 'number',
        sortable: true,
        align: 'right',
      },
      {
        key: 'total_amount',
        label: 'Valor Total',
        type: 'currency',
        sortable: true,
        align: 'right',
      },
      { key: 'avg_price', label: 'Preço Médio', type: 'currency', sortable: true, align: 'right' },
      {
        key: 'unique_customers',
        label: 'Clientes',
        type: 'number',
        sortable: true,
        align: 'right',
      },
    ];

    const rows = result.map((row) => ({
      id: row.id,
      name: row.name,
      category_name: row.category_name || '-',
      total_quantity: Number(row.total_quantity),
      total_amount: Number(row.total_amount),
      avg_price: row.avg_price ? Number(row.avg_price) : 0,
      unique_customers: Number(row.unique_customers),
    }));

    return { result: rows, total: countResult, columns };
  }

  /**
   * Get customer summary table data
   */
  private async getCustomerTable(
    prisma: PrismaClient,
    dateFilter: Prisma.DateTimeFilter,
    dimensionFilters: Record<string, any>,
    skip: number,
    limit: number,
  ): Promise<{ result: any[]; total: number; columns: TableColumn[] }> {
    const whereConditions = [`occurred_at >= ? AND occurred_at <= ?`];
    const whereParams: any[] = [dateFilter.gte as Date, dateFilter.lte as Date];

    if (dimensionFilters['customerId']) {
      whereConditions.push('customer_id = ?');
      whereParams.push(dimensionFilters['customerId']);
    }

    const query = `
      SELECT 
        cu.id,
        cu.name,
        cu.region,
        SUM(CASE WHEN t.type = 'REVENUE' THEN t.amount ELSE 0 END) as total_revenue,
        SUM(CASE WHEN t.type = 'EXPENSE' THEN t.amount ELSE 0 END) as total_expense,
        COUNT(DISTINCT t.id) as transaction_count,
        MAX(t.occurred_at) as last_transaction
      FROM customers cu
      LEFT JOIN transactions t ON cu.id = t.customer_id
        AND t.${whereConditions.join(' AND t.')}
      GROUP BY cu.id, cu.name, cu.region
      HAVING (total_revenue > 0 OR total_expense > 0)
      ORDER BY total_revenue DESC
      LIMIT ? OFFSET ?
    `;

    const [result, countResult] = await Promise.all([
      prisma.$queryRawUnsafe<
        {
          id: string;
          name: string;
          region: string;
          total_revenue: number | bigint;
          total_expense: number | bigint;
          transaction_count: number | bigint;
          last_transaction: Date | null;
        }[]
      >(query, ...whereParams, limit, skip),
      prisma.customer.count(),
    ]);

    const columns: TableColumn[] = [
      { key: 'name', label: 'Cliente', type: 'string', sortable: true },
      { key: 'region', label: 'Região', type: 'string', sortable: true },
      {
        key: 'total_revenue',
        label: 'Receita Total',
        type: 'currency',
        sortable: true,
        align: 'right',
      },
      {
        key: 'total_expense',
        label: 'Despesa Total',
        type: 'currency',
        sortable: true,
        align: 'right',
      },
      {
        key: 'transaction_count',
        label: 'Transações',
        type: 'number',
        sortable: true,
        align: 'right',
      },
      { key: 'last_transaction', label: 'Última Transação', type: 'date', sortable: true },
    ];

    const rows = result.map((row) => ({
      id: row.id,
      name: row.name,
      region: row.region || '-',
      total_revenue: Number(row.total_revenue),
      total_expense: Number(row.total_expense),
      transaction_count: Number(row.transaction_count),
      last_transaction: row.last_transaction?.toISOString() || '-',
    }));

    return { result: rows, total: countResult, columns };
  }

  /**
   * Format payment status for display
   */
  private formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      PENDING: 'Pendente',
      PAID: 'Pago',
      OVERDUE: 'Vencido',
      CANCELLED: 'Cancelado',
    };
    return statusMap[status] || status;
  }
}
