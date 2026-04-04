import { create } from 'zustand';

/** Ephemeral session state — not persisted across app restarts */
interface SessionState {
  /** Currently active story context for story→chat→decision flow */
  activeStoryId: string | null;
  /** Whether the app is loading initial data */
  isLoading: boolean;
  /** Global error message */
  error: string | null;

  setActiveStory: (storyId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useSessionStore = create<SessionState>()((set) => ({
  activeStoryId: null,
  isLoading: false,
  error: null,

  setActiveStory: (activeStoryId) => set({ activeStoryId }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
