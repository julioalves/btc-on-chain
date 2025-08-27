import React from 'react';
import type { AIRecommendation } from '../types';
import { Recommendation } from '../types';
import { BuyIcon } from './icons/BuyIcon';
import { SellIcon } from './icons/SellIcon';
import { HoldIcon } from './icons/HoldIcon';
import { ErrorIcon } from './icons/ErrorIcon';

interface AIAdvisorProps {
  recommendation: AIRecommendation | null;
  isLoading: boolean;
}

const AILoadingState: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full p-6">
    <div className="animate-pulse flex flex-col items-center text-center">
      <div className="w-16 h-16 bg-white/10 rounded-full mb-4"></div>
      <div className="h-8 w-36 bg-white/10 rounded-md mb-3"></div>
      <div className="h-4 w-52 bg-white/10 rounded-md mb-2"></div>
      <div className="h-4 w-48 bg-white/10 rounded-md"></div>
    </div>
    <p className="text-sm text-white/50 mt-4 absolute bottom-6">IA analisando métricas...</p>
  </div>
);

const RecommendationDisplay: React.FC<{ recommendation: AIRecommendation }> = ({ recommendation }) => {
  const rec = recommendation.recommendation.toUpperCase();
  const styles = {
    [Recommendation.BUY]: {
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-400',
      text: 'COMPRAR',
      icon: <BuyIcon className="w-10 h-10" />,
    },
    [Recommendation.SELL]: {
      bgColor: 'bg-red-500/10',
      textColor: 'text-red-400',
      text: 'VENDER',
      icon: <SellIcon className="w-10 h-10" />,
    },
    [Recommendation.HOLD]: {
      bgColor: 'bg-yellow-500/10',
      textColor: 'text-yellow-400',
      text: 'MANTER',
      icon: <HoldIcon className="w-10 h-10" />,
    },
    [Recommendation.ERROR]: {
      bgColor: 'bg-gray-500/10',
      textColor: 'text-gray-400',
      text: 'ERRO',
      icon: <ErrorIcon className="w-10 h-10" />,
    },
  };

  const currentStyle = styles[rec as Recommendation] || styles.ERROR;

  return (
    <div className={`p-6 rounded-3xl h-full flex flex-col justify-between`}>
      <div>
        <h2 className="text-lg font-semibold text-white/80 mb-4">Recomendação da IA</h2>
        <div className="flex items-center space-x-4">
          <div className={`p-4 rounded-full ${currentStyle.bgColor} ${currentStyle.textColor}`}>
            {currentStyle.icon}
          </div>
          <span className={`text-4xl font-extrabold ${currentStyle.textColor}`}>{currentStyle.text}</span>
        </div>
      </div>
      <div>
        <h3 className="text-md font-semibold text-white/80 mb-2">Justificativa:</h3>
        <p className="text-sm text-white/60 leading-relaxed">{recommendation.justification}</p>
      </div>
    </div>
  );
};


export const AIAdvisor: React.FC<AIAdvisorProps> = ({ recommendation, isLoading }) => {
  return (
    <div className="bg-[#1e1f22] rounded-3xl shadow-lg border border-white/10 min-h-[244px] relative">
      {isLoading || !recommendation ? <AILoadingState /> : <RecommendationDisplay recommendation={recommendation} />}
    </div>
  );
};