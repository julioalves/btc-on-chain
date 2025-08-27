import type { DashboardData, Metric } from '../types';

// Helper to process chart data from blockchain.info API
const processChartData = (chartData: any, points: number = 30) => {
    if (!chartData?.values || chartData.values.length === 0) {
        // Return a default structure to prevent crashes downstream
        return { latestValue: 0, historicalData: Array(points).fill({ name: 'D-?', value: 0 }) };
    }
    const dataPoints = chartData.values.slice(-points);
    const historicalData = dataPoints.map((d: any, i: number) => ({
        name: `D-${points - i - 1}`,
        value: d.y
    }));
    const latestValue = chartData.values[chartData.values.length - 1].y;
    return { latestValue, historicalData };
};

// Helper for calculating a rolling moving average from a list of data points
const calculateRollingAverage = (data: { y: number }[], windowSize: number): number[] => {
    if (data.length < windowSize) return [];
    
    const averages: number[] = [];
    let sum = data.slice(0, windowSize).reduce((acc, curr) => acc + curr.y, 0);
    averages.push(sum / windowSize);

    for (let i = windowSize; i < data.length; i++) {
        sum += data[i].y - data[i - windowSize].y;
        averages.push(sum / windowSize);
    }
    return averages;
};

// A helper to fetch data and provide context on failure
const fetchWithContext = async (name: string, url: string) => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            // Create a specific error for HTTP issues
            throw new Error(`HTTP error! status: ${response.status} for ${name}`);
        }
        return await response.json();
    } catch (error) {
        // This will catch network errors ('Failed to fetch') and the HTTP error above
        console.error(`Request failed for ${name}:`, error);
        // Re-throw with more context so Promise.all fails with a clear message.
        throw new Error(`Could not fetch data for ${name}. Reason: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

export const fetchDashboardData = async (): Promise<DashboardData> => {
    try {
        const BASE_CHART_URL = 'https://api.blockchain.info/charts';

        // Use Promise.all with the contextual fetch helper.
        // The Stock-to-Flow endpoint is returning 404 and has been removed for stability.
        const [
            priceData,
            fearAndGreedData,
            hashRateChartData,
            priceChartRawData,
            minersRevenueRawData,
            transactionsChartData,
        ] = await Promise.all([
            fetchWithContext('CoinGecko Price', 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,brl'),
            fetchWithContext('Fear & Greed Index', 'https://api.alternative.me/fng/?limit=30'),
            fetchWithContext('Hash Rate Chart', `${BASE_CHART_URL}/hash-rate?timespan=30days&format=json&cors=true`),
            fetchWithContext('Price Chart (Mayer)', `${BASE_CHART_URL}/market-price?timespan=230days&format=json&cors=true`),
            fetchWithContext('Miners Revenue Chart (Puell)', `${BASE_CHART_URL}/miners-revenue?timespan=400days&format=json&cors=true`),
            fetchWithContext('Transactions Chart', `${BASE_CHART_URL}/n-transactions?timespan=30days&format=json&cors=true`),
        ]);

        // --- Process API Data ---

        const btcPrice = {
            usd: priceData.bitcoin.usd,
            brl: priceData.bitcoin.brl,
        };

        const fngCurrent = fearAndGreedData.data[0];
        const fngHistorical = fearAndGreedData.data.map((d: any, i: number) => ({
            name: `D-${i}`,
            value: parseInt(d.value, 10)
        })).reverse();
        
        const { latestValue: latestHashRateTHS, historicalData: hashRateHistoricalTHS } = processChartData(hashRateChartData);
        const hashRateEHS = latestHashRateTHS / 1_000_000;
        const hashRateHistoricalEHS = hashRateHistoricalTHS.map(d => ({...d, value: d.value / 1_000_000}));

        const { latestValue: transactionsValue, historicalData: transactionsHistorical } = processChartData(transactionsChartData);

        // Calculate Mayer Multiple
        const pricesForMayer = priceChartRawData.values;
        if (!pricesForMayer || pricesForMayer.length < 200) throw new Error("Not enough price data for Mayer Multiple");
        const rolling200dMA = calculateRollingAverage(pricesForMayer, 200);
        if (rolling200dMA.length < 30) throw new Error("Not enough 200d MA data for Mayer Multiple");
        const last30Prices = pricesForMayer.slice(-30);
        const last30Rolling200dMA = rolling200dMA.slice(-30);
        const mayerValue = last30Prices[last30Prices.length - 1].y / last30Rolling200dMA[last30Rolling200dMA.length - 1];
        const mayerHistorical = last30Prices.map((price, i) => ({
            name: `D-${29 - i}`,
            value: price.y / last30Rolling200dMA[i]
        }));
        
        // Calculate Puell Multiple
        const revenueForPuell = minersRevenueRawData.values;
        if (!revenueForPuell || revenueForPuell.length < 365) throw new Error("Not enough revenue data for Puell Multiple");
        const rolling365dMA = calculateRollingAverage(revenueForPuell, 365);
        if (rolling365dMA.length < 30) throw new Error("Not enough 365d MA data for Puell Multiple");
        const last30Revenues = revenueForPuell.slice(-30);
        const last30Rolling365dMA = rolling365dMA.slice(-30);
        const puellValue = last30Revenues[last30Revenues.length - 1].y / last30Rolling365dMA[last30Rolling365dMA.length - 1];
        const puellHistorical = last30Revenues.map((revenue, i) => ({
            name: `D-${29 - i}`,
            value: revenue.y / last30Rolling365dMA[i]
        }));

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
                historicalData: hashRateHistoricalEHS
            },
            {
                name: "Transações Diárias",
                value: `${(transactionsValue / 1000).toFixed(2)}k`,
                description: "Volume de transações na rede",
                tooltip: "O número de transações confirmadas na blockchain do Bitcoin diariamente. Um aumento pode indicar maior adoção e atividade na rede.",
                historicalData: transactionsHistorical
            },
            {
                name: "Mayer Multiple",
                value: mayerValue.toFixed(2),
                description: "Preço / Média Móvel 200d",
                tooltip: "Múltiplo do preço atual em relação à média móvel de 200 dias. >2.4 historicamente indica sobrecompra.",
                historicalData: mayerHistorical
            },
            {
                name: "Puell Multiple",
                value: puellValue.toFixed(2),
                description: "Emissão diária / Média 365d",
                tooltip: "Relação entre a receita diária dos mineradores e sua média móvel de 365 dias. >4 sugere topo, <0.5 sugere fundo.",
                historicalData: puellHistorical
            },
        ];

        return {
            price: btcPrice,
            metrics: metrics,
        };

    } catch (error) {
        console.error("Error fetching on-chain data:", error);
        throw new Error("Falha ao buscar dados reais. Verifique a conexão ou tente novamente mais tarde.");
    }
};