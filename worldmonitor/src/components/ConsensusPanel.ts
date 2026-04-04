import { Panel } from './Panel';
import { escapeHtml } from '@/utils/sanitize';

const NOVA_API = '/nova';

export class ConsensusPanel extends Panel {
  private queryInput!: HTMLInputElement;
  private resultsEl!: HTMLElement;
  private statusEl!: HTMLElement;
  private isLoading = false;

  constructor() {
    super({
      id: 'consensus',
      title: 'Multi-AI Consensus',
      className: 'consensus-panel col-span-2 span-2',
      showCount: false,
      trackActivity: false,
    });
    this.buildUI();
    this.injectStyles();
  }

  private buildUI(): void {
    this.content.innerHTML = '';
    this.content.style.cssText = 'display:flex;flex-direction:column;height:100%;padding:12px;overflow-y:auto;';

    const searchBar = document.createElement('div');
    searchBar.className = 'cons-search';

    this.queryInput = document.createElement('input');
    this.queryInput.type = 'text';
    this.queryInput.placeholder = 'Enter topic for multi-model fact-check...';
    this.queryInput.className = 'cons-input';
    this.queryInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.runConsensus();
    });

    const btn = document.createElement('button');
    btn.className = 'cons-btn';
    btn.textContent = 'Check Consensus';
    btn.addEventListener('click', () => this.runConsensus());

    searchBar.appendChild(this.queryInput);
    searchBar.appendChild(btn);

    this.statusEl = document.createElement('div');
    this.statusEl.className = 'cons-status';

    this.resultsEl = document.createElement('div');
    this.resultsEl.className = 'cons-results';

    this.content.appendChild(searchBar);
    this.content.appendChild(this.statusEl);
    this.content.appendChild(this.resultsEl);
  }

  private async runConsensus(): Promise<void> {
    const query = this.queryInput.value.trim();
    if (!query || this.isLoading) return;

    this.isLoading = true;
    this.statusEl.innerHTML = '<span class="cons-spinner"></span> Querying 3 AI models in parallel...';
    this.resultsEl.innerHTML = '';

    try {
      const res = await fetch(`${NOVA_API}/api/consensus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
        signal: AbortSignal.timeout(90000),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.renderConsensus(data);
      this.statusEl.innerHTML = '';
    } catch (e: any) {
      this.statusEl.innerHTML = `<span style="color:#f87171">Error: ${escapeHtml(e.message)}</span>`;
    } finally {
      this.isLoading = false;
    }
  }

  private renderConsensus(data: any): void {
    const agreePct = Math.round((data.agreement_score || 0) * 100);
    const agreeColor = agreePct > 70 ? '#22c55e' : agreePct > 40 ? '#eab308' : '#ef4444';

    this.resultsEl.innerHTML = `
      <div class="cons-agreement">
        <div class="cons-agreement-ring" style="--pct:${agreePct};--color:${agreeColor}">
          <span class="cons-agreement-value">${agreePct}%</span>
        </div>
        <div class="cons-agreement-label">Model Agreement</div>
      </div>

      <div class="cons-synthesis">
        <div class="cons-section-title">Consensus Synthesis</div>
        <div class="cons-synthesis-text">${escapeHtml(data.final_synthesis || '')}</div>
      </div>

      ${data.disagreements?.length ? `
        <div class="cons-disagreements">
          <div class="cons-section-title" style="color:#f59e0b">Disagreements</div>
          ${data.disagreements.map((d: string) => `<div class="cons-disagreement-item">${escapeHtml(d)}</div>`).join('')}
        </div>
      ` : ''}

      <div class="cons-models">
        <div class="cons-section-title">Individual Model Analysis</div>
        <div class="cons-model-grid">
          ${(data.models || []).map((m: any) => `
            <div class="cons-model-card">
              <div class="cons-model-name">${escapeHtml(m.model?.split('/')[1] || m.model || 'Unknown')}</div>
              <div class="cons-model-row">
                <span class="cons-model-label">Sentiment</span>
                <span class="cons-model-value cons-sentiment-${m.sentiment}">${escapeHtml(m.sentiment || 'N/A')}</span>
              </div>
              <div class="cons-model-row">
                <span class="cons-model-label">Credibility</span>
                <span class="cons-model-value">${escapeHtml(m.credibility || 'N/A')}</span>
              </div>
              <div class="cons-model-row">
                <span class="cons-model-label">Key Facts</span>
                <ul class="cons-facts">${(m.facts || []).slice(0, 3).map((f: string) => `<li>${escapeHtml(f)}</li>`).join('')}</ul>
              </div>
              <div class="cons-model-row">
                <span class="cons-model-label">Missing Context</span>
                <span class="cons-model-detail">${escapeHtml(m.missing_context || 'None noted')}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  private injectStyles(): void {
    if (document.getElementById('cons-styles')) return;
    const style = document.createElement('style');
    style.id = 'cons-styles';
    style.textContent = `
      .cons-search { display:flex; gap:8px; margin-bottom:10px; }
      .cons-input {
        flex:1; padding:8px 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.15);
        background:rgba(0,0,0,0.3); color:#e2e8f0; font-size:13px; outline:none;
      }
      .cons-input:focus { border-color:#06b6d4; }
      .cons-btn {
        padding:8px 16px; border-radius:8px; border:none;
        background:linear-gradient(135deg, #06b6d4, #0891b2); color:white;
        font-weight:600; cursor:pointer; font-size:13px; white-space:nowrap;
      }
      .cons-btn:hover { background:linear-gradient(135deg, #0891b2, #0e7490); }
      .cons-status { font-size:13px; color:#94a3b8; min-height:20px; display:flex; align-items:center; gap:8px; }
      .cons-spinner {
        display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,0.2);
        border-top-color:#06b6d4; border-radius:50%; animation:cons-spin 0.8s linear infinite;
      }
      @keyframes cons-spin { to { transform:rotate(360deg); } }

      .cons-results { overflow-y:auto; flex:1; display:flex; flex-direction:column; gap:12px; }

      .cons-agreement { text-align:center; padding:16px; }
      .cons-agreement-ring {
        display:inline-flex; align-items:center; justify-content:center;
        width:80px; height:80px; border-radius:50%;
        background:conic-gradient(var(--color) calc(var(--pct) * 1%), rgba(255,255,255,0.08) 0);
        position:relative;
      }
      .cons-agreement-ring::before {
        content:''; position:absolute; width:60px; height:60px; border-radius:50%;
        background:#0f172a;
      }
      .cons-agreement-value {
        position:relative; z-index:1; font-size:20px; font-weight:800; color:#e2e8f0;
      }
      .cons-agreement-label { font-size:12px; color:#94a3b8; margin-top:6px; }

      .cons-section-title { font-size:12px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px; }
      .cons-synthesis { padding:12px; background:rgba(0,0,0,0.15); border-radius:8px; }
      .cons-synthesis-text { font-size:14px; color:#e2e8f0; line-height:1.6; }

      .cons-disagreements { padding:10px 12px; background:rgba(245,158,11,0.08); border-radius:8px; border:1px solid rgba(245,158,11,0.15); }
      .cons-disagreement-item { font-size:13px; color:#fbbf24; padding:4px 0; }

      .cons-model-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:10px; }
      .cons-model-card {
        padding:10px; background:rgba(0,0,0,0.12); border-radius:8px;
        border:1px solid rgba(255,255,255,0.06);
      }
      .cons-model-name { font-size:14px; font-weight:700; color:#e2e8f0; margin-bottom:8px; text-transform:capitalize; }
      .cons-model-row { margin-bottom:6px; }
      .cons-model-label { font-size:11px; color:#64748b; display:block; }
      .cons-model-value { font-size:13px; color:#cbd5e1; font-weight:600; }
      .cons-model-detail { font-size:12px; color:#94a3b8; }
      .cons-facts { margin:4px 0 0; padding-left:16px; font-size:12px; color:#94a3b8; }
      .cons-facts li { margin-bottom:2px; }
      .cons-sentiment-positive { color:#22c55e; }
      .cons-sentiment-negative { color:#ef4444; }
      .cons-sentiment-neutral { color:#94a3b8; }
      .cons-sentiment-mixed { color:#eab308; }
    `;
    document.head.appendChild(style);
  }
}
