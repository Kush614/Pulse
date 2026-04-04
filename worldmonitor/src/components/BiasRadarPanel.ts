import { Panel } from './Panel';
import { escapeHtml } from '@/utils/sanitize';

const NOVA_API = '/nova';

interface BiasRadarItem {
  article: { title: string; url: string; source: string; snippet?: string };
  avg: {
    political_lean: number;
    emotional: number;
    opinion_ratio: number;
    sensationalism: number;
    credibility: number;
  };
  scores: { reasoning?: string }[];
}

interface BiasRadarResponse {
  query: string;
  radar: BiasRadarItem[];
  summary: {
    avg_lean: number;
    spread: number;
    lean_label: string;
    most_objective_source: string;
    article_count: number;
  };
}

export class BiasRadarPanel extends Panel {
  private searchInput!: HTMLInputElement;
  private resultsContainer!: HTMLElement;
  private summaryContainer!: HTMLElement;
  private isLoading = false;

  constructor() {
    super({
      id: 'bias-radar',
      title: 'Bias Radar',
      className: 'bias-radar-panel col-span-2 span-3',
      showCount: false,
      trackActivity: false,
    });
    this.buildUI();
    this.injectStyles();
  }

  private buildUI(): void {
    this.content.innerHTML = '';
    this.content.style.cssText = 'display:flex;flex-direction:column;height:100%;padding:12px;overflow-y:auto;';

    // Search bar
    const searchBar = document.createElement('div');
    searchBar.className = 'bias-search-bar';

    this.searchInput = document.createElement('input');
    this.searchInput.type = 'text';
    this.searchInput.placeholder = 'Enter a news topic to analyze bias across sources...';
    this.searchInput.className = 'bias-search-input';
    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.analyze();
    });

    const btn = document.createElement('button');
    btn.className = 'bias-analyze-btn';
    btn.textContent = 'Analyze Bias';
    btn.addEventListener('click', () => this.analyze());

    searchBar.appendChild(this.searchInput);
    searchBar.appendChild(btn);

    // Summary card
    this.summaryContainer = document.createElement('div');
    this.summaryContainer.className = 'bias-summary';

    // Results grid
    this.resultsContainer = document.createElement('div');
    this.resultsContainer.className = 'bias-results';

    this.content.appendChild(searchBar);
    this.content.appendChild(this.summaryContainer);
    this.content.appendChild(this.resultsContainer);
  }

  private async analyze(): Promise<void> {
    const query = this.searchInput.value.trim();
    if (!query || this.isLoading) return;

    this.isLoading = true;
    this.resultsContainer.innerHTML = '<div class="bias-loading">Analyzing bias across sources...</div>';
    this.summaryContainer.innerHTML = '';

    try {
      const res = await fetch(`${NOVA_API}/api/bias-radar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
        signal: AbortSignal.timeout(60000),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: BiasRadarResponse = await res.json();
      this.renderSummary(data.summary);
      this.renderResults(data.radar);
    } catch (e: any) {
      this.resultsContainer.innerHTML = `<div class="bias-error">Analysis failed: ${escapeHtml(e.message)}</div>`;
    } finally {
      this.isLoading = false;
    }
  }

  private renderSummary(summary: BiasRadarResponse['summary']): void {
    const leanColor = this.leanColor(summary.avg_lean);
    const spreadBar = Math.round(summary.spread * 50); // 0-100 scale

    this.summaryContainer.innerHTML = `
      <div class="bias-summary-card">
        <div class="bias-summary-metric">
          <span class="bias-label">Overall Lean</span>
          <span class="bias-value" style="color:${leanColor}">${summary.lean_label}</span>
          <div class="bias-spectrum">
            <div class="bias-spectrum-bar">
              <div class="bias-spectrum-marker" style="left:${((summary.avg_lean + 1) / 2) * 100}%"></div>
            </div>
            <div class="bias-spectrum-labels">
              <span>Left</span><span>Center</span><span>Right</span>
            </div>
          </div>
        </div>
        <div class="bias-summary-metric">
          <span class="bias-label">Source Diversity</span>
          <span class="bias-value">${spreadBar > 60 ? 'Diverse' : spreadBar > 30 ? 'Moderate' : 'Narrow'}</span>
          <div class="bias-bar-container">
            <div class="bias-bar" style="width:${spreadBar}%;background:${spreadBar > 60 ? '#22c55e' : spreadBar > 30 ? '#eab308' : '#ef4444'}"></div>
          </div>
        </div>
        <div class="bias-summary-metric">
          <span class="bias-label">Most Objective</span>
          <span class="bias-value">${escapeHtml(summary.most_objective_source)}</span>
        </div>
        <div class="bias-summary-metric">
          <span class="bias-label">Sources Analyzed</span>
          <span class="bias-value">${summary.article_count}</span>
        </div>
      </div>
    `;
  }

  private renderResults(radar: BiasRadarItem[]): void {
    if (!radar.length) {
      this.resultsContainer.innerHTML = '<div class="bias-empty">No articles found to analyze.</div>';
      return;
    }

    this.resultsContainer.innerHTML = radar.map(item => {
      const lean = item.avg.political_lean;
      const color = this.leanColor(lean);

      return `
        <div class="bias-article-card">
          <div class="bias-article-header">
            <a href="${escapeHtml(item.article.url)}" target="_blank" class="bias-article-title">${escapeHtml(item.article.title)}</a>
            <span class="bias-article-source" style="border-color:${color}">${escapeHtml(item.article.source)}</span>
          </div>
          <div class="bias-radar-chart">
            ${this.renderRadarBars(item.avg)}
          </div>
          <div class="bias-reasoning">${escapeHtml(item.scores[0]?.reasoning || '')}</div>
        </div>
      `;
    }).join('');
  }

  private renderRadarBars(avg: BiasRadarItem['avg']): string {
    const bars = [
      { label: 'Political', value: (avg.political_lean + 1) / 2, color: this.leanColor(avg.political_lean) },
      { label: 'Emotional', value: avg.emotional, color: avg.emotional > 0.6 ? '#ef4444' : '#22c55e' },
      { label: 'Opinion', value: avg.opinion_ratio, color: avg.opinion_ratio > 0.5 ? '#f59e0b' : '#3b82f6' },
      { label: 'Sensational', value: avg.sensationalism, color: avg.sensationalism > 0.5 ? '#ef4444' : '#22c55e' },
      { label: 'Credibility', value: avg.credibility, color: avg.credibility > 0.6 ? '#22c55e' : '#ef4444' },
    ];

    return bars.map(b => `
      <div class="bias-bar-row">
        <span class="bias-bar-label">${b.label}</span>
        <div class="bias-bar-track">
          <div class="bias-bar-fill" style="width:${b.value * 100}%;background:${b.color}"></div>
        </div>
        <span class="bias-bar-value">${(b.value * 100).toFixed(0)}%</span>
      </div>
    `).join('');
  }

  private leanColor(lean: number): string {
    if (lean < -0.3) return '#3b82f6';  // blue = left
    if (lean > 0.3) return '#ef4444';   // red = right
    return '#22c55e';                    // green = center
  }

  private injectStyles(): void {
    if (document.getElementById('bias-radar-styles')) return;
    const style = document.createElement('style');
    style.id = 'bias-radar-styles';
    style.textContent = `
      .bias-search-bar { display:flex; gap:8px; margin-bottom:12px; }
      .bias-search-input {
        flex:1; padding:8px 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.15);
        background:rgba(0,0,0,0.3); color:#e2e8f0; font-size:14px; outline:none;
      }
      .bias-search-input:focus { border-color:#3b82f6; }
      .bias-analyze-btn {
        padding:8px 16px; border-radius:8px; border:none; background:#3b82f6; color:white;
        font-weight:600; cursor:pointer; white-space:nowrap; font-size:13px;
      }
      .bias-analyze-btn:hover { background:#2563eb; }

      .bias-summary-card {
        display:grid; grid-template-columns:repeat(auto-fit, minmax(140px,1fr)); gap:12px;
        padding:12px; background:rgba(0,0,0,0.2); border-radius:10px; margin-bottom:12px;
        border:1px solid rgba(255,255,255,0.08);
      }
      .bias-summary-metric { display:flex; flex-direction:column; gap:4px; }
      .bias-label { font-size:11px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px; }
      .bias-value { font-size:16px; font-weight:700; color:#e2e8f0; }

      .bias-spectrum { margin-top:4px; }
      .bias-spectrum-bar {
        height:6px; background:linear-gradient(to right, #3b82f6, #22c55e 50%, #ef4444);
        border-radius:3px; position:relative;
      }
      .bias-spectrum-marker {
        position:absolute; top:-3px; width:12px; height:12px; border-radius:50%;
        background:white; border:2px solid #0f172a; transform:translateX(-50%);
        box-shadow:0 0 6px rgba(255,255,255,0.5);
      }
      .bias-spectrum-labels { display:flex; justify-content:space-between; font-size:10px; color:#64748b; margin-top:2px; }

      .bias-bar-container { height:6px; background:rgba(255,255,255,0.1); border-radius:3px; margin-top:4px; }
      .bias-bar { height:100%; border-radius:3px; transition:width 0.5s ease; }

      .bias-results { overflow-y:auto; flex:1; display:flex; flex-direction:column; gap:8px; }
      .bias-article-card {
        padding:10px 12px; background:rgba(0,0,0,0.15); border-radius:8px;
        border:1px solid rgba(255,255,255,0.06);
      }
      .bias-article-header { display:flex; justify-content:space-between; align-items:flex-start; gap:8px; margin-bottom:8px; }
      .bias-article-title { color:#93c5fd; text-decoration:none; font-size:13px; font-weight:600; line-height:1.3; }
      .bias-article-title:hover { text-decoration:underline; }
      .bias-article-source {
        font-size:11px; color:#94a3b8; padding:2px 8px; border-radius:4px;
        border:1px solid; white-space:nowrap; flex-shrink:0;
      }

      .bias-radar-chart { margin:8px 0; }
      .bias-bar-row { display:flex; align-items:center; gap:8px; margin-bottom:4px; }
      .bias-bar-label { font-size:11px; color:#94a3b8; width:70px; flex-shrink:0; }
      .bias-bar-track { flex:1; height:5px; background:rgba(255,255,255,0.08); border-radius:3px; }
      .bias-bar-fill { height:100%; border-radius:3px; transition:width 0.6s ease; }
      .bias-bar-value { font-size:11px; color:#64748b; width:32px; text-align:right; }

      .bias-reasoning { font-size:12px; color:#64748b; font-style:italic; margin-top:4px; }
      .bias-loading, .bias-empty, .bias-error { padding:20px; text-align:center; color:#94a3b8; font-size:14px; }
      .bias-error { color:#f87171; }
    `;
    document.head.appendChild(style);
  }
}
