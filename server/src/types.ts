// ============================================================
// Nova News — Type Definitions
// ============================================================

export interface Article {
  id?: number;
  title: string;
  url: string;
  source: string;
  snippet?: string;
  full_text?: string;
  published_at?: string;
  fetched_at?: string;
  category?: string;
  metadata?: Record<string, unknown>;
}

export interface BiasScore {
  id?: number;
  article_id: number;
  political_lean: number;    // -1 (left) to +1 (right)
  emotional: number;         // 0 (factual) to 1 (emotional)
  opinion_ratio: number;     // 0 (reporting) to 1 (opinion)
  sensationalism: number;
  source_credibility: number;
  model_used: string;
  reasoning?: string;
}

export interface BiasRadarData {
  article: Article;
  scores: BiasScore[];
  avg: {
    political_lean: number;
    emotional: number;
    opinion_ratio: number;
    sensationalism: number;
    credibility: number;
  };
}

export interface ConsensusResult {
  query: string;
  models: {
    model: string;
    facts: string[];
    sentiment: string;
    missing_context: string;
    credibility: string;
  }[];
  agreement_score: number;   // 0-1 how much models agree
  disagreements: string[];
  final_synthesis: string;
}

export interface Report {
  id?: number;
  user_id?: string;
  query: string;
  synthesis: string;
  sources: { title: string; url: string; source: string; bias_lean?: number }[];
  consensus?: ConsensusResult;
  bias_summary?: {
    avg_lean: number;
    spread: number;
    most_objective_source: string;
  };
  audio_url?: string;
  created_at?: string;
}

export interface UserPreferences {
  user_id: string;
  topics: string[];
  language: string;
  voice_enabled: boolean;
  briefing_style: 'concise' | 'detailed' | 'debate';
  last_seen_at: string;
}

export interface BreakingNewsItem {
  id?: number;
  article_id: number;
  headline: string;
  urgency: number;
  regions: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface DebateSide {
  position: string;
  arguments: string[];
  sources: { title: string; url: string }[];
  voice_id?: string;
}

export interface DebateResult {
  topic: string;
  pro: DebateSide;
  con: DebateSide;
  neutral_summary: string;
  audio_pro_url?: string;
  audio_con_url?: string;
}
