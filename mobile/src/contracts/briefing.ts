// Briefing response from GET /api/briefing

export interface BriefingResponse {
  audioUrl: string;
  transcript: string;
  duration: number;
  generatedAt: string;
  storiesCount: number;
}
