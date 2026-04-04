import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

loadDotenv();

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
    if (normalized === 'false' || normalized === '0' || normalized === 'no' || normalized === '') return false;
  }
  return value;
}, z.boolean());

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8787),
  PULSE_STORE_PATH: z.string().default('backend/data/runtime-store.json'),
  PULSE_STRICT_LIVE_MODE: booleanFromEnv.default(false),
  MINIMAX_API_KEY: z.string().optional(),
  MINIMAX_BASE_URL: z.string().url().optional(),
  CLAUDE_API_KEY: z.string().optional(),
  CLAUDE_BASE_URL: z.string().url().optional(),
  ELEVENLABS_API_KEY: z.string().optional(),
  ELEVENLABS_VOICE_ID: z.string().optional(),
  MEMORI_API_KEY: z.string().optional(),
  MEMORI_SPACE_ID: z.string().optional(),
  INSFORGE_URL: z.string().url().optional(),
  INSFORGE_API_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
