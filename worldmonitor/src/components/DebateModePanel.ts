import { Panel } from './Panel';
import { escapeHtml } from '@/utils/sanitize';

const NOVA_API = '/nova';

export class DebateModePanel extends Panel {
  private topicInput!: HTMLInputElement;
  private debateContainer!: HTMLElement;
  private statusEl!: HTMLElement;
  private isLoading = false;

  constructor() {
    super({
      id: 'debate-mode',
      title: 'Debate Mode',
      className: 'debate-mode-panel col-span-2 span-3',
      showCount: false,
      trackActivity: false,
    });
    this.buildUI();
    this.injectStyles();
  }

  private buildUI(): void {
    this.content.innerHTML = '';
    this.content.style.cssText = 'display:flex;flex-direction:column;height:100%;padding:12px;overflow-y:auto;';

    // Search
    const searchBar = document.createElement('div');
    searchBar.className = 'debate-search';

    this.topicInput = document.createElement('input');
    this.topicInput.type = 'text';
    this.topicInput.placeholder = 'Enter a controversial topic for both-sides analysis...';
    this.topicInput.className = 'debate-input';
    this.topicInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.runDebate();
    });

    const btn = document.createElement('button');
    btn.className = 'debate-btn';
    btn.innerHTML = 'Start Debate';
    btn.addEventListener('click', () => this.runDebate());

    const audioToggle = document.createElement('label');
    audioToggle.className = 'debate-audio-toggle';
    audioToggle.innerHTML = `
      <input type="checkbox" id="debateAudioCheck" checked />
      <span>With Audio</span>
    `;

    searchBar.appendChild(this.topicInput);
    searchBar.appendChild(audioToggle);
    searchBar.appendChild(btn);

    this.statusEl = document.createElement('div');
    this.statusEl.className = 'debate-status';

    this.debateContainer = document.createElement('div');
    this.debateContainer.className = 'debate-container';

    this.content.appendChild(searchBar);
    this.content.appendChild(this.statusEl);
    this.content.appendChild(this.debateContainer);
  }

  private async runDebate(): Promise<void> {
    const topic = this.topicInput.value.trim();
    if (!topic || this.isLoading) return;

    this.isLoading = true;
    this.statusEl.innerHTML = '<span class="debate-spinner"></span> Generating debate with sources... (~30s)';
    this.debateContainer.innerHTML = '';

    const withAudio = (document.getElementById('debateAudioCheck') as HTMLInputElement)?.checked ?? false;

    try {
      const token = localStorage.getItem('nova_token') || '';
      const res = await fetch(`${NOVA_API}/api/debate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ topic, with_audio: withAudio }),
        signal: AbortSignal.timeout(120000),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.renderDebate(data);
      this.statusEl.innerHTML = '';
    } catch (e: any) {
      this.statusEl.innerHTML = `<span style="color:#f87171">Error: ${escapeHtml(e.message)}</span>`;
    } finally {
      this.isLoading = false;
    }
  }

  private renderDebate(data: any): void {
    const pro = data.pro || {};
    const con = data.con || {};

    this.debateContainer.innerHTML = `
      <div class="debate-topic-header">${escapeHtml(data.topic || '')}</div>

      <div class="debate-sides">
        <div class="debate-side debate-pro">
          <div class="debate-side-header">
            <span class="debate-side-icon">&#9989;</span>
            <span class="debate-side-label">FOR</span>
          </div>
          <div class="debate-position">${escapeHtml(pro.position || '')}</div>
          <ul class="debate-arguments">
            ${(pro.arguments || []).map((a: string) => `<li>${escapeHtml(a)}</li>`).join('')}
          </ul>
          ${pro.sources?.length ? `
            <div class="debate-sources">
              ${pro.sources.map((s: any) => `<a href="${escapeHtml(s.url)}" target="_blank">${escapeHtml(s.title)}</a>`).join('')}
            </div>
          ` : ''}
          ${data.audio_pro_url ? `<audio controls src="${escapeHtml(data.audio_pro_url)}" class="debate-audio"></audio>` : ''}
        </div>

        <div class="debate-divider">VS</div>

        <div class="debate-side debate-con">
          <div class="debate-side-header">
            <span class="debate-side-icon">&#10060;</span>
            <span class="debate-side-label">AGAINST</span>
          </div>
          <div class="debate-position">${escapeHtml(con.position || '')}</div>
          <ul class="debate-arguments">
            ${(con.arguments || []).map((a: string) => `<li>${escapeHtml(a)}</li>`).join('')}
          </ul>
          ${con.sources?.length ? `
            <div class="debate-sources">
              ${con.sources.map((s: any) => `<a href="${escapeHtml(s.url)}" target="_blank">${escapeHtml(s.title)}</a>`).join('')}
            </div>
          ` : ''}
          ${data.audio_con_url ? `<audio controls src="${escapeHtml(data.audio_con_url)}" class="debate-audio"></audio>` : ''}
        </div>
      </div>

      ${data.neutral_summary ? `
        <div class="debate-neutral">
          <div class="debate-neutral-header">Balanced Take</div>
          <div class="debate-neutral-text">${escapeHtml(data.neutral_summary)}</div>
        </div>
      ` : ''}
    `;
  }

  private injectStyles(): void {
    if (document.getElementById('debate-styles')) return;
    const style = document.createElement('style');
    style.id = 'debate-styles';
    style.textContent = `
      .debate-search { display:flex; gap:8px; margin-bottom:10px; flex-wrap:wrap; }
      .debate-input {
        flex:1; min-width:200px; padding:8px 12px; border-radius:8px;
        border:1px solid rgba(255,255,255,0.15); background:rgba(0,0,0,0.3);
        color:#e2e8f0; font-size:13px; outline:none;
      }
      .debate-input:focus { border-color:#f59e0b; }
      .debate-btn {
        padding:8px 16px; border-radius:8px; border:none;
        background:linear-gradient(135deg, #f59e0b, #d97706); color:white;
        font-weight:600; cursor:pointer; font-size:13px;
      }
      .debate-btn:hover { background:linear-gradient(135deg, #d97706, #b45309); }
      .debate-audio-toggle {
        display:flex; align-items:center; gap:4px; font-size:12px; color:#94a3b8; cursor:pointer;
      }
      .debate-status { font-size:13px; color:#94a3b8; min-height:20px; display:flex; align-items:center; gap:8px; }
      .debate-spinner {
        display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,0.2);
        border-top-color:#f59e0b; border-radius:50%; animation:debate-spin 0.8s linear infinite;
      }
      @keyframes debate-spin { to { transform:rotate(360deg); } }

      .debate-container { overflow-y:auto; flex:1; }
      .debate-topic-header {
        font-size:16px; font-weight:700; color:#e2e8f0; text-align:center;
        padding:8px; margin-bottom:12px;
      }

      .debate-sides { display:grid; grid-template-columns:1fr auto 1fr; gap:12px; margin-bottom:12px; }
      .debate-side {
        padding:12px; border-radius:10px; border:1px solid rgba(255,255,255,0.08);
      }
      .debate-pro { background:rgba(34,197,94,0.08); border-color:rgba(34,197,94,0.2); }
      .debate-con { background:rgba(239,68,68,0.08); border-color:rgba(239,68,68,0.2); }

      .debate-side-header { display:flex; align-items:center; gap:6px; margin-bottom:8px; }
      .debate-side-icon { font-size:16px; }
      .debate-side-label { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#94a3b8; }
      .debate-position { font-size:14px; font-weight:600; color:#e2e8f0; margin-bottom:8px; line-height:1.4; }
      .debate-arguments { margin:0; padding-left:18px; font-size:13px; color:#cbd5e1; line-height:1.6; }
      .debate-arguments li { margin-bottom:4px; }
      .debate-sources { margin-top:8px; }
      .debate-sources a {
        display:block; font-size:11px; color:#93c5fd; text-decoration:none;
        padding:2px 0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
      }
      .debate-sources a:hover { text-decoration:underline; }
      .debate-audio { width:100%; margin-top:8px; height:32px; }

      .debate-divider {
        display:flex; align-items:center; justify-content:center; font-size:18px;
        font-weight:800; color:#475569; writing-mode:vertical-lr;
      }

      .debate-neutral {
        padding:12px; background:rgba(59,130,246,0.08); border-radius:10px;
        border:1px solid rgba(59,130,246,0.15);
      }
      .debate-neutral-header { font-size:12px; font-weight:700; color:#3b82f6; text-transform:uppercase; margin-bottom:6px; }
      .debate-neutral-text { font-size:13px; color:#cbd5e1; line-height:1.6; }
    `;
    document.head.appendChild(style);
  }
}
