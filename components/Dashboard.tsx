import React, { useState } from 'react';
import type { DashboardData, AIRecommendation, Metric } from '../types';
import { PriceTicker } from './PriceTicker';
import { AIAdvisor } from './AIAdvisor';
import { MetricCard } from './MetricCard';
import { MetricChartModal } from './MetricChartModal';
import { BitcoinIcon } from './icons/BitcoinIcon';
import { RefreshIcon } from './icons/RefreshIcon';

interface DashboardProps {
  data: DashboardData;
  aiRecommendation: AIRecommendation | null;
  isAiLoading: boolean;
  onRefresh: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, aiRecommendation, isAiLoading, onRefresh }) => {
  const [zoomedMetric, setZoomedMetric] = useState<Metric | null>(null);

  return (
    <div className="container mx-auto max-w-7xl">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
          <BitcoinIcon className="w-10 h-10 text-yellow-500"/>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Painel On-Chain Bitcoin</h1>
        </div>
        <button
          onClick={onRefresh}
          disabled={isAiLoading}
          className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-white/10 text-white rounded-full shadow-lg hover:bg-white/20 transition-all duration-300 disabled:bg-white/5 disabled:cursor-not-allowed transform hover:scale-105"
        >
          <RefreshIcon className={`w-5 h-5 ${isAiLoading ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium">{isAiLoading ? 'Atualizando...' : 'Atualizar Dados'}</span>
        </button>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
            <PriceTicker price={data.price} />
            <AIAdvisor recommendation={aiRecommendation} isLoading={isAiLoading} />
        </div>
        
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {data.metrics.map((metric) => (
            <MetricCard 
              key={metric.name} 
              metric={metric}
              onZoom={() => setZoomedMetric(metric)}
            />
          ))}
        </div>
      </main>

      {zoomedMetric && (
        <MetricChartModal 
          metric={zoomedMetric} 
          onClose={() => setZoomedMetric(null)} 
        />
      )}
    </div>
  );
};