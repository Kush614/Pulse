// FocusPreferences — user's personalization settings

import { PulseTopic } from './feed';

export interface FocusPreferences {
  /** Selected sector/topic interests */
  topics: PulseTopic[];
  /** Watched ticker symbols */
  tickers: string[];
  /** Minimum urgency level to surface (1=all, 2=medium+, 3=critical only) */
  minUrgency: 1 | 2 | 3;
  /** Whether onboarding focus setup has been completed */
  setupComplete: boolean;
}

export const DEFAULT_FOCUS: FocusPreferences = {
  topics: [],
  tickers: [],
  minUrgency: 1,
  setupComplete: false,
};
