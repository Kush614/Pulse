// ============================================================
// Nova News — Bias Radar Engine + Multi-Model Consensus
// ============================================================

import { aiChat } from './insforge.js';
import type { Article, BiasScore, BiasRadarData, ConsensusResult } from './types.js';

// ─── Bias Analysis (via InsForge AI Gateway) ─────────────────

const BIAS_PROMPT = `You are a media bias analyst. Analyze this news article and return a JSON object with these scores (each 0-1 float, except political_lean which is -1 to +1):

{
  "political_lean": <-1 far-left to +1 far-right, 0 = center>,
  "emotional": <0 purely factual to 1 highly emotional language>,
  "opinion_ratio": <0 straight reporting to 1 pure opinion/editorial>,
  "sensationalism": <0 measured to 1 clickbait/sensational>,
  "source_credibility": <0 unreliable to 1 highly credible>,
  "reasoning": "<1-2 sentence explanation>"
}

Only return valid JSON, no other text.`;

export async function analyzeBias(article: Article, model?: string): Promise<BiasScore> {
  const modelId = model || 'openai/gpt-4o-mini';

  const content = `Source: ${article.source}
Title: ${article.title}
Content: ${article.snippet || article.full_text || '(no content)'}
URL: ${article.url}`;

  const res = await aiChat({
    model: modelId,
    messages: [
      { role: 'system', content: BIAS_PROMPT },
      { role: 'user', content },
    ],
    temperature: 0.1,
    max_tokens: 512,
  }) as any;

  const text = res.choices?.[0]?.message?.content || '{}';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(jsonMatch?.[0] || '{}');

  return {
    article_id: article.id || 0,
    political_lean: clamp(parsed.political_lean ?? 0, -1, 1),
    emotional: clamp(parsed.emotional ?? 0.5, 0, 1),
    opinion_ratio: clamp(parsed.opinion_ratio ?? 0.5, 0, 1),
    sensationalism: clamp(parsed.sensationalism ?? 0.5, 0, 1),
    source_credibility: clamp(parsed.source_credibility ?? 0.5, 0, 1),
    model_used: modelId,
    reasoning: parsed.reasoning || '',
  };
}

// ─── Bias Radar: analyze same story across multiple sources ──

export async function biasRadar(articles: Article[]): Promise<BiasRadarData[]> {
  const results = await Promise.allSettled(
    articles.map(a => analyzeBias(a))
  );

  return articles.map((article, i) => {
    const score = results[i].status === 'fulfilled' ? results[i].value : defaultBias(article);
    return {
      article,
      scores: [score],
      avg: {
        political_lean: score.political_lean,
        emotional: score.emotional,
        opinion_ratio: score.opinion_ratio,
        sensationalism: score.sensationalism,
        credibility: score.source_credibility,
      },
    };
  });
}

// ─── Multi-Model Consensus Engine ────────────────────────────

// Run same model with different analysis perspectives to simulate multi-model consensus
const CONSENSUS_PERSPECTIVES = [
  { model: 'openai/gpt-4o-mini', label: 'Factual Analyst', temp: 0.1 },
  { model: 'openai/gpt-4o-mini', label: 'Critical Skeptic', temp: 0.4 },
  { model: 'openai/gpt-4o-mini', label: 'Context Expert', temp: 0.3 },
];

const CONSENSUS_PROMPT = `Analyze this news topic. Return JSON:
{
  "facts": ["<list of verified factual claims>"],
  "sentiment": "<overall sentiment: positive/negative/neutral/mixed>",
  "missing_context": "<what important context is missing from coverage>",
  "credibility": "<low/medium/high — how credible is the overall narrative>"
}
Only return valid JSON.`;

