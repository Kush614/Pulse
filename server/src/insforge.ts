// ============================================================
// Nova News — InsForge Client (REST API)
// ============================================================
// Actual InsForge API paths discovered from live instance:
//   DB:      /api/database/records/{table}
//   Auth:    /api/auth/users (signup), /api/auth/sessions (login)
//   AI:      /api/ai/chat/completion
//   Storage: /api/storage/upload/{bucket}
//   Tables:  /api/database/tables

const INSFORGE_URL = process.env.INSFORGE_URL || '';
const INSFORGE_API_KEY = process.env.INSFORGE_API_KEY || '';       // anon JWT
const INSFORGE_SERVICE_KEY = process.env.INSFORGE_SERVICE_KEY || ''; // ik_* key

function headers(token?: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-api-key': INSFORGE_SERVICE_KEY,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

// ─── Database Records ────────────────────────────────────────
// GET  /api/database/records/{table}?limit=N&offset=N&order=col.desc&col=op.value
// POST /api/database/records/{table}  body: [{...}]
// PATCH /api/database/records/{table}?id=eq.X  body: {...}

export async function dbSelect<T>(
  table: string,
  query: string = '',
  token?: string
): Promise<T[]> {
  const url = `${INSFORGE_URL}/api/database/records/${table}${query ? '?' + query : ''}`;
  const res = await fetch(url, { headers: headers(token) });
  if (!res.ok) {
    const text = await res.text();
    console.error(`DB select ${table}: ${res.status} ${text}`);
    return [];
  }
  const data = await res.json() as any;
  // InsForge may wrap in { data: [...] } or return array directly
  return Array.isArray(data) ? data : (data.data || data.records || []);
}

export async function dbInsert<T>(
  table: string,
  data: Record<string, unknown> | Record<string, unknown>[],
  token?: string
): Promise<T[]> {
  const url = `${INSFORGE_URL}/api/database/records/${table}`;
  const body = Array.isArray(data) ? data : [data];
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...headers(token), 'Prefer': 'return=representation' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`DB insert ${table}: ${res.status} ${text}`);
    return [];
  }
  const result = await res.json() as any;
  return Array.isArray(result) ? result : (result.data || result.records || [result]);
}

export async function dbUpdate<T>(
  table: string,
  query: string,
  data: Record<string, unknown>,
  token?: string
): Promise<T[]> {
  const url = `${INSFORGE_URL}/api/database/records/${table}?${query}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { ...headers(token), 'Prefer': 'return=representation' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`DB update ${table}: ${res.status} ${text}`);
    return [];
  }
  const result = await res.json() as any;
  return Array.isArray(result) ? result : (result.data || [result]);
}

export async function dbDelete(table: string, query: string, token?: string): Promise<void> {
  const url = `${INSFORGE_URL}/api/database/records/${table}?${query}`;
  await fetch(url, { method: 'DELETE', headers: headers(token) });
}

// ─── Authentication ──────────────────────────────────────────

export async function authSignUp(email: string, password: string, name?: string) {
  const res = await fetch(`${INSFORGE_URL}/api/auth/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name: name || email.split('@')[0] }),
  });
  if (!res.ok) throw new Error(`Auth signup: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function authLogin(email: string, password: string) {
  const res = await fetch(`${INSFORGE_URL}/api/auth/sessions?client_type=server`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Auth login: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function authGetUser(token: string) {
  const res = await fetch(`${INSFORGE_URL}/api/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Auth get user: ${res.status}`);
  return res.json();
}

// ─── AI Gateway ──────────────────────────────────────────────
// POST /api/ai/chat/completion
// Auth: Authorization: Bearer <ik_key> OR x-api-key: <ik_key>
// Response: { text, metadata: { model, usage } }

export interface AIChatOptions {
  model?: string;
  messages: { role: string; content: string }[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export async function aiChat(options: AIChatOptions, token?: string) {
  const res = await fetch(`${INSFORGE_URL}/api/ai/chat/completion`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${INSFORGE_SERVICE_KEY}`,
    },
    body: JSON.stringify({
      model: options.model || 'openai/gpt-4o-mini',
      messages: options.messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.max_tokens ?? 2048,
      stream: options.stream ?? false,
    }),
  });
  if (!res.ok) throw new Error(`AI chat: ${res.status} ${await res.text()}`);
  if (options.stream) return res;

  const data = await res.json() as any;

  // InsForge returns { text, metadata } format — normalize to OpenAI-compatible
  if (data.text && !data.choices) {
    return {
      choices: [{ message: { content: data.text, role: 'assistant' }, delta: { content: data.text } }],
      metadata: data.metadata,
    };
  }
  return data;
}

export async function aiChatStream(options: AIChatOptions, token?: string) {
  return aiChat({ ...options, stream: true }, token);
}

export async function aiEmbedding(text: string, token?: string): Promise<number[]> {
  // Use AI gateway for embeddings if available
  try {
    const res = await fetch(`${INSFORGE_URL}/api/ai/chat/completion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${INSFORGE_SERVICE_KEY}`,
      },
      body: JSON.stringify({
        model: 'openai/text-embedding-3-small',
        input: text,
      }),
    });
    if (!res.ok) return [];
    const data = await res.json() as any;
    return data.data?.[0]?.embedding || data.embedding || [];
  } catch {
    return [];
  }
}

// ─── Storage ─────────────────────────────────────────────────

export async function storageUpload(
  bucket: string,
  path: string,
  fileBuffer: Buffer | Uint8Array,
  contentType: string,
  token?: string
): Promise<string> {
  // Try InsForge storage endpoint
  const url = `${INSFORGE_URL}/api/storage/upload/${bucket}/${path}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': INSFORGE_SERVICE_KEY,
        'Content-Type': contentType,
      },
      body: fileBuffer as unknown as BodyInit,
    });
    if (res.ok) {
      const data = await res.json() as any;
      return data.url || data.publicUrl || `${INSFORGE_URL}/api/storage/public/${bucket}/${path}`;
    }
  } catch {
    // Storage may not be configured — fall back to returning base64 data URI
  }

  // Fallback: return a data URI so audio still works even without storage
  const base64 = Buffer.from(fileBuffer).toString('base64');
  return `data:${contentType};base64,${base64}`;
}

export async function storageGetPublicUrl(bucket: string, path: string): Promise<string> {
  return `${INSFORGE_URL}/api/storage/public/${bucket}/${path}`;
}

// ─── Realtime (publish via DB insert — triggers push via WebSocket) ──

export async function publishBreakingNews(headline: string, articleId: number, urgency: number = 3) {
  return dbInsert('breaking_news', {
    article_id: articleId,
    headline,
    urgency,
    regions: ['global'],
  });
}
