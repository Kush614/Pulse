import { SuggestedPrompt, FeedEvent } from '../../contracts';

let promptCounter = 0;

/** Generate story-aware suggested prompts based on a feed event. */
export function buildSuggestedPrompts(event: FeedEvent): SuggestedPrompt[] {
  const base: SuggestedPrompt[] = [
    {
      id: `sp-${++promptCounter}`,
      label: 'What does this mean for my portfolio?',
      prompt: `Analyze how "${event.headline}" impacts a diversified portfolio, especially tickers like ${event.relatedTickers.map((t) => t.symbol).join(', ')}.`,
    },
    {
      id: `sp-${++promptCounter}`,
      label: 'Compare viewpoints',
      prompt: `Compare the left, center, and right perspectives on "${event.headline}" and highlight where they disagree most.`,
    },
    {
      id: `sp-${++promptCounter}`,
      label: 'Historical precedent?',
      prompt: `Has anything similar to "${event.headline}" happened before? What was the market outcome?`,
    },
  ];

  if (event.sectorImpact.length > 0) {
    const topSector = event.sectorImpact.reduce((a, b) =>
      Math.abs(b.impact) > Math.abs(a.impact) ? b : a,
    );
    base.push({
      id: `sp-${++promptCounter}`,
      label: `${topSector.sector} impact`,
      prompt: `Deep dive into why the ${topSector.sector} sector is expected to move ${topSector.impact > 0 ? 'up' : 'down'} ${Math.abs(topSector.impact)}% due to "${event.headline}".`,
    });
  }

  return base;
}

/** Generate a unique ID. */
export function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
