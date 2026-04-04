import { Panel } from './Panel';
import { escapeHtml } from '@/utils/sanitize';

const NOVA_API = '/nova';

interface BreakingItem {
  id: number;
  headline: string;
  urgency: number;
  pushed_at: string;
  regions: string[];
}

export class BreakingNewsRealtimePanel extends Panel {
  private feedEl!: HTMLElement;
  private alertAudioEl!: HTMLAudioElement;
  private wsConnection: WebSocket | null = null;
  private items: BreakingItem[] = [];

  constructor() {
    super({
      id: 'breaking-realtime',
      title: 'Breaking News (Live)',
      className: 'breaking-realtime-panel col-span-2 span-2',
      showCount: true,
      trackActivity: true,
    });
    this.buildUI();
    this.injectStyles();
    this.loadRecent();
    this.connectRealtime();
  }

  private buildUI(): void {
    this.content.innerHTML = '';
    this.content.style.cssText = 'display:flex;flex-direction:column;height:100%;padding:8px 12px;overflow-y:auto;';

    // Live indicator
    const liveBar = document.createElement('div');
    liveBar.className = 'brk-live-bar';
    liveBar.innerHTML = `
      <span class="brk-live-dot"></span>
      <span class="brk-live-text">LIVE</span>
      <span class="brk-connection" id="brkConnectionStatus">Connecting...</span>
    `;

    this.feedEl = document.createElement('div');
    this.feedEl.className = 'brk-feed';

    // Hidden audio element for alerts
    this.alertAudioEl = document.createElement('audio');
    this.alertAudioEl.preload = 'none';

    this.content.appendChild(liveBar);
    this.content.appendChild(this.feedEl);
    this.content.appendChild(this.alertAudioEl);
  }

  private async loadRecent(): Promise<void> {
    try {
      const res = await fetch(`${NOVA_API}/api/breaking`);
      if (!res.ok) return;
      const items: BreakingItem[] = await res.json();
      this.items = items;
      this.renderFeed();
      this.setCount(items.length);
    } catch {
      // silent — will retry via realtime
    }
  }

  private connectRealtime(): void {
    // Poll for new breaking news every 30 seconds (fallback if WebSocket not available)
    const statusEl = document.getElementById('brkConnectionStatus');

    const poll = async () => {
      try {
        const res = await fetch(`${NOVA_API}/api/breaking`);
        if (!res.ok) return;
        const items: BreakingItem[] = await res.json();

        // Check for new items
        const newItems = items.filter(item =>
          !this.items.some(existing => existing.id === item.id)
        );

        if (newItems.length > 0) {
          this.items = items;
          this.renderFeed();
          this.setCount(items.length);

          // Flash animation for new items
          for (const item of newItems) {
            this.flashAlert(item);
          }
        }

        if (statusEl) {
          statusEl.textContent = 'Connected';
          statusEl.style.color = '#22c55e';
        }
      } catch {
        if (statusEl) {
          statusEl.textContent = 'Reconnecting...';
          statusEl.style.color = '#f59e0b';
        }
      }
    };

    // Initial load + interval
    poll();
    setInterval(poll, 30000);

    if (statusEl) {
      statusEl.textContent = 'Polling (30s)';
      statusEl.style.color = '#22c55e';
    }
  }

  private renderFeed(): void {
    this.feedEl.innerHTML = this.items.slice(0, 20).map(item => {
      const time = new Date(item.pushed_at).toLocaleTimeString();
      const urgencyClass = item.urgency >= 4 ? 'brk-critical' : item.urgency >= 3 ? 'brk-high' : 'brk-normal';

      return `
        <div class="brk-item ${urgencyClass}" data-id="${item.id}">
          <div class="brk-urgency-bar" style="--urgency:${item.urgency}"></div>
          <div class="brk-item-content">
            <span class="brk-time">${time}</span>
            <span class="brk-headline">${escapeHtml(item.headline)}</span>
          </div>
          ${item.urgency >= 4 ? '<span class="brk-alert-badge">ALERT</span>' : ''}
        </div>
      `;
    }).join('');
  }

  private flashAlert(item: BreakingItem): void {
    // Browser notification for high urgency
    if (item.urgency >= 4 && Notification.permission === 'granted') {
      new Notification('Breaking News', { body: item.headline, icon: '/favicon.ico' });
    }

    // Visual flash on the panel
    this.content.classList.add('brk-flash');
    setTimeout(() => this.content.classList.remove('brk-flash'), 2000);
  }

  destroy(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
    }
  }

  private injectStyles(): void {
    if (document.getElementById('brk-styles')) return;
    const style = document.createElement('style');
    style.id = 'brk-styles';
    style.textContent = `
      .brk-live-bar {
        display:flex; align-items:center; gap:6px; padding:4px 0 8px;
        border-bottom:1px solid rgba(255,255,255,0.06); margin-bottom:8px;
      }
      .brk-live-dot {
        width:8px; height:8px; border-radius:50%; background:#ef4444;
        animation:brk-pulse 1.5s ease-in-out infinite;
      }
      @keyframes brk-pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
      .brk-live-text { font-size:11px; font-weight:800; color:#ef4444; letter-spacing:1px; }
      .brk-connection { font-size:11px; color:#64748b; margin-left:auto; }

      .brk-feed { overflow-y:auto; flex:1; display:flex; flex-direction:column; gap:4px; }
      .brk-item {
        display:flex; align-items:center; gap:8px; padding:6px 8px; border-radius:6px;
        background:rgba(0,0,0,0.1); border-left:3px solid transparent;
        animation:brk-slide-in 0.3s ease;
      }
      @keyframes brk-slide-in { from { opacity:0; transform:translateY(-10px); } }
      .brk-normal { border-left-color:#64748b; }
      .brk-high { border-left-color:#f59e0b; background:rgba(245,158,11,0.05); }
      .brk-critical { border-left-color:#ef4444; background:rgba(239,68,68,0.08); }

      .brk-item-content { display:flex; gap:8px; align-items:baseline; flex:1; min-width:0; }
      .brk-time { font-size:11px; color:#64748b; flex-shrink:0; font-family:monospace; }
      .brk-headline { font-size:13px; color:#e2e8f0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .brk-critical .brk-headline { color:#fca5a5; font-weight:600; }

      .brk-alert-badge {
        font-size:10px; font-weight:800; color:#ef4444; background:rgba(239,68,68,0.15);
        padding:2px 6px; border-radius:4px; letter-spacing:0.5px; flex-shrink:0;
      }

      .brk-flash { animation:brk-flash-anim 0.5s ease 3; }
      @keyframes brk-flash-anim { 0%,100% { box-shadow:none; } 50% { box-shadow:inset 0 0 20px rgba(239,68,68,0.15); } }
    `;
    document.head.appendChild(style);
  }
}
