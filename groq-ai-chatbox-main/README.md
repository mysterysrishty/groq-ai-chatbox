# 🤖 Aria — AI Voice Assistant

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![Groq](https://img.shields.io/badge/powered%20by-Groq%20LLaMA-orange.svg)
![Status](https://img.shields.io/badge/status-live-success.svg)

---

## 🌐 Live Demo

👉 **[https://your-live-url.vercel.app](https://your-live-url.vercel.app)**

> No login required — open and start chatting instantly.

![Aria Screenshot](./docs/screenshot.png)

---

## ✨ Features

- ⚡ **Streaming Responses** — AI replies word-by-word like ChatGPT, powered by Groq's ultra-fast LLaMA inference
- 🧠 **Conversation Memory** — Full chat history sent with every request so the AI remembers context
- 🎤 **Voice Input** — Speak your question via Web Speech API — auto-sends when you stop talking
- 🔊 **Voice Output** — AI responses read aloud via SpeechSynthesis API
- 🔀 **Model Selector** — Switch between LLaMA 3.1 8B (fast), LLaMA 3.3 70B (smart), Mixtral 8x7B (balanced)
- 📝 **Markdown Rendering** — AI responses render with bold, code blocks, bullet points and headers
- 🛡️ **Rate Limited** — 30 requests/min per IP via express-rate-limit
- 🔒 **Helmet Security** — HTTP security headers on every response
- 🎨 **Dark UI** — Polished terminal-inspired interface with animated grid background

---

## 🧠 Key Engineering Decisions

- **Streaming via SSE** — Used Server-Sent Events to pipe Groq's stream directly to the browser token-by-token, eliminating the wait for full response
- **Conversation history on client** — History array stored in JS state and sent with each request, keeping the server stateless and scalable
- **Last 20 messages only** — History is sliced to prevent token overflow on Groq's context window
- **API key never exposed** — All Groq calls happen server-side; the browser never sees the API key
- **Auto-send on voice final** — `isFinal` flag from SpeechRecognition triggers send automatically, making voice UX seamless
- **Rate limiting on chat only** — Applied 30 req/min specifically to `/api/chat` to protect Groq API quota

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| AI Model | Groq LLaMA 3.1 8B / 3.3 70B, Mixtral 8x7B |
| Backend | Node.js + Express.js |
| Streaming | Server-Sent Events (SSE) |
| Security | Helmet + express-rate-limit |
| Frontend | Vanilla JS + Tailwind CSS (CDN) |
| Voice | Web Speech API (STT + TTS) |
| Markdown | marked.js |
| Deployment | Vercel / Render |

---

## 📁 Project Structure

```
aria-ai-voice-chat/
├── public/
│   └── index.html        # Full frontend — UI, streaming, voice, markdown
├── docs/
│   └── screenshot.png    # README screenshot
├── server.js             # Express server — Groq proxy, SSE streaming, rate limiting
├── package.json
├── .env.example          # Environment variable template
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Free Groq API key from [console.groq.com](https://console.groq.com)

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/mysterysrishty/aria-ai-voice-chat.git
cd aria-ai-voice-chat

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Edit .env and add your GROQ_API_KEY

# 4. Run
npm run dev
```

Open **[http://localhost:5000](http://localhost:5000)** 🎉

---

## 🔧 Environment Variables

```env
GROQ_API_KEY=your_groq_api_key_here   # Get free at console.groq.com
PORT=5000
NODE_ENV=development
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Send message, returns SSE stream |
| GET | `/api/models` | List available AI models |
| GET | `/api/health` | Health check + Groq key status |

### Request body for `/api/chat`

```json
{
  "message": "Explain recursion",
  "model":   "llama-3.1-8b-instant",
  "history": [
    { "role": "user",      "content": "Hello" },
    { "role": "assistant", "content": "Hi! How can I help?" }
  ]
}
```

### Streaming response format (SSE)

```
data: {"token": "Recursion"}
data: {"token": " is"}
data: {"token": " when"}
...
data: [DONE]
```

---

## 🚢 Deployment

Deployed as a single Node.js service on **Render** (backend serves static frontend too):

| Setting | Value |
|---|---|
| Build Command | `npm install` |
| Start Command | `node server.js` |
| Environment Variable | `GROQ_API_KEY` |

---

## 📄 License

MIT License — see [LICENSE](LICENSE)

---

## 📧 Contact

**Srishty Singh**
- 📩 singhsrishty711@gmail.com
- 💼 [LinkedIn](https://linkedin.com/in/srishty)
- 🐙 [GitHub](https://github.com/mysterysrishty)

---

*Built with ❤️ using Groq LLaMA + Node.js by Srishty Singh*
