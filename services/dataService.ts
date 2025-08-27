import type { DashboardData, Metric } from '../types';

// Helper to generate random data for metrics without a free public API
const generateRandom = (min: number, max: number, decimals: number = 2): number => {
    const str = (Math.random() * (max - min) + min).toFixed(decimals);
    return parseFloat(str);
};

const generateHistoricalData = (base: number, points: number, volatility: number) => {
    const data = [];
    let currentValue = base;
    for (let i = 0; i < points; i++) {
        // Ensure data points are positive and have some variance
        currentValue += (Math.random() - 0.5) * base * volatility;
        if (currentValue <= 0) {
            currentValue = base * (Math.random() * 0.1 + 0.95); // reset near base if it drops too low
        }
        data.push({ name: `D-${points - i}`, value: parseFloat(currentValue.toFixed(2)) });
    }
    return data.reverse(); // Reverse to show trend from past to present
};


export const fetchDashboardData = async (): Promise<DashboardData> => {
    try {
        // Use Promise.all to fetch data concurrently from multiple public APIs
        const [priceResponse, fearAndGreedResponse, hashRateResponse] = await Promise.all([
            fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,brl'),
            fetch('https://api.alternative.me/fng/?limit=30'), // Fetch 30 days for chart
            fetch('https://api.blockchain.info/q/hashrate')
        ]);

        if (!priceResponse.ok) throw new Error('Failed to fetch price data from CoinGecko');
        if (!fearAndGreedResponse.ok) throw new Error('Failed to fetch Fear & Greed data');
        if (!hashRateResponse.ok) throw new Error('Failed to fetch Hash Rate data');

        const priceData = await priceResponse.json();
        const fearAndGreedData = await fearAndGreedResponse.json();
        const hashRateDataGHS = await hashRateResponse.json(); // Data is in Giga Hashes per second

        // Process real data from APIs
        const btcPrice = {
            usd: priceData.bitcoin.usd,
            brl: priceData.bitcoin.brl,
        };

        const fngCurrent = fearAndGreedData.data[0];
        const fngHistorical = fearAndGreedData.data.map((d: any, i: number) => ({
            name: `D-${i}`,
            value: parseInt(d.value, 10)
        })).reverse();

        // Convert Hash Rate from GH/s to EH/s for readability
        const hashRateEHS = (hashRateDataGHS / 1_000_000_000);
        
        // Mock data for metrics where free, key-less public APIs are not readily available
        const mvrvValue = generateRandom(1.8, 2.9);
        const mayerValue = generateRandom(1.3, 1.9);
        const puellValue = generateRandom(1.5, 2.5);
        const lthSupplyValue = generateRandom(83, 86);

        const metrics: Metric[] = [
            {
                name: "Fear & Greed Index",
                value: fngCurrent.value,
                description: fngCurrent.value_classification,
                tooltip: "Mede o sentimento do mercado. 0 é 'Medo Extremo', 100 é 'Ganância Extrema'.",
                historicalData: fngHistorical,
            },
            {
                name: "Hash Rate",
                value: `${hashRateEHS.toFixed(2)} EH/s`,
                description: "Poder computacional da rede",
                tooltip: "A taxa de hash crescente indica uma rede forte e segura, com mais mineradores participando.",
                historicalData: generateHistoricalData(hashRateEHS, 30, 0.05)
            },
            // --- Metrics below are mocked as free public APIs are not readily available ---
            {
                name: "MVRV Ratio",
                value: mvrvValue.toFixed(2),
                description: "Valor de Mercado / Realizado",
                tooltip: "Compara o valor de mercado com o valor realizado. >3.7 sugere topo, <1 sugere fundo.",
                historicalData: generateHistoricalData(mvrvValue, 30, 0.1)
            },
            {
                name: "Long Term Holder Supply",
                value: `${lthSupplyValue.toFixed(2)}%`,
                description: "Fornecimento em posse de LTHs",
                tooltip: "Percentual de moedas detidas por 'holders' de longo prazo, indicando convicção.",
                historicalData: generateHistoricalData(lthSupplyValue, 30, 0.01)
            },
            {
                name: "Mayer Multiple",
                value: mayerValue.toFixed(2),
                description: "Preço / Média Móvel 200d",
                tooltip: "Múltiplo do preço atual em relação à média móvel de 200 dias. >2.4 historicamente indica sobrecompra.",
                historicalData: generateHistoricalData(mayerValue, 30, 0.15)
            },
            {
                name: "Puell Multiple",
                value: puellValue.toFixed(2),
                description: "Emissão diária / Média 365d",
                tooltip: "Relação entre a emissão diária de moedas e sua média móvel de 365 dias. >4 sugere topo, <0.5 sugere fundo.",
                historicalData: generateHistoricalData(puellValue, 30, 0.2)
            },
        ];

        return {
            price: btcPrice,
            metrics: metrics,
        };

    } catch (error) {
        console.error("Error fetching real on-chain data:", error);
        // Propagate the error to be handled by the UI component
        throw new Error("Falha ao buscar dados reais. Verifique a conexão ou tente novamente mais tarde.");
    }
};