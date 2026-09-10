/**
 * @file TelemetryChart.jsx
 * @description Apple-inspired minimalist time-series telemetry chart displaying altitude and battery profiles
 * with integrated anomaly incident reference lines and avionics telemetry tooltips.
 */

import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { ArrowUpRight, BatteryCharging, AlertTriangle } from 'lucide-react';

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
    const rawPoint = payload[0]?.payload;
    const hasAnomaly = rawPoint?.issue && rawPoint.issue.toLowerCase() !== 'none' && rawPoint.issue.trim() !== '';

    return (
      <div className="bg-[#141418]/95 backdrop-blur-xl border border-white/[0.12] p-3 rounded-xl shadow-2xl min-w-[180px] text-xs space-y-2">
        <p className="text-[11px] font-medium text-neutral-400 border-b border-white/[0.08] pb-1 font-mono">
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
                <span className="font-semibold text-white font-mono">
                  {entry.value} {isAlt ? 'm' : '%'}
                </span>
              </div>
            );
          })}
        </div>

        {hasAnomaly && (
          <div className="flex items-center gap-1.5 pt-1.5 border-t border-red-500/20 text-red-300 text-[10px] font-medium">
            <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
            <span className="truncate">Alert: {rawPoint.issue}</span>
          </div>
        )}
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
 * @param {Function} [props.onSelectPoint] - Callback invoked when a chart node is clicked.
 * @returns {React.ReactElement|null} The rendered chart or null if data is absent.
 */
export default function TelemetryChart({ data, onSelectPoint }) {
  if (!data || data.length === 0) return null;

  // Format data for chart display
  const chartData = useMemo(() => {
    return data.map((d) => ({
      time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      Altitude: d.altitude,
      Battery: d.battery,
      issue: d.issue,
      raw: d
    }));
  }, [data]);

  // Extract timestamps with active anomalies for reference lines
  const anomalyTimes = useMemo(() => {
    return chartData
      .filter((d) => d.issue && d.issue.toLowerCase() !== 'none' && d.issue.trim() !== '')
      .map((d) => d.time);
  }, [chartData]);

  return (
    <div className="w-full h-full min-h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart 
          data={chartData} 
          margin={{ top: 8, right: 10, left: -20, bottom: 0 }}
          onClick={(e) => {
            if (e && e.activePayload && e.activePayload.length && onSelectPoint) {
              onSelectPoint(e.activePayload[0].payload.raw);
            }
          }}
        >
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

          {/* Anomaly reference lines */}
          {anomalyTimes.slice(0, 8).map((timeStr, idx) => (
            <ReferenceLine
              key={idx}
              yAxisId="left"
              x={timeStr}
              stroke="#ff453a"
              strokeDasharray="3 3"
              strokeWidth={1}
            />
          ))}

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
