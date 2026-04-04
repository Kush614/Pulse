// Feed & story data shapes returned by GET /api/feed

export type PulseTopic =
  | 'MACRO'
  | 'GEOPOLITICS'
  | 'EARNINGS'
  | 'TECH'
  | 'COMMODITIES';

export type ViewpointLabel = 'LEFT' | 'CENTER' | 'RIGHT';

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
