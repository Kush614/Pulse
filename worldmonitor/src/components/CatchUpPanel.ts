import { Panel } from './Panel';
import { escapeHtml } from '@/utils/sanitize';

const NOVA_API = '/nova';

export class CatchUpPanel extends Panel {
  private contentEl!: HTMLElement;
  private statusEl!: HTMLElement;
  private isLoading = false;

  constructor() {
    super({
      id: 'catchup',
      title: 'What Did I Miss?',
      className: 'catchup-panel col-span-2 span-2',
      showCount: false,
      trackActivity: false,
    });
    this.buildUI();
    this.injectStyles();
  }

  private buildUI(): void {
    this.content.innerHTML = '';
    this.content.style.cssText = 'display:flex;flex-direction:column;height:100%;padding:12px;overflow-y:auto;';

    const header = document.createElement('div');
    header.className = 'catchup-header';

    const refreshBtn = document.createElement('button');
    refreshBtn.className = 'catchup-refresh-btn';
    refreshBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
      </svg>
      Catch Me Up
    `;
    refreshBtn.addEventListener('click', () => this.loadCatchUp());

    this.statusEl = document.createElement('div');
    this.statusEl.className = 'catchup-status';

    header.appendChild(refreshBtn);
    header.appendChild(this.statusEl);

    this.contentEl = document.createElement('div');
    this.contentEl.className = 'catchup-content';
    this.contentEl.innerHTML = '<div class="catchup-placeholder">Click "Catch Me Up" to see what happened since your last visit.</div>';

    this.content.appendChild(header);
    this.content.appendChild(this.contentEl);
  }

  private async loadCatchUp(): Promise<void> {
    if (this.isLoading) return;
    this.isLoading = true;

    const token = localStorage.getItem('nova_token') || '';
    this.statusEl.innerHTML = '<span class="catchup-spinner"></span> Analyzing what you missed...';
    this.contentEl.innerHTML = '';

    try {
      const res = await fetch(`${NOVA_API}/api/catchup`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        signal: AbortSignal.timeout(60000),
      });

      if (!res.ok) {
        if (res.status === 401) {
          this.contentEl.innerHTML = '<div class="catchup-login">Login to get personalized catch-ups based on when you were last active.</div>';
          this.statusEl.innerHTML = '';
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      this.renderCatchUp(data);
      this.statusEl.innerHTML = '';
    } catch (e: any) {
      this.statusEl.innerHTML = `<span style="color:#f87171">${escapeHtml(e.message)}</span>`;
    } finally {
      this.isLoading = false;
    }
  }

  private renderCatchUp(data: any): void {
    const since = data.since ? new Date(data.since).toLocaleString() : 'Unknown';

    this.contentEl.innerHTML = `
      <div class="catchup-since">Since: ${escapeHtml(since)} | Topics: ${(data.topics || []).map((t: string) => escapeHtml(t)).join(', ')}</div>

      <div class="catchup-synthesis">${this.formatMarkdown(data.synthesis || 'No updates.')}</div>

      ${data.articles?.length ? `
        <div class="catchup-articles-header">Recent Stories (${data.articles.length})</div>
        <div class="catchup-articles">
          ${data.articles.slice(0, 12).map((a: any) => `
            <a href="${escapeHtml(a.url)}" target="_blank" class="catchup-article">
              <span class="catchup-article-source">${escapeHtml(a.source)}</span>
              <span class="catchup-article-title">${escapeHtml(a.title)}</span>
            </a>
          `).join('')}
        </div>
      ` : ''}
    `;
  }

  private formatMarkdown(text: string): string {
    return escapeHtml(text)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.*)/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/\n/g, '<br>');
  }

  private injectStyles(): void {
    if (document.getElementById('catchup-styles')) return;
    const style = document.createElement('style');
    style.id = 'catchup-styles';
    style.textContent = `
      .catchup-header { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
      .catchup-refresh-btn {
        display:flex; align-items:center; gap:6px; padding:8px 14px; border-radius:8px;
        border:none; background:linear-gradient(135deg, #10b981, #059669); color:white;
        font-weight:600; cursor:pointer; font-size:13px; white-space:nowrap;
      }
      .catchup-refresh-btn:hover { background:linear-gradient(135deg, #059669, #047857); }
      .catchup-status { font-size:13px; color:#94a3b8; display:flex; align-items:center; gap:6px; }
      .catchup-spinner {
        display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,0.2);
        border-top-color:#10b981; border-radius:50%; animation:catchup-spin 0.8s linear infinite;
      }
      @keyframes catchup-spin { to { transform:rotate(360deg); } }

      .catchup-content { overflow-y:auto; flex:1; }
      .catchup-placeholder, .catchup-login {
        padding:30px; text-align:center; color:#64748b; font-size:14px;
      }
      .catchup-since {
        font-size:12px; color:#64748b; padding:6px 10px; background:rgba(0,0,0,0.15);
        border-radius:6px; margin-bottom:10px;
      }
      .catchup-synthesis {
        font-size:14px; color:#e2e8f0; line-height:1.7; padding:12px;
        background:rgba(0,0,0,0.1); border-radius:8px; margin-bottom:12px;
      }
      .catchup-synthesis ul { padding-left:18px; margin:6px 0; }
      .catchup-synthesis li { margin-bottom:4px; }
      .catchup-synthesis strong { color:#22d3ee; }

      .catchup-articles-header { font-size:11px; text-transform:uppercase; color:#64748b; letter-spacing:0.5px; margin-bottom:6px; font-weight:600; }
      .catchup-articles { display:flex; flex-direction:column; gap:4px; }
      .catchup-article {
        display:flex; gap:8px; align-items:baseline; padding:4px 0;
        text-decoration:none; border-bottom:1px solid rgba(255,255,255,0.04);
      }
      .catchup-article:hover .catchup-article-title { color:#93c5fd; }
      .catchup-article-source { font-size:11px; color:#64748b; min-width:80px; flex-shrink:0; }
      .catchup-article-title { font-size:13px; color:#94a3b8; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    `;
    document.head.appendChild(style);
  }
}
