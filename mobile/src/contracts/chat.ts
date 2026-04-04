// Chat thread and message types

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  threadId: string;
  role: ChatRole;
  content: string;
  /** ISO-8601 timestamp */
  createdAt: string;
  /** Optional impact analysis block attached to an assistant message */
  impactAnalysis?: ImpactAnalysisBlock;
}

export interface ImpactAnalysisBlock {
  ticker: string;
  expectedMove: string;
  confidence: number;
  rationale: string;
}

export interface ChatThreadSummary {
  id: string;
  /** ID of the story this thread is about */
  storyId: string;
  /** Story headline for display */
  storyHeadline: string;
  /** Preview of last message */
  lastMessagePreview: string;
  /** Number of messages in thread */
  messageCount: number;
  /** ISO-8601 timestamp of last activity */
  updatedAt: string;
  /** ISO-8601 timestamp of creation */
  createdAt: string;
}

export interface SuggestedPrompt {
  id: string;
  label: string;
  prompt: string;
}
