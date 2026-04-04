export type PulseTopic = 'MACRO' | 'GEOPOLITICS' | 'EARNINGS' | 'TECH' | 'COMMODITIES';
export type ViewpointLabel = 'LEFT' | 'CENTER' | 'RIGHT';
export type SignalAction = 'LONG' | 'SHORT' | 'HEDGE';

export interface PulseViewpoint {
  label: ViewpointLabel;
  pct: number;
  color: string;
  take: string;
}

export interface PulseBiasDistribution {
  left: number;
  center: number;
  right: number;
}

export interface SectorImpact {
  sector: string;
  impact: number;
  color: string;
}

export interface RelatedTicker {
  symbol: string;
  change: number;
}

export interface FeedEvent {
  id: string;
  headline: string;
  topic: PulseTopic;
  topicColor: string;
  time: string;
  objectivity: number;
  sources: number;
  urgency: 1 | 2 | 3;
  brief: string;
  viewpoints: PulseViewpoint[];
  biasDistribution: PulseBiasDistribution;
  sectorImpact: SectorImpact[];
  relatedTickers: RelatedTicker[];
}

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

export interface PortfolioHoldingRequest {
  ticker: string;
  shares: number;
  avgCost: number;
}

export interface HoldingExposure {
  headline: string;
  impact: number;
}

export interface PortfolioHoldingImpact {
  ticker: string;
  name: string;
  weight: number;
  value: number;
  geoImpact: number;
  exposedTo: HoldingExposure[];
}

export interface PortfolioImpactRequest {
  holdings: PortfolioHoldingRequest[];
}

export interface PortfolioImpactResponse {
  totalValue: number;
  aggregateRisk: number;
  totalImpact: number;
  holdings: PortfolioHoldingImpact[];
}

export interface BriefingResponse {
  audioUrl: string;
  transcript: string;
  duration: number;
  generatedAt: string;
  storiesCount: number;
}

export interface ArticleRecord {
  id: string;
  sourceUrl: string;
  sourceName: string;
  sourceLean: 'left' | 'center' | 'right';
  title: string;
  body: string;
  published: string;
  ingested: string;
  eventId: string | null;
}

export interface ProcessMemoryEntry {
  id: string;
  scope: 'pipeline' | 'portfolio' | 'briefing' | 'signals';
  title: string;
  details: string;
  recordedAt: string;
  metadata?: Record<string, unknown>;
}

export interface RuntimeStore {
  articles: ArticleRecord[];
  events: FeedEvent[];
  signals: TradeSignal[];
  portfolios: PortfolioImpactRequest[];
  briefings: BriefingResponse[];
  memoryEntries: ProcessMemoryEntry[];
}
