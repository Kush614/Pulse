import { createClient } from '@insforge/sdk';
import { env } from '../env.js';
import type { BriefingResponse, FeedEvent, PortfolioImpactResponse, TradeSignal } from '../contracts.js';

function getClient() {
  if (!env.INSFORGE_URL || !env.INSFORGE_API_KEY) return null;
  return createClient({
    baseUrl: env.INSFORGE_URL,
    anonKey: env.INSFORGE_API_KEY,
    edgeFunctionToken: env.INSFORGE_API_KEY,
    isServerMode: true,
  });
}

export async function syncEventsToInsforge(events: FeedEvent[]): Promise<void> {
  const client = getClient();
  if (!client || events.length === 0) return;

  try {
    await client.database.from('events').upsert(
      events.map((event) => ({
        id: event.id,
        headline: event.headline,
        topic: event.topic,
        brief: event.brief,
        objectivity_score: event.objectivity,
        source_count: event.sources,
        urgency: event.urgency,
        bias_left_pct: event.biasDistribution.left,
        bias_center_pct: event.biasDistribution.center,
        bias_right_pct: event.biasDistribution.right,
        viewpoint_left: event.viewpoints.find((view) => view.label === 'LEFT')?.take ?? '',
        viewpoint_center: event.viewpoints.find((view) => view.label === 'CENTER')?.take ?? '',
        viewpoint_right: event.viewpoints.find((view) => view.label === 'RIGHT')?.take ?? '',
        sector_impact: event.sectorImpact,
      })),
      { onConflict: 'id' },
    );
  } catch (error) {
    console.warn('[insforge] event sync skipped', error);
  }
}

export async function syncSignalsToInsforge(signals: TradeSignal[]): Promise<void> {
  const client = getClient();
  if (!client || signals.length === 0) return;

  try {
    await client.database.from('signals').upsert(
      signals.map((signal) => ({
        id: signal.id,
        action: signal.action,
        ticker: signal.ticker,
        name: signal.name,
        rationale: signal.rationale,
        expected_move: signal.expectedMove,
        timeframe: signal.timeframe,
        confidence: signal.confidence,
        pattern_match: signal.historicalMatch,
      })),
      { onConflict: 'id' },
    );
  } catch (error) {
    console.warn('[insforge] signal sync skipped', error);
  }
}

export async function syncBriefingToInsforge(briefing: BriefingResponse): Promise<void> {
  const client = getClient();
  if (!client) return;

  try {
    await client.database.from('briefings').upsert([{
      id: briefing.generatedAt,
      audio_url: briefing.audioUrl,
      transcript: briefing.transcript,
      duration_seconds: briefing.duration,
      generated_at: briefing.generatedAt,
      stories_count: briefing.storiesCount,
    }], { onConflict: 'id' });
  } catch (error) {
    console.warn('[insforge] briefing sync skipped', error);
  }
}

export async function syncPortfolioToInsforge(result: PortfolioImpactResponse): Promise<void> {
  const client = getClient();
  if (!client) return;

  try {
    await client.database.from('portfolio_impacts').insert([{
      total_value: result.totalValue,
      aggregate_risk: result.aggregateRisk,
      total_impact: result.totalImpact,
      holdings: result.holdings,
      created_at: new Date().toISOString(),
    }]);
  } catch (error) {
    console.warn('[insforge] portfolio sync skipped', error);
  }
}
