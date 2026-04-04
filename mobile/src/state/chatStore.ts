import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ChatThreadSummary, ChatMessage } from '../contracts';
import { asyncStorageAdapter } from './storage';

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
  persist(
    (set, get) => ({
      threads: [],
      messagesByThread: {},
      lastOpenedThreadId: null,

      addThread: (thread) =>
        set((s) => ({ threads: [thread, ...s.threads] })),

      updateThread: (threadId, patch) =>
        set((s) => ({
          threads: s.threads.map((t) =>
            t.id === threadId ? { ...t, ...patch } : t,
          ),
        })),

      removeThread: (threadId) =>
        set((s) => ({
          threads: s.threads.filter((t) => t.id !== threadId),
          messagesByThread: Object.fromEntries(
            Object.entries(s.messagesByThread).filter(
              ([key]) => key !== threadId,
            ),
          ),
        })),

      addMessage: (message) =>
        set((s) => ({
          messagesByThread: {
            ...s.messagesByThread,
            [message.threadId]: [
              ...(s.messagesByThread[message.threadId] ?? []),
              message,
            ],
          },
        })),

      setLastOpenedThread: (threadId) =>
        set({ lastOpenedThreadId: threadId }),

      getThreadForStory: (storyId) =>
        get().threads.find((t) => t.storyId === storyId),
    }),
    {
      name: 'pulse.chatThreads',
      storage: createJSONStorage(() => asyncStorageAdapter),
    },
  ),
);
