// Decision record types

export type DecisionAction = 'watchlist' | 'alert' | 'avoid' | 'conviction';

export interface DecisionRecord {
  id: string;
  /** ID of the story that prompted this decision */
  storyId: string;
  /** Story headline for display */
  storyHeadline: string;
  /** Primary action taken */
  action: DecisionAction;
  /** Related ticker symbol, if any */
  ticker?: string;
  /** User's personal note / conviction thesis */
  note: string;
  /** ID of linked chat thread, if any */
  linkedThreadId?: string;
  /** Summary of linked chat, if any */
  linkedChatSummary?: string;
  /** ISO-8601 timestamp */
  createdAt: string;
  /** ISO-8601 timestamp */
  updatedAt: string;
}
