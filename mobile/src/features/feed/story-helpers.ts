import type { FeedFilter, FocusProfile, Story } from '../story/types';

export function scoreStoryForProfile(story: Story, profile: FocusProfile) {
  let score = story.objectivityScore;

  for (const sector of profile.sectors) {
    if (story.relatedSectors.includes(sector)) {
      score += 24;
    }
  }

  for (const ticker of profile.tickers) {
    if (story.relatedTickers.includes(ticker)) {
      score += 16;
    }
  }

  if (profile.topics.includes(story.topic)) {
    score += 20;
  }

  if (profile.horizon === '24H' && (story.urgency === 'Critical' || story.urgency === 'High')) {
    score += 12;
  }

  if (profile.horizon === '1M' && story.topic === 'Rates') {
    score += 8;
  }

  return score;
}

export function filterStories(stories: Story[], filter: FeedFilter, profile: FocusProfile) {
  const rankedStories = [...stories].sort(
    (left, right) => scoreStoryForProfile(right, profile) - scoreStoryForProfile(left, profile),
  );

  if (filter === 'Top Picks') {
    return rankedStories;
  }

  if (filter === 'My Sectors') {
    return rankedStories.filter((story) =>
      story.relatedSectors.some((sector) => profile.sectors.includes(sector)),
    );
  }

  if (filter === 'Breaking') {
    return rankedStories.filter((story) => story.urgency === 'Critical' || story.urgency === 'High');
  }

  if (filter === 'Policy') {
    return rankedStories.filter((story) => story.topic === 'Rates' || story.topic === 'Geopolitics');
  }

  return rankedStories.filter((story) => story.topic === 'Supply Chain');
}

export function formatImpact(value: number) {
  return `${value > 0 ? '+' : ''}${value}`;
}
