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
import { Activity, Battery } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0b1120]/90 backdrop-blur-xl border border-indigo-500/30 p-4 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] min-w-[200px]">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-indigo-500/20 pb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between py-1.5">
            <span className="flex items-center gap-2 text-sm font-bold text-slate-200">
              {entry.name === 'Altitude' ? <Activity size={14} className="text-indigo-400" /> : <Battery size={14} className="text-emerald-400" />}
              {entry.name}
            </span>
            <span className="font-mono font-black" style={{ color: entry.color }}>
              {entry.value} {entry.name === 'Altitude' ? 'm' : '%'}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

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
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorAltitude" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorBattery" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.5} />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} 
            axisLine={{ stroke: '#1e293b' }}
            tickLine={false}
            tickMargin={10}
          />
          <YAxis 
            yAxisId="left" 
            tick={{ fontSize: 10, fill: '#6366f1', fontWeight: 600 }}
            axisLine={{ stroke: '#1e293b' }}
            tickLine={false}
            tickMargin={10}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            tick={{ fontSize: 10, fill: '#10b981', fontWeight: 600 }}
            axisLine={{ stroke: '#1e293b' }}
            tickLine={false}
            tickMargin={10}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(99,102,241,0.2)', strokeWidth: 2 }} />
          <Legend wrapperStyle={{ paddingTop: '15px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8' }} />
          <Area 
            yAxisId="left"
            type="monotone" 
            dataKey="Altitude" 
            stroke="#6366f1"
            fillOpacity={1}
            fill="url(#colorAltitude)"
            strokeWidth={3} 
            activeDot={{ r: 6, fill: '#6366f1', strokeWidth: 0, shadow: '0 0 10px rgba(99,102,241,0.8)' }} 
          />
          <Area 
            yAxisId="right"
            type="monotone" 
            dataKey="Battery" 
            stroke="#10b981"
            fillOpacity={1}
            fill="url(#colorBattery)"
            strokeWidth={3} 
            activeDot={{ r: 6, fill: '#10b981', strokeWidth: 0, shadow: '0 0 10px rgba(16,185,129,0.8)' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
