export type Horizon = '24H' | '1W' | '1M';
export type FeedFilter = 'Top Picks' | 'My Sectors' | 'Breaking' | 'Policy' | 'Supply Chain';
export type ScreenName = 'focus' | 'feed' | 'story' | 'sources';

export type FocusProfile = {
  sectors: string[];
  tickers: string[];
  topics: string[];
  horizon: Horizon;
};

export type BiasBucket = {
  id: 'left' | 'center' | 'right';
  label: 'Left' | 'Center' | 'Right';
  share: number;
  outlets: string[];
  framingSummary: string;
  framingWords: string[];
};

export type ImpactScore = {
  label: string;
  value: number;
};

export type Story = {
  id: string;
  headline: string;
  summary: string;
  whyItMatters: string;
  topic: string;
  time: string;
  urgency: 'Elevated' | 'High' | 'Critical';
  objectivityScore: number;
  sourceCount: number;
  impactHint: string;
  relatedTickers: string[];
  relatedSectors: string[];
  sectorImpact: ImpactScore[];
  sourceLens: BiasBucket[];
};

export const DEFAULT_FOCUS_PROFILE: FocusProfile = {
  sectors: ['Semiconductors', 'Materials'],
  tickers: ['NVDA', 'MP'],
  topics: ['Geopolitics', 'Supply Chain'],
  horizon: '1W',
};

export const focusOptions = {
  sectors: ['Semiconductors', 'Materials', 'Energy', 'Defense', 'AI Infrastructure', 'Macro'],
  tickers: ['NVDA', 'MP', 'SMH', 'LMT', 'XLE', 'TSM'],
  topics: ['Geopolitics', 'Supply Chain', 'Policy', 'Earnings', 'Rates', 'Trade'],
  horizons: ['24H', '1W', '1M'] as Horizon[],
};

