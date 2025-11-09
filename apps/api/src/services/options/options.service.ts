/**
 * Options Service
 * Provides cursor-based pagination for dropdown/autocomplete entities
 */

import { Prisma, PrismaClient } from '@prisma/client';
import {
  type OptionsEntity,
  type OptionsQuery,
  type OptionsResponse,
  type OptionItem,
} from '../../types/options.types.js';
import { decodeCursor, encodeCursor } from '../../utils/cursor.js';
import { ValidationError } from '../../utils/errors.js';

interface CursorState {
  id: string;
  sortValue?: string;
}

/**
 * Service responsible for retrieving options with cursor pagination
 */
export class OptionsService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Fetch options for the requested entity
   */
  async getOptions(
    entity: OptionsEntity,
    query: OptionsQuery,
  ): Promise<OptionsResponse> {
    switch (entity) {
      case 'categories':
        return this.getCategoryOptions(query);
      case 'products':
        return this.getProductOptions(query);
      case 'customers':
        return this.getCustomerOptions(query);
      case 'regions':
        return this.getRegionOptions(query);
      default:
        throw new ValidationError(`Unsupported options entity: ${entity}`);
    }
  }

  /**
   * Retrieve category options
   */
  private async getCategoryOptions(query: OptionsQuery): Promise<OptionsResponse> {
    const { limit, q, cursor, includeInactive } = query;
    const decodedCursor = this.decodeCursor(cursor);

    const where: Prisma.CategoryWhereInput = {
      ...(includeInactive ? {} : { isActive: true }),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { code: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const categories = await this.prisma.category.findMany({
      where,
      orderBy: [
        { name: 'asc' },
        { id: 'asc' },
      ],
      select: {
        id: true,
        name: true,
        code: true,
      },
      take: limit + 1,
      ...(decodedCursor
        ? {
            cursor: { id: decodedCursor.id },
            skip: 1,
          }
        : {}),
    });

    const { items, hasMore } = this.mapResults(categories, limit, (category) => ({
      id: category.id,
      label: category.name,
      value: category.id,
      metadata: {
        code: category.code,
      },
    }));

    const nextCursor = this.buildNextCursor(items, hasMore);
    const total = await this.prisma.category.count({ where });

    return {
      items,
      hasMore,
      nextCursor,
      total,
    };
  }

  /**
   * Retrieve product options
   */
  private async getProductOptions(query: OptionsQuery): Promise<OptionsResponse> {
    const { limit, q, cursor, includeInactive, categoryId } = query;
    const decodedCursor = this.decodeCursor(cursor);

    const where: Prisma.ProductWhereInput = {
      ...(includeInactive ? {} : { isActive: true }),
      ...(categoryId ? { categoryId } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { code: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const products = await this.prisma.product.findMany({
      where,
      orderBy: [
        { name: 'asc' },
        { id: 'asc' },
      ],
      select: {
        id: true,
        name: true,
        code: true,
        categoryId: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: limit + 1,
      ...(decodedCursor
        ? {
            cursor: { id: decodedCursor.id },
            skip: 1,
          }
        : {}),
    });

    const { items, hasMore } = this.mapResults(products, limit, (product) => ({
      id: product.id,
      label: product.name,
      value: product.id,
      metadata: {
        code: product.code,
        categoryId: product.categoryId,
        categoryName: product.category?.name,
      },
    }));

    const nextCursor = this.buildNextCursor(items, hasMore);
    const total = await this.prisma.product.count({ where });

    return {
      items,
      hasMore,
      nextCursor,
      total,
    };
  }

  /**
   * Retrieve customer options
   */
  private async getCustomerOptions(query: OptionsQuery): Promise<OptionsResponse> {
    const { limit, q, cursor, includeInactive, region } = query;
    const decodedCursor = this.decodeCursor(cursor);

    const where: Prisma.CustomerWhereInput = {
      ...(includeInactive ? {} : { isActive: true }),
      ...(region ? { region } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { document: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const customers = await this.prisma.customer.findMany({
      where,
      orderBy: [
        { name: 'asc' },
        { id: 'asc' },
      ],
      select: {
        id: true,
        name: true,
        document: true,
        region: true,
      },
      take: limit + 1,
      ...(decodedCursor
        ? {
            cursor: { id: decodedCursor.id },
            skip: 1,
          }
        : {}),
    });

    const { items, hasMore } = this.mapResults(customers, limit, (customer) => ({
      id: customer.id,
      label: customer.name,
      value: customer.id,
      metadata: {
        document: customer.document,
        region: customer.region,
      },
    }));

    const nextCursor = this.buildNextCursor(items, hasMore);
    const total = await this.prisma.customer.count({ where });

    return {
      items,
      hasMore,
      nextCursor,
      total,
    };
  }

  /**
   * Retrieve region options (distinct regions from customers)
   */
  private async getRegionOptions(query: OptionsQuery): Promise<OptionsResponse> {
    const { limit, q, cursor, includeInactive } = query;
    const decodedCursor = this.decodeCursor(cursor);

    const baseConditions: Prisma.CustomerWhereInput[] = [
      { region: { not: null } },
      { region: { not: '' } },
    ];

    if (!includeInactive) {
      baseConditions.push({ isActive: true });
    }

    if (q) {
      baseConditions.push({
        region: { contains: q, mode: 'insensitive' },
      });
    }

    const where: Prisma.CustomerWhereInput = {
      AND: baseConditions,
    };

    const regions = await this.prisma.customer.groupBy({
      by: ['region'],
      where,
      orderBy: {
        region: 'asc',
      },
      take: limit + 1,
      ...(decodedCursor?.sortValue
        ? {
            cursor: { region: decodedCursor.sortValue },
            skip: 1,
          }
        : {}),
      _count: {
        _all: true,
      },
    });

    const truncatedRegions = regions.slice(0, limit);
    const hasMore = regions.length > limit;

    const items: OptionItem[] = truncatedRegions.map((regionGroup) => {
      const regionName = regionGroup.region ?? '';

      return {
        id: regionName,
        label: regionName,
        value: regionName,
        metadata: {
          customerCount: regionGroup._count._all,
        },
      };
    });

    const nextCursor = hasMore && items.length > 0
      ? encodeCursor({
          id: items[items.length - 1].id,
          sortValue: items[items.length - 1].label,
        })
      : undefined;

    const totalRegions = await this.prisma.customer.findMany({
      where,
      distinct: ['region'],
      select: { region: true },
    });

    return {
      items,
      hasMore,
      nextCursor,
      total: totalRegions.length,
    };
  }

  /**
   * Decode pagination cursor and convert errors into validation errors
   */
  private decodeCursor(cursor?: string): CursorState | undefined {
    if (!cursor) {
      return undefined;
    }

    try {
      return decodeCursor(cursor);
    } catch {
      throw new ValidationError('Invalid cursor', { cursor: 'Malformed cursor provided' });
    }
  }

  /**
   * Build response items and determine pagination state
   */
  private mapResults<T>(
    results: T[],
    limit: number,
    mapper: (item: T) => OptionItem,
  ): { items: OptionItem[]; hasMore: boolean } {
    const hasMore = results.length > limit;
    const trimmed = hasMore ? results.slice(0, limit) : results;
    const items = trimmed.map(mapper);
    return { items, hasMore };
  }

  /**
   * Build the next cursor based on the last item
   */
  private buildNextCursor(items: OptionItem[], hasMore: boolean): string | undefined {
    if (!hasMore || items.length === 0) {
      return undefined;
    }

    const lastItem = items[items.length - 1];
    return encodeCursor({
      id: lastItem.id,
      sortValue: lastItem.label,
    });
  }
}