export async function multiModelConsensus(query: string, articles: Article[]): Promise<ConsensusResult> {
  const articleSummary = articles
    .slice(0, 8)
    .map(a => `[${a.source}] ${a.title}: ${a.snippet?.slice(0, 200)}`)
    .join('\n');

  const userMsg = `Topic: ${query}\n\nArticles:\n${articleSummary}`;

  const modelResults = await Promise.allSettled(
    CONSENSUS_PERSPECTIVES.map(async ({ model, label, temp }) => {
      const perspectivePrompt = label === 'Critical Skeptic'
        ? CONSENSUS_PROMPT + '\nBe extra skeptical. Question claims that lack strong evidence.'
        : label === 'Context Expert'
        ? CONSENSUS_PROMPT + '\nFocus heavily on missing context and what the articles do NOT cover.'
        : CONSENSUS_PROMPT;

      const res = await aiChat({
        model,
        messages: [
          { role: 'system', content: perspectivePrompt },
          { role: 'user', content: userMsg },
        ],
        temperature: temp,
        max_tokens: 1024,
      }) as any;

      const text = res.choices?.[0]?.message?.content || '{}';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch?.[0] || '{}');
      return { model: label, ...parsed };
    })
  );

  const models = modelResults
    .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
    .map(r => r.value);

  // Find disagreements
  const disagreements: string[] = [];
  const sentiments = [...new Set(models.map(m => m.sentiment))];
  if (sentiments.length > 1) {
    disagreements.push(`Sentiment disagreement: ${models.map(m => `${m.model.split('/')[1]}: ${m.sentiment}`).join(', ')}`);
  }
  const credibilities = [...new Set(models.map(m => m.credibility))];
  if (credibilities.length > 1) {
    disagreements.push(`Credibility disagreement: ${models.map(m => `${m.model.split('/')[1]}: ${m.credibility}`).join(', ')}`);
  }

  // Generate final synthesis
  const synthesisRes = await aiChat({
    model: 'openai/gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an objective news synthesizer. Given analyses from multiple AI models, produce a balanced, factual summary. Highlight where models agree and where they disagree. Be concise (3-5 sentences).',
      },
      {
        role: 'user',
        content: `Query: ${query}\n\nModel analyses:\n${JSON.stringify(models, null, 2)}\n\nDisagreements found: ${JSON.stringify(disagreements)}`,
      },
    ],
    temperature: 0.2,
    max_tokens: 512,
  }) as any;

  const agreement = models.length > 0
    ? 1 - (disagreements.length / (models.length * 2))
    : 0;

  return {
    query,
    models,
    agreement_score: Math.max(0, Math.min(1, agreement)),
    disagreements,
    final_synthesis: synthesisRes.choices?.[0]?.message?.content || 'Unable to synthesize.',
  };
}

// ─── Debate Mode ─────────────────────────────────────────────

const DEBATE_PROMPT = `You are generating a structured debate on a topic. Given the topic and source articles, produce a JSON response:
{
  "pro": {
    "position": "<clear statement of the pro position>",
    "arguments": ["<argument 1>", "<argument 2>", "<argument 3>"],
    "sources": [{"title": "<source>", "url": "<url>"}]
  },
  "con": {
    "position": "<clear statement of the con position>",
    "arguments": ["<argument 1>", "<argument 2>", "<argument 3>"],
    "sources": [{"title": "<source>", "url": "<url>"}]
  },
  "neutral_summary": "<2-3 sentence balanced take>"
}
Use ONLY facts from the provided sources. Be intellectually honest on both sides. Only return valid JSON.`;

export async function generateDebate(topic: string, articles: Article[]) {
  const articleCtx = articles
    .slice(0, 10)
    .map(a => `[${a.source}] ${a.title}\n${a.snippet?.slice(0, 300)}\nURL: ${a.url}`)
    .join('\n\n');

  const res = await aiChat({
    model: 'openai/gpt-4o-mini',
    messages: [
      { role: 'system', content: DEBATE_PROMPT },
      { role: 'user', content: `Topic: ${topic}\n\nSources:\n${articleCtx}` },
    ],
    temperature: 0.4,
    max_tokens: 2048,
  }) as any;

  const text = res.choices?.[0]?.message?.content || '{}';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return { topic, ...JSON.parse(jsonMatch?.[0] || '{}') };
}

// ─── Helpers ─────────────────────────────────────────────────

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function defaultBias(article: Article): BiasScore {
  return {
    article_id: article.id || 0,
    political_lean: 0,
    emotional: 0.5,
    opinion_ratio: 0.5,
    sensationalism: 0.5,
    source_credibility: 0.5,
    model_used: 'default',
    reasoning: 'Analysis failed, using defaults',
  };
}
