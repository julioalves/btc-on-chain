import React from 'react';
import type { Metric } from '../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { InfoIcon } from './icons/InfoIcon';

interface MetricCardProps {
  metric: Metric;
}

export const MetricCard: React.FC<MetricCardProps> = ({ metric }) => {
  const hasChartData = metric.historicalData && metric.historicalData.length > 0;

  return (
    <div className="bg-[#1e1f22] p-6 rounded-3xl shadow-lg border border-white/10 flex flex-col justify-between transition-all duration-300 hover:border-blue-500/50 hover:shadow-blue-500/10">
      <div className="flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-md font-medium text-white/60">{metric.name}</h3>
          <div className="relative group flex-shrink-0">
            <InfoIcon className="w-5 h-5 text-white/40 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-[#121316] text-white/90 text-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 border border-white/10">
              {metric.tooltip}
            </div>
          </div>
        </div>
        <p className="text-4xl font-bold text-white tracking-tight">{metric.value}</p>
        <p className="text-sm text-white/50 mt-1">{metric.description}</p>
      </div>
      {hasChartData && (
        <div className="mt-6">
          <p className="text-xs font-medium text-white/40 mb-2">Tendência (30 dias)</p>
          <div className="h-24 -ml-6 -mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metric.historicalData}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <RechartsTooltip
                  cursor={{ stroke: 'rgba(255, 255, 255, 0.1)', strokeWidth: 1 }}
                  contentStyle={{ 
                    backgroundColor: 'rgba(18, 19, 22, 0.8)',
                    backdropFilter: 'blur(4px)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.75rem',
                    color: '#FFF'
                  }}
                  labelStyle={{ color: '#94a3b8' }}
                  itemStyle={{ color: '#38bdf8', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="value" stroke="#38bdf8" strokeWidth={2.5} dot={false} />
                <XAxis dataKey="name" hide={true} />
                <YAxis domain={['dataMin - (dataMax-dataMin)*0.1', 'dataMax + (dataMax-dataMin)*0.1']} hide={true} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};