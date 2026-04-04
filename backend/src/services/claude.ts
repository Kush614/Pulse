import Anthropic from '@anthropic-ai/sdk';
import type { Message } from '@anthropic-ai/sdk/resources/messages/messages';
import { env } from '../env.js';
import { attachMemori, recallMemoriContext } from './memory-layer.js';

const DEFAULT_MODEL = 'claude-3-7-sonnet-latest';

function getClient() {
  if (!env.CLAUDE_API_KEY) return null;
  return attachMemori(new Anthropic({
    apiKey: env.CLAUDE_API_KEY,
    baseURL: env.CLAUDE_BASE_URL,
  }), 'pulse-signal-engine');
}

function extractTextBlocks(response: Message) {
  return response.content
    .filter((block): block is Extract<Message['content'][number], { type: 'text' }> => block.type === 'text')
    .map((block) => block.text)
    .join('\n');
}

export async function generateClaudeJson<T>(prompt: string, processId: string): Promise<T | null> {
  const client = getClient();
  if (!client) return null;

  const memoryContext = await recallMemoriContext(prompt, processId);

  try {
    const response = await client.messages.create({
      model: DEFAULT_MODEL,
      stream: false,
      max_tokens: 700,
      temperature: 0.2,
      system: [
        'You are a disciplined financial reasoning assistant.',
        'Return only valid JSON with no markdown fences.',
        memoryContext ? `Relevant process memory:\n${memoryContext}` : '',
      ].filter(Boolean).join('\n\n'),
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = extractTextBlocks(response).trim();
    const jsonStart = raw.indexOf('{');
    const jsonEnd = raw.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) return null;
    return JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as T;
  } catch (error) {
    console.warn('[claude] generation failed, falling back to heuristics');
    return null;
  }
}
