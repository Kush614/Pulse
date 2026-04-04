import { create } from 'zustand';
import { StoryContext } from '../contracts';

const MAX_RECENT = 50;

interface RecentStoriesState {
  stories: StoryContext[];
  addStory: (story: StoryContext) => void;
  clearHistory: () => void;
}

export const useRecentStoriesStore = create<RecentStoriesState>()(
  (set) => ({
    stories: [],

    addStory: (story) =>
      set((state) => {
        const filtered = state.stories.filter(
          (recent) => recent.event.id !== story.event.id,
        );
        return { stories: [story, ...filtered].slice(0, MAX_RECENT) };
      }),

    clearHistory: () => set({ stories: [] }),
  }),
);
