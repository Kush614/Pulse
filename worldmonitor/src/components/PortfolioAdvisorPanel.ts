import { Panel } from './Panel';
import { escapeHtml } from '@/utils/sanitize';

const NOVA_API = '/nova';

interface PortfolioAsset {
  name: string;
  ticker: string;
  quantity: number;
  avgPrice: number;
  allocation: number;
}

interface AssetImpact {
  asset: string;
  direction: string;
  move: string;
  confidence: string;
  reason: string;
}

interface AdvisorResponse {
  news_insight: string;
  impacts: AssetImpact[];
  overall: { direction: string; move: string; risk: string };
  advice: string[];
  opportunities: string[];
  news_used: { title: string; source: string }[];
}

const DEFAULT_PORTFOLIO: PortfolioAsset[] = [
  { name: 'Apple', ticker: 'AAPL', quantity: 50, avgPrice: 178.5, allocation: 25 },
  { name: 'NVIDIA', ticker: 'NVDA', quantity: 20, avgPrice: 480.0, allocation: 20 },
  { name: 'S&P 500 ETF', ticker: 'SPY', quantity: 30, avgPrice: 450.0, allocation: 30 },
  { name: 'Gold ETF', ticker: 'GLD', quantity: 15, avgPrice: 185.0, allocation: 10 },
  { name: 'Tesla', ticker: 'TSLA', quantity: 25, avgPrice: 245.0, allocation: 15 },
];

export class PortfolioAdvisorPanel extends Panel {
  private portfolio: PortfolioAsset[] = [...DEFAULT_PORTFOLIO];
  private leftPane!: HTMLElement;
  private rightPane!: HTMLElement;
  private isLoading = false;

  constructor() {
    super({
      id: 'portfolio-advisor',
      title: 'AI Portfolio Advisor',
      className: 'portfolio-advisor-panel col-span-2 span-3',
      showCount: false,
      trackActivity: false,
    });
    this.buildUI();
    this.injectStyles();
  }

  private buildUI(): void {
    this.content.innerHTML = '';
    this.content.style.cssText = 'display:flex;flex-direction:column;height:100%;padding:0;overflow:hidden;';

    // Top action bar
    const actionBar = document.createElement('div');
    actionBar.className = 'pa-action-bar';
    actionBar.innerHTML = `
      <button class="pa-analyze-btn" id="paAnalyzeBtn">Analyze Portfolio Impact</button>
      <button class="pa-edit-btn" id="paEditBtn">Edit Portfolio</button>
    `;
    this.content.appendChild(actionBar);

    // Split panes
    const splitView = document.createElement('div');
    splitView.className = 'pa-split-view';

    this.leftPane = document.createElement('div');
    this.leftPane.className = 'pa-left-pane';

    this.rightPane = document.createElement('div');
    this.rightPane.className = 'pa-right-pane';

    splitView.appendChild(this.leftPane);
    splitView.appendChild(this.rightPane);
    this.content.appendChild(splitView);

    this.renderPortfolio();
    this.rightPane.innerHTML = '<div class="pa-placeholder">Click <strong>Analyze Portfolio Impact</strong> to get AI-driven news analysis for your holdings.</div>';

    actionBar.querySelector('#paAnalyzeBtn')!.addEventListener('click', () => this.analyze());
    actionBar.querySelector('#paEditBtn')!.addEventListener('click', () => this.showEditModal());
  }

