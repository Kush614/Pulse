import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { BriefingResponse, FeedEvent, TradeSignal } from '../contracts.js';
import { env } from '../env.js';
import { RuntimeStoreRepository } from '../lib/runtime-store.js';
import { loadFallbackBriefing } from './fallback-data.js';
import { refreshFeedPipeline } from './feed-pipeline.js';
import { syncBriefingToInsforge } from './insforge-sync.js';
import { assertStrictLive, isStrictLiveMode } from './live-mode.js';
import { generateSignals } from './signals.js';

const storeRepo = new RuntimeStoreRepository();

function estimateDurationSeconds(transcript: string) {
  return Math.max(18, Math.round(transcript.split(/\s+/).length / 2.4));
}

function isFallbackAudioUrl(audioUrl: string | null | undefined) {
  return !audioUrl || audioUrl === '/static/briefings/fallback-briefing.wav';
}

function buildBriefingScript(events: FeedEvent[], signals: TradeSignal[]) {
  const topStories = events.slice(0, 5);
  const sections = topStories.map((event, index) => {
    const signal = signals.find((candidate) => candidate.triggeringStory === event.headline);
    const recommendation = signal ? `Recommended action: ${signal.action} ${signal.ticker} with ${signal.confidence} confidence.` : 'Recommended action: monitor for confirmation before sizing risk.';
    return [
      `${index === 0 ? 'First' : index === 1 ? 'Second' : index === 2 ? 'Third' : index === 3 ? 'Fourth' : 'Finally'}: ${event.headline}.`,
      event.brief,
      recommendation,
    ].join(' ');
  });

  return [
    `Good morning. ${topStories.length} stories require your attention today.`,
    ...sections,
    `That's your Pulse briefing for ${new Date().toLocaleDateString('en-US')}. Markets open in ${new Date().getHours() < 9 ? 30 : 0} minutes.`,
  ].join('\n\n');
}

async function synthesizeWithElevenLabs(script: string) {
  if (process.env.VITEST) return '/static/briefings/test-briefing.mp3';
  if (!env.ELEVENLABS_API_KEY || !env.ELEVENLABS_VOICE_ID) return null;

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${env.ELEVENLABS_VOICE_ID}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': env.ELEVENLABS_API_KEY,
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text: script,
      model_id: 'eleven_flash_v2_5',
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.7,
      },
    }),
    signal: AbortSignal.timeout(25_000),
  });

  if (!response.ok) return null;

  const outputDir = join(process.cwd(), 'backend', 'public', 'briefings');
  await mkdir(outputDir, { recursive: true });
  const fileName = `generated-${Date.now()}.mp3`;
  const absolutePath = join(outputDir, fileName);
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(absolutePath, buffer);
  return `/static/briefings/${fileName}`;
}

export async function generateBriefing(force = false): Promise<BriefingResponse | null> {
  const store = await storeRepo.read();
  const lastBriefing = store.meta?.lastBriefingAt ? new Date(store.meta.lastBriefingAt).getTime() : 0;
  const freshEnough = Date.now() - lastBriefing < 6 * 60 * 60_000;

  if (process.env.VITEST && !force) {
    return store.briefings[0] ?? await loadFallbackBriefing();
  }

  if (!force && freshEnough && store.briefings[0] && (!isStrictLiveMode() || !isFallbackAudioUrl(store.briefings[0].audioUrl))) {
    return store.briefings[0];
  }

  const [{ events }, signals] = await Promise.all([
    refreshFeedPipeline(false),
    generateSignals(false),
  ]);
  const activeEvents = events.length > 0 ? events : store.events;
  assertStrictLive(
    activeEvents.length > 0,
    'Cannot generate a live briefing without active live events. Strict live mode is enabled.',
  );
  if (activeEvents.length === 0) return loadFallbackBriefing();

  const transcript = buildBriefingScript(activeEvents, signals);
  const generatedAt = new Date().toISOString();
  const audioUrl = await synthesizeWithElevenLabs(transcript);
  assertStrictLive(
    audioUrl && !isFallbackAudioUrl(audioUrl),
    'ElevenLabs audio generation failed or is not configured. Strict live mode is enabled, so fallback audio cannot be served.',
  );
  const fallback = await loadFallbackBriefing();

  const briefing: BriefingResponse = {
    audioUrl: audioUrl ?? fallback?.audioUrl ?? '/static/briefings/fallback-briefing.wav',
    transcript,
    duration: estimateDurationSeconds(transcript),
    generatedAt,
    storiesCount: activeEvents.slice(0, 5).length,
  };

  const latestStore = await storeRepo.read();
  await storeRepo.write({
    ...latestStore,
    briefings: [briefing, ...latestStore.briefings].slice(0, 10),
    meta: {
      ...latestStore.meta,
      lastBriefingAt: generatedAt,
    },
  });
  await syncBriefingToInsforge(briefing);

  return briefing;
}
