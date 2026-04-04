import { create } from 'zustand';
import { DecisionRecord, DecisionAction } from '../contracts';

interface DecisionState {
  decisions: DecisionRecord[];

  addDecision: (decision: DecisionRecord) => void;
  updateDecision: (id: string, patch: Partial<DecisionRecord>) => void;
  removeDecision: (id: string) => void;
  getDecisionsForStory: (storyId: string) => DecisionRecord[];
  getDecisionsByAction: (action: DecisionAction) => DecisionRecord[];
}

export const useDecisionStore = create<DecisionState>()(
  (set, get) => ({
    decisions: [],

    addDecision: (decision) =>
      set((state) => ({ decisions: [decision, ...state.decisions] })),

    updateDecision: (id, patch) =>
      set((state) => ({
        decisions: state.decisions.map((decision) =>
          decision.id === id
            ? { ...decision, ...patch, updatedAt: new Date().toISOString() }
            : decision,
        ),
      })),

    removeDecision: (id) =>
      set((state) => ({
        decisions: state.decisions.filter((decision) => decision.id !== id),
      })),

    getDecisionsForStory: (storyId) =>
      get().decisions.filter((decision) => decision.storyId === storyId),

    getDecisionsByAction: (action) =>
      get().decisions.filter((decision) => decision.action === action),
  }),
);
