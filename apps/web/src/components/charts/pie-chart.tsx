/**
 * Pie Chart Component using Recharts
 */

import type { ComponentProps } from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

import { formatCurrency, formatPercentage } from '@dashboard/shared';
import type { PieChartResponse } from '@dashboard/types';

import { cn } from '@/lib/utils';

interface PieChartProps extends ComponentProps<'div'> {
  data: PieChartResponse;
  height?: number;
  colors?: string[];
  animate?: boolean;
  showPercentage?: boolean;
  innerRadius?: number;
  outerRadius?: number;
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
  '#F97316', // Orange
  '#8B5CF6', // Purple (repeat)
];

/**
 * Custom tooltip component
 */
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
      <p className="mb-2 text-sm font-semibold text-slate-700">
        {data.label}
      </p>
      <div className="flex items-center gap-3">
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: payload[0].color }}
        />
        <div className="flex flex-col">
          <span className="text-base font-semibold text-slate-900">
            {formatCurrency(data.value)}
          </span>
          {data.percentage && (
            <span className="text-sm text-slate-500">
              {formatPercentage(data.percentage, 1)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Custom label component
 */
function renderCustomLabel(entry: any, showPercentage: boolean) {
  if (!showPercentage || !entry.percentage || entry.percentage < 5) {
    return '';
  }
  return `${entry.percentage.toFixed(1)}%`;
}

/**
 * Pie Chart Component
 */
export function PieChart({
  data,
  height = 320,
  colors = DEFAULT_COLORS,
  animate = true,
  showPercentage = true,
  innerRadius = 0,
  outerRadius = undefined,
  className,
  ...props
}: PieChartProps) {
  const chartData = data.series.map((item, index) => ({
    ...item,
    fill: colors[index % colors.length],
  }));

  return (
    <div className={cn('w-full', className)} {...props}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={showPercentage ? (entry) => renderCustomLabel(entry, showPercentage) : false}
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            fill="#8884d8"
            dataKey="value"
            animationDuration={animate ? 1000 : 0}
            animationEasing="ease-out"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              paddingTop: '20px',
            }}
            iconType="circle"
          />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Donut Chart Component (Pie with inner radius)
 */
export function DonutChart(props: PieChartProps) {
  return <PieChart {...props} innerRadius={60} />;
}
