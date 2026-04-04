import { env } from '../env.js';

export function assertStrictLive(condition: unknown, message: string): void {
  if (env.PULSE_STRICT_LIVE_MODE && !condition) {
    throw new Error(message);
  }
}

export function isStrictLiveMode(): boolean {
  return env.PULSE_STRICT_LIVE_MODE;
}
