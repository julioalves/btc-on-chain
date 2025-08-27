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


export const fetchDashboardData = async (): Promise<DashboardData> => {
    try {
        const BASE_CHART_URL = 'https://api.blockchain.info/charts';

        // Use Promise.all to fetch all data concurrently
        const [
            priceResponse,
            fearAndGreedResponse,
            hashRateChartResponse,
            mvrvChartResponse,
            priceChartResponse, // For Mayer Multiple (200d MA)
            minersRevenueChartResponse, // For Puell Multiple (365d MA)
            transactionsChartResponse // Replacement for LTH Supply
        ] = await Promise.all([
            fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,brl'),
            fetch('https://api.alternative.me/fng/?limit=30'),
            fetch(`${BASE_CHART_URL}/hash-rate?timespan=30days&format=json&cors=true`),
            fetch(`${BASE_CHART_URL}/mvrv?timespan=30days&format=json&cors=true`),
            fetch(`${BASE_CHART_URL}/market-price?timespan=230days&format=json&cors=true`), // 30d history of 200d MA
            fetch(`${BASE_CHART_URL}/miners-revenue?timespan=400days&format=json&cors=true`), // 30d history of 365d MA
            fetch(`${BASE_CHART_URL}/n-transactions?timespan=30days&format=json&cors=true`),
        ]);
        
        // Validate all API responses
        const responses = [priceResponse, fearAndGreedResponse, hashRateChartResponse, mvrvChartResponse, priceChartResponse, minersRevenueChartResponse, transactionsChartResponse];
        for (const res of responses) {
            if (!res.ok) throw new Error(`Failed to fetch data: ${res.statusText}`);
        }

        // Parse all responses
        const priceData = await priceResponse.json();
        const fearAndGreedData = await fearAndGreedResponse.json();
        const hashRateChartData = await hashRateChartResponse.json();
        const mvrvChartData = await mvrvChartResponse.json();
        const priceChartRawData = await priceChartResponse.json();
        const minersRevenueRawData = await minersRevenueChartResponse.json();
        const transactionsChartData = await transactionsChartResponse.json();

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

        const { latestValue: mvrvValue, historicalData: mvrvHistorical } = processChartData(mvrvChartData);

        const { latestValue: transactionsValue, historicalData: transactionsHistorical } = processChartData(transactionsChartData);

        // Calculate Mayer Multiple
        const pricesForMayer = priceChartRawData.values;
        const rolling200dMA = calculateRollingAverage(pricesForMayer, 200);
        const last30Prices = pricesForMayer.slice(-30);
        const last30Rolling200dMA = rolling200dMA.slice(-30);
        const mayerValue = last30Prices[last30Prices.length - 1].y / last30Rolling200dMA[last30Rolling200dMA.length - 1];
        const mayerHistorical = last30Prices.map((price, i) => ({
            name: `D-${29 - i}`,
            value: price.y / last30Rolling200dMA[i]
        }));
        
        // Calculate Puell Multiple
        const revenueForPuell = minersRevenueRawData.values;
        const rolling365dMA = calculateRollingAverage(revenueForPuell, 365);
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
                name: "MVRV Ratio",
                value: mvrvValue.toFixed(2),
                description: "Valor de Mercado / Realizado",
                tooltip: "Compara o valor de mercado com o valor realizado. >3.7 sugere topo, <1 sugere fundo.",
                historicalData: mvrvHistorical
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