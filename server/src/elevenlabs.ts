// ============================================================
// Nova News — ElevenLabs TTS Service
// ============================================================

import { storageUpload } from './insforge.js';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const ELEVENLABS_VOICE_NOVA = process.env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb';
// Second voice for debate mode (different persona)
const ELEVENLABS_VOICE_COUNTER = 'pNInz6obpgDQGcFmaJgB';  // "Adam" voice

// ─── Text to Speech ──────────────────────────────────────────

export async function textToSpeech(
  text: string,
  voiceId?: string,
  modelId?: string
): Promise<Buffer> {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId || ELEVENLABS_VOICE_NOVA}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text.slice(0, 5000), // ElevenLabs limit
        model_id: modelId || 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.75,
          style: 0.3,
          speed: 1.05,
        },
      }),
      signal: AbortSignal.timeout(60000),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ElevenLabs TTS: ${res.status} ${err}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ─── Generate & Upload Briefing ──────────────────────────────

export async function generateBriefingAudio(
  text: string,
  userId: string,
  label: string = 'briefing'
): Promise<string> {
  const audio = await textToSpeech(text);
  const filename = `${label}_${userId}_${Date.now()}.mp3`;
  const url = await storageUpload('audio', filename, audio, 'audio/mpeg');
  return url;
}

// ─── Generate Debate Audio (two voices) ──────────────────────

export async function generateDebateAudio(
  proText: string,
  conText: string,
  userId: string
): Promise<{ proUrl: string; conUrl: string }> {
  const [proAudio, conAudio] = await Promise.all([
    textToSpeech(proText, ELEVENLABS_VOICE_NOVA),
    textToSpeech(conText, ELEVENLABS_VOICE_COUNTER),
  ]);

  const ts = Date.now();
  const [proUrl, conUrl] = await Promise.all([
    storageUpload('audio', `debate_pro_${userId}_${ts}.mp3`, proAudio, 'audio/mpeg'),
    storageUpload('audio', `debate_con_${userId}_${ts}.mp3`, conAudio, 'audio/mpeg'),
  ]);

  return { proUrl, conUrl };
}

// ─── Generate Breaking News Alert Audio ──────────────────────

export async function generateBreakingAlert(headline: string): Promise<Buffer> {
  const script = `Breaking news. ${headline}`;
  return textToSpeech(script, ELEVENLABS_VOICE_NOVA);
}

// ─── Multi-Language Briefing ─────────────────────────────────

const LANGUAGE_CODES: Record<string, string> = {
  en: 'en',
  es: 'es',
  fr: 'fr',
  de: 'de',
  zh: 'zh',
  ja: 'ja',
  pt: 'pt',
  ar: 'ar',
  hi: 'hi',
  ko: 'ko',
};

export async function generateMultiLangBriefing(
  text: string,
  language: string,
  userId: string
): Promise<string> {
  const langCode = LANGUAGE_CODES[language] || 'en';
  const audio = await textToSpeech(text, ELEVENLABS_VOICE_NOVA, 'eleven_multilingual_v2');
  const filename = `briefing_${langCode}_${userId}_${Date.now()}.mp3`;
  return storageUpload('audio', filename, audio, 'audio/mpeg');
}
