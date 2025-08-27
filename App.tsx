import React, { useState, useEffect, useCallback } from 'react';
import { Dashboard } from './components/Dashboard';
import { fetchDashboardData } from './services/dataService';
import { getBitcoinAnalysis } from './services/geminiService';
import type { DashboardData, AIRecommendation } from './types';
import { BitcoinIcon } from './components/icons/BitcoinIcon';

const App: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [aiRecommendation, setAiRecommendation] = useState<AIRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setIsAiLoading(true);
    setError(null);
    setAiRecommendation(null);
    
    try {
      const dashboardData = await fetchDashboardData();
      setData(dashboardData);
      
      try {
        const recommendation = await getBitcoinAnalysis(dashboardData);
        setAiRecommendation(recommendation);
      } catch (aiError) {
        console.error("AI analysis failed:", aiError);
        setError("Falha ao obter a análise da IA. Tente novamente mais tarde.");
        setAiRecommendation({ recommendation: 'ERROR', justification: 'Não foi possível carregar a análise da IA.' });
      } finally {
        setIsAiLoading(false);
      }

    } catch (dataError) {
      console.error("Failed to fetch dashboard data:", dataError);
      setError("Não foi possível carregar os dados do painel. Verifique sua conexão e tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#121316] text-white">
        <BitcoinIcon className="w-24 h-24 text-yellow-500 animate-pulse" />
        <h1 className="text-2xl font-bold mt-4">Carregando Painel Bitcoin...</h1>
        <p className="text-white/60">Buscando os dados mais recentes da blockchain.</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#121316] text-white p-4">
        <h1 className="text-2xl font-bold text-red-500">Ocorreu um Erro</h1>
        <p className="text-center text-white/70 mt-2">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-full shadow-md transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121316] text-white p-4 sm:p-6 lg:p-8">
      {data && (
        <Dashboard 
          data={data}
          aiRecommendation={aiRecommendation}
          isAiLoading={isAiLoading}
          onRefresh={loadData}
        />
      )}
    </div>
  );
};

export default App;