  private renderPortfolio(): void {
    const totalValue = this.portfolio.reduce((s, a) => s + a.quantity * a.avgPrice, 0);
    this.leftPane.innerHTML = `
      <div class="pa-section-title">Your Portfolio</div>
      <div class="pa-portfolio-total">Total Value: <strong>$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></div>
      <div class="pa-portfolio-list">
        ${this.portfolio.map(a => {
          const value = a.quantity * a.avgPrice;
          return `
            <div class="pa-asset-row">
              <div class="pa-asset-info">
                <span class="pa-asset-ticker">${escapeHtml(a.ticker)}</span>
                <span class="pa-asset-name">${escapeHtml(a.name)}</span>
              </div>
              <div class="pa-asset-details">
                <span class="pa-asset-qty">${a.quantity} shares</span>
                <span class="pa-asset-price">Avg $${a.avgPrice.toFixed(2)}</span>
                <span class="pa-asset-value">$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div class="pa-asset-alloc">
                <div class="pa-alloc-bar"><div class="pa-alloc-fill" style="width:${a.allocation}%"></div></div>
                <span class="pa-alloc-pct">${a.allocation}%</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  private async analyze(): Promise<void> {
    if (this.isLoading) return;
    this.isLoading = true;
    this.rightPane.innerHTML = `
      <div class="pa-loading">
        <div class="pa-loading-spinner"></div>
        <div>Fetching latest news & analyzing impact on your portfolio...</div>
      </div>
    `;

    try {
      const res = await fetch(`${NOVA_API}/api/portfolio-advisor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolio: this.portfolio }),
        signal: AbortSignal.timeout(90000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: AdvisorResponse = await res.json();
      this.renderAnalysis(data);
    } catch (e: any) {
      this.rightPane.innerHTML = `<div class="pa-error">Analysis failed: ${escapeHtml(e.message)}</div>`;
    } finally {
      this.isLoading = false;
    }
  }

  private renderAnalysis(data: AdvisorResponse): void {
    const dirIcon = (d: string) => {
      if (d.toLowerCase().includes('up')) return '<span class="pa-dir-up">&#9650;</span>';
      if (d.toLowerCase().includes('down')) return '<span class="pa-dir-down">&#9660;</span>';
      return '<span class="pa-dir-neutral">&#9654;</span>';
    };
    const confColor = (c: string) => {
      if (c.toLowerCase() === 'high') return '#22c55e';
      if (c.toLowerCase() === 'medium') return '#eab308';
      return '#94a3b8';
    };
    const overallColor = data.overall.direction.toLowerCase().includes('gain') ? '#22c55e'
      : data.overall.direction.toLowerCase().includes('loss') ? '#ef4444' : '#eab308';

    this.rightPane.innerHTML = `
      <div class="pa-analysis">
        <!-- News Insight -->
        <div class="pa-card pa-insight-card">
          <div class="pa-card-title">News Insight</div>
          <div class="pa-card-body">${escapeHtml(data.news_insight)}</div>
          ${data.news_used?.length ? `
            <div class="pa-news-sources">
              ${data.news_used.slice(0, 5).map(n => `<span class="pa-news-tag" title="${escapeHtml(n.title)}">${escapeHtml(n.source)}</span>`).join('')}
            </div>
          ` : ''}
        </div>

        <!-- Per-Asset Impact -->
        <div class="pa-card">
          <div class="pa-card-title">Portfolio Impact Prediction</div>
          <div class="pa-impacts">
            ${(data.impacts || []).map(imp => `
              <div class="pa-impact-row">
                <div class="pa-impact-header">
                  ${dirIcon(imp.direction)}
                  <strong>${escapeHtml(imp.asset)}</strong>
                  <span class="pa-impact-move">${escapeHtml(imp.move)}</span>
                  <span class="pa-impact-conf" style="color:${confColor(imp.confidence)}">
                    ${escapeHtml(imp.confidence)}
                  </span>
                </div>
                <div class="pa-impact-reason">${escapeHtml(imp.reason)}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Overall Summary -->
        <div class="pa-card pa-overall-card" style="border-left:3px solid ${overallColor}">
          <div class="pa-card-title">Overall Portfolio Summary</div>
          <div class="pa-overall-grid">
            <div class="pa-overall-item">
              <span class="pa-overall-label">Expected Impact</span>
              <span class="pa-overall-value" style="color:${overallColor}">${escapeHtml(data.overall.direction)}</span>
            </div>
            <div class="pa-overall-item">
              <span class="pa-overall-label">Estimated Move</span>
              <span class="pa-overall-value">${escapeHtml(data.overall.move)}</span>
            </div>
            <div class="pa-overall-item">
              <span class="pa-overall-label">Risk Level</span>
              <span class="pa-overall-value">${escapeHtml(data.overall.risk)}</span>
            </div>
          </div>
        </div>

        <!-- Actionable Advice -->
        <div class="pa-card">
          <div class="pa-card-title">Actionable Advice</div>
          <ul class="pa-advice-list">
            ${(data.advice || []).map(a => `<li>${escapeHtml(a)}</li>`).join('')}
          </ul>
        </div>

        <!-- Opportunity Signals -->
        ${data.opportunities?.length ? `
          <div class="pa-card pa-opps-card">
            <div class="pa-card-title">Opportunity Signals</div>
            <ul class="pa-opps-list">
              ${data.opportunities.map(o => `<li>${escapeHtml(o)}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
  }

  private showEditModal(): void {
    // Inline edit — replace left pane with form
    this.leftPane.innerHTML = `
      <div class="pa-section-title">Edit Portfolio</div>
      <div class="pa-edit-form" id="paEditForm">
        ${this.portfolio.map((a, i) => `
          <div class="pa-edit-row" data-idx="${i}">
            <input class="pa-input" value="${escapeHtml(a.ticker)}" data-field="ticker" placeholder="Ticker" />
            <input class="pa-input" value="${escapeHtml(a.name)}" data-field="name" placeholder="Name" />
            <input class="pa-input pa-input-sm" type="number" value="${a.quantity}" data-field="quantity" placeholder="Qty" />
            <input class="pa-input pa-input-sm" type="number" value="${a.avgPrice}" data-field="avgPrice" placeholder="Avg $" step="0.01" />
            <input class="pa-input pa-input-sm" type="number" value="${a.allocation}" data-field="allocation" placeholder="%" />
            <button class="pa-remove-btn" data-remove="${i}">X</button>
          </div>
        `).join('')}
        <div class="pa-edit-actions">
          <button class="pa-add-btn" id="paAddAsset">+ Add Asset</button>
          <button class="pa-save-btn" id="paSavePortfolio">Save</button>
          <button class="pa-cancel-btn" id="paCancelEdit">Cancel</button>
        </div>
      </div>
    `;

    this.leftPane.querySelector('#paAddAsset')!.addEventListener('click', () => {
      this.portfolio.push({ name: '', ticker: '', quantity: 0, avgPrice: 0, allocation: 0 });
      this.showEditModal();
    });

    this.leftPane.querySelector('#paCancelEdit')!.addEventListener('click', () => {
      this.renderPortfolio();
    });

    this.leftPane.querySelectorAll('.pa-remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt((btn as HTMLElement).dataset.remove || '0');
        this.portfolio.splice(idx, 1);
        this.showEditModal();
      });
    });

    this.leftPane.querySelector('#paSavePortfolio')!.addEventListener('click', () => {
      const form = this.leftPane.querySelector('#paEditForm')!;
      const rows = form.querySelectorAll('.pa-edit-row');
      const newPortfolio: PortfolioAsset[] = [];
      rows.forEach(row => {
        const get = (field: string) => (row.querySelector(`[data-field="${field}"]`) as HTMLInputElement)?.value || '';
        const ticker = get('ticker').trim();
        if (!ticker) return;
        newPortfolio.push({
          ticker,
          name: get('name').trim() || ticker,
          quantity: parseFloat(get('quantity')) || 0,
          avgPrice: parseFloat(get('avgPrice')) || 0,
          allocation: parseFloat(get('allocation')) || 0,
        });
      });
      this.portfolio = newPortfolio;
      this.renderPortfolio();
    });
  }

  private injectStyles(): void {
    if (document.getElementById('portfolio-advisor-styles')) return;
    const style = document.createElement('style');
    style.id = 'portfolio-advisor-styles';
    style.textContent = `
      .pa-action-bar {
        display:flex; gap:8px; padding:10px 12px; border-bottom:1px solid rgba(255,255,255,0.08);
        flex-shrink:0;
      }
      .pa-analyze-btn {
        padding:8px 18px; border-radius:8px; border:none; background:linear-gradient(135deg,#3b82f6,#8b5cf6);
        color:white; font-weight:700; cursor:pointer; font-size:13px; transition:opacity 0.2s;
      }
      .pa-analyze-btn:hover { opacity:0.85; }
      .pa-edit-btn {
        padding:8px 14px; border-radius:8px; border:1px solid rgba(255,255,255,0.15);
        background:transparent; color:#94a3b8; cursor:pointer; font-size:12px;
      }
      .pa-edit-btn:hover { border-color:#3b82f6; color:#e2e8f0; }

      .pa-split-view { display:flex; flex:1; overflow:hidden; min-height:0; }
      .pa-left-pane {
        width:280px; flex-shrink:0; border-right:1px solid rgba(255,255,255,0.08);
        overflow-y:auto; padding:10px 12px;
      }
      .pa-right-pane { flex:1; overflow-y:auto; padding:10px 12px; }

      .pa-section-title { font-size:12px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px; }
      .pa-portfolio-total { font-size:14px; color:#e2e8f0; margin-bottom:12px; }

      .pa-asset-row {
        padding:8px; margin-bottom:6px; background:rgba(0,0,0,0.15); border-radius:6px;
        border:1px solid rgba(255,255,255,0.05);
      }
      .pa-asset-info { display:flex; align-items:center; gap:8px; margin-bottom:4px; }
      .pa-asset-ticker {
        font-weight:800; font-size:13px; color:#93c5fd; background:rgba(59,130,246,0.15);
        padding:2px 6px; border-radius:4px; font-family:var(--font-mono,monospace);
      }
      .pa-asset-name { font-size:12px; color:#94a3b8; }
      .pa-asset-details { display:flex; gap:8px; font-size:11px; color:#64748b; margin-bottom:4px; }
      .pa-asset-value { color:#e2e8f0; font-weight:600; }
      .pa-asset-alloc { display:flex; align-items:center; gap:6px; }
      .pa-alloc-bar { flex:1; height:4px; background:rgba(255,255,255,0.08); border-radius:2px; }
      .pa-alloc-fill { height:100%; background:#3b82f6; border-radius:2px; transition:width 0.3s; }
      .pa-alloc-pct { font-size:11px; color:#64748b; width:30px; text-align:right; }

      /* Right pane analysis */
      .pa-placeholder { padding:40px 20px; text-align:center; color:#64748b; font-size:14px; line-height:1.6; }
      .pa-loading { display:flex; flex-direction:column; align-items:center; gap:12px; padding:40px; color:#94a3b8; }
      .pa-loading-spinner {
        width:32px; height:32px; border:3px solid rgba(255,255,255,0.1); border-top-color:#3b82f6;
        border-radius:50%; animation:pa-spin 0.8s linear infinite;
      }
      @keyframes pa-spin { to { transform:rotate(360deg); } }
      .pa-error { padding:20px; text-align:center; color:#f87171; }

      .pa-analysis { display:flex; flex-direction:column; gap:10px; }
      .pa-card {
        background:rgba(0,0,0,0.15); border:1px solid rgba(255,255,255,0.06);
        border-radius:8px; padding:10px 12px;
      }
      .pa-card-title { font-size:12px; font-weight:700; color:#93c5fd; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px; }
      .pa-card-body { font-size:13px; color:#cbd5e1; line-height:1.5; }
      .pa-insight-card { border-left:3px solid #3b82f6; }
      .pa-news-sources { display:flex; flex-wrap:wrap; gap:4px; margin-top:8px; }
      .pa-news-tag {
        font-size:10px; padding:2px 6px; border-radius:4px;
        background:rgba(59,130,246,0.15); color:#93c5fd; cursor:default;
      }

      .pa-impacts { display:flex; flex-direction:column; gap:8px; }
      .pa-impact-row { padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.04); }
      .pa-impact-row:last-child { border-bottom:none; }
      .pa-impact-header { display:flex; align-items:center; gap:8px; font-size:13px; }
      .pa-impact-move { font-family:var(--font-mono,monospace); font-size:12px; color:#e2e8f0; }
      .pa-impact-conf { font-size:11px; font-weight:600; text-transform:uppercase; }
      .pa-impact-reason { font-size:12px; color:#64748b; margin-top:3px; margin-left:22px; }
      .pa-dir-up { color:#22c55e; font-size:11px; }
      .pa-dir-down { color:#ef4444; font-size:11px; }
      .pa-dir-neutral { color:#eab308; font-size:10px; }

      .pa-overall-card { background:rgba(0,0,0,0.2); }
      .pa-overall-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
      .pa-overall-item { display:flex; flex-direction:column; gap:2px; }
      .pa-overall-label { font-size:11px; color:#64748b; }
      .pa-overall-value { font-size:15px; font-weight:700; color:#e2e8f0; }

      .pa-advice-list, .pa-opps-list {
        margin:0; padding-left:18px; font-size:13px; color:#cbd5e1; line-height:1.6;
      }
      .pa-opps-card { border-left:3px solid #22c55e; }
      .pa-opps-list li { color:#86efac; }

      /* Edit form */
      .pa-edit-form { display:flex; flex-direction:column; gap:6px; }
      .pa-edit-row { display:flex; gap:4px; align-items:center; }
      .pa-input {
        padding:5px 8px; border-radius:4px; border:1px solid rgba(255,255,255,0.12);
        background:rgba(0,0,0,0.3); color:#e2e8f0; font-size:12px; width:100%;
      }
      .pa-input-sm { width:60px; flex-shrink:0; }
      .pa-input:focus { outline:none; border-color:#3b82f6; }
      .pa-remove-btn {
        background:none; border:none; color:#f87171; cursor:pointer; font-weight:700;
        font-size:14px; padding:2px 6px; flex-shrink:0;
      }
      .pa-edit-actions { display:flex; gap:6px; margin-top:8px; }
      .pa-add-btn, .pa-save-btn, .pa-cancel-btn {
        padding:6px 12px; border-radius:6px; border:none; cursor:pointer; font-size:12px; font-weight:600;
      }
      .pa-add-btn { background:rgba(255,255,255,0.08); color:#94a3b8; }
      .pa-save-btn { background:#3b82f6; color:white; }
      .pa-cancel-btn { background:rgba(255,255,255,0.05); color:#64748b; }

      @media (max-width: 600px) {
        .pa-split-view { flex-direction:column; }
        .pa-left-pane { width:100%; border-right:none; border-bottom:1px solid rgba(255,255,255,0.08); max-height:200px; }
      }
    `;
    document.head.appendChild(style);
  }
}
