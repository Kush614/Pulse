import { create } from 'zustand';
import { FocusPreferences, DEFAULT_FOCUS, PulseTopic } from '../contracts';

interface FocusState extends FocusPreferences {
  setTopics: (topics: PulseTopic[]) => void;
  setTickers: (tickers: string[]) => void;
  setMinUrgency: (level: 1 | 2 | 3) => void;
  completeSetup: () => void;
  reset: () => void;
}

export const useFocusStore = create<FocusState>()(
  (set) => ({
    ...DEFAULT_FOCUS,
    setTopics: (topics) => set({ topics }),
    setTickers: (tickers) => set({ tickers }),
    setMinUrgency: (minUrgency) => set({ minUrgency }),
    completeSetup: () => set({ setupComplete: true }),
    reset: () => set(DEFAULT_FOCUS),
  }),
);
