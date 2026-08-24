import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function TelemetryChart({ data }) {
  if (!data || data.length === 0) return null;

  // Format data for chart
  const chartData = data.map(d => ({
    time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    Altitude: d.altitude,
    Battery: d.battery
  }));

  return (
    <div className="w-full h-full min-h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 12, fill: '#64748b' }} 
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            yAxisId="left" 
            tick={{ fontSize: 12, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            tick={{ fontSize: 12, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend wrapperStyle={{ paddingTop: '10px' }} />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="Altitude" 
            stroke="#3b82f6" 
            strokeWidth={3} 
            dot={false}
            activeDot={{ r: 6 }} 
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="Battery" 
            stroke="#10b981" 
            strokeWidth={3} 
            dot={false} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
