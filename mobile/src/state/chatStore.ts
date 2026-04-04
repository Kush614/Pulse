import { create } from 'zustand';
import { ChatThreadSummary, ChatMessage } from '../contracts';

interface ChatState {
  /** All thread summaries, newest first */
  threads: ChatThreadSummary[];
  /** Messages keyed by threadId */
  messagesByThread: Record<string, ChatMessage[]>;
  /** ID of last opened thread (for resume) */
  lastOpenedThreadId: string | null;

  addThread: (thread: ChatThreadSummary) => void;
  updateThread: (threadId: string, patch: Partial<ChatThreadSummary>) => void;
  removeThread: (threadId: string) => void;
  addMessage: (message: ChatMessage) => void;
  setLastOpenedThread: (threadId: string) => void;
  getThreadForStory: (storyId: string) => ChatThreadSummary | undefined;
}

export const useChatStore = create<ChatState>()(
  (set, get) => ({
    threads: [],
    messagesByThread: {},
    lastOpenedThreadId: null,

    addThread: (thread) =>
      set((state) => ({ threads: [thread, ...state.threads] })),

    updateThread: (threadId, patch) =>
      set((state) => ({
        threads: state.threads.map((thread) =>
          thread.id === threadId ? { ...thread, ...patch } : thread,
        ),
      })),

    removeThread: (threadId) =>
      set((state) => ({
        threads: state.threads.filter((thread) => thread.id !== threadId),
        messagesByThread: Object.fromEntries(
          Object.entries(state.messagesByThread).filter(
            ([key]) => key !== threadId,
          ),
        ),
      })),

    addMessage: (message) =>
      set((state) => ({
        messagesByThread: {
          ...state.messagesByThread,
          [message.threadId]: [
            ...(state.messagesByThread[message.threadId] ?? []),
            message,
          ],
        },
      })),

    setLastOpenedThread: (threadId) =>
      set({ lastOpenedThreadId: threadId }),

    getThreadForStory: (storyId) =>
      get().threads.find((thread) => thread.storyId === storyId),
  }),
);
