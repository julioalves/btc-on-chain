import React from 'react';
import type { PriceData } from '../types';
import { BrazilFlagIcon } from './icons/BrazilFlagIcon';
import { USAFlagIcon } from './icons/USAFlagIcon';

interface PriceTickerProps {
  price: PriceData;
}

const formatCurrency = (value: number, currency: 'USD' | 'BRL') => {
  return new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'pt-BR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const PriceTicker: React.FC<PriceTickerProps> = ({ price }) => {
  return (
    <div className="bg-[#1e1f22] p-6 rounded-3xl shadow-lg border border-white/10 flex flex-col justify-center space-y-6">
      <h2 className="text-lg font-semibold text-white/80">Cotação Atual do Bitcoin</h2>
      <div className="flex items-center space-x-4">
        <USAFlagIcon className="w-10 h-10 rounded-full shadow-md" />
        <div>
            <span className="text-4xl font-bold text-white tracking-tight">{formatCurrency(price.usd, 'USD')}</span>
            <p className="text-sm text-white/60">Dólar Americano</p>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <BrazilFlagIcon className="w-10 h-10 rounded-full shadow-md" />
        <div>
            <span className="text-4xl font-bold text-white tracking-tight">{formatCurrency(price.brl, 'BRL')}</span>
            <p className="text-sm text-white/60">Real Brasileiro</p>
        </div>
      </div>
    </div>
  );
};