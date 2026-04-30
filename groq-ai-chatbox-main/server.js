const express    = require('express');
const fetch      = require('node-fetch');
const cors       = require('cors');
const path       = require('path');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false })); // CSP off — we load CDN scripts
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Rate limit: 30 AI requests per minute per IP
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many requests — please slow down.' },
});

// ── Groq config ───────────────────────────────────────────────────────────────
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL     = 'https://api.groq.com/openai/v1/chat/completions';

// Available models the user can switch between
const MODELS = {
  'llama-3.1-8b-instant':    'LLaMA 3.1 8B (Fast)',
  'llama-3.3-70b-versatile': 'LLaMA 3.3 70B (Smart)',
  'mixtral-8x7b-32768':      'Mixtral 8x7B (Balanced)',
};

// System prompt — gives the AI a clear personality and purpose
const SYSTEM_PROMPT = `You are Aria, a brilliant and concise AI assistant built with Groq's LLaMA model.
You respond in clear, well-structured markdown when helpful (use **bold**, bullet points, code blocks).
Keep responses focused and useful. Never mention being an AI unless directly asked.
If asked about yourself, say you are Aria, powered by Groq LLaMA.`;

// ── POST /api/chat — streaming ────────────────────────────────────────────────
app.post('/api/chat', chatLimiter, async (req, res) => {
  try {
    const { message, history = [], model = 'llama-3.1-8b-instant' } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!GROQ_API_KEY) {
      return res.status(503).json({ error: 'GROQ_API_KEY not configured on server.' });
    }

    if (!MODELS[model]) {
      return res.status(400).json({ error: 'Invalid model selected.' });
    }

    // Build full conversation: system + history + new message
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      // history comes from client: [{ role, content }, ...]
      ...history.slice(-20), // keep last 20 exchanges to avoid token overflow
      { role: 'user', content: message.trim() },
    ];

    // ── Stream response from Groq ─────────────────────────────────────────
    const groqResp = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 1024,
        stream:     true,  // KEY: enables streaming
        temperature: 0.7,
      }),
    });

    if (!groqResp.ok) {
      const err = await groqResp.text();
      console.error('Groq API error:', groqResp.status, err);
      return res.status(502).json({ error: `Groq API error: ${groqResp.status}` });
    }

    // Set headers for SSE (Server-Sent Events) streaming
    res.setHeader('Content-Type',      'text/event-stream');
    res.setHeader('Cache-Control',     'no-cache');
    res.setHeader('X-Accel-Buffering', 'no');

    // Pipe Groq's stream to client
    groqResp.body.on('data', (chunk) => {
      const lines = chunk.toString().split('\n').filter(l => l.trim());
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') { res.write('data: [DONE]\n\n'); continue; }
        try {
          const json  = JSON.parse(data);
          const token = json.choices?.[0]?.delta?.content || '';
          if (token) res.write(`data: ${JSON.stringify({ token })}\n\n`);
        } catch { /* skip malformed chunks */ }
      }
    });

    groqResp.body.on('end',   () => res.end());
    groqResp.body.on('error', () => res.end());

  } catch (err) {
    console.error('POST /api/chat error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// ── GET /api/models — return available models ──────────────────────────────
app.get('/api/models', (_req, res) => {
  res.json({ models: MODELS });
});

// ── GET /api/health ────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status:    'healthy',
    groq:      GROQ_API_KEY ? 'configured' : 'missing',
    timestamp: new Date().toISOString(),
  });
});

// ── Global error handler ───────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(GROQ_API_KEY ? '✅ Groq API Key loaded' : '❌ Groq API Key missing — add to .env');
});
