
import React from 'react';
import type { Metric } from '../types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Label,
} from 'recharts';
import { InfoIcon } from './icons/InfoIcon';

interface MetricCardProps {
  metric: Metric;
  onZoom: () => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    // Format value with 2 decimal places unless it's a large integer
    const formattedValue = Math.abs(value) > 100 ? Math.round(value).toLocaleString() : value.toFixed(2);
    return (
      <div className="bg-[#121316]/80 backdrop-blur-sm border border-white/10 rounded-lg p-2 px-3 shadow-xl">
        <p className="text-xs text-white/60">{`Dia ${label.replace('D-', '')}`}</p>
        <p className="text-sm font-bold text-sky-400">{`Valor: ${formattedValue}`}</p>
      </div>
    );
  }
  return null;
};

const ChartContextLayers: React.FC<{ metricName: string }> = ({ metricName }) => {
  switch (metricName) {
    case 'Fear & Greed Index':
      return (
        <>
          <ReferenceArea y1={0} y2={25} fill="rgba(239, 68, 68, 0.1)" stroke="rgba(239, 68, 68, 0.2)" strokeDasharray="3 3" ifOverflow="extendDomain" />
          <ReferenceArea y1={25} y2={45} fill="rgba(249, 115, 22, 0.1)" stroke="rgba(249, 115, 22, 0.2)" strokeDasharray="3 3" ifOverflow="extendDomain" />
          <ReferenceArea y1={55} y2={75} fill="rgba(74, 222, 128, 0.05)" stroke="rgba(74, 222, 128, 0.2)" strokeDasharray="3 3" ifOverflow="extendDomain" />
          <ReferenceArea y1={75} y2={100} fill="rgba(34, 197, 94, 0.1)" stroke="rgba(34, 197, 94, 0.2)" strokeDasharray="3 3" ifOverflow="extendDomain" />
        </>
      );
    case 'Mayer Multiple':
      return (
        <>
          <ReferenceLine y={2.4} stroke="#ef4444" strokeDasharray="4 4" ifOverflow="extendDomain">
             <Label value="Overbought (>2.4)" position="insideTopRight" fill="#ef4444" fontSize={10} offset={10} />
          </ReferenceLine>
           <ReferenceLine y={1.0} stroke="rgba(255,255,255,0.4)" strokeDasharray="4 4" ifOverflow="extendDomain">
             <Label value="Fair Value (~1.0)" position="insideRight" fill="rgba(255,255,255,0.6)" fontSize={10} offset={10} />
          </ReferenceLine>
        </>
      );
    case 'Puell Multiple':
       return (
        <>
          <ReferenceLine y={4.0} stroke="#ef4444" strokeDasharray="4 4" ifOverflow="extendDomain">
            <Label value="Topo (>4)" position="insideTopRight" fill="#ef4444" fontSize={10} offset={10} />
          </ReferenceLine>
          <ReferenceLine y={0.5} stroke="#22c55e" strokeDasharray="4 4" ifOverflow="extendDomain">
            <Label value="Fundo (<0.5)" position="insideBottomRight" fill="#22c55e" fontSize={10} offset={10}/>
          </ReferenceLine>
        </>
      );
    default:
      return null;
  }
};

export const MetricCard: React.FC<MetricCardProps> = ({ metric, onZoom }) => {
  const hasChartData = metric.historicalData && metric.historicalData.length > 0;
  
  const formatYAxis = (tickItem: number) => {
    if (metric.name === 'Hash Rate') {
        return `${tickItem.toFixed(0)}`;
    }
    if (metric.name === 'Transações Diárias') {
        return tickItem >= 1000 ? `${(tickItem / 1000).toFixed(0)}k` : `${tickItem}`;
    }
    return parseFloat(tickItem.toFixed(2)).toString();
  };

  return (
    <div 
      className="bg-[#1e1f22] p-6 rounded-3xl shadow-lg border border-white/10 flex flex-col justify-between transition-all duration-300 hover:border-blue-500/50 hover:shadow-blue-500/10 cursor-pointer transform hover:scale-[1.02]"
      onClick={onZoom}
    >
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
          <div className="h-28 -mr-4 -mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={metric.historicalData}
                margin={{ top: 10, right: 5, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" hide={true} />
                <YAxis
                  orientation="right"
                  domain={['dataMin - (dataMax-dataMin)*0.1', 'dataMax + (dataMax-dataMin)*0.1']}
                  tickFormatter={formatYAxis}
                  stroke="rgba(255, 255, 255, 0.4)"
                  fontSize={11}
                  axisLine={false}
                  tickLine={false}
                  width={45}
                  tick={{ dx: 5 }}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <ChartContextLayers metricName={metric.name} />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#38bdf8" 
                  strokeWidth={2.5} 
                  fill="url(#chartGradient)"
                  dot={false} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};