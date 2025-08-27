import React, { useEffect } from 'react';
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
  CartesianGrid,
} from 'recharts';
import { CloseIcon } from './icons/CloseIcon';

interface MetricChartModalProps {
  metric: Metric;
  onClose: () => void;
}

// Re-using chart components from MetricCard for consistency
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const formattedValue = Math.abs(value) > 100 ? Math.round(value).toLocaleString() : value.toFixed(2);
    return (
      <div className="bg-[#121316]/80 backdrop-blur-sm border border-white/10 rounded-lg p-2 px-3 shadow-xl">
        <p className="text-sm text-white/60">{`Dia ${label.replace('D-', '')}`}</p>
        <p className="text-lg font-bold text-sky-400">{`${formattedValue}`}</p>
      </div>
    );
  }
  return null;
};

const ChartContextLayers: React.FC<{ metricName: string }> = ({ metricName }) => {
  // This component can be extended similarly to the one in MetricCard
  // For brevity, we'll replicate the logic.
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
             <Label value="Overbought (>2.4)" position="insideTopRight" fill="#ef4444" fontSize={12} offset={10} />
          </ReferenceLine>
           <ReferenceLine y={1.0} stroke="rgba(255,255,255,0.4)" strokeDasharray="4 4" ifOverflow="extendDomain">
             <Label value="Fair Value (~1.0)" position="insideRight" fill="rgba(255,255,255,0.6)" fontSize={12} offset={10} />
          </ReferenceLine>
        </>
      );
    case 'Puell Multiple':
       return (
        <>
          <ReferenceLine y={4.0} stroke="#ef4444" strokeDasharray="4 4" ifOverflow="extendDomain">
            <Label value="Topo (>4)" position="insideTopRight" fill="#ef4444" fontSize={12} offset={10} />
          </ReferenceLine>
          <ReferenceLine y={0.5} stroke="#22c55e" strokeDasharray="4 4" ifOverflow="extendDomain">
            <Label value="Fundo (<0.5)" position="insideBottomRight" fill="#22c55e" fontSize={12} offset={10}/>
          </ReferenceLine>
        </>
      );
    default:
      return null;
  }
};

export const MetricChartModal: React.FC<MetricChartModalProps> = ({ metric, onClose }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const formatYAxis = (tickItem: number) => {
    if (metric.name === 'Hash Rate') return `${tickItem.toFixed(0)} EH/s`;
    if (metric.name === 'Transações Diárias') return tickItem >= 1000 ? `${(tickItem / 1000).toFixed(0)}k` : `${tickItem}`;
    return parseFloat(tickItem.toFixed(2)).toString();
  };

  const hasChartData = metric.historicalData && metric.historicalData.length > 0;

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
      <div 
        className="bg-[#1e1f22] border border-white/10 rounded-3xl shadow-2xl w-full max-w-4xl h-full max-h-[80vh] p-6 sm:p-8 flex flex-col relative transform scale-95 animate-zoom-in"
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
        @keyframes zoom-in {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        .animate-zoom-in {
            animation: zoom-in 0.3s ease-out forwards;
        }
        `}</style>
        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-10">
          <CloseIcon className="w-7 h-7" />
        </button>

        <div className="flex-shrink-0 mb-6">
          <h2 className="text-2xl font-bold text-white">{metric.name}</h2>
          <p className="text-white/60">{metric.description}</p>
          <p className="text-5xl font-bold text-sky-400 mt-2">{metric.value}</p>
        </div>

        {hasChartData ? (
          <div className="flex-grow h-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metric.historicalData} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="modalChartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                <XAxis 
                    dataKey="name" 
                    stroke="rgba(255,255,255,0.6)" 
                    fontSize={12}
                    tickFormatter={(tick) => tick.replace('D-', '')}
                    label={{ value: 'Dias atrás', position: 'insideBottom', offset: -10, fill: 'rgba(255,255,255,0.6)' }}
                />
                <YAxis 
                    stroke="rgba(255,255,255,0.6)" 
                    fontSize={12}
                    tickFormatter={formatYAxis}
                    domain={['dataMin - (dataMax-dataMin)*0.1', 'dataMax + (dataMax-dataMin)*0.1']}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <ChartContextLayers metricName={metric.name} />
                <Area type="monotone" dataKey="value" stroke="#38bdf8" strokeWidth={2.5} fill="url(#modalChartGradient)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex-grow flex items-center justify-center text-white/50">
            Sem dados históricos para exibir.
          </div>
        )}
      </div>
    </div>
  );
};
