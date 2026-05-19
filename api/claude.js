/**
 * /api/claude.js — Proxy Vercel vers OpenRouter
 */

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  const allowed = [
    'https://mogged-ai-oyzu.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:5500',
  ];
  const origin = req.headers.origin || '';
  if (allowed.includes(origin) || origin.endsWith('.vercel.app')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENROUTER_API_KEY not configured' });

  try {
    const body = req.body;
    const openaiMessages = [];

    if (body.system) {
      openaiMessages.push({ role: 'system', content: body.system });
    }

    if (Array.isArray(body.messages)) {
      for (const msg of body.messages) {
        if (Array.isArray(msg.content)) {
          const parts = msg.content.map(part => {
            if (part.type === 'image') {
              return {
                type: 'image_url',
                image_url: {
                  url: part.source?.type === 'base64'
                    ? `data:${part.source.media_type};base64,${part.source.data}`
                    : part.source?.url || ''
                }
              };
            }
            return { type: 'text', text: part.text || '' };
          });
          openaiMessages.push({ role: msg.role, content: parts });
        } else {
          openaiMessages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    const modelMap = {
      'claude-sonnet-4-20250514': 'anthropic/claude-sonnet-4-5',
      'claude-3-5-sonnet-20241022': 'anthropic/claude-3.5-sonnet',
    };
    const requestedModel = body.model || 'claude-sonnet-4-20250514';
    const openrouterModel = modelMap[requestedModel] || 'anthropic/claude-sonnet-4-5';

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://mogged-ai-oyzu.vercel.app',
        'X-Title': 'Mogged.ai',
      },
      body: JSON.stringify({
        model: openrouterModel,
        max_tokens: Math.min(body.max_tokens || 1000, 16000),
        messages: openaiMessages,
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);

    const openaiText = data.choices?.[0]?.message?.content || '';
    return res.status(200).json({
      id: data.id || 'msg_' + Date.now(),
      type: 'message',
      role: 'assistant',
      content: [{ type: 'text', text: openaiText }],
      model: requestedModel,
      stop_reason: 'end_turn',
      usage: {
        input_tokens: data.usage?.prompt_tokens || 0,
        output_tokens: data.usage?.completion_tokens || 0,
      }
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
