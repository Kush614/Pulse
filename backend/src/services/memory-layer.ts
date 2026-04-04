import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { Memori } from '@memorilabs/memori';
import { env } from '../env.js';

type SupportedClient = OpenAI | Anthropic;

export function attachMemori<T extends SupportedClient>(client: T, processId: string, entityId = 'pulse-system'): T {
  if (!env.MEMORI_API_KEY) return client;
  const memori = new Memori().attribution(entityId, processId);
  memori.llm.register(client);
  return client;
}

export async function recallMemoriContext(query: string, processId: string, entityId = 'pulse-system'): Promise<string> {
  if (!env.MEMORI_API_KEY || !query.trim()) return '';

  try {
    const memori = new Memori().attribution(entityId, processId);
    const facts = await memori.recall(query);
    if (!facts.length) return '';
    return facts
      .slice(0, 5)
      .map((fact) => `- ${fact.content}`)
      .join('\n');
  } catch {
    return '';
  }
}
