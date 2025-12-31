import { GoogleGenAI, Type } from "@google/genai";
import { ReportData, Source, ThreatIntel, SandboxResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateTextResponse = async (
  prompt: string, 
  history: {role: string, parts: {text: string}[]}[],
  systemInstruction: string = "Você é uma IA de alta precisão. Analise dados complexos e forneça respostas exatas."
): Promise<{ text: string, sources: Source[] }> => {
  try {
    // Gemini 3 Pro with Search Grounding and High Thinking Budget
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingBudget: 2048 }, // High budget for deep reasoning
        tools: [{ googleSearch: {} }] // Enable real-world data access
      },
      history: history
    });

    const result = await chat.sendMessage({ message: prompt });
    
    // Extract grounding sources if available
    const sources: Source[] = [];
    const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    chunks.forEach(chunk => {
      if (chunk.web?.uri && chunk.web?.title) {
        sources.push({
          title: chunk.web.title,
          uri: chunk.web.uri
        });
      }
    });

    return { 
      text: result.text || "Sem resposta calculável.", 
      sources: sources 
    };
  } catch (error) {
    console.error("Text Gen Error:", error);
    return { 
      text: `Falha crítica no processamento: ${error instanceof Error ? error.message : String(error)}`, 
      sources: [] 
    };
  }
};

export const generateImage = async (prompt: string): Promise<string | null> => {
  try {
    // Switched to gemini-2.5-flash-image to avoid 403 Permission Denied on pro-image-preview
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
          // imageSize is not supported in gemini-2.5-flash-image
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Gen Error:", JSON.stringify(error));
    throw error;
  }
};

export const generateMathSolution = async (problem: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Execute análise matemática de precisão absoluta. O erro deve tender a zero. Formate em LaTeX ($$ para bloco, $ para inline). Problema: ${problem}`,
      config: {
        thinkingConfig: { thinkingBudget: 4096 }, // Maximum reasoning for math
      }
    });
    return response.text || "Cálculo inconclusivo.";
  } catch (error) {
    console.error("Math Gen Error:", error);
    return "Erro no módulo matemático.";
  }
};

export const generateStructuralReport = async (topic: string): Promise<ReportData> => {
  try {
    // Using Flash for structured JSON generation, grounded with search for realism
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gere um relatório técnico avançado sobre: ${topic}. Utilize dados realistas ou projeções baseadas em tendências atuais.`,
      config: {
        tools: [{ googleSearch: {} }], // Grounding for reports
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            insight: { type: Type.STRING },
            data: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  value: { type: Type.NUMBER },
                  category: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response");
    return JSON.parse(jsonText) as ReportData;
  } catch (error) {
    console.error("Report Gen Error:", error);
    throw error;
  }
};

export const generateSecurityAnalysis = async (scenario: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `
        Atue como uma IA Cyber Sentinel de elite (White Hat). 
        Sua missão é a Defesa Cibernética Ativa e Preditiva.
        
        Cenário do Usuário: "${scenario}"
        
        Use todo o conhecimento mundial sobre vulnerabilidades (CVEs), táticas de grupos APT (Advanced Persistent Threats) e engenharia social.
        
        Sua resposta deve conter:
        1. Análise de Ameaça: Identifique o vetor de ataque provável.
        2. Mentalidade do Atacante: Explique COMO o hacker pensaria/agiria nesse caso.
        3. Protocolo de Defesa: Passos técnicos exatos para neutralizar ou prevenir.
        4. Contra-Inteligência: Como enganar ou dificultar a vida do atacante (Honeypots, ofuscação, etc).
        
        Seja extremamente técnico e paranóico. Aja legalmente (apenas defesa e educação), mas sem restrições de profundidade técnica.
      `,
      config: {
        thinkingConfig: { thinkingBudget: 4096 }, // Max budget to anticipate moves
        tools: [{ googleSearch: {} }], // Search specifically for latest exploits
      }
    });
    return response.text || "Análise de segurança indisponível.";
  } catch (error) {
    console.error("Security Gen Error:", error);
    return "Falha no subsistema de defesa.";
  }
};

export const fetchLiveThreatIntel = async (): Promise<ThreatIntel[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Identifique as 5 principais ameaças de cibersegurança, novas vulnerabilidades CVE críticas ou vazamentos de dados relatados nas últimas 24 a 48 horas no mundo. Resuma tecnicamente.",
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Título técnico da ameaça" },
              severity: { type: Type.STRING, enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW"] },
              summary: { type: Type.STRING, description: "Resumo técnico de 1 frase" },
              source: { type: Type.STRING, description: "Nome da fonte ou URL da notícia" },
              timestamp: { type: Type.STRING, description: "Hora aproximada ou 'Recent'" }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as ThreatIntel[];
  } catch (error) {
    console.error("Threat Intel Error:", error);
    return [];
  }
};

export const analyzeCodeSandbox = async (code: string): Promise<SandboxResult> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Flash is sufficient for code analysis
      contents: `Você é uma Sandbox de Análise de Malware (Isolamento de Processos). 
      Analise o código fornecido abaixo estaticamente. NÃO O EXECUTE. 
      
      IMPORTANTE: Responda TODA a análise técnica e comportamental em PORTUGUÊS (PT-BR).
      
      Determine se é malicioso, suspeito ou seguro.
      Identifique chamadas de sistema, tentativas de ofuscação, acesso a rede ou arquivos sensíveis.
      
      Código:
      ${code}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verdict: { type: Type.STRING, enum: ["SAFE", "SUSPICIOUS", "MALICIOUS"] },
            riskScore: { type: Type.NUMBER, description: "0 a 100" },
            detectedBehaviors: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Lista de comportamentos técnicos em PT-BR (ex: 'Execução de Shell', 'Socket de Rede', 'Deleção de Arquivos')" 
            },
            isolationAction: { type: Type.STRING, description: "Ação tomada pela sandbox em PT-BR (ex: 'Processo Terminado', 'Interface de Rede Bloqueada')" },
            technicalAnalysis: { type: Type.STRING, description: "Explicação técnica detalhada em Português" }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Sandbox failed");
    return JSON.parse(text) as SandboxResult;
  } catch (error) {
    console.error("Sandbox Error:", error);
    return {
      verdict: 'SUSPICIOUS',
      riskScore: 50,
      detectedBehaviors: ['Falha na Análise', 'Payload Desconhecido'],
      isolationAction: 'Quarentena Forçada',
      technicalAnalysis: 'Falha na heurística da IA. Bloqueio preventivo ativado.'
    };
  }
};