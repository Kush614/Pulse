import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DecisionRecord, DecisionAction } from '../contracts';
import { asyncStorageAdapter } from './storage';

interface DecisionState {
  decisions: DecisionRecord[];

  addDecision: (decision: DecisionRecord) => void;
  updateDecision: (id: string, patch: Partial<DecisionRecord>) => void;
  removeDecision: (id: string) => void;
  getDecisionsForStory: (storyId: string) => DecisionRecord[];
  getDecisionsByAction: (action: DecisionAction) => DecisionRecord[];
}

export const useDecisionStore = create<DecisionState>()(
  persist(
    (set, get) => ({
      decisions: [],

      addDecision: (decision) =>
        set((s) => ({ decisions: [decision, ...s.decisions] })),

      updateDecision: (id, patch) =>
        set((s) => ({
          decisions: s.decisions.map((d) =>
            d.id === id ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d,
          ),
        })),

      removeDecision: (id) =>
        set((s) => ({
          decisions: s.decisions.filter((d) => d.id !== id),
        })),

      getDecisionsForStory: (storyId) =>
        get().decisions.filter((d) => d.storyId === storyId),

      getDecisionsByAction: (action) =>
        get().decisions.filter((d) => d.action === action),
    }),
    {
      name: 'pulse.decisions',
      storage: createJSONStorage(() => asyncStorageAdapter),
    },
  ),
);
