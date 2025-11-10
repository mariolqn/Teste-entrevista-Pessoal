/**
 * Tests for LineChart component
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { LineChart } from '@/components/charts/line-chart';
import type { LineChartResponse } from '@dashboard/types';

const baseLineChartData: LineChartResponse = {
  series: [
    {
      name: 'Revenue',
      points: [
        { x: '2024-01-01', y: 1000 },
        { x: '2024-01-02', y: 1200 },
        { x: '2024-01-03', y: 800 },
      ],
    },
    {
      name: 'Expense',
      points: [
        { x: '2024-01-01', y: 600 },
        { x: '2024-01-02', y: 750 },
        { x: '2024-01-03', y: 500 },
      ],
    },
  ],
};

// Mock Recharts components
vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    LineChart: ({ children, data }: any) => (
      <div data-testid="line-chart" data-chart-data={JSON.stringify(data)}>
        {children}
      </div>
    ),
    Line: ({ dataKey, stroke }: any) => (
      <div data-testid={`line-${dataKey}`} data-stroke={stroke} />
    ),
    XAxis: ({ tickFormatter }: any) => <div data-testid="x-axis" data-tick-formatter={!!tickFormatter} />,
    YAxis: ({ tickFormatter }: any) => <div data-testid="y-axis" data-tick-formatter={!!tickFormatter} />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: ({ content }: any) => <div data-testid="tooltip" data-custom-content={!!content} />,
    Legend: () => <div data-testid="legend" />,
  };
});

// Mock shared formatters
vi.mock('@dashboard/shared', () => ({
  formatCurrency: vi.fn((value) => `$${value.toFixed(2)}`),
}));

describe('LineChart', () => {
  const mockData: LineChartResponse = baseLineChartData;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render chart container', () => {
    render(<LineChart data={baseLineChartData} />);

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('should render all chart elements', () => {
    render(<LineChart data={baseLineChartData} />);

    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    expect(screen.getByTestId('legend')).toBeInTheDocument();
  });

  it('should render line for each series', () => {
    render(<LineChart data={mockData} />);

    expect(screen.getByTestId('line-Revenue')).toBeInTheDocument();
    expect(screen.getByTestId('line-Expense')).toBeInTheDocument();
  });

  it('should apply default colors to series', () => {
    render(<LineChart data={mockData} />);

    const revenueLine = screen.getByTestId('line-Revenue');
    const expenseLine = screen.getByTestId('line-Expense');

    expect(revenueLine).toHaveAttribute('data-stroke', '#8B5CF6'); // Default revenue color
    expect(expenseLine).toHaveAttribute('data-stroke', '#06B6D4'); // Default expense color
  });

  it('should apply custom colors when provided', () => {
    const customColors = {
      revenue: '#FF0000',
      expense: '#00FF00',
    };

    render(<LineChart data={mockData} colors={customColors} />);

    const revenueLine = screen.getByTestId('line-Revenue');
    const expenseLine = screen.getByTestId('line-Expense');

    expect(revenueLine).toHaveAttribute('data-stroke', '#FF0000');
    expect(expenseLine).toHaveAttribute('data-stroke', '#00FF00');
  });

  it('should use fallback color for unknown series', () => {
    const dataWithUnknownSeries: LineChartResponse = {
      series: [
        {
          name: 'UnknownSeries',
          points: [{ x: '2024-01-01', y: 100 }],
        },
      ],
    };

    render(<LineChart data={dataWithUnknownSeries} />);

    const unknownLine = screen.getByTestId('line-UnknownSeries');
    expect(unknownLine).toHaveAttribute('data-stroke', '#64748B'); // Fallback color
  });

  it('should apply custom className', () => {
    const { container } = render(<LineChart data={mockData} className="custom-chart" />);

    expect(container.firstChild).toHaveClass('custom-chart');
  });

  it('should forward additional props', () => {
    render(<LineChart data={mockData} data-testid="custom-line-chart" />);

    expect(screen.getByTestId('custom-line-chart')).toBeInTheDocument();
  });

  it('should transform data correctly for Recharts', () => {
    render(<LineChart data={mockData} />);

    const chartElement = screen.getByTestId('line-chart');
    const chartDataAttr = chartElement.getAttribute('data-chart-data');
    const chartData = JSON.parse(chartDataAttr || '[]');

    expect(chartData).toHaveLength(3); // 3 unique timestamps
    expect(chartData[0]).toHaveProperty('timestamp', '2024-01-01');
    expect(chartData[0]).toHaveProperty('Revenue', 1000);
    expect(chartData[0]).toHaveProperty('Expense', 600);
  });

  it('should handle data with misaligned timestamps', () => {
    const misalignedData: LineChartResponse = {
      series: [
        {
          name: 'Revenue',
          points: [
            { x: '2024-01-01', y: 1000 },
            { x: '2024-01-03', y: 800 },
          ],
        },
        {
          name: 'Expense',
          points: [
            { x: '2024-01-02', y: 750 },
            { x: '2024-01-03', y: 500 },
          ],
        },
      ],
    };

    render(<LineChart data={misalignedData} />);

    const chartElement = screen.getByTestId('line-chart');
    const chartDataAttr = chartElement.getAttribute('data-chart-data');
    const chartData = JSON.parse(chartDataAttr || '[]');

    expect(chartData).toHaveLength(3); // Should create entries for all timestamps
    expect(chartData.map((d: any) => d.timestamp)).toEqual([
      '2024-01-01',
      '2024-01-02',
      '2024-01-03',
    ]);
  });

  it('should handle empty data gracefully', () => {
    const emptyData: LineChartResponse = {
      series: [],
    };

    render(<LineChart data={emptyData} />);

    const chartElement = screen.getByTestId('line-chart');
    const chartDataAttr = chartElement.getAttribute('data-chart-data');
    const chartData = JSON.parse(chartDataAttr || '[]');

    expect(chartData).toEqual([]);
  });

  it('should use custom tooltip content', () => {
    render(<LineChart data={mockData} />);

    const tooltip = screen.getByTestId('tooltip');
    expect(tooltip).toHaveAttribute('data-custom-content', 'true');
  });

  it('should apply tick formatters to axes', () => {
    render(<LineChart data={mockData} />);

    const xAxis = screen.getByTestId('x-axis');
    const yAxis = screen.getByTestId('y-axis');

    expect(xAxis).toHaveAttribute('data-tick-formatter', 'true');
    expect(yAxis).toHaveAttribute('data-tick-formatter', 'true');
  });

  it('should sort data by timestamp', () => {
    const unsortedData: LineChartResponse = {
      series: [
        {
          name: 'Revenue',
          points: [
            { x: '2024-01-03', y: 800 },
            { x: '2024-01-01', y: 1000 },
            { x: '2024-01-02', y: 1200 },
          ],
        },
      ],
    };

    render(<LineChart data={unsortedData} />);

    const chartElement = screen.getByTestId('line-chart');
    const chartDataAttr = chartElement.getAttribute('data-chart-data');
    const chartData = JSON.parse(chartDataAttr || '[]');

    expect(chartData.map((d: any) => d.timestamp)).toEqual([
      '2024-01-01',
      '2024-01-02',
      '2024-01-03',
    ]);
  });
});

// Utility function tests
describe('LineChart utility functions', () => {
  describe('formatTick', () => {
    // We can't directly test the formatTick function since it's internal,
    // but we can test the behavior through the component
    it('should format date ticks correctly', () => {
      render(<LineChart data={baseLineChartData} />);

      // The formatting is handled internally and passed to XAxis
      const xAxis = screen.getByTestId('x-axis');
      expect(xAxis).toHaveAttribute('data-tick-formatter', 'true');
    });
  });

  describe('transformData', () => {
    it('should handle single series', () => {
      const singleSeriesData: LineChartResponse = {
        series: [
          {
            name: 'Revenue',
            points: [
              { x: '2024-01-01', y: 1000 },
              { x: '2024-01-02', y: 1200 },
            ],
          },
        ],
      };

      render(<LineChart data={singleSeriesData} />);

      const chartElement = screen.getByTestId('line-chart');
      const chartDataAttr = chartElement.getAttribute('data-chart-data');
      const chartData = JSON.parse(chartDataAttr || '[]');

      expect(chartData).toHaveLength(2);
      expect(chartData[0]).toEqual({
        timestamp: '2024-01-01',
        Revenue: 1000,
      });
    });

    it('should handle duplicate timestamps within series', () => {
      const duplicateData: LineChartResponse = {
        series: [
          {
            name: 'Revenue',
            points: [
              { x: '2024-01-01', y: 1000 },
              { x: '2024-01-01', y: 1500 }, // Duplicate timestamp
            ],
          },
        ],
      };

      render(<LineChart data={duplicateData} />);

      const chartElement = screen.getByTestId('line-chart');
      const chartDataAttr = chartElement.getAttribute('data-chart-data');
      const chartData = JSON.parse(chartDataAttr || '[]');

      expect(chartData).toHaveLength(1);
      // Should use the last value for duplicate timestamps
      expect(chartData[0].Revenue).toBe(1500);
    });
  });
});
