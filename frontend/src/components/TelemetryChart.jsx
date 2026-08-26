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
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
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
            contentStyle={{ backgroundColor: '#0a0f1c', borderRadius: '1rem', border: '1px solid rgba(99,102,241,0.2)', boxShadow: '0 0 20px rgba(99,102,241,0.2)', color: '#fff' }}
            itemStyle={{ color: '#fff', fontWeight: 900, fontFamily: 'monospace' }}
          />
          <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }} />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="Altitude" 
            stroke="#6366f1" 
            strokeWidth={4} 
            dot={false}
            activeDot={{ r: 6, fill: '#6366f1', strokeWidth: 0, shadow: '0 0 10px rgba(99,102,241,0.8)' }} 
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="Battery" 
            stroke="#10b981" 
            strokeWidth={4} 
            dot={false} 
            activeDot={{ r: 6, fill: '#10b981', strokeWidth: 0, shadow: '0 0 10px rgba(16,185,129,0.8)' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
