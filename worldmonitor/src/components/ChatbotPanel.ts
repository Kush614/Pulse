import { Panel } from './Panel';

const NOVA_API = '/nova';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export class ChatbotPanel extends Panel {
  private messages: ChatMessage[] = [];
  private inputEl!: HTMLTextAreaElement;
  private messagesContainer!: HTMLElement;
  private sendBtn!: HTMLButtonElement;
  private isLoading = false;

  constructor() {
    super({
      id: 'chatbot',
      title: 'Nova AI News',
      className: 'chatbot-panel col-span-2 span-3',
      showCount: false,
      trackActivity: false,
    });

    this.buildChatUI();
    this.addWelcomeMessage();
    this.checkNovaConnection();
  }

  private buildChatUI(): void {
    this.content.innerHTML = '';
    this.content.style.cssText = 'display:flex;flex-direction:column;height:100%;padding:0;overflow:hidden;';

    // Status bar — Nova connection indicators
    const statusBar = document.createElement('div');
    statusBar.className = 'chatbot-mcp-status';
    statusBar.innerHTML = `
      <div class="chatbot-mcp-badges">
        <span class="chatbot-mcp-badge" id="novaBadge">Nova AI</span>
        <span class="chatbot-mcp-badge" id="insforgebadge">InsForge</span>
        <span class="chatbot-mcp-badge" id="elevenlabsBadge">ElevenLabs</span>
      </div>
    `;

    // Messages area
    this.messagesContainer = document.createElement('div');
    this.messagesContainer.className = 'chatbot-messages';

    // Input area
    const inputArea = document.createElement('div');
    inputArea.className = 'chatbot-input-area';

    this.inputEl = document.createElement('textarea');
    this.inputEl.className = 'chatbot-input';
    this.inputEl.placeholder = 'Ask about world events, markets, conflicts...';
    this.inputEl.rows = 1;
    this.inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });
    this.inputEl.addEventListener('input', () => {
      this.inputEl.style.height = 'auto';
      this.inputEl.style.height = Math.min(this.inputEl.scrollHeight, 120) + 'px';
    });

    this.sendBtn = document.createElement('button');
    this.sendBtn.className = 'chatbot-send-btn';
    this.sendBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg>`;
    this.sendBtn.addEventListener('click', () => this.handleSend());

    inputArea.appendChild(this.inputEl);
    inputArea.appendChild(this.sendBtn);

    this.content.appendChild(statusBar);
    this.content.appendChild(this.messagesContainer);
    this.content.appendChild(inputArea);

    // Inject styles
    if (!document.getElementById('chatbot-styles')) {
      const style = document.createElement('style');
      style.id = 'chatbot-styles';
      style.textContent = CHATBOT_CSS;
      document.head.appendChild(style);
    }
  }

  private addWelcomeMessage(): void {
    this.addMessage({
      role: 'assistant',
      content: `Welcome to **Nova News** — your objective AI news analyst.\n\nI cross-reference multiple sources and analyze bias to give you the clearest picture.\n\nTry asking:\n- "What's happening with AI regulation?"\n- "Latest on the Taiwan situation"\n- "Analyze market trends today"\n- "What are the most objective sources on climate?"\n\nAlso check out the **Bias Radar**, **Debate Mode**, and **Voice Briefing** panels!`,
      timestamp: new Date(),
    });
  }

  private async checkNovaConnection(): Promise<void> {
    try {
      const res = await fetch(`${NOVA_API}/health`, { signal: AbortSignal.timeout(5000) });
      const data = await res.json();
      this.updateBadge('novaBadge', data.status === 'ok');
      this.updateBadge('insforgebadge', !!data.insforge);
      this.updateBadge('elevenlabsBadge', !!data.elevenlabs);
    } catch {
      this.updateBadge('novaBadge', false);
      this.updateBadge('insforgebadge', false);
      this.updateBadge('elevenlabsBadge', false);
    }
  }

  private updateBadge(id: string, connected: boolean, toolCount?: number): void {
    const badge = document.getElementById(id);
    if (!badge) return;
    badge.classList.toggle('connected', connected);
    badge.classList.toggle('disconnected', !connected);
    if (connected && toolCount !== undefined) {
      badge.textContent += ` (${toolCount})`;
    }
  }



  private async handleSend(): Promise<void> {
    const text = this.inputEl.value.trim();
    if (!text || this.isLoading) return;

    this.inputEl.value = '';
    this.inputEl.style.height = 'auto';

    this.addMessage({ role: 'user', content: text, timestamp: new Date() });
    this.setLoading(true);

    try {
      const response = await this.processQuery(text);
      this.addMessage({ role: 'assistant', content: response, timestamp: new Date() });
    } catch (e: any) {
      this.addMessage({ role: 'assistant', content: `Error: ${e.message}`, timestamp: new Date() });
    } finally {
      this.setLoading(false);
    }
  }


  private async processQuery(query: string): Promise<string> {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('help') || lowerQuery.includes('what can')) {
      return this.getHelpText();
    }

    // Call Nova backend — streaming chat
    try {
      const token = localStorage.getItem('nova_token') || '';
      const history = this.messages
        .filter(m => m.role !== 'system')
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch(`${NOVA_API}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: query, history }),
        signal: AbortSignal.timeout(60000),
      });

      if (!res.ok) {
        // Fallback to sync endpoint
        const syncRes = await fetch(`${NOVA_API}/api/chat/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: query }),
          signal: AbortSignal.timeout(60000),
        });
        if (!syncRes.ok) throw new Error(`HTTP ${syncRes.status}`);
        const data = await syncRes.json();
        return data.response || 'No response from Nova.';
      }

      // Read SSE stream
      if (!res.body) {
        const text = await res.text();
        return text || 'No response from Nova.';
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const parsed = JSON.parse(line.slice(6));
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) fullResponse += delta;
            } catch { /* skip */ }
          }
        }
      }

      return fullResponse || 'Nova processed your query but returned no content.';
    } catch (e: any) {
      return `Error connecting to Nova: ${e.message}. Check that the Nova server is running at ${NOVA_API}`;
    }
  }


  private getHelpText(): string {
    let text = '## Nova News — AI-Powered Objective News\n\n';
    text += '**Chat Features:**\n';
    text += '- Ask about any news topic for a bias-aware, multi-source briefing\n';
    text += '- Real-time data from Google News, EXA, Twitter/X, Reddit\n';
    text += '- All queries stored in InsForge DB for trending analysis\n\n';
    text += '**Other Panels to Try:**\n';
    text += '- **Bias Radar** — See how different sources cover the same story\n';
    text += '- **Multi-AI Consensus** — 3 AI models fact-check the same topic\n';
    text += '- **Debate Mode** — Both sides of controversial topics with audio\n';
    text += '- **Voice Briefing** — ElevenLabs-powered audio news briefings\n';
    text += '- **What Did I Miss?** — Personalized catch-up since last visit\n';
    text += '- **Breaking News** — Live feed with urgency scoring\n\n';
    text += '**Powered by:** InsForge (DB, Auth, AI Gateway, Storage, Realtime, Vector Search) + ElevenLabs';
    return text;
  }


  private addMessage(msg: ChatMessage): void {
    this.messages.push(msg);

    const msgEl = document.createElement('div');
    msgEl.className = `chatbot-message chatbot-message-${msg.role}`;

    const avatar = document.createElement('div');
    avatar.className = 'chatbot-avatar';
    avatar.textContent = msg.role === 'user' ? 'U' : 'AI';

    const bubble = document.createElement('div');
    bubble.className = 'chatbot-bubble';
    bubble.innerHTML = this.renderMarkdown(msg.content);

    const time = document.createElement('div');
    time.className = 'chatbot-time';
    time.textContent = msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    msgEl.appendChild(avatar);
    const wrapper = document.createElement('div');
    wrapper.className = 'chatbot-bubble-wrapper';
    wrapper.appendChild(bubble);
    wrapper.appendChild(time);
    msgEl.appendChild(wrapper);

    this.messagesContainer.appendChild(msgEl);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  private renderMarkdown(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      .replace(/^### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
      .replace(/\n/g, '<br>');
  }

  private setLoading(loading: boolean): void {
    this.isLoading = loading;
    this.sendBtn.disabled = loading;
    this.inputEl.disabled = loading;

    // Remove existing loading indicator
    const existing = this.messagesContainer.querySelector('.chatbot-loading');
    if (existing) existing.remove();

    if (loading) {
      const loader = document.createElement('div');
      loader.className = 'chatbot-message chatbot-message-assistant chatbot-loading';
      loader.innerHTML = `
        <div class="chatbot-avatar">AI</div>
        <div class="chatbot-bubble-wrapper">
          <div class="chatbot-bubble">
            <div class="chatbot-typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      `;
      this.messagesContainer.appendChild(loader);
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }
}

