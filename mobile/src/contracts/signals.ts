// Trade signals returned by GET /api/signals

export type SignalAction = 'LONG' | 'SHORT' | 'HEDGE';

export interface TradeSignal {
  id: string;
  action: SignalAction;
  ticker: string;
  name: string;
  rationale: string;
  expectedMove: string;
  timeframe: string;
  confidence: number;
  triggeringStory: string;
  historicalMatch: string;
}
