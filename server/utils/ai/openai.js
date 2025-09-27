import { PassThrough } from 'stream';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

function getApiKey() {
  const k = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || '';
  if (!k) throw new Error('Missing OPENAI_API_KEY');
  return k;
}

function normalizeMessages(messages = []) {
  // Expect [{ role: 'user'|'system'|'assistant', content: string }]
  const out = [];
  for (const m of messages) {
    if (!m || typeof m.content !== 'string') continue;
    const role = ['user', 'system', 'assistant'].includes(String(m.role)) ? m.role : 'user';
    out.push({ role, content: String(m.content) });
  }
  return out;
}

export async function openaiChat({ messages, model, temperature = 0.7, max_tokens, stream = false, signal }) {
  const apiKey = getApiKey();
  const body = {
    model: model || process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: normalizeMessages(messages),
    temperature,
    stream,
  };
  if (typeof max_tokens === 'number') body.max_tokens = max_tokens;

  const resp = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!stream) {
    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      throw new Error(`OpenAI error ${resp.status}: ${errText.slice(0, 200)}`);
    }
    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content || '';
    return { provider: 'openai', model: body.model, content, raw: data };
  }

  // Streaming: return a Node stream of Server-Sent Events (SSE) data chunks
  if (!resp.ok || !resp.body) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`OpenAI stream error ${resp.status}: ${errText.slice(0, 200)}`);
  }
  const passthrough = new PassThrough();
  (async () => {
    try {
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        // Forward as-is; upstream is already in SSE format with lines starting with 'data:'
        passthrough.write(chunk);
      }
      passthrough.end();
    } catch (e) {
      try { passthrough.end(); } catch {}
    }
  })();
  return { provider: 'openai', model: body.model, stream: passthrough };
}
