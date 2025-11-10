/**
 * Tests for dashboard store
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { useDashboardStore, useDateRange, useChartAPIParams } from '@/stores/dashboard-store';
import type { Option } from '@dashboard/types';

const makeOption = <T = string>(id: string | number, label: string, value: T): Option<T> => ({
  id,
  label,
  value,
});

// Mock zustand persist to avoid localStorage issues in tests
vi.mock('zustand/middleware', () => ({
  persist: vi.fn((fn) => fn),
}));

describe('useDashboardStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state before each test
    useDashboardStore.getState().resetFilters();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('initial state', () => {
    it('should have default date range (last 30 days)', () => {
      const { result } = renderHook(() => useDashboardStore());

      const { filters } = result.current;
      expect(filters.dateRange).toBeDefined();
      expect(filters.dateRange.start).toBeDefined();
      expect(filters.dateRange.end).toBeDefined();

      // Check that start is before end and roughly 30 days apart
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      const daysDiff = Math.abs((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      expect(daysDiff).toBeCloseTo(30, 1); // Allow 1 day tolerance
      expect(startDate.getTime()).toBeLessThan(endDate.getTime());
    });

    it('should have default filter values', () => {
      const { result } = renderHook(() => useDashboardStore());

      const { filters } = result.current;
      expect(filters.selectedCategory).toBeUndefined();
      expect(filters.selectedProduct).toBeUndefined();
      expect(filters.selectedCustomer).toBeUndefined();
      expect(filters.selectedRegion).toBeUndefined();
      expect(filters.includeEmitted).toBe(true);
    });
  });

  describe('setDateRange', () => {
    it('should update date range', () => {
      const { result } = renderHook(() => useDashboardStore());

      const newDateRange = {
        start: '2024-01-01T00:00:00.000Z',
        end: '2024-01-31T23:59:59.999Z',
      };

      act(() => {
        result.current.setDateRange(newDateRange);
      });

      expect(result.current.filters.dateRange).toEqual(newDateRange);
    });

    it('should preserve other filters when updating date range', () => {
      const { result } = renderHook(() => useDashboardStore());

      const category = makeOption('1', 'Electronics', 'Electronics');

      // Set a category first
      act(() => {
        result.current.setSelectedCategory(category);
      });

      const newDateRange = {
        start: '2024-01-01T00:00:00.000Z',
        end: '2024-01-31T23:59:59.999Z',
      };

      // Update date range
      act(() => {
        result.current.setDateRange(newDateRange);
      });

      expect(result.current.filters.dateRange).toEqual(newDateRange);
      expect(result.current.filters.selectedCategory).toEqual(category);
    });
  });

  describe('selection methods', () => {
    it('should set selected category', () => {
      const { result } = renderHook(() => useDashboardStore());

      const category = makeOption('1', 'Electronics', 'Electronics');

      act(() => {
        result.current.setSelectedCategory(category);
      });

      expect(result.current.filters.selectedCategory).toEqual(category);
    });

    it('should set selected product', () => {
      const { result } = renderHook(() => useDashboardStore());

      const product = makeOption('2', 'Laptop', 'Laptop');

      act(() => {
        result.current.setSelectedProduct(product);
      });

      expect(result.current.filters.selectedProduct).toEqual(product);
    });

    it('should set selected customer', () => {
      const { result } = renderHook(() => useDashboardStore());

      const customer = makeOption('3', 'John Doe', 'John Doe');

      act(() => {
        result.current.setSelectedCustomer(customer);
      });

      expect(result.current.filters.selectedCustomer).toEqual(customer);
    });

    it('should set selected region', () => {
      const { result } = renderHook(() => useDashboardStore());

      const region = makeOption('us', 'United States', 'us');

      act(() => {
        result.current.setSelectedRegion(region);
      });

      expect(result.current.filters.selectedRegion).toEqual(region);
    });

    it('should handle null values for selections', () => {
      const { result } = renderHook(() => useDashboardStore());

      const category = makeOption('1', 'Electronics', 'Electronics');

      // Set a category first
      act(() => {
        result.current.setSelectedCategory(category);
      });

      expect(result.current.filters.selectedCategory).toEqual(category);

      // Clear the category
      act(() => {
        result.current.setSelectedCategory(null);
      });

      expect(result.current.filters.selectedCategory).toBeNull();
    });

    it('should handle undefined values for selections', () => {
      const { result } = renderHook(() => useDashboardStore());

      const category = makeOption('1', 'Electronics', 'Electronics');

      // Set a category first
      act(() => {
        result.current.setSelectedCategory(category);
      });

      // Clear with undefined
      act(() => {
        result.current.setSelectedCategory(undefined);
      });

      expect(result.current.filters.selectedCategory).toBeNull();
    });
  });

  describe('setIncludeEmitted', () => {
    it('should toggle includeEmitted flag', () => {
      const { result } = renderHook(() => useDashboardStore());

      // Default is true
      expect(result.current.filters.includeEmitted).toBe(true);

      act(() => {
        result.current.setIncludeEmitted(false);
      });

      expect(result.current.filters.includeEmitted).toBe(false);

      act(() => {
        result.current.setIncludeEmitted(true);
      });

      expect(result.current.filters.includeEmitted).toBe(true);
    });
  });

  describe('resetFilters', () => {
    it('should reset all filters to default values', () => {
      const { result } = renderHook(() => useDashboardStore());

      // Set some filters
      const category = makeOption('1', 'Electronics', 'Electronics');
      const product = makeOption('2', 'Laptop', 'Laptop');

      act(() => {
        result.current.setSelectedCategory(category);
        result.current.setSelectedProduct(product);
        result.current.setIncludeEmitted(false);
      });

      expect(result.current.filters.selectedCategory).toEqual(category);
      expect(result.current.filters.selectedProduct).toEqual(product);
      expect(result.current.filters.includeEmitted).toBe(false);

      // Reset filters
      act(() => {
        result.current.resetFilters();
      });

      expect(result.current.filters.selectedCategory).toBeNull();
      expect(result.current.filters.selectedProduct).toBeNull();
      expect(result.current.filters.selectedCustomer).toBeNull();
      expect(result.current.filters.selectedRegion).toBeNull();
      expect(result.current.filters.includeEmitted).toBe(true);
      
      // Date range should be refreshed to current date
      expect(result.current.filters.dateRange).toBeDefined();
    });
  });

  describe('getAPIParams', () => {
    it('should return API parameters from current filters', () => {
      const { result } = renderHook(() => useDashboardStore());

      const dateRange = {
        start: '2024-01-01T00:00:00.000Z',
        end: '2024-01-31T23:59:59.999Z',
      };

      act(() => {
        result.current.setDateRange(dateRange);
      });

      const apiParams = result.current.getAPIParams();

      expect(apiParams.start).toBe(dateRange.start);
      expect(apiParams.end).toBe(dateRange.end);
      expect(apiParams.categoryId).toBeUndefined();
      expect(apiParams.productId).toBeUndefined();
      expect(apiParams.customerId).toBeUndefined();
      expect(apiParams.region).toBeUndefined();
    });

    it('should include selection IDs in API parameters', () => {
      const { result } = renderHook(() => useDashboardStore());

      const category = makeOption('1', 'Electronics', 'Electronics');
      const product = makeOption(2, 'Laptop', 'Laptop'); // Numeric ID
      const customer = makeOption('3', 'John Doe', 'John Doe');
      const region = makeOption('us', 'United States', 'US');

      act(() => {
        result.current.setSelectedCategory(category);
        result.current.setSelectedProduct(product);
        result.current.setSelectedCustomer(customer);
        result.current.setSelectedRegion(region);
      });

      const apiParams = result.current.getAPIParams();

      expect(apiParams.categoryId).toBe('1');
      expect(apiParams.productId).toBe('2');
      expect(apiParams.customerId).toBe('3');
      expect(apiParams.region).toBe('US'); // Uses value, not id
    });

    it('should handle Date objects in date range', () => {
      const { result } = renderHook(() => useDashboardStore());

      const startDate = new Date('2024-01-01T00:00:00.000Z');
      const endDate = new Date('2024-01-31T23:59:59.999Z');

      act(() => {
        result.current.setDateRange({
          start: startDate,
          end: endDate,
        } as any);
      });

      const apiParams = result.current.getAPIParams();

      expect(apiParams.start).toBe(startDate.toISOString());
      expect(apiParams.end).toBe(endDate.toISOString());
    });
  });
});

describe('useDateRange hook', () => {
  beforeEach(() => {
    useDashboardStore.getState().resetFilters();
  });

  it('should return current date range as ISO strings', () => {
    const { result } = renderHook(() => useDateRange());

    expect(result.current.start).toBeDefined();
    expect(result.current.end).toBeDefined();
    expect(typeof result.current.start).toBe('string');
    expect(typeof result.current.end).toBe('string');

    // Should be valid ISO strings
    expect(() => new Date(result.current.start)).not.toThrow();
    expect(() => new Date(result.current.end)).not.toThrow();
  });

  it('should update when date range changes', () => {
    const { result } = renderHook(() => useDateRange());
    const { result: storeResult } = renderHook(() => useDashboardStore());

    const newDateRange = {
      start: '2024-01-01T00:00:00.000Z',
      end: '2024-01-31T23:59:59.999Z',
    };

    act(() => {
      storeResult.current.setDateRange(newDateRange);
    });

    expect(result.current.start).toBe(newDateRange.start);
    expect(result.current.end).toBe(newDateRange.end);
  });

  it('should handle Date objects and convert to ISO strings', () => {
    const { result } = renderHook(() => useDateRange());
    const { result: storeResult } = renderHook(() => useDashboardStore());

    const startDate = new Date('2024-01-01T00:00:00.000Z');
    const endDate = new Date('2024-01-31T23:59:59.999Z');

    act(() => {
      storeResult.current.setDateRange({
        start: startDate,
        end: endDate,
      } as any);
    });

    expect(result.current.start).toBe(startDate.toISOString());
    expect(result.current.end).toBe(endDate.toISOString());
  });
});

describe('useChartAPIParams hook', () => {
  beforeEach(() => {
    useDashboardStore.getState().resetFilters();
  });

  it('should return API parameters from store', () => {
    const { result } = renderHook(() => useChartAPIParams());
    const { result: storeResult } = renderHook(() => useDashboardStore());

    const category = makeOption('1', 'Electronics', 'Electronics');
    const dateRange = {
      start: '2024-01-01T00:00:00.000Z',
      end: '2024-01-31T23:59:59.999Z',
    };

    act(() => {
      storeResult.current.setDateRange(dateRange);
      storeResult.current.setSelectedCategory(category);
    });

    const params = result.current;

    expect(params.start).toBe(dateRange.start);
    expect(params.end).toBe(dateRange.end);
    expect(params.categoryId).toBe('1');
    expect(params.productId).toBeUndefined();
    expect(params.customerId).toBeUndefined();
    expect(params.region).toBeUndefined();
  });

  it('should update when store changes', () => {
    const { result } = renderHook(() => useChartAPIParams());
    const { result: storeResult } = renderHook(() => useDashboardStore());

    const product = makeOption('2', 'Laptop', 'Laptop');

    act(() => {
      storeResult.current.setSelectedProduct(product);
    });

    expect(result.current.productId).toBe('2');
  });
});
