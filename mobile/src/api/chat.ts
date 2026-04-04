// Chat API — wraps MiniMax for chat and comparison summaries
// In v1 we call MiniMax directly from the client; a backend proxy can be added later.

import { ChatMessage, ImpactAnalysisBlock } from '../contracts';

const MINIMAX_BASE =
  process.env.EXPO_PUBLIC_MINIMAX_URL ?? 'https://api.minimax.chat';
const MINIMAX_KEY = process.env.EXPO_PUBLIC_MINIMAX_KEY ?? '';

interface MiniMaxMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface MiniMaxResponse {
  choices: { message: { content: string } }[];
}

export async function sendChatMessage(
  systemPrompt: string,
  history: MiniMaxMessage[],
  userMessage: string,
  signal?: AbortSignal,
): Promise<string> {
  if (!MINIMAX_KEY) {
    return [
      'Base case: the story raises near-term volatility for exposed supply chains while improving the case for domestic substitution.',
      'Bull case: local producers capture demand and policy support if restrictions persist.',
      'Bear case: downstream cost pressure spreads faster than investors expect.',
      'Watch the next 24 hours for follow-on reporting, official clarifications, and whether related tickers confirm the move.',
      '{"ticker":"MP","expectedMove":"+8% to +12%","confidence":78,"rationale":"Domestic rare earth producers should benefit first if export controls tighten and buyers reprice local supply security."}',
    ].join('\n\n');
  }

  const messages: MiniMaxMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userMessage },
  ];

  const res = await fetch(`${MINIMAX_BASE}/v1/text/chatcompletion_v2`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${MINIMAX_KEY}`,
    },
    body: JSON.stringify({ model: 'MiniMax-Text-01', messages }),
    signal,
  });

  if (!res.ok) {
    throw new Error(`MiniMax request failed: ${res.status}`);
  }

  const data: MiniMaxResponse = await res.json();
  return data.choices[0]?.message?.content ?? '';
}

/**
 * Build the system prompt for a story-aware chat thread.
 */
export function buildStorySystemPrompt(
  headline: string,
  brief: string,
  viewpointTakes: string[],
): string {
  return [
    'You are PULSE AI, a financial-news discussion assistant.',
    `The user is discussing this story: "${headline}"`,
    `Brief: ${brief}`,
    viewpointTakes.length
      ? `Perspectives:\n${viewpointTakes.map((t, i) => `${i + 1}. ${t}`).join('\n')}`
      : '',
    'Help the user understand implications, compare viewpoints, and assess portfolio impact.',
    'When relevant, include an impact analysis in your response as JSON: {"ticker","expectedMove","confidence","rationale"}.',
  ]
    .filter(Boolean)
    .join('\n\n');
}

/**
 * Try to parse an impact analysis block from an assistant response.
 */
export function parseImpactAnalysis(
  content: string,
): ImpactAnalysisBlock | undefined {
  const match = content.match(
    /\{[^}]*"ticker"[^}]*"expectedMove"[^}]*"confidence"[^}]*"rationale"[^}]*\}/,
  );
  if (!match) return undefined;
  try {
    const parsed = JSON.parse(match[0]);
    if (parsed.ticker && parsed.expectedMove && parsed.confidence && parsed.rationale) {
      return parsed as ImpactAnalysisBlock;
    }
  } catch {
    // not valid JSON
  }
  return undefined;
}
