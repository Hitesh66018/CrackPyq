"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

export function TopicRadarChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) return <div className="text-gray-500 text-center py-10">No topic data available</div>;

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} />
          <Radar name="Accuracy %" dataKey="accuracy" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
          <Radar name="Score %" dataKey="scorePct" stroke="#a855f7" fill="#a855f7" fillOpacity={0.4} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#111624', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
            itemStyle={{ color: '#fff' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
