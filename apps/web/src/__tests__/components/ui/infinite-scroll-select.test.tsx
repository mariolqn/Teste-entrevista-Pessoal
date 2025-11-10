/**
 * Tests for InfiniteScrollSelect component
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { ReactNode } from 'react';

import { InfiniteScrollSelect } from '@/components/ui/infinite-scroll-select';
import * as optionsService from '@/services/options.service';
import type { OptionsEndpointResponse } from '@dashboard/types';

// Mock the options service
vi.mock('@/services/options.service');
const mockedFetchOptions = vi.mocked(optionsService.fetchOptions);

// Mock intersection observer
const mockInView = vi.hoisted(() => ({
  ref: vi.fn(),
  inView: false,
}));

vi.mock('react-intersection-observer', () => ({
  useInView: () => mockInView,
}));

// Mock debounce hook
vi.mock('@/hooks/use-debounce', () => ({
  useDebouncedValue: vi.fn((value) => value),
}));

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

const createOnChangeMock = () =>
  vi.fn<[optionsService.SelectOption<string> | null], void>();

const defaultProps = () => ({
  entity: 'products' as const,
  label: 'Product',
  onChange: createOnChangeMock(),
  placeholder: 'Select product...',
});

describe('InfiniteScrollSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInView.inView = false;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should render with label and trigger button', () => {
    render(
      <InfiniteScrollSelect {...defaultProps()} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveTextContent('Select product...');
  });

  it('should display selected value when provided', () => {
    const selectedValue: optionsService.SelectOption = {
      id: '1',
      label: 'Selected Product',
      value: 'Selected Product',
    };

    render(
      <InfiniteScrollSelect {...defaultProps()} value={selectedValue} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByRole('button')).toHaveTextContent('Selected Product');
  });

  it('should open popover when trigger is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <InfiniteScrollSelect {...defaultProps()} />,
      { wrapper: createWrapper() }
    );

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('should not open when disabled', async () => {
    const user = userEvent.setup();
    
    render(
      <InfiniteScrollSelect {...defaultProps()} disabled />,
      { wrapper: createWrapper() }
    );

    const trigger = screen.getByRole('button');
    expect(trigger).toBeDisabled();
    
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('should fetch options when opened', async () => {
    const mockResponse: OptionsEndpointResponse = {
      items: [
        { id: '1', label: 'Product 1', value: 'Product 1' },
        { id: '2', label: 'Product 2', value: 'Product 2' },
      ],
      hasMore: false,
      total: 2,
    };

    mockedFetchOptions.mockResolvedValue(mockResponse);

    const user = userEvent.setup();
    
    render(
      <InfiniteScrollSelect {...defaultProps()} />,
      { wrapper: createWrapper() }
    );

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    await waitFor(() => {
      expect(mockedFetchOptions).toHaveBeenCalledWith('products', {
        limit: 20,
      });
    });

    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
  });

  it('should handle search input', async () => {
    const mockResponse: OptionsEndpointResponse = {
      items: [{ id: '1', label: 'Laptop', value: 'Laptop' }],
      hasMore: false,
      total: 1,
    };

    mockedFetchOptions.mockResolvedValue(mockResponse);

    const user = userEvent.setup();
    
    render(
      <InfiniteScrollSelect {...defaultProps()} searchPlaceholder="Search products..." />,
      { wrapper: createWrapper() }
    );

    // Open popover
    const trigger = screen.getByRole('button');
    await user.click(trigger);

    // Type in search input
    const searchInput = screen.getByPlaceholderText('Search products...');
    await user.type(searchInput, 'laptop');

    await waitFor(() => {
      expect(mockedFetchOptions).toHaveBeenCalledWith('products', {
        limit: 20,
        search: 'laptop',
      });
    });
  });

  it('should handle option selection', async () => {
    const mockResponse: OptionsEndpointResponse = {
      items: [
        { id: '1', label: 'Product 1', value: 'Product 1' },
        { id: '2', label: 'Product 2', value: 'Product 2' },
      ],
      hasMore: false,
      total: 2,
    };

    mockedFetchOptions.mockResolvedValue(mockResponse);

    const onChange = createOnChangeMock();
    const user = userEvent.setup();
    
    render(
      <InfiniteScrollSelect {...defaultProps()} onChange={onChange} />,
      { wrapper: createWrapper() }
    );

    // Open popover
    const trigger = screen.getByRole('button');
    await user.click(trigger);

    // Wait for options to load
    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    // Select an option
    await user.click(screen.getByText('Product 1'));

    expect(onChange).toHaveBeenCalledWith({
      id: '1',
      label: 'Product 1',
      value: 'Product 1',
    });
  });

  it('should handle clear selection', async () => {
    const mockResponse: OptionsEndpointResponse = {
      items: [{ id: '1', label: 'Product 1', value: 'Product 1' }],
      hasMore: false,
      total: 1,
    };

    mockedFetchOptions.mockResolvedValue(mockResponse);

    const selectedValue: optionsService.SelectOption = {
      id: '1',
      label: 'Selected Product',
      value: 'Selected Product',
    };
    const onChange = createOnChangeMock();
    const user = userEvent.setup();
    
    render(
      <InfiniteScrollSelect {...defaultProps()} value={selectedValue} onChange={onChange} />,
      { wrapper: createWrapper() }
    );

    // Open popover
    const trigger = screen.getByRole('button');
    await user.click(trigger);

    // Click clear button (X icon)
    const clearButton = screen.getByLabelText('Limpar seleção');
    await user.click(clearButton);

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('should display loading state', async () => {
    mockedFetchOptions.mockImplementation(() => new Promise(() => {})); // Never resolves

    const user = userEvent.setup();
    
    render(
      <InfiniteScrollSelect {...defaultProps()} />,
      { wrapper: createWrapper() }
    );

    // Open popover
    const trigger = screen.getByRole('button');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Carregando...')).toBeInTheDocument();
    });
  });

  it('should display error state with retry button', async () => {
    mockedFetchOptions.mockRejectedValue(new Error('Failed to fetch options'));

    const user = userEvent.setup();
    
    render(
      <InfiniteScrollSelect {...defaultProps()} />,
      { wrapper: createWrapper() }
    );

    // Open popover
    const trigger = screen.getByRole('button');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch options')).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Tentar novamente');
    expect(retryButton).toBeInTheDocument();

    // Test retry functionality
    mockedFetchOptions.mockResolvedValue({
      items: [{ id: '1', label: 'Product 1', value: 'Product 1' }],
      hasMore: false,
      total: 1,
    });

    await user.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });
  });

  it('should display empty state when no results', async () => {
    mockedFetchOptions.mockResolvedValue({
      items: [],
      hasMore: false,
      total: 0,
    });

    const user = userEvent.setup();
    
    render(
      <InfiniteScrollSelect {...defaultProps()} />,
      { wrapper: createWrapper() }
    );

    // Open popover
    const trigger = screen.getByRole('button');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Nenhum resultado encontrado')).toBeInTheDocument();
    });
  });

  it('should handle pagination with infinite scroll', async () => {
    const mockFirstPage: OptionsEndpointResponse = {
      items: [{ id: '1', label: 'Product 1', value: 'Product 1' }],
      nextCursor: 'page-2',
      hasMore: true,
      total: 10,
    };

    const mockSecondPage: OptionsEndpointResponse = {
      items: [{ id: '2', label: 'Product 2', value: 'Product 2' }],
      hasMore: false,
      total: 10,
    };

    mockedFetchOptions
      .mockResolvedValueOnce(mockFirstPage)
      .mockResolvedValueOnce(mockSecondPage);

    const user = userEvent.setup();
    
    render(
      <InfiniteScrollSelect {...defaultProps()} />,
      { wrapper: createWrapper() }
    );

    // Open popover
    const trigger = screen.getByRole('button');
    await user.click(trigger);

    // Wait for first page to load
    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    // Simulate intersection observer triggering
    mockInView.inView = true;
    
    // Trigger the effect manually since we can't easily test intersection observer
    await waitFor(() => {
      expect(mockedFetchOptions).toHaveBeenCalledTimes(2);
    });

    expect(mockedFetchOptions).toHaveBeenCalledWith('products', {
      limit: 20,
      cursor: 'page-2',
    });
  });

  it('should display selected indicator for current selection', async () => {
    const mockResponse: OptionsEndpointResponse = {
      items: [
        { id: '1', label: 'Product 1', value: 'Product 1' },
        { id: '2', label: 'Product 2', value: 'Product 2' },
      ],
      hasMore: false,
      total: 2,
    };

    mockedFetchOptions.mockResolvedValue(mockResponse);

    const selectedValue: optionsService.SelectOption = {
      id: '1',
      label: 'Product 1',
      value: 'Product 1',
    };
    const user = userEvent.setup();
    
    render(
      <InfiniteScrollSelect {...defaultProps()} value={selectedValue} />,
      { wrapper: createWrapper() }
    );

    // Open popover
    const trigger = screen.getByRole('button');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Selecionado')).toBeInTheDocument();
    });
  });

  it('should support custom limit parameter', async () => {
    mockedFetchOptions.mockResolvedValue({
      items: [],
      hasMore: false,
      total: 0,
    });

    const user = userEvent.setup();
    
    render(
      <InfiniteScrollSelect {...defaultProps()} limit={50} />,
      { wrapper: createWrapper() }
    );

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    await waitFor(() => {
      expect(mockedFetchOptions).toHaveBeenCalledWith('products', {
        limit: 50,
      });
    });
  });

  it('should handle different entity types', async () => {
    const entities: Array<'products' | 'categories' | 'customers' | 'regions'> = [
      'categories',
      'customers',
      'regions',
    ];

    mockedFetchOptions.mockResolvedValue({
      items: [],
      hasMore: false,
      total: 0,
    });

    for (const entity of entities) {
      const user = userEvent.setup();
      
      const onChange = createOnChangeMock();

      render(
        <InfiniteScrollSelect entity={entity} label="Test" onChange={onChange} />,
        { wrapper: createWrapper() }
      );

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(mockedFetchOptions).toHaveBeenCalledWith(entity, {
          limit: 20,
        });
      });

      // Clean up for next iteration
      vi.clearAllMocks();
    }
  });

  it('should apply custom className', () => {
    render(
      <InfiniteScrollSelect {...defaultProps()} className="custom-select" />,
      { wrapper: createWrapper() }
    );

    const container = screen.getByRole('button').closest('.custom-select');
    expect(container).toBeInTheDocument();
  });

  it('should generate unique label ID', () => {
    render(
      <InfiniteScrollSelect {...defaultProps()} />,
      { wrapper: createWrapper() }
    );

    const label = screen.getByText('Product');
    const button = screen.getByRole('button');
    
    expect(label).toHaveAttribute('for');
    expect(button).toHaveAttribute('id');
    expect(label.getAttribute('for')).toBe(button.getAttribute('id'));
  });
});
