"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

export function ProgressLineChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center border border-dashed border-white/10 rounded-2xl bg-[#0B0F19]/50">
        <p className="text-gray-500 font-medium">Complete more tests to see your progress graph!</p>
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#6b7280', fontSize: 12 }} 
            axisLine={false} 
            tickLine={false} 
            dy={10}
            tickFormatter={(value) => value.length > 15 ? value.substring(0, 15) + '...' : value}
          />
          <YAxis 
            tick={{ fill: '#6b7280', fontSize: 12 }} 
            axisLine={false} 
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#111624', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
            itemStyle={{ color: '#fff' }}
          />
          <Line 
            type="monotone" 
            dataKey="score" 
            name="Score"
            stroke="#10b981" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#111624', stroke: '#10b981', strokeWidth: 2 }} 
            activeDot={{ r: 6, fill: '#10b981', stroke: '#fff' }}
          />
          <Line 
            type="monotone" 
            dataKey="accuracy" 
            name="Accuracy %"
            stroke="#a855f7" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#111624', stroke: '#a855f7', strokeWidth: 2 }} 
            activeDot={{ r: 6, fill: '#a855f7', stroke: '#fff' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
