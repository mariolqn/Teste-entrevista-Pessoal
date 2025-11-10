/**
 * Tests for PieChart component
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { PieChart, DonutChart } from '@/components/charts/pie-chart';
import type { PieChartResponse, PieChartSegment } from '@dashboard/types';

type PieSegmentInput = Omit<PieChartSegment, 'percentage'> & {
  percentage?: number;
};

const buildPieChartResponse = (segments: PieSegmentInput[]): PieChartResponse => {
  if (segments.length === 0) {
    return { series: [], total: 0 };
  }

  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  return {
    series: segments.map((segment) => ({
      ...segment,
      percentage:
        segment.percentage !== undefined
          ? segment.percentage
          : total === 0
          ? 0
          : (segment.value / total) * 100,
    })),
    total,
  };
};

const basePieData = buildPieChartResponse([
  { label: 'Electronics', value: 1500 },
  { label: 'Clothing', value: 800 },
  { label: 'Books', value: 300 },
  { label: 'Sports', value: 200 },
]);

// Mock Recharts components
vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
    Pie: ({ data, innerRadius, outerRadius, animationDuration, children }: any) => (
      <div 
        data-testid="pie"
        data-inner-radius={innerRadius}
        data-outer-radius={outerRadius}
        data-animation-duration={animationDuration}
        data-data-length={data.length}
      >
        {children}
      </div>
    ),
    Cell: ({ fill }: any) => <div data-testid="pie-cell" data-fill={fill} />,
    Tooltip: ({ content }: any) => <div data-testid="tooltip" data-custom-content={!!content} />,
    Legend: () => <div data-testid="legend" />,
  };
});

// Mock shared formatters
vi.mock('@dashboard/shared', () => ({
  formatCurrency: vi.fn((value) => `$${value.toFixed(2)}`),
  formatPercentage: vi.fn((value, decimals) => `${value.toFixed(decimals)}%`),
}));

describe('PieChart', () => {
  const mockData: PieChartResponse = basePieData;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render chart container', () => {
    render(<PieChart data={mockData} />);

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pie')).toBeInTheDocument();
  });

  it('should render all chart elements', () => {
    render(<PieChart data={mockData} />);

    expect(screen.getByTestId('pie')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    expect(screen.getByTestId('legend')).toBeInTheDocument();
  });

  it('should render cells for each data item', () => {
    render(<PieChart data={mockData} />);

    const cells = screen.getAllByTestId('pie-cell');
    expect(cells).toHaveLength(4);
  });

  it('should apply default colors to cells', () => {
    render(<PieChart data={mockData} />);

    const cells = screen.getAllByTestId('pie-cell');
    expect(cells[0]).toHaveAttribute('data-fill', '#8B5CF6'); // First default color
    expect(cells[1]).toHaveAttribute('data-fill', '#06B6D4'); // Second default color
    expect(cells[2]).toHaveAttribute('data-fill', '#10B981'); // Third default color
    expect(cells[3]).toHaveAttribute('data-fill', '#F59E0B'); // Fourth default color
  });

  it('should apply custom colors when provided', () => {
    const customColors = ['#FF0000', '#00FF00', '#0000FF'];

    render(<PieChart data={mockData} colors={customColors} />);

    const cells = screen.getAllByTestId('pie-cell');
    expect(cells[0]).toHaveAttribute('data-fill', '#FF0000');
    expect(cells[1]).toHaveAttribute('data-fill', '#00FF00');
    expect(cells[2]).toHaveAttribute('data-fill', '#0000FF');
    expect(cells[3]).toHaveAttribute('data-fill', '#FF0000'); // Wraps around
  });

  it('should apply custom height', () => {
    render(<PieChart data={mockData} height={400} />);

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  it('should use custom inner and outer radius', () => {
    render(<PieChart data={mockData} innerRadius={50} outerRadius={100} />);

    const pie = screen.getByTestId('pie');
    expect(pie).toHaveAttribute('data-inner-radius', '50');
    expect(pie).toHaveAttribute('data-outer-radius', '100');
  });

  it('should apply animation settings', () => {
    render(<PieChart data={mockData} animate={true} />);

    const pie = screen.getByTestId('pie');
    expect(pie).toHaveAttribute('data-animation-duration', '1000');
  });

  it('should disable animation when animate is false', () => {
    render(<PieChart data={mockData} animate={false} />);

    const pie = screen.getByTestId('pie');
    expect(pie).toHaveAttribute('data-animation-duration', '0');
  });

  it('should apply custom className', () => {
    const { container } = render(<PieChart data={mockData} className="custom-pie-chart" />);

    expect(container.firstChild).toHaveClass('custom-pie-chart');
  });

  it('should forward additional props', () => {
    render(<PieChart data={mockData} data-testid="custom-pie-chart" />);

    expect(screen.getByTestId('custom-pie-chart')).toBeInTheDocument();
  });

  it('should handle empty data gracefully', () => {
    const emptyData = buildPieChartResponse([]);

    render(<PieChart data={emptyData} />);

    const pie = screen.getByTestId('pie');
    expect(pie).toHaveAttribute('data-data-length', '0');
  });

  it('should handle single data point', () => {
    const singleData = buildPieChartResponse([{ label: 'Only Category', value: 1000 }]);

    render(<PieChart data={singleData} />);

    const pie = screen.getByTestId('pie');
    expect(pie).toHaveAttribute('data-data-length', '1');
  });

  it('should use custom tooltip content', () => {
    render(<PieChart data={mockData} />);

    const tooltip = screen.getByTestId('tooltip');
    expect(tooltip).toHaveAttribute('data-custom-content', 'true');
  });
});

describe('DonutChart', () => {
  const mockData = buildPieChartResponse([
    { label: 'Category A', value: 100 },
    { label: 'Category B', value: 200 },
  ]);

  it('should render as PieChart with inner radius', () => {
    render(<DonutChart data={mockData} />);

    const pie = screen.getByTestId('pie');
    expect(pie).toHaveAttribute('data-inner-radius', '60');
  });

  it('should accept and override inner radius', () => {
    render(<DonutChart data={mockData} innerRadius={80} />);

    const pie = screen.getByTestId('pie');
    expect(pie).toHaveAttribute('data-inner-radius', '80');
  });

  it('should pass through other PieChart props', () => {
    render(<DonutChart data={mockData} animate={false} height={500} />);

    const pie = screen.getByTestId('pie');
    expect(pie).toHaveAttribute('data-animation-duration', '0');
  });
});

// Utility function tests
describe('PieChart utility functions', () => {
  describe('renderCustomLabel', () => {
    // Since renderCustomLabel is internal, we test its behavior through the component
    it('should show percentage labels when enabled', () => {
      render(<PieChart data={basePieData} showPercentage={true} />);

      // The label rendering is handled internally by Recharts
      // We can only verify that the pie component is rendered correctly
      expect(screen.getByTestId('pie')).toBeInTheDocument();
    });

    it('should hide percentage labels when disabled', () => {
      render(<PieChart data={basePieData} showPercentage={false} />);

      expect(screen.getByTestId('pie')).toBeInTheDocument();
    });
  });

  describe('data transformation', () => {
    it('should preserve original data structure', () => {
      const dataWithPercentages = buildPieChartResponse([
        { label: 'A', value: 100, percentage: 50 },
        { label: 'B', value: 100, percentage: 50 },
      ]);

      render(<PieChart data={dataWithPercentages} />);

      const pie = screen.getByTestId('pie');
      expect(pie).toHaveAttribute('data-data-length', '2');
    });

    it('should handle data without percentages', () => {
      const dataWithoutPercentages = buildPieChartResponse([
        { label: 'A', value: 100 },
        { label: 'B', value: 200 },
      ]);

      render(<PieChart data={dataWithoutPercentages} />);

      const pie = screen.getByTestId('pie');
      expect(pie).toHaveAttribute('data-data-length', '2');
    });

    it('should handle zero values', () => {
      const dataWithZeros = buildPieChartResponse([
        { label: 'A', value: 0 },
        { label: 'B', value: 100 },
      ]);

      render(<PieChart data={dataWithZeros} />);

      const pie = screen.getByTestId('pie');
      expect(pie).toHaveAttribute('data-data-length', '2');
    });

    it('should handle negative values', () => {
      const dataWithNegatives = buildPieChartResponse([
        { label: 'A', value: -50 },
        { label: 'B', value: 100 },
      ]);

      render(<PieChart data={dataWithNegatives} />);

      const pie = screen.getByTestId('pie');
      expect(pie).toHaveAttribute('data-data-length', '2');
    });
  });
});