export const demoStories: Story[] = [
  {
    id: 'rare-earth-controls',
    headline: 'China expands rare earth export reviews as chip supply chains brace for delay risk',
    summary:
      'Beijing tightened administrative review around rare earth exports, raising the probability of slower shipments into semiconductor and defense supply chains. Coverage converges on the trade friction, but the framing differs sharply on whether this is industrial policy, retaliation, or a manageable bottleneck.',
    whyItMatters:
      'Your focus profile overlaps directly with the exposed sectors. Domestic materials names may benefit from substitution demand, while semiconductor ETFs face near-term volatility if component lead times stretch.',
    topic: 'Geopolitics',
    time: '12m ago',
    urgency: 'Critical',
    objectivityScore: 91,
    sourceCount: 28,
    impactHint: 'Positive for domestic rare earth producers, caution for semiconductor supply chains.',
    relatedTickers: ['MP', 'SMH', 'NVDA', 'TSM'],
    relatedSectors: ['Materials', 'Semiconductors', 'Defense'],
    sectorImpact: [
      { label: 'Materials', value: 84 },
      { label: 'Semiconductors', value: -72 },
      { label: 'Defense', value: 36 },
    ],
    sourceLens: [
      {
        id: 'left',
        label: 'Left',
        share: 31,
        outlets: ['The Guardian', 'NPR', 'Vox'],
        framingSummary:
          'Focuses on the geopolitical escalation and the downstream risk to global manufacturing workers, highlighting how policy conflict spills into consumer costs and fragile supply chains.',
        framingWords: ['escalation', 'fragile', 'global supply chains'],
      },
      {
        id: 'center',
        label: 'Center',
        share: 42,
        outlets: ['Reuters', 'AP', 'BBC'],
        framingSummary:
          'Leads with the export-control mechanics, shipment impact, and quotes from ministries and analysts. The tone is more procedural and fact-dense than ideological.',
        framingWords: ['review process', 'shipment delays', 'official statement'],
      },
      {
        id: 'right',
        label: 'Right',
        share: 27,
        outlets: ['Fox Business', 'WSJ Opinion', 'National Review'],
        framingSummary:
          'Frames the move as strategic leverage in a wider competition with the U.S., emphasizing resilience, domestic sourcing, and the need for industrial self-sufficiency.',
        framingWords: ['strategic leverage', 'domestic sourcing', 'resilience'],
      },
    ],
  },
  {
    id: 'fed-pause-reits',
    headline: 'Fed minutes keep pause intact but inflation stickiness clouds rate-cut bets',
    summary:
      'Fresh minutes reinforced a cautious pause, but several policymakers flagged persistent services inflation. Coverage broadly agrees on the hold, while debate centers on whether real estate and small caps are vulnerable to a slower easing path.',
    whyItMatters:
      'The story matters if your risk horizon is under one month. High-duration sectors can reprice quickly when expected cuts get pushed further out.',
    topic: 'Rates',
    time: '39m ago',
    urgency: 'High',
    objectivityScore: 88,
    sourceCount: 24,
    impactHint: 'Pressure on rate-sensitive equities if cuts are repriced later.',
    relatedTickers: ['IYR', 'XLRE', 'TLT', 'UUP'],
    relatedSectors: ['Macro', 'Real Estate', 'Financials'],
    sectorImpact: [
      { label: 'Real Estate', value: -68 },
      { label: 'Macro', value: 74 },
      { label: 'Financials', value: 32 },
    ],
    sourceLens: [
      {
        id: 'left',
        label: 'Left',
        share: 29,
        outlets: ['MSNBC', 'NPR', 'The Atlantic'],
        framingSummary:
          'Emphasizes consumer strain and the real-world cost of prolonged inflation, often connecting the hold to wage pressure and affordability concerns.',
        framingWords: ['affordability', 'consumer strain', 'wage pressure'],
      },
      {
        id: 'center',
        label: 'Center',
        share: 46,
        outlets: ['Bloomberg', 'Reuters', 'PBS'],
        framingSummary:
          'Details which voting members sounded hawkish, what changed in inflation language, and how futures markets repriced the probability of cuts.',
        framingWords: ['repricing', 'minutes', 'futures probability'],
      },
      {
        id: 'right',
        label: 'Right',
        share: 25,
        outlets: ['Fox Business', 'WSJ Opinion'],
        framingSummary:
          'Stresses policy credibility and warns against easing too soon, arguing that market optimism had run ahead of the actual inflation path.',
        framingWords: ['credibility', 'premature cuts', 'market optimism'],
      },
    ],
  },
  {
    id: 'energy-shipping-risk',
    headline: 'Shipping insurers reprice Gulf routes as regional conflict lifts crude risk premium',
    summary:
      'Marine insurers raised premiums on key Gulf corridors after renewed conflict warnings, increasing the implied risk premium in crude. Most outlets agree the shipping costs matter more than immediate production losses.',
    whyItMatters:
      'Energy names can benefit from the supply-risk premium, but the move also raises transport costs for industrials and chemicals. This is a story where second-order effects matter more than the headline spike.',
    topic: 'Supply Chain',
    time: '1h ago',
    urgency: 'Elevated',
    objectivityScore: 86,
    sourceCount: 19,
    impactHint: 'Supports energy prices but complicates transport-sensitive sectors.',
    relatedTickers: ['XLE', 'CVX', 'DOW'],
    relatedSectors: ['Energy', 'Industrials', 'Chemicals'],
    sectorImpact: [
      { label: 'Energy', value: 78 },
      { label: 'Industrials', value: -34 },
      { label: 'Chemicals', value: -29 },
    ],
    sourceLens: [
      {
        id: 'left',
        label: 'Left',
        share: 34,
        outlets: ['The Guardian', 'Al Jazeera'],
        framingSummary:
          'Leans into humanitarian and diplomatic instability, with shipping cost inflation treated as one symptom of a broader regional deterioration.',
        framingWords: ['regional deterioration', 'humanitarian', 'diplomatic fallout'],
      },
      {
        id: 'center',
        label: 'Center',
        share: 41,
        outlets: ['Reuters', 'CNBC', 'BBC'],
        framingSummary:
          'Keeps the focus on freight insurance, freight routes, and the crude premium implied by higher logistics risk.',
        framingWords: ['insurance premium', 'freight routes', 'risk premium'],
      },
      {
        id: 'right',
        label: 'Right',
        share: 25,
        outlets: ['Fox Business', 'The Economist'],
        framingSummary:
          'Frames the event through energy security and strategic deterrence, stressing the importance of maintaining open trade lanes.',
        framingWords: ['energy security', 'deterrence', 'open trade lanes'],
      },
    ],
  },
];

export function findStoryById(storyId: string) {
  return demoStories.find((story) => story.id === storyId);
}
