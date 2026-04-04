import { Panel } from './Panel';
import { escapeHtml } from '@/utils/sanitize';

const NOVA_API = '/nova';

export class VoiceBriefingPanel extends Panel {
  private audioEl!: HTMLAudioElement;
  private scriptEl!: HTMLElement;
  private sourcesEl!: HTMLElement;
  private statusEl!: HTMLElement;
  private generateBtn!: HTMLButtonElement;
  private topicInput!: HTMLInputElement;
  private langSelect!: HTMLSelectElement;
  private isLoading = false;

  constructor() {
    super({
      id: 'voice-briefing',
      title: 'Nova Voice Briefing',
      className: 'voice-briefing-panel col-span-2 span-2',
      showCount: false,
      trackActivity: false,
    });
    this.buildUI();
    this.injectStyles();
  }

  private buildUI(): void {
    this.content.innerHTML = '';
    this.content.style.cssText = 'display:flex;flex-direction:column;height:100%;padding:12px;gap:10px;overflow-y:auto;';

    // Controls row
    const controls = document.createElement('div');
    controls.className = 'vb-controls';

    this.topicInput = document.createElement('input');
    this.topicInput.type = 'text';
    this.topicInput.placeholder = 'Topic (or leave empty for personalized briefing)';
    this.topicInput.className = 'vb-input';

    this.langSelect = document.createElement('select');
    this.langSelect.className = 'vb-select';
    const langs = [
      ['en', 'English'], ['es', 'Spanish'], ['fr', 'French'], ['de', 'German'],
      ['zh', 'Chinese'], ['ja', 'Japanese'], ['pt', 'Portuguese'], ['ar', 'Arabic'],
      ['hi', 'Hindi'], ['ko', 'Korean'],
    ];
    for (const [code, label] of langs) {
      const opt = document.createElement('option');
      opt.value = code!;
      opt.textContent = label!;
      this.langSelect.appendChild(opt);
    }

    this.generateBtn = document.createElement('button');
    this.generateBtn.className = 'vb-generate-btn';
    this.generateBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
      Generate Briefing
    `;
    this.generateBtn.addEventListener('click', () => this.generate());

    controls.appendChild(this.topicInput);
    controls.appendChild(this.langSelect);
    controls.appendChild(this.generateBtn);

    // Audio player
    this.audioEl = document.createElement('audio');
    this.audioEl.controls = true;
    this.audioEl.className = 'vb-audio';
    this.audioEl.style.display = 'none';

    // Status
    this.statusEl = document.createElement('div');
    this.statusEl.className = 'vb-status';

    // Script display
    this.scriptEl = document.createElement('div');
    this.scriptEl.className = 'vb-script';

    // Sources
    this.sourcesEl = document.createElement('div');
    this.sourcesEl.className = 'vb-sources';

    this.content.appendChild(controls);
    this.content.appendChild(this.statusEl);
    this.content.appendChild(this.audioEl);
    this.content.appendChild(this.scriptEl);
    this.content.appendChild(this.sourcesEl);
  }

  private async generate(): Promise<void> {
    if (this.isLoading) return;
    this.isLoading = true;

    this.generateBtn.disabled = true;
    this.statusEl.innerHTML = '<span class="vb-spinner"></span> Generating voice briefing... (this takes ~30s)';
    this.scriptEl.innerHTML = '';
    this.sourcesEl.innerHTML = '';
    this.audioEl.style.display = 'none';

    try {
      const token = localStorage.getItem('nova_token') || '';
      const res = await fetch(`${NOVA_API}/api/briefing/voice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          query: this.topicInput.value.trim() || undefined,
          language: this.langSelect.value,
        }),
        signal: AbortSignal.timeout(120000),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Show audio player
      if (data.audio_url) {
        this.audioEl.src = data.audio_url;
        this.audioEl.style.display = 'block';
        this.statusEl.innerHTML = '<span style="color:#22c55e">Briefing ready. Press play.</span>';
      } else {
        this.statusEl.innerHTML = '<span style="color:#f59e0b">Script generated (audio unavailable)</span>';
      }

      // Show script
      if (data.script) {
        this.scriptEl.innerHTML = `
          <div class="vb-script-header">Script</div>
          <div class="vb-script-text">${escapeHtml(data.script)}</div>
        `;
      }

      // Show sources
      if (data.sources?.length) {
        this.sourcesEl.innerHTML = `
          <div class="vb-sources-header">Sources (${data.sources.length})</div>
          ${data.sources.slice(0, 10).map((s: any) =>
            `<a href="${escapeHtml(s.url)}" target="_blank" class="vb-source-link">[${escapeHtml(s.source)}] ${escapeHtml(s.title)}</a>`
          ).join('')}
        `;
      }
    } catch (e: any) {
      this.statusEl.innerHTML = `<span style="color:#f87171">Error: ${escapeHtml(e.message)}</span>`;
    } finally {
      this.isLoading = false;
      this.generateBtn.disabled = false;
    }
  }

  private injectStyles(): void {
    if (document.getElementById('vb-styles')) return;
    const style = document.createElement('style');
    style.id = 'vb-styles';
    style.textContent = `
      .vb-controls { display:flex; gap:8px; flex-wrap:wrap; }
      .vb-input {
        flex:1; min-width:180px; padding:8px 12px; border-radius:8px;
        border:1px solid rgba(255,255,255,0.15); background:rgba(0,0,0,0.3);
        color:#e2e8f0; font-size:13px; outline:none;
      }
      .vb-input:focus { border-color:#8b5cf6; }
      .vb-select {
        padding:8px; border-radius:8px; border:1px solid rgba(255,255,255,0.15);
        background:rgba(0,0,0,0.3); color:#e2e8f0; font-size:13px;
      }
      .vb-generate-btn {
        display:flex; align-items:center; gap:6px; padding:8px 16px; border-radius:8px;
        border:none; background:linear-gradient(135deg, #8b5cf6, #6d28d9); color:white;
        font-weight:600; cursor:pointer; font-size:13px; white-space:nowrap;
      }
      .vb-generate-btn:hover { background:linear-gradient(135deg, #7c3aed, #5b21b6); }
      .vb-generate-btn:disabled { opacity:0.5; cursor:not-allowed; }

      .vb-audio { width:100%; border-radius:8px; }
      .vb-status { font-size:13px; color:#94a3b8; display:flex; align-items:center; gap:8px; min-height:24px; }

      .vb-spinner {
        display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,0.2);
        border-top-color:#8b5cf6; border-radius:50%; animation:vb-spin 0.8s linear infinite;
      }
      @keyframes vb-spin { to { transform:rotate(360deg); } }

      .vb-script {
        overflow-y:auto; flex:1; min-height:0;
      }
      .vb-script-header, .vb-sources-header {
        font-size:11px; text-transform:uppercase; letter-spacing:0.5px;
        color:#64748b; margin-bottom:6px; font-weight:600;
      }
      .vb-script-text {
        font-size:13px; color:#cbd5e1; line-height:1.6; white-space:pre-wrap;
        padding:10px; background:rgba(0,0,0,0.15); border-radius:8px;
      }

      .vb-sources { max-height:120px; overflow-y:auto; }
      .vb-source-link {
        display:block; font-size:12px; color:#93c5fd; text-decoration:none;
        padding:3px 0; border-bottom:1px solid rgba(255,255,255,0.05);
        overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
      }
      .vb-source-link:hover { color:#bfdbfe; text-decoration:underline; }
    `;
    document.head.appendChild(style);
  }
}