const CHATBOT_CSS = `
.chatbot-panel {
  min-height: 500px !important;
}

.chatbot-mcp-status {
  padding: 6px 12px;
  border-bottom: 1px solid var(--border);
  background: var(--surface-hover, rgba(255,255,255,0.03));
}

.chatbot-mcp-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chatbot-mcp-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.chatbot-mcp-badge.connected {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.chatbot-mcp-badge.disconnected {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}


.chatbot-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chatbot-message {
  display: flex;
  gap: 8px;
  max-width: 90%;
}

.chatbot-message-user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.chatbot-message-assistant {
  align-self: flex-start;
}

.chatbot-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.chatbot-message-user .chatbot-avatar {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.chatbot-message-assistant .chatbot-avatar {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.chatbot-bubble-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.chatbot-bubble {
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
}

.chatbot-message-user .chatbot-bubble {
  background: rgba(59, 130, 246, 0.15);
  color: var(--text);
  border-bottom-right-radius: 4px;
}

.chatbot-message-assistant .chatbot-bubble {
  background: var(--surface-hover, rgba(255,255,255,0.05));
  color: var(--text);
  border-bottom-left-radius: 4px;
}

.chatbot-bubble code {
  background: rgba(0,0,0,0.3);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 12px;
}

.chatbot-bubble pre {
  background: rgba(0,0,0,0.4);
  padding: 8px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 4px 0;
}

.chatbot-bubble pre code {
  background: none;
  padding: 0;
}

.chatbot-bubble h3, .chatbot-bubble h4 {
  margin: 8px 0 4px;
  font-size: 14px;
}

.chatbot-bubble ul {
  margin: 4px 0;
  padding-left: 16px;
}

.chatbot-bubble li {
  margin: 2px 0;
}

.chatbot-time {
  font-size: 10px;
  color: var(--text-muted, #666);
  padding: 0 4px;
}

.chatbot-message-user .chatbot-time {
  text-align: right;
}

.chatbot-input-area {
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid var(--border);
  background: var(--surface-hover, rgba(255,255,255,0.03));
  align-items: flex-end;
}

.chatbot-input {
  flex: 1;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 12px;
  color: var(--text);
  font-size: 13px;
  font-family: inherit;
  resize: none;
  outline: none;
  min-height: 36px;
  max-height: 120px;
}

.chatbot-input:focus {
  border-color: rgba(59, 130, 246, 0.5);
}

.chatbot-input::placeholder {
  color: var(--text-muted, #666);
}

.chatbot-send-btn {
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  color: #60a5fa;
  cursor: pointer;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s;
}

.chatbot-send-btn:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.35);
}

.chatbot-send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.chatbot-typing {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}

.chatbot-typing span {
  width: 6px;
  height: 6px;
  background: var(--text-muted, #666);
  border-radius: 50%;
  animation: chatbot-bounce 1.2s infinite;
}

.chatbot-typing span:nth-child(2) { animation-delay: 0.2s; }
.chatbot-typing span:nth-child(3) { animation-delay: 0.4s; }

@keyframes chatbot-bounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-8px); }
}

`;
