import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { StoryContext } from '../contracts';
import { asyncStorageAdapter } from './storage';

const MAX_RECENT = 50;

interface RecentStoriesState {
  stories: StoryContext[];
  addStory: (story: StoryContext) => void;
  clearHistory: () => void;
}

export const useRecentStoriesStore = create<RecentStoriesState>()(
  persist(
    (set) => ({
      stories: [],

      addStory: (story) =>
        set((s) => {
          // Deduplicate by event ID, move to front
          const filtered = s.stories.filter(
            (r) => r.event.id !== story.event.id,
          );
          return { stories: [story, ...filtered].slice(0, MAX_RECENT) };
        }),

      clearHistory: () => set({ stories: [] }),
    }),
    {
      name: 'pulse.recentStories',
      storage: createJSONStorage(() => asyncStorageAdapter),
    },
  ),
);
