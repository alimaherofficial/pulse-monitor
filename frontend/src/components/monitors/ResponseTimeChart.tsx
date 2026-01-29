'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { CheckResult } from '@/types';
import { format } from 'date-fns';

interface ResponseTimeChartProps {
  checks: CheckResult[];
}

export function ResponseTimeChart({ checks }: ResponseTimeChartProps) {
  const data = useMemo(() => {
    return checks
      .filter(check => check.status === 'UP' && check.responseTime)
      .slice(0, 50)
      .reverse()
      .map(check => ({
        time: format(new Date(check.checkedAt), 'HH:mm'),
        responseTime: check.responseTime,
      }));
  }, [checks]);

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No response time data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="time" 
          stroke="#6b7280"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke="#6b7280"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}ms`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '12px',
          }}
          formatter={(value: number) => [`${value}ms`, 'Response Time']}
        />
        <Line
          type="monotone"
          dataKey="responseTime"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#3b82f6' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
