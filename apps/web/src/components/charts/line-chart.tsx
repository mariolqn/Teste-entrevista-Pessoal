/**
 * Line Chart Component using Recharts
 */

import type { ComponentProps } from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

import { formatCurrency } from '@dashboard/shared';
import type { LineChartResponse } from '@dashboard/types';

import { cn } from '@/lib/utils';

interface LineChartProps extends ComponentProps<'div'> {
  data: LineChartResponse;
  height?: number;
  colors?: {
    revenue?: string;
    expense?: string;
    profit?: string;
  };
  animate?: boolean;
}

/**
 * Transform API data to Recharts format
 */
function transformData(data: LineChartResponse) {
  const allPoints = new Map<string, Record<string, number>>();

  // Collect all data points by timestamp
  data.series.forEach((series) => {
    series.points.forEach((point) => {
      const key = String(point.x);
      if (!allPoints.has(key)) {
        allPoints.set(key, { timestamp: key } as Record<string, any>);
      }
      const entry = allPoints.get(key)!;
      entry[series.name] = point.y;
    });
  });

  // Convert to array and sort by timestamp
  return Array.from(allPoints.values()).sort((a, b) => {
    const timeA = new Date(a['timestamp'] ?? 0).getTime();
    const timeB = new Date(b['timestamp'] ?? 0).getTime();
    return timeA - timeB;
  });
}

/**
 * Format tick labels for dates
 */
function formatTick(value: string) {
  try {
    const date = new Date(value);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  } catch {
    return value;
  }
}

/**
 * Custom tooltip component
 */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
      <p className="mb-2 text-sm font-semibold text-slate-700">
        {formatTick(label)}
      </p>
      <div className="space-y-2">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="font-medium text-slate-600">{entry.dataKey}:</span>
            <span className="font-semibold text-slate-900">
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Line Chart Component
 */
export function LineChart({
  data,
  height = 320,
  colors = {
    revenue: '#8B5CF6',
    expense: '#06B6D4',
    profit: '#10B981',
  },
  animate = true,
  className,
  ...props
}: LineChartProps) {
  const chartData = transformData(data);

  const seriesConfig = data.series.map((series) => {
    const key = series.name.toLowerCase();
    const color = colors[key as keyof typeof colors] || '#64748B';
    
    return {
      dataKey: series.name,
      stroke: color,
      strokeWidth: key === 'profit' ? 3 : 2,
      strokeDasharray: key === 'expense' ? '5 5' : undefined,
      dot: { fill: color, strokeWidth: 2, r: 4 },
      activeDot: { r: 6, strokeWidth: 0 },
    };
  });

  return (
    <div className={cn('w-full', className)} {...props}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#E2E8F0" 
            strokeOpacity={0.6}
          />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTick}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94A3B8', fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={(value) => formatCurrency(value)}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94A3B8', fontSize: 12 }}
            width={80}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              paddingTop: '20px',
            }}
            iconType="line"
          />
          {seriesConfig.map((config) => (
            <Line
              key={config.dataKey}
              dataKey={config.dataKey}
              stroke={config.stroke}
              strokeWidth={config.strokeWidth}
              strokeDasharray={config.strokeDasharray}
              dot={config.dot}
              activeDot={config.activeDot}
              animationDuration={animate ? 1000 : 0}
              animationEasing="ease-in-out"
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
