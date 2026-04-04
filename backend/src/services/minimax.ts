import OpenAI from 'openai';
import { env } from '../env.js';
import { attachMemori } from './memory-layer.js';

const DEFAULT_MODEL = 'MiniMax-M2.1-highspeed';

function getClient() {
  if (!env.MINIMAX_API_KEY) return null;
  return attachMemori(new OpenAI({
    apiKey: env.MINIMAX_API_KEY,
    baseURL: env.MINIMAX_BASE_URL || 'https://api.minimax.io/v1',
  }), 'pulse-feed-analysis');
}

export interface MinimaxClusterAnalysis {
  brief: string;
  topic?: 'MACRO' | 'GEOPOLITICS' | 'EARNINGS' | 'TECH' | 'COMMODITIES';
  viewpoints?: {
    left: string;
    center: string;
    right: string;
  };
}

export async function analyzeClusterWithMinimax(headlines: string[]): Promise<MinimaxClusterAnalysis | null> {
  const client = getClient();
  if (!client || headlines.length === 0) return null;

  try {
    const response = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You convert clusters of financial and geopolitical headlines into structured market-intelligence JSON.',
        },
        {
          role: 'user',
          content: [
            'Analyze these related headlines and return JSON with keys: brief, topic, viewpoints.',
            'topic must be one of MACRO, GEOPOLITICS, EARNINGS, TECH, COMMODITIES.',
            'brief must be 2 sentences max, investor-facing, objective, no hype.',
            'viewpoints must be an object with left, center, right. Each value must be 1 sentence.',
            '',
            headlines.map((headline, index) => `${index + 1}. ${headline}`).join('\n'),
          ].join('\n'),
        },
      ],
    });

    const raw = response.choices[0]?.message?.content?.trim();
    if (!raw) return null;
    const withoutThinking = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    const jsonStart = withoutThinking.indexOf('{');
    const jsonEnd = withoutThinking.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) return null;
    return JSON.parse(withoutThinking.slice(jsonStart, jsonEnd + 1)) as MinimaxClusterAnalysis;
  } catch (error) {
    console.warn('[minimax] cluster analysis failed, falling back to heuristics');
    return null;
  }
}
