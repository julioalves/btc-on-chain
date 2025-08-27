
export interface PriceData {
  usd: number;
  brl: number;
}

export interface Metric {
  name: string;
  value: string | number;
  description: string;
  tooltip: string;
  historicalData?: { name: string; value: number }[];
}

export interface DashboardData {
  price: PriceData;
  metrics: Metric[];
}

export enum Recommendation {
  BUY = 'BUY',
  SELL = 'SELL',
  HOLD = 'HOLD',
  ERROR = 'ERROR',
}

export interface AIRecommendation {
  recommendation: Recommendation | string;
  justification: string;
}
