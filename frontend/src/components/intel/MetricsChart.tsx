/**
 * MetricsChart
 * Simple SVG sparkline for showing metric trends
 */

import { useMemo } from 'react';
import { TrendUp, TrendDown, Minus } from '@phosphor-icons/react';

interface DataPoint {
  value: number;
  date?: string;
}

interface MetricsChartProps {
  data: DataPoint[];
  height?: number;
  width?: number;
  color?: 'cyan' | 'emerald' | 'gold' | 'rose' | 'auto';
  showTrend?: boolean;
  label?: string;
  formatValue?: (value: number) => string;
}

export default function MetricsChart({
  data,
  height = 40,
  width = 120,
  color = 'auto',
  showTrend = true,
  label,
  formatValue = (v) => v.toLocaleString(),
}: MetricsChartProps) {
  const { path, trend, trendPercent, minValue, maxValue, currentValue } = useMemo(() => {
    if (!data || data.length === 0) {
      return { path: '', trend: 0, trendPercent: 0, minValue: 0, maxValue: 0, currentValue: 0 };
    }

    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1; // Avoid division by zero

    // Calculate path points
    const padding = 4;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = values.map((value, i) => {
      const x = padding + (i / (values.length - 1 || 1)) * chartWidth;
      const y = padding + chartHeight - ((value - min) / range) * chartHeight;
      return { x, y };
    });

    // Create smooth path
    let pathD = '';
    if (points.length > 0) {
      pathD = `M ${points[0].x},${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const cpX = (prev.x + curr.x) / 2;
        pathD += ` Q ${cpX},${prev.y} ${curr.x},${curr.y}`;
      }
    }

    // Calculate trend
    const firstValue = values[0] || 0;
    const lastValue = values[values.length - 1] || 0;
    const trendValue = lastValue - firstValue;
    const trendPercentValue = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

    return {
      path: pathD,
      trend: trendValue,
      trendPercent: trendPercentValue,
      minValue: min,
      maxValue: max,
      currentValue: lastValue,
    };
  }, [data, width, height]);

  // Determine color based on trend or explicit color
  const chartColor = useMemo(() => {
    if (color !== 'auto') {
      const colors = {
        cyan: { stroke: '#06B6D4', fill: '#06B6D4' },
        emerald: { stroke: '#10B981', fill: '#10B981' },
        gold: { stroke: '#F59E0B', fill: '#F59E0B' },
        rose: { stroke: '#F43F5E', fill: '#F43F5E' },
      };
      return colors[color];
    }

    // Auto color based on trend
    if (trend > 0) return { stroke: '#10B981', fill: '#10B981' }; // emerald
    if (trend < 0) return { stroke: '#F43F5E', fill: '#F43F5E' }; // rose
    return { stroke: '#6B7280', fill: '#6B7280' }; // gray
  }, [color, trend]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-xs text-gray-500" style={{ height, width }}>
        No data
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {label && (
        <div className="text-[10px] text-gray-500 mb-1">{label}</div>
      )}

      <div className="flex items-center gap-2">
        {/* Sparkline */}
        <svg width={width} height={height} className="overflow-visible">
          {/* Gradient fill */}
          <defs>
            <linearGradient id={`gradient-${label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColor.fill} stopOpacity="0.3" />
              <stop offset="100%" stopColor={chartColor.fill} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Area fill */}
          {path && (
            <path
              d={`${path} L ${width - 4},${height - 4} L 4,${height - 4} Z`}
              fill={`url(#gradient-${label})`}
            />
          )}

          {/* Line */}
          <path
            d={path}
            fill="none"
            stroke={chartColor.stroke}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Current value dot */}
          {data.length > 0 && (
            <circle
              cx={width - 4}
              cy={4 + (height - 8) - ((currentValue - minValue) / (maxValue - minValue || 1)) * (height - 8)}
              r="3"
              fill={chartColor.fill}
            />
          )}
        </svg>

        {/* Trend indicator */}
        {showTrend && (
          <div className="flex flex-col items-end min-w-[50px]">
            <div className="text-sm font-medium text-white">
              {formatValue(currentValue)}
            </div>
            <div className={`flex items-center gap-0.5 text-[10px] ${
              trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-rose-400' : 'text-gray-500'
            }`}>
              {trend > 0 ? (
                <TrendUp size={10} weight="bold" />
              ) : trend < 0 ? (
                <TrendDown size={10} weight="bold" />
              ) : (
                <Minus size={10} />
              )}
              {Math.abs(trendPercent).toFixed(1)}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Mini sparkline variant - just the line, no extras
 */
export function MiniSparkline({
  data,
  height = 24,
  width = 60,
  color = 'auto',
}: {
  data: number[];
  height?: number;
  width?: number;
  color?: 'cyan' | 'emerald' | 'gold' | 'rose' | 'auto';
}) {
  const { path, trend } = useMemo(() => {
    if (!data || data.length === 0) {
      return { path: '', trend: 0 };
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const padding = 2;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = data.map((value, i) => {
      const x = padding + (i / (data.length - 1 || 1)) * chartWidth;
      const y = padding + chartHeight - ((value - min) / range) * chartHeight;
      return { x, y };
    });

    let pathD = '';
    if (points.length > 0) {
      pathD = `M ${points[0].x},${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        pathD += ` L ${points[i].x},${points[i].y}`;
      }
    }

    return {
      path: pathD,
      trend: data[data.length - 1] - data[0],
    };
  }, [data, width, height]);

  const strokeColor = useMemo(() => {
    if (color !== 'auto') {
      const colors = {
        cyan: '#06B6D4',
        emerald: '#10B981',
        gold: '#F59E0B',
        rose: '#F43F5E',
      };
      return colors[color];
    }
    if (trend > 0) return '#10B981';
    if (trend < 0) return '#F43F5E';
    return '#6B7280';
  }, [color, trend]);

  if (!data || data.length === 0) return null;

  return (
    <svg width={width} height={height}>
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
