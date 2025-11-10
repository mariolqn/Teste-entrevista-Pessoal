/**
 * Bar Chart Component using Recharts
 */

import type { ComponentProps } from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

import { formatCurrency } from '@dashboard/shared';
import type { BarChartResponse } from '@dashboard/types';

import { cn } from '@/lib/utils';

interface BarChartProps extends ComponentProps<'div'> {
  data: BarChartResponse;
  height?: number;
  colors?: string[];
  animate?: boolean;
  layout?: 'horizontal' | 'vertical';
  stacked?: boolean;
}

/**
 * Default color palette
 */
const DEFAULT_COLORS = [
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#6366F1', // Indigo
  '#EC4899', // Pink
  '#84CC16', // Lime
];

/**
 * Transform API data to Recharts format
 */
function transformData(data: BarChartResponse) {
  return data.categories.map((category, index) => {
    const entry: Record<string, any> = { category };
    
    data.series.forEach((series) => {
      entry[series.name] = series.data[index] || 0;
    });
    
    return entry;
  });
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
        {label}
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
 * Bar Chart Component
 */
export function BarChart({
  data,
  height = 320,
  colors = DEFAULT_COLORS,
  animate = true,
  layout = 'vertical',
  stacked = false,
  className,
  ...props
}: BarChartProps) {
  const chartData = transformData(data);

  if (layout === 'horizontal') {
    return (
      <div className={cn('w-full', className)} {...props}>
        <ResponsiveContainer width="100%" height={height}>
          <RechartsBarChart
            layout="horizontal"
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#E2E8F0" 
              strokeOpacity={0.6}
            />
            <XAxis 
              type="number"
              tickFormatter={(value) => formatCurrency(value)}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 12 }}
            />
            <YAxis 
              type="category"
              dataKey="category"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 12 }}
              width={120}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                paddingTop: '20px',
              }}
            />
            {data.series.map((series, index) => (
              <Bar
                key={series.name}
                dataKey={series.name}
                fill={colors[index % colors.length]}
                radius={[0, 4, 4, 0]}
                animationDuration={animate ? 1000 : 0}
                animationEasing="ease-out"
                {...(stacked && { stackId: 'stack' })}
              />
            ))}
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)} {...props}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#E2E8F0" 
            strokeOpacity={0.6}
          />
          <XAxis
            dataKey="category"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94A3B8', fontSize: 12 }}
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
          />
          {data.series.map((series, index) => (
            <Bar
              key={series.name}
              dataKey={series.name}
              fill={colors[index % colors.length]}
              radius={[4, 4, 0, 0]}
              animationDuration={animate ? 1000 : 0}
              animationEasing="ease-out"
              {...(stacked && { stackId: 'stack' })}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
