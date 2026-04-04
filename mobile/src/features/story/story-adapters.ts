import type { FeedEvent, PulseTopic, StoryContext } from '../../contracts';
import { palette } from '../../theme/tokens';
import { findStoryById, type Story } from './types';

const TOPIC_MAP: Record<string, PulseTopic> = {
  Geopolitics: 'GEOPOLITICS',
  Rates: 'MACRO',
  'Supply Chain': 'COMMODITIES',
  Earnings: 'EARNINGS',
  Trade: 'MACRO',
  Policy: 'MACRO',
};

function mapTopicColor(topic: PulseTopic) {
  switch (topic) {
    case 'GEOPOLITICS':
      return palette.accent;
    case 'MACRO':
      return palette.horizon;
    case 'EARNINGS':
      return palette.positive;
    case 'TECH':
      return palette.biasLeft;
    case 'COMMODITIES':
      return palette.warning;
    default:
      return palette.text;
  }
}

function mapUrgencyLabel(urgency: Story['urgency']): 1 | 2 | 3 {
  if (urgency === 'Critical') {
    return 3;
  }

  if (urgency === 'High') {
    return 2;
  }

  return 1;
}

function mapUrgencyBack(urgency: 1 | 2 | 3): Story['urgency'] {
  if (urgency === 3) {
    return 'Critical';
  }

  if (urgency === 2) {
    return 'High';
  }

  return 'Elevated';
}

export function toFeedEvent(story: Story): FeedEvent {
  const topic = TOPIC_MAP[story.topic] ?? 'TECH';

  return {
    id: story.id,
    headline: story.headline,
    topic,
    topicColor: mapTopicColor(topic),
    time: story.time,
    objectivity: story.objectivityScore,
    sources: story.sourceCount,
    urgency: mapUrgencyLabel(story.urgency),
    brief: story.summary,
    viewpoints: story.sourceLens.map((bucket) => ({
      label: bucket.label.toUpperCase() as 'LEFT' | 'CENTER' | 'RIGHT',
      pct: bucket.share,
      color:
        bucket.id === 'left'
          ? palette.biasLeft
          : bucket.id === 'center'
            ? palette.biasCenter
            : palette.biasRight,
      take: bucket.framingSummary,
    })),
    biasDistribution: {
      left: story.sourceLens.find((bucket) => bucket.id === 'left')?.share ?? 0,
      center: story.sourceLens.find((bucket) => bucket.id === 'center')?.share ?? 0,
      right: story.sourceLens.find((bucket) => bucket.id === 'right')?.share ?? 0,
    },
    sectorImpact: story.sectorImpact.map((impact) => ({
      sector: impact.label,
      impact: impact.value,
      color: impact.value >= 0 ? palette.positive : palette.negative,
    })),
    relatedTickers: story.relatedTickers.map((ticker, index) => ({
      symbol: ticker,
      change: story.sectorImpact[index]?.value ?? 0,
    })),
  };
}

export function toStoryContext(story: Story): StoryContext {
  return {
    event: toFeedEvent(story),
    openedAt: new Date().toISOString(),
  };
}

export function fromStoryContext(context: StoryContext): Story {
  const existing = findStoryById(context.event.id);

  if (existing) {
    return existing;
  }

  return {
    id: context.event.id,
    headline: context.event.headline,
    summary: context.event.brief,
    whyItMatters: context.event.brief,
    topic: context.event.topic,
    time: context.event.time,
    urgency: mapUrgencyBack(context.event.urgency),
    objectivityScore: context.event.objectivity,
    sourceCount: context.event.sources,
    impactHint: context.event.brief,
    relatedTickers: context.event.relatedTickers.map((ticker) => ticker.symbol),
    relatedSectors: context.event.sectorImpact.map((impact) => impact.sector),
    sectorImpact: context.event.sectorImpact.map((impact) => ({
      label: impact.sector,
      value: impact.impact,
    })),
    sourceLens: context.event.viewpoints.map((viewpoint) => ({
      id: viewpoint.label.toLowerCase() as 'left' | 'center' | 'right',
      label:
        viewpoint.label === 'LEFT'
          ? 'Left'
          : viewpoint.label === 'CENTER'
            ? 'Center'
            : 'Right',
      share: viewpoint.pct,
      outlets: [],
      framingSummary: viewpoint.take,
      framingWords: viewpoint.take.split(' ').slice(0, 3),
    })),
  };
}
