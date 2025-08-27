import { GoogleGenAI } from "@google/genai";
import type { DashboardData, AIRecommendation } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const getBitcoinAnalysis = async (data: DashboardData): Promise<AIRecommendation> => {
  const metricsSummary = data.metrics.map(m => `- ${m.name}: ${m.value} (${m.tooltip})`).join('\n');
  const prompt = `
    Você é um analista de criptomoedas especialista em dados on-chain do Bitcoin. Sua tarefa é fornecer uma recomendação de investimento de curto prazo com base nas seguintes métricas.

    Métricas Atuais:
    - Preço do Bitcoin (USD): $${data.price.usd.toFixed(2)}
    - Preço do Bitcoin (BRL): R$${data.price.brl.toFixed(2)}
    ${metricsSummary}

    Com base *apenas* nos dados fornecidos, determine se o sentimento atual do mercado sugere uma oportunidade de 'COMPRAR', 'VENDER' ou 'MANTER' (HOLD) para o Bitcoin.

    Forneça sua resposta estritamente como um objeto JSON. O objeto JSON deve conter duas chaves:
    1. "recommendation": Uma única string, sendo "BUY", "SELL", ou "HOLD".
    2. "justification": Um parágrafo conciso (2-3 frases) em português explicando seu raciocínio com base na interação das métricas fornecidas.
    
    Sua resposta DEVE ser apenas o objeto JSON, sem nenhuma formatação markdown (como \`\`\`json) ou qualquer outro texto explicativo.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let text = response.text.trim();
    
    // The model might still wrap the JSON in markdown fences despite instructions. 
    // This logic robustly removes them.
    if (text.startsWith("```json")) {
      text = text.slice(7, -3).trim();
    } else if (text.startsWith("```")) {
      text = text.slice(3, -3).trim();
    }

    const parsedResponse = JSON.parse(text);
    
    if (parsedResponse.recommendation && parsedResponse.justification) {
        return parsedResponse as AIRecommendation;
    } else {
        throw new Error("Resposta da IA em formato inválido.");
    }

  } catch (error) {
    console.error("Error calling Gemini API or parsing response:", error);
    if (error instanceof SyntaxError) {
      throw new Error("A IA retornou uma resposta em formato inválido. Tente novamente.");
    }
    throw new Error("Não foi possível obter a análise da IA. Por favor, tente novamente.");
  }
};
