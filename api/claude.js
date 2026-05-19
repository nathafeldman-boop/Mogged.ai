/**
 * /api/claude.js — Proxy Vercel vers OpenRouter
 * Accepte le format Anthropic et retourne le format Anthropic.
 * Supporte les messages avec images (vision) pour le scanner facial.
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

    // Ajouter le system prompt si présent
    if (body.system) {
      openaiMessages.push({ role: 'system', content: body.system });
    }

    // Convertir les messages du format Anthropic vers OpenAI
    let hasImages = false;
    if (Array.isArray(body.messages)) {
      for (const msg of body.messages) {
        if (Array.isArray(msg.content)) {
          const parts = msg.content.map(part => {
            if (part.type === 'image') {
              // Format Anthropic image -> format OpenAI image_url
              hasImages = true;
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

    // Modèles par ordre de préférence (gratuits et supportant la vision)
    // google/gemma-4-31b-it:free supporte la vision et est gratuit
    const openrouterModel = hasImages
      ? 'google/gemma-4-31b-it:free'
      : 'google/gemma-4-31b-it:free';

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

    if (!response.ok) {
      console.error('OpenRouter error:', response.status, JSON.stringify(data));
      return res.status(response.status).json(data);
    }

    const openaiText = data.choices?.[0]?.message?.content || '';

    // Retourner le format Anthropic pour compatibilité avec le frontend
    return res.status(200).json({
      id: data.id || 'msg_' + Date.now(),
      type: 'message',
      role: 'assistant',
      content: [{ type: 'text', text: openaiText }],
      model: body.model || openrouterModel,
      stop_reason: 'end_turn',
      usage: {
        input_tokens: data.usage?.prompt_tokens || 0,
        output_tokens: data.usage?.completion_tokens || 0,
      }
    });

  } catch (err) {
    console.error('Proxy error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
