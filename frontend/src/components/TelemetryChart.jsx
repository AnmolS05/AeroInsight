/**
 * @file TelemetryChart.jsx
 * @description Apple-inspired minimalist time-series telemetry chart displaying altitude and battery profiles.
 */

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { ArrowUpRight, BatteryCharging } from 'lucide-react';

/**
 * Custom tooltip component rendered on chart hover with Apple-grade typography and frosted surface.
 *
 * @param {Object} props - Tooltip component properties.
 * @param {boolean} props.active - Whether the tooltip is currently active.
 * @param {Array<Object>} props.payload - Array of hovered data point entries.
 * @param {string} props.label - Hovered timestamp string.
 * @returns {React.ReactElement|null} Tooltip UI or null if inactive.
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#18181b]/95 backdrop-blur-md border border-white/[0.12] p-3 rounded-xl shadow-xl min-w-[170px] text-xs">
        <p className="text-[11px] font-medium text-neutral-400 mb-2 border-b border-white/[0.08] pb-1.5">
          {label}
        </p>
        <div className="flex flex-col gap-1.5">
          {payload.map((entry, index) => {
            const isAlt = entry.name === 'Altitude';
            return (
              <div key={index} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-neutral-300">
                  {isAlt ? (
                    <span className="w-2 h-2 rounded-full bg-[#2997ff]" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-[#30d158]" />
                  )}
                  {entry.name}
                </span>
                <span className="font-semibold text-white">
                  {entry.value} {isAlt ? 'm' : '%'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

/**
 * Main telemetry time-series chart component.
 *
 * @param {Object} props - Component properties.
 * @param {Array<Object>} props.data - Raw telemetry records array.
 * @returns {React.ReactElement|null} The rendered chart or null if data is absent.
 */
export default function TelemetryChart({ data }) {
  if (!data || data.length === 0) return null;

  // Format data for chart display
  const chartData = data.map(d => ({
    time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    Altitude: d.altitude,
    Battery: d.battery
  }));

  return (
    <div className="w-full h-full min-h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="appleAltGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2997ff" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#2997ff" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="appleBatteryGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#30d158" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#30d158" stopOpacity={0.0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="rgba(255, 255, 255, 0.05)"
          />

          <XAxis
            dataKey="time"
            tick={{ fontSize: 11, fill: '#86868b' }}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
            tickLine={false}
            tickMargin={8}
          />

          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11, fill: '#2997ff' }}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
          />

          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11, fill: '#30d158' }}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            wrapperStyle={{
              paddingTop: '8px',
              fontSize: '11px',
              fontWeight: 500,
              color: '#86868b'
            }}
          />

          <Area
            yAxisId="left"
            type="monotone"
            dataKey="Altitude"
            stroke="#2997ff"
            strokeWidth={2}
            fill="url(#appleAltGradient)"
            activeDot={{ r: 4, fill: '#2997ff', stroke: '#ffffff', strokeWidth: 1.5 }}
            isAnimationActive={true}
            animationDuration={800}
          />

          <Area
            yAxisId="right"
            type="monotone"
            dataKey="Battery"
            stroke="#30d158"
            strokeWidth={2}
            fill="url(#appleBatteryGradient)"
            activeDot={{ r: 4, fill: '#30d158', stroke: '#ffffff', strokeWidth: 1.5 }}
            isAnimationActive={true}
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
