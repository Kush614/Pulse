import OpenAI from 'openai';
import { env } from '../env.js';
import { attachMemori, recallMemoriContext } from './memory-layer.js';

const DEFAULT_MODEL = 'MiniMax-M2.1-highspeed';

function getClient() {
  if (!env.MINIMAX_API_KEY) return null;
  return attachMemori(new OpenAI({
    apiKey: env.MINIMAX_API_KEY,
    baseURL: env.MINIMAX_BASE_URL || 'https://api.minimax.io/v1',
  }), 'pulse-signal-engine');
}

export async function generateSignalJson<T>(prompt: string, processId: string): Promise<T | null> {
  const client = getClient();
  if (!client) return null;

  const memoryContext = await recallMemoriContext(prompt, processId);

  try {
    const response = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: [
            'You are a disciplined financial reasoning assistant.',
            'Return only valid JSON with no markdown fences.',
            memoryContext ? `Relevant process memory:\n${memoryContext}` : '',
          ].filter(Boolean).join('\n\n'),
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content?.trim();
    if (!raw) return null;
    const withoutThinking = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    const jsonStart = withoutThinking.indexOf('{');
    const jsonEnd = withoutThinking.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) return null;
    return JSON.parse(withoutThinking.slice(jsonStart, jsonEnd + 1)) as T;
  } catch (error) {
    console.warn('[signal-llm] generation failed, falling back to heuristics');
    return null;
  }
}
