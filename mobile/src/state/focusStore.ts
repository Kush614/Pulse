import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { FocusPreferences, DEFAULT_FOCUS, PulseTopic } from '../contracts';
import { asyncStorageAdapter } from './storage';

interface FocusState extends FocusPreferences {
  setTopics: (topics: PulseTopic[]) => void;
  setTickers: (tickers: string[]) => void;
  setMinUrgency: (level: 1 | 2 | 3) => void;
  completeSetup: () => void;
  reset: () => void;
}

export const useFocusStore = create<FocusState>()(
  persist(
    (set) => ({
      ...DEFAULT_FOCUS,
      setTopics: (topics) => set({ topics }),
      setTickers: (tickers) => set({ tickers }),
      setMinUrgency: (minUrgency) => set({ minUrgency }),
      completeSetup: () => set({ setupComplete: true }),
      reset: () => set(DEFAULT_FOCUS),
    }),
    {
      name: 'pulse.focus',
      storage: createJSONStorage(() => asyncStorageAdapter),
    },
  ),
);
