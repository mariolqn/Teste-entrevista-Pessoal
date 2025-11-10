/**
 * Tests for options service
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { fetchOptions, type SelectOption } from '@/services/options.service';
import type { OptionsEndpointResponse, Option } from '@dashboard/types';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock env
vi.mock('@/lib/env', () => ({
  env: {
    apiUrl: 'http://localhost:3000',
  },
}));

const makeOption = <T = string>(
  id: string | number,
  label: string,
  value: T = label as unknown as T,
  overrides: Partial<Option<T>> = {},
): Option<T> => ({
  id,
  label,
  value,
  ...overrides,
});

describe('fetchOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should fetch options successfully without parameters', async () => {
    const mockResponse: OptionsEndpointResponse = {
      items: [
        makeOption('1', 'Option 1'),
        makeOption('2', 'Option 2'),
      ],
      hasMore: false,
      total: 2,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await fetchOptions('products');

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/options/products',
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-store',
      }
    );
  });

  it('should include search parameter in URL', async () => {
    const mockResponse: OptionsEndpointResponse = {
      items: [makeOption('1', 'Laptop')],
      hasMore: false,
      total: 1,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    await fetchOptions('products', { search: 'laptop' });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/options/products?search=laptop',
      expect.any(Object)
    );
  });

  it('should include cursor parameter for pagination', async () => {
    const mockResponse: OptionsEndpointResponse = {
      items: [makeOption('3', 'Option 3')],
      nextCursor: 'next-token',
      hasMore: true,
      total: 10,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    await fetchOptions('categories', { cursor: 'current-token' });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/options/categories?cursor=current-token',
      expect.any(Object)
    );
  });

  it('should include limit parameter', async () => {
    const mockResponse: OptionsEndpointResponse = {
      items: Array.from({ length: 20 }, (_, i) =>
        makeOption(`${i + 1}`, `Option ${i + 1}`),
      ),
      hasMore: true,
      total: 100,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    await fetchOptions('customers', { limit: 20 });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/options/customers?limit=20',
      expect.any(Object)
    );
  });

  it('should include all parameters when provided', async () => {
    const mockResponse: OptionsEndpointResponse = {
      items: [makeOption('1', 'Filtered Result')],
      nextCursor: 'next-token',
      hasMore: true,
      total: 50,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    await fetchOptions('products', {
      search: 'laptop',
      cursor: 'page-2',
      limit: 25,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/options/products?search=laptop&cursor=page-2&limit=25',
      expect.any(Object)
    );
  });

  it('should handle different entity types', async () => {
    const entities: Array<'products' | 'categories' | 'customers' | 'regions'> = [
      'products',
      'categories',
      'customers',
      'regions',
    ];

    const mockResponse: OptionsEndpointResponse = {
      items: [makeOption('1', 'Test')],
      hasMore: false,
      total: 1,
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    for (const entity of entities) {
      await fetchOptions(entity);
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3000/api/v1/options/${entity}`,
        expect.any(Object)
      );
    }
  });

  it('should handle options with metadata and values', async () => {
    const mockResponse: OptionsEndpointResponse = {
      items: [
        {
          id: '1',
          label: 'Premium Product',
          value: { price: 99.99, category: 'electronics' },
          metadata: { featured: true, inStock: true },
        },
        {
          id: '2',
          label: 'Basic Product',
          value: null,
          disabled: true,
        },
      ],
      hasMore: false,
      total: 2,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await fetchOptions('products');

    expect(result.items[0]).toEqual({
      id: '1',
      label: 'Premium Product',
      value: { price: 99.99, category: 'electronics' },
      metadata: { featured: true, inStock: true },
    });

    expect(result.items[1]).toEqual({
      id: '2',
      label: 'Basic Product',
      value: null,
      disabled: true,
    });
  });

  it('should handle API error responses', async () => {
    const errorResponse = {
      type: 'validation-error',
      title: 'Invalid request',
      status: 400,
      detail: 'Invalid entity type',
    };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve(errorResponse),
    });

    await expect(fetchOptions('products' as any)).rejects.toThrow('Invalid entity type');
  });

  it('should handle API error responses without JSON detail', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('Invalid JSON')),
    });

    await expect(fetchOptions('products')).rejects.toThrow('Failed to load options');
  });

  it('should handle API error responses with non-string detail', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ detail: { code: 'INVALID_PARAM' } }),
    });

    await expect(fetchOptions('products')).rejects.toThrow('Failed to load options');
  });

  it('should validate response schema', async () => {
    const invalidResponse = {
      // Missing required fields
      data: [{ name: 'Invalid Option' }], // Should be 'items'
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(invalidResponse),
    });

    await expect(fetchOptions('products')).rejects.toThrow();
  });

  it('should handle numeric IDs in options', async () => {
    const mockResponse: OptionsEndpointResponse = {
      items: [
        makeOption(1, 'Option 1', 'Option 1'),
        makeOption(2, 'Option 2', 'Option 2'),
      ],
      hasMore: false,
      total: 2,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await fetchOptions('categories');

    expect(result.items[0]?.id).toBe(1);
    expect(result.items[1]?.id).toBe(2);
  });

  it('should handle empty search parameter', async () => {
    const mockResponse: OptionsEndpointResponse = {
      items: [],
      hasMore: false,
      total: 0,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    await fetchOptions('products', { search: '' });

    // Empty search should not be included in URL
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/options/products',
      expect.any(Object)
    );
  });

  it('should handle zero limit', async () => {
    const mockResponse: OptionsEndpointResponse = {
      items: [],
      hasMore: false,
      total: 0,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    await fetchOptions('products', { limit: 0 });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/options/products?limit=0',
      expect.any(Object)
    );
  });
});

describe('SelectOption type', () => {
  it('should be compatible with Option type', () => {
    const option: SelectOption = makeOption('1', 'Test Option');

    expect(option.id).toBe('1');
    expect(option.label).toBe('Test Option');
  });

  it('should support generic type parameter', () => {
    const typedOption: SelectOption<{ category: string }> = {
      id: '1',
      label: 'Test Option',
      value: { category: 'electronics' },
    };

    expect(typedOption.value?.category).toBe('electronics');
  });
});
