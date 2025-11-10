/**
 * Dashboard global state store
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { DateRange, Option } from '@dashboard/types';

/**
 * Dashboard filters state
 */
export interface DashboardFilters {
  dateRange: DateRange;
  selectedCategory?: Option | null;
  selectedProduct?: Option | null;
  selectedCustomer?: Option | null;
  selectedRegion?: Option | null;
  includeEmitted: boolean;
}

/**
 * Dashboard store state
 */
interface DashboardState {
  // Filters
  filters: DashboardFilters;
  
  // Actions
  setDateRange: (dateRange: DateRange) => void;
  setSelectedCategory: (category?: Option | null) => void;
  setSelectedProduct: (product?: Option | null) => void;
  setSelectedCustomer: (customer?: Option | null) => void;
  setSelectedRegion: (region?: Option | null) => void;
  setIncludeEmitted: (include: boolean) => void;
  resetFilters: () => void;
  
  // Computed values
  getAPIParams: () => {
    start: string;
    end: string;
    categoryId: string | undefined;
    productId: string | undefined;
    customerId: string | undefined;
    region: string | undefined;
  };
}

/**
 * Get default date range (last 30 days)
 */
function getDefaultDateRange(): DateRange {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

/**
 * Default filters
 */
const defaultFilters: DashboardFilters = {
  dateRange: getDefaultDateRange(),
  includeEmitted: true,
};

/**
 * Dashboard store
 */
export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      filters: defaultFilters,
      
      setDateRange: (dateRange) =>
        set((state) => ({
          filters: { ...state.filters, dateRange },
        })),
      
      setSelectedCategory: (selectedCategory) =>
        set((state) => ({
          filters: { ...state.filters, selectedCategory: selectedCategory || null },
        })),
      
      setSelectedProduct: (selectedProduct) =>
        set((state) => ({
          filters: { ...state.filters, selectedProduct: selectedProduct || null },
        })),
      
      setSelectedCustomer: (selectedCustomer) =>
        set((state) => ({
          filters: { ...state.filters, selectedCustomer: selectedCustomer || null },
        })),
      
      setSelectedRegion: (selectedRegion) =>
        set((state) => ({
          filters: { ...state.filters, selectedRegion: selectedRegion || null },
        })),
      
      setIncludeEmitted: (includeEmitted) =>
        set((state) => ({
          filters: { ...state.filters, includeEmitted },
        })),
      
      resetFilters: () =>
        set(() => ({
          filters: { 
            ...defaultFilters, 
            dateRange: getDefaultDateRange(),
            selectedCategory: null,
            selectedProduct: null,
            selectedCustomer: null,
            selectedRegion: null,
          },
        })),
      
      getAPIParams: () => {
        const { filters } = get();
        
        return {
          start: typeof filters.dateRange.start === 'string' 
            ? filters.dateRange.start 
            : filters.dateRange.start.toISOString(),
          end: typeof filters.dateRange.end === 'string' 
            ? filters.dateRange.end 
            : filters.dateRange.end.toISOString(),
          categoryId: filters.selectedCategory?.id?.toString() ?? undefined,
          productId: filters.selectedProduct?.id?.toString() ?? undefined,
          customerId: filters.selectedCustomer?.id?.toString() ?? undefined,
          region: filters.selectedRegion?.value?.toString() ?? undefined,
        };
      },
    }),
    {
      name: 'dashboard-filters',
      partialize: (state) => ({
        filters: {
          ...state.filters,
          // Don't persist selections, only date range and settings
          selectedCategory: null,
          selectedProduct: null,
          selectedCustomer: null,
          selectedRegion: null,
        },
      }),
    }
  )
);

/**
 * Hook to get current date range in ISO string format
 */
export function useDateRange() {
  const { dateRange } = useDashboardStore((state) => state.filters);
  
  return {
    start: typeof dateRange.start === 'string' ? dateRange.start : dateRange.start.toISOString(),
    end: typeof dateRange.end === 'string' ? dateRange.end : dateRange.end.toISOString(),
  };
}

/**
 * Hook to get API parameters for chart requests
 */
export function useChartAPIParams() {
  return useDashboardStore((state) => state.getAPIParams());
}
