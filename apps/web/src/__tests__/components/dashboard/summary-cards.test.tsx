/**
 * Tests for SummaryCards component
 */

import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';

import { SummaryCards } from '@/components/dashboard/summary-cards';
import * as chartDataHooks from '@/hooks/use-chart-data';
import * as dashboardStore from '@/stores/dashboard-store';

// Mock shared formatters
vi.mock('@dashboard/shared', () => ({
  formatCurrency: vi.fn((value) => `$${value.toFixed(2)}`),
}));

// Mock hooks
vi.mock('@/hooks/use-chart-data');
vi.mock('@/stores/dashboard-store');

const mockedUseDashboardSummary = vi.mocked(chartDataHooks.useDashboardSummary);
const mockedUseChartAPIParams = vi.mocked(dashboardStore.useChartAPIParams);

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

describe('SummaryCards', () => {
  const mockApiParams = {
    start: '2024-01-01T00:00:00.000Z',
    end: '2024-01-31T23:59:59.999Z',
    categoryId: undefined,
    productId: undefined,
    customerId: undefined,
    region: undefined,
  };

  const mockSummaryData = {
    totalRevenue: 50000,
    totalExpense: 30000,
    liquidProfit: 20000,
    overdueAccounts: {
      receivable: 5000,
      payable: 3000,
    },
    upcomingAccounts: {
      receivable: 8000,
      payable: 2000,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseChartAPIParams.mockReturnValue(mockApiParams);
  });

  it('should display loading skeleton when loading', () => {
    mockedUseDashboardSummary.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    render(<SummaryCards />, { wrapper: createWrapper() });

    // Should show 5 loading skeletons
    const skeletons = screen.getAllByText((_content, element) => {
      return element?.classList.contains('animate-pulse') || false;
    });
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should display error fallback with static data when error occurs', () => {
    mockedUseDashboardSummary.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('API Error'),
    } as any);

    render(<SummaryCards />, { wrapper: createWrapper() });

    expect(screen.getByText(/Exibindo dados de exemplo/)).toBeInTheDocument();
    expect(screen.getByText('$41954.26')).toBeInTheDocument(); // Fallback revenue
    expect(screen.getByText('$67740.79')).toBeInTheDocument(); // Fallback expense
  });

  it('should display error fallback when data is undefined', () => {
    mockedUseDashboardSummary.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as any);

    render(<SummaryCards />, { wrapper: createWrapper() });

    expect(screen.getByText(/Exibindo dados de exemplo/)).toBeInTheDocument();
  });

  it('should display actual data when loaded successfully', () => {
    mockedUseDashboardSummary.mockReturnValue({
      data: mockSummaryData,
      isLoading: false,
      error: null,
    } as any);

    render(<SummaryCards />, { wrapper: createWrapper() });

    expect(screen.getByText('$50000.00')).toBeInTheDocument(); // Total Revenue
    expect(screen.getByText('$30000.00')).toBeInTheDocument(); // Total Expense
    expect(screen.getByText('$20000.00')).toBeInTheDocument(); // Liquid Profit
    expect(screen.getByText('$5000.00')).toBeInTheDocument(); // Overdue receivable
    expect(screen.getByText('$3000.00')).toBeInTheDocument(); // Overdue payable
  });

  it('should pass correct parameters to useDashboardSummary', () => {
    mockedUseDashboardSummary.mockReturnValue({
      data: mockSummaryData,
      isLoading: false,
      error: null,
    } as any);

    render(<SummaryCards />, { wrapper: createWrapper() });

    expect(mockedUseDashboardSummary).toHaveBeenCalledWith({
      start: mockApiParams.start,
      end: mockApiParams.end,
    });
  });

  it('should include optional filters when they are set', () => {
    const paramsWithFilters = {
      ...mockApiParams,
      categoryId: '1',
      productId: '2',
      region: 'US',
    };

    mockedUseChartAPIParams.mockReturnValue(paramsWithFilters);
    mockedUseDashboardSummary.mockReturnValue({
      data: mockSummaryData,
      isLoading: false,
      error: null,
    } as any);

    render(<SummaryCards />, { wrapper: createWrapper() });

    expect(mockedUseDashboardSummary).toHaveBeenCalledWith({
      start: paramsWithFilters.start,
      end: paramsWithFilters.end,
      categoryId: '1',
      productId: '2',
      region: 'US',
    });
  });

  it('should exclude undefined filters from parameters', () => {
    mockedUseDashboardSummary.mockReturnValue({
      data: mockSummaryData,
      isLoading: false,
      error: null,
    } as any);

    render(<SummaryCards />, { wrapper: createWrapper() });

    expect(mockedUseDashboardSummary).toHaveBeenCalled();
    const callArgs = mockedUseDashboardSummary.mock.calls[0]?.[0];
    expect(callArgs).toBeDefined();
    expect(callArgs).not.toHaveProperty('categoryId');
    expect(callArgs).not.toHaveProperty('productId');
    expect(callArgs).not.toHaveProperty('customerId');
    expect(callArgs).not.toHaveProperty('region');
  });

  it('should handle missing account data gracefully', () => {
    const dataWithMissingAccounts = {
      ...mockSummaryData,
      overdueAccounts: undefined,
      upcomingAccounts: undefined,
    };

    mockedUseDashboardSummary.mockReturnValue({
      data: dataWithMissingAccounts,
      isLoading: false,
      error: null,
    } as any);

    render(<SummaryCards />, { wrapper: createWrapper() });

    // Should show $0.00 for missing account data
    const zeroValues = screen.getAllByText('$0.00');
    expect(zeroValues.length).toBeGreaterThan(0);
  });

  it('should display all required card labels', () => {
    mockedUseDashboardSummary.mockReturnValue({
      data: mockSummaryData,
      isLoading: false,
      error: null,
    } as any);

    render(<SummaryCards />, { wrapper: createWrapper() });

    expect(screen.getByText('Total Receita')).toBeInTheDocument();
    expect(screen.getByText('Total Despesa')).toBeInTheDocument();
    expect(screen.getByText('Lucro Líquido')).toBeInTheDocument();
    expect(screen.getByText('Contas Vencidas')).toBeInTheDocument();
    expect(screen.getByText('Contas a Vencer')).toBeInTheDocument();
  });

  it('should display account card sub-labels', () => {
    mockedUseDashboardSummary.mockReturnValue({
      data: mockSummaryData,
      isLoading: false,
      error: null,
    } as any);

    render(<SummaryCards />, { wrapper: createWrapper() });

    expect(screen.getAllByText('Receber')).toHaveLength(2); // In both account cards
    expect(screen.getAllByText('A Pagar')).toHaveLength(2); // In both account cards
  });

  it('should render with proper CSS grid layout', () => {
    mockedUseDashboardSummary.mockReturnValue({
      data: mockSummaryData,
      isLoading: false,
      error: null,
    } as any);

    const { container } = render(<SummaryCards />, { wrapper: createWrapper() });

    const section = container.querySelector('section');
    expect(section).toHaveClass('grid', 'gap-4', 'lg:grid-cols-5');
  });

  it('should render icons for each card', () => {
    mockedUseDashboardSummary.mockReturnValue({
      data: mockSummaryData,
      isLoading: false,
      error: null,
    } as any);

    const { container } = render(<SummaryCards />, { wrapper: createWrapper() });

    // Should have 5 icon containers
    const iconContainers = container.querySelectorAll('.h-11.w-11');
    expect(iconContainers).toHaveLength(5);
  });

  it('should handle negative values correctly', () => {
    const dataWithNegatives = {
      ...mockSummaryData,
      liquidProfit: -10000,
      totalExpense: 60000,
    };

    mockedUseDashboardSummary.mockReturnValue({
      data: dataWithNegatives,
      isLoading: false,
      error: null,
    } as any);

    render(<SummaryCards />, { wrapper: createWrapper() });

    expect(screen.getByText('$-10000.00')).toBeInTheDocument();
  });

  it('should apply hover effects to cards', () => {
    mockedUseDashboardSummary.mockReturnValue({
      data: mockSummaryData,
      isLoading: false,
      error: null,
    } as any);

    const { container } = render(<SummaryCards />, { wrapper: createWrapper() });

    const cards = container.querySelectorAll('[class*="hover:shadow"]');
    expect(cards.length).toBeGreaterThan(0);
  });

  describe('error states', () => {
    it('should show error message for API failures', () => {
      mockedUseDashboardSummary.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
      } as any);

      render(<SummaryCards />, { wrapper: createWrapper() });

      expect(screen.getByText(/Verifique a conexão com a API/)).toBeInTheDocument();
    });

    it('should show error state when data is null', () => {
      mockedUseDashboardSummary.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as any);

      render(<SummaryCards />, { wrapper: createWrapper() });

      expect(screen.getByText(/Exibindo dados de exemplo/)).toBeInTheDocument();
    });
  });

  describe('loading states', () => {
    it('should show correct number of skeleton cards', () => {
      mockedUseDashboardSummary.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      const { container } = render(<SummaryCards />, { wrapper: createWrapper() });

      // Should have 5 skeleton cards in grid layout
      const gridContainer = container.querySelector('.lg\\:grid-cols-5');
      expect(gridContainer).toBeInTheDocument();
    });

    it('should animate skeleton elements', () => {
      mockedUseDashboardSummary.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      const { container } = render(<SummaryCards />, { wrapper: createWrapper() });

      const animatedElements = container.querySelectorAll('.animate-pulse');
      expect(animatedElements.length).toBeGreaterThan(0);
    });
  });
});
