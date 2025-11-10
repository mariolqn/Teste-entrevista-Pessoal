/**
 * Tests for FiltersToolbar component
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';

import { FiltersToolbar } from '@/components/dashboard/filters-toolbar';
import * as dashboardStore from '@/stores/dashboard-store';
import type { Option } from '@dashboard/types';

// Mock the dashboard store
vi.mock('@/stores/dashboard-store');
const mockedUseDashboardStore = vi.mocked(dashboardStore.useDashboardStore);

// Mock UI components
vi.mock('@/components/ui/date-range-picker', () => ({
  DateRangePicker: ({ value, onChange, required, className }: any) => (
    <div 
      data-testid="date-range-picker"
      data-value={JSON.stringify(value)}
      data-required={required}
      className={className}
      onClick={() => onChange?.({ start: '2024-01-01', end: '2024-01-31' })}
    >
      Date Range Picker
    </div>
  ),
}));

vi.mock('@/components/ui/infinite-scroll-select', () => ({
  InfiniteScrollSelect: ({ entity, label, value, onChange, placeholder, className }: any) => (
    <div
      data-testid={`infinite-scroll-select-${entity}`}
      data-label={label}
      data-value={JSON.stringify(value)}
      data-placeholder={placeholder}
      className={className}
      onClick={() =>
        onChange?.({
          id: '1',
          label: `Test ${entity}`,
          value: `Test ${entity}`,
        })
      }
    >
      {label} Select
    </div>
  ),
}));

const makeOption = <T = string>(id: string | number, label: string, value: T): Option<T> => ({
  id,
  label,
  value,
});

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('FiltersToolbar', () => {
  const mockStoreActions = {
    setDateRange: vi.fn(),
    setSelectedCategory: vi.fn(),
    setSelectedProduct: vi.fn(),
    setSelectedCustomer: vi.fn(),
    setIncludeEmitted: vi.fn(),
    resetFilters: vi.fn(),
  };

  const mockFilters = {
    dateRange: {
      start: '2024-01-01T00:00:00.000Z',
      end: '2024-01-31T23:59:59.999Z',
    },
    selectedCategory: null as Option | null,
    selectedProduct: null as Option | null,
    selectedCustomer: null as Option | null,
    selectedRegion: null as Option | null,
    includeEmitted: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseDashboardStore.mockReturnValue({
      filters: mockFilters,
      ...mockStoreActions,
    } as any);
  });

  it('should render all filter components', () => {
    render(<FiltersToolbar />, { wrapper: createWrapper() });

    expect(screen.getByTestId('date-range-picker')).toBeInTheDocument();
    expect(screen.getByTestId('infinite-scroll-select-categories')).toBeInTheDocument();
    expect(screen.getByTestId('infinite-scroll-select-products')).toBeInTheDocument();
    expect(screen.getByTestId('infinite-scroll-select-customers')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('should render previous period button', () => {
    render(<FiltersToolbar />, { wrapper: createWrapper() });

    const prevButton = screen.getByTitle('Período anterior');
    expect(prevButton).toBeInTheDocument();
    expect(prevButton).toHaveClass('bg-brand-500');
  });

  it('should render date range presets', () => {
    render(<FiltersToolbar />, { wrapper: createWrapper() });

    expect(screen.getByText('Últimos 7 dias')).toBeInTheDocument();
    expect(screen.getByText('Últimos 30 dias')).toBeInTheDocument();
    expect(screen.getByText('Últimos 90 dias')).toBeInTheDocument();
  });

  it('should render action buttons', () => {
    render(<FiltersToolbar />, { wrapper: createWrapper() });

    expect(screen.getByText('Limpar')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByText('Pesquisar')).toBeInTheDocument();
  });

  it('should handle date range change', async () => {
    const user = userEvent.setup();
    
    render(<FiltersToolbar />, { wrapper: createWrapper() });

    const dateRangePicker = screen.getByTestId('date-range-picker');
    await user.click(dateRangePicker);

    expect(mockStoreActions.setDateRange).toHaveBeenCalledWith({
      start: '2024-01-01',
      end: '2024-01-31',
    });
  });

  it('should handle preset date selection', async () => {
    const user = userEvent.setup();
    
    render(<FiltersToolbar />, { wrapper: createWrapper() });

    const last7DaysPreset = screen.getByText('Últimos 7 dias');
    await user.click(last7DaysPreset);

    expect(mockStoreActions.setDateRange).toHaveBeenCalled();
    
    // Check that the call was made with dates representing last 7 days
    const callArgs = mockStoreActions.setDateRange.mock.calls[0][0];
    expect(callArgs).toHaveProperty('start');
    expect(callArgs).toHaveProperty('end');
  });

  it('should handle previous period navigation', async () => {
    const user = userEvent.setup();
    
    render(<FiltersToolbar />, { wrapper: createWrapper() });

    const prevButton = screen.getByTitle('Período anterior');
    await user.click(prevButton);

    expect(mockStoreActions.setDateRange).toHaveBeenCalled();
    
    // Should set date range to previous period
    const callArgs = mockStoreActions.setDateRange.mock.calls[0][0];
    expect(callArgs).toHaveProperty('start');
    expect(callArgs).toHaveProperty('end');
  });

  it('should handle category selection', async () => {
    const user = userEvent.setup();
    
    render(<FiltersToolbar />, { wrapper: createWrapper() });

    const categorySelect = screen.getByTestId('infinite-scroll-select-categories');
    await user.click(categorySelect);

    expect(mockStoreActions.setSelectedCategory).toHaveBeenCalledWith({
      id: '1',
      label: 'Test categories',
    });
  });

  it('should handle product selection', async () => {
    const user = userEvent.setup();
    
    render(<FiltersToolbar />, { wrapper: createWrapper() });

    const productSelect = screen.getByTestId('infinite-scroll-select-products');
    await user.click(productSelect);

    expect(mockStoreActions.setSelectedProduct).toHaveBeenCalledWith({
      id: '1',
      label: 'Test products',
    });
  });

  it('should handle customer selection', async () => {
    const user = userEvent.setup();
    
    render(<FiltersToolbar />, { wrapper: createWrapper() });

    const customerSelect = screen.getByTestId('infinite-scroll-select-customers');
    await user.click(customerSelect);

    expect(mockStoreActions.setSelectedCustomer).toHaveBeenCalledWith({
      id: '1',
      label: 'Test customers',
    });
  });

  it('should handle include emitted checkbox', async () => {
    const user = userEvent.setup();
    
    render(<FiltersToolbar />, { wrapper: createWrapper() });

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked(); // Default is true

    await user.click(checkbox);

    expect(mockStoreActions.setIncludeEmitted).toHaveBeenCalledWith(false);
  });

  it('should handle reset filters', async () => {
    const user = userEvent.setup();
    
    render(<FiltersToolbar />, { wrapper: createWrapper() });

    const resetButton = screen.getByText('Limpar');
    await user.click(resetButton);

    expect(mockStoreActions.resetFilters).toHaveBeenCalled();
  });

  it('should display selected values correctly', () => {
    const filtersWithSelections = {
      ...mockFilters,
      selectedCategory: makeOption('1', 'Electronics', 'Electronics'),
      selectedProduct: makeOption('2', 'Laptop', 'Laptop'),
      selectedCustomer: makeOption('3', 'John Doe', 'John Doe'),
      includeEmitted: false,
    };

    mockedUseDashboardStore.mockReturnValue({
      filters: filtersWithSelections,
      ...mockStoreActions,
    } as any);

    render(<FiltersToolbar />, { wrapper: createWrapper() });

    // Check that selected values are passed to components
    const categorySelect = screen.getByTestId('infinite-scroll-select-categories');
    expect(categorySelect).toHaveAttribute('data-value', JSON.stringify({ id: '1', label: 'Electronics' }));

    const productSelect = screen.getByTestId('infinite-scroll-select-products');
    expect(productSelect).toHaveAttribute('data-value', JSON.stringify({ id: '2', label: 'Laptop' }));

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('should render filter field labels correctly', () => {
    render(<FiltersToolbar />, { wrapper: createWrapper() });

    expect(screen.getByText('Período')).toBeInTheDocument();
    expect(screen.getByText('Centro de custo')).toBeInTheDocument();
    expect(screen.getByText('Produto')).toBeInTheDocument();
    expect(screen.getByText('Cliente')).toBeInTheDocument();
  });

  it('should mark required fields with asterisk', () => {
    render(<FiltersToolbar />, { wrapper: createWrapper() });

    // Period should be marked as required
    const periodLabel = screen.getByText('Período').closest('div');
    expect(periodLabel?.textContent).toMatch(/\*/); // Should contain asterisk
  });

  it('should apply correct CSS classes for layout', () => {
    const { container } = render(<FiltersToolbar />, { wrapper: createWrapper() });

    const toolbar = container.querySelector('.bg-gradient-to-r.from-brand-50\\/70');
    expect(toolbar).toBeInTheDocument();
    expect(toolbar).toHaveClass('flex', 'flex-wrap', 'items-center', 'gap-4');
  });

  it('should handle all preset buttons', async () => {
    const user = userEvent.setup();
    
    render(<FiltersToolbar />, { wrapper: createWrapper() });

    const presets = ['Últimos 7 dias', 'Últimos 30 dias', 'Últimos 90 dias'];
    
    for (const presetText of presets) {
      const preset = screen.getByText(presetText);
      await user.click(preset);
    }

    expect(mockStoreActions.setDateRange).toHaveBeenCalledTimes(3);
  });

  it('should have proper button styling', () => {
    render(<FiltersToolbar />, { wrapper: createWrapper() });

    const prevButton = screen.getByTitle('Período anterior');
    expect(prevButton).toHaveClass('bg-brand-500', 'text-white');

    const searchButton = screen.getByText('Pesquisar');
    expect(searchButton).toHaveClass('bg-brand-500', 'text-white');

    const pdfButton = screen.getByText('PDF');
    expect(pdfButton).toHaveClass('border-brand-500', 'text-brand-600');
  });

  it('should calculate previous period correctly', async () => {
    const user = userEvent.setup();
    
    // Set up a specific date range
    const specificFilters = {
      ...mockFilters,
      dateRange: {
        start: '2024-01-15T00:00:00.000Z', // 15 days
        end: '2024-01-30T23:59:59.999Z',
      },
    };

    mockedUseDashboardStore.mockReturnValue({
      filters: specificFilters,
      ...mockStoreActions,
    } as any);

    render(<FiltersToolbar />, { wrapper: createWrapper() });

    const prevButton = screen.getByTitle('Período anterior');
    await user.click(prevButton);

    expect(mockStoreActions.setDateRange).toHaveBeenCalled();
    
    // Should calculate the previous period with same duration
    const callArgs = mockStoreActions.setDateRange.mock.calls[0][0];
    const startDate = new Date(callArgs.start);
    const endDate = new Date(callArgs.end);
    
    // Should be before the original range and maintain ordering
    expect(endDate.getTime()).toBeLessThan(new Date('2024-01-15T00:00:00.000Z').getTime());
    expect(endDate.getTime()).toBeGreaterThan(startDate.getTime());
  });

  it('should pass correct props to infinite scroll selects', () => {
    render(<FiltersToolbar />, { wrapper: createWrapper() });

    const categorySelect = screen.getByTestId('infinite-scroll-select-categories');
    expect(categorySelect).toHaveAttribute('data-label', 'Centro de custo');
    expect(categorySelect).toHaveAttribute('data-placeholder', 'Todos os centros');

    const productSelect = screen.getByTestId('infinite-scroll-select-products');
    expect(productSelect).toHaveAttribute('data-label', 'Produto');
    expect(productSelect).toHaveAttribute('data-placeholder', 'Todos os produtos');

    const customerSelect = screen.getByTestId('infinite-scroll-select-customers');
    expect(customerSelect).toHaveAttribute('data-label', 'Cliente');
    expect(customerSelect).toHaveAttribute('data-placeholder', 'Todos os clientes');
  });

  it('should handle date range picker without change', async () => {
    const user = userEvent.setup();
    
    // Mock DateRangePicker to not call onChange
    vi.mocked(require('@/components/ui/date-range-picker').DateRangePicker).mockImplementation(
      ({ value, onChange, required, className }: any) => (
        <div 
          data-testid="date-range-picker"
          data-value={JSON.stringify(value)}
          data-required={required}
          className={className}
          onClick={() => onChange?.(undefined)} // Pass undefined
        >
          Date Range Picker
        </div>
      )
    );

    render(<FiltersToolbar />, { wrapper: createWrapper() });

    const dateRangePicker = screen.getByTestId('date-range-picker');
    await user.click(dateRangePicker);

    // Should not call setDateRange when undefined is passed
    expect(mockStoreActions.setDateRange).not.toHaveBeenCalled();
  });
});
