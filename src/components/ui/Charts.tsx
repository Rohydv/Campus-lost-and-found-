import React from 'react';
import { cn } from '../../lib/utils';

export interface ChartDataItem {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: ChartDataItem[];
  title?: string;
  subtitle?: string;
  className?: string;
}

export function DonutChart({ data, title, subtitle, className }: DonutChartProps) {
  const total = data.reduce((acc, item) => acc + item.value, 0);
  const radius = 36;
  const circumference = 2 * Math.PI * radius; // ~226.19
  
  let accumulatedPercent = 0;

  return (
    <div className={cn("flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm", className)}>
      {(title || subtitle) && (
        <div className="text-center mb-4">
          {title && <h3 className="text-sm font-semibold text-slate-800">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      )}

      <div className="relative w-44 h-44 flex items-center justify-center">
        {total === 0 ? (
          // Empty state placeholder donut
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth="12"
            />
          </svg>
        ) : (
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {data.map((item, index) => {
              if (item.value === 0) return null;
              const percent = (item.value / total) * 100;
              const strokeLength = (percent / 100) * circumference;
              const strokeOffset = - (accumulatedPercent / 100) * circumference;
              accumulatedPercent += percent;

              return (
                <circle
                  key={item.name}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth="12"
                  strokeDasharray={`${strokeLength} ${circumference}`}
                  strokeDashoffset={strokeOffset}
                  className="transition-all duration-500 ease-out hover:stroke-[14px] cursor-pointer"
                >
                  <title>{`${item.name}: ${item.value} (${percent.toFixed(1)}%)`}</title>
                </circle>
              );
            })}
          </svg>
        )}
        
        {/* Central Label */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold text-slate-800">{total}</span>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Total</span>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-5 w-full text-xs">
        {data.map((item) => {
          const percent = total === 0 ? 0 : (item.value / total) * 100;
          return (
            <div key={item.name} className="flex items-center gap-2 text-slate-600 truncate">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate">{item.name}</span>
              <span className="ml-auto font-medium text-slate-900">{item.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface BarChartProps {
  data: ChartDataItem[];
  title?: string;
  subtitle?: string;
  className?: string;
  height?: number;
}

export function BarChart({ data, title, subtitle, className, height = 200 }: BarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const total = data.reduce((acc, item) => acc + item.value, 0);

  return (
    <div className={cn("bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col", className)}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-sm font-semibold text-slate-800">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      )}

      {/* Grid and Bars */}
      <div 
        className="relative flex items-end justify-around w-full gap-2 px-2 border-b border-slate-100"
        style={{ height: `${height}px` }}
      >
        {/* Horizontal gridlines */}
        <div className="absolute inset-x-0 top-0 h-full flex flex-col justify-between pointer-events-none">
          <div className="border-t border-dashed border-slate-100 w-full" />
          <div className="border-t border-dashed border-slate-100 w-full" />
          <div className="border-t border-dashed border-slate-100 w-full" />
          <div className="w-full" /> {/* Bottom border handled by container */}
        </div>

        {total === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
            No data available
          </div>
        ) : (
          data.map((item) => {
            const percentage = (item.value / maxValue) * 100;
            return (
              <div key={item.name} className="relative flex flex-col items-center flex-1 group max-w-[60px]">
                {/* Tooltip on hover */}
                <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-all duration-200 bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-lg pointer-events-none z-10 whitespace-nowrap">
                  {item.name}: {item.value} ({total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%)
                </div>
                
                {/* Bar */}
                <div
                  className="w-full rounded-t-lg transition-all duration-500 ease-out hover:opacity-85"
                  style={{
                    height: `${Math.max(percentage, 4)}%`,
                    backgroundColor: item.color,
                    boxShadow: `0 4px 12px ${item.color}20`
                  }}
                />
              </div>
            );
          })
        )}
      </div>

      {/* Labels */}
      {total > 0 && (
        <div className="flex justify-around mt-3 w-full text-xs text-slate-500 text-center">
          {data.map((item) => (
            <div key={item.name} className="flex-1 truncate px-1 max-w-[60px]" title={item.name}>
              <p className="font-semibold text-slate-700">{item.value}</p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface HorizontalBarListProps {
  data: {
    name: string;
    value: number;
    color: string;
    icon?: React.ReactNode;
  }[];
  title?: string;
  subtitle?: string;
  className?: string;
}

export function HorizontalBarList({ data, title, subtitle, className }: HorizontalBarListProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const total = data.reduce((acc, item) => acc + item.value, 0);

  return (
    <div className={cn("bg-white p-5 rounded-2xl border border-slate-100 shadow-sm", className)}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-sm font-semibold text-slate-800">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      )}

      <div className="space-y-3.5">
        {total === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            No data available
          </div>
        ) : (
          data.map((item) => {
            const percentage = (item.value / maxValue) * 100;
            const itemPercentOfTotal = total > 0 ? (item.value / total) * 100 : 0;

            return (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700 font-medium truncate">
                    {item.icon}
                    <span className="truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <span className="font-bold text-slate-800">{item.value}</span>
                    <span className="text-slate-400 text-[10px]">({itemPercentOfTotal.toFixed(0)}%)</span>
                  </div>
                </div>

                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
