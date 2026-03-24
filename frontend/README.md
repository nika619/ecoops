# ECOOPS Global Matrix Frontend

> React + TypeScript + Vite — WebGL holographic globe dashboard with voice AI

## Features

- **🌍 Interactive Globe** — Cobe-powered WebGL globe with edge node markers and deployment arcs
- **📊 4 Navigation Views**:
  - **NETWORK** — 3D globe with deployment controls and edge node status
  - **TELEMETRY** — Pipeline metrics dashboard (jobs, waste %, monthly/annual projections)
  - **ARCS** — SVG visualization of CI job → file pattern optimization mappings
  - **REGIONS** — Edge node detail cards with latency, uptime, CO₂ share
- **🎤 Voice AI** — Real-time bidirectional voice via Gemini 2.5 Flash Native Audio WebSocket
  - Always-on listening (no re-clicking the mic)
  - Barge-in support (interrupt the AI mid-sentence)
  - AudioWorklet-based 16kHz PCM capture
- **💬 Chat Interface** — Collapsible text chat panel
- **📡 Live Analysis** — SSE-powered real-time progress from Flask backend

## Architecture

```
src/
├── main.tsx                    # Entry point
├── globalmatrix/
│   └── GlobalMatrixApp.tsx     # Main dashboard (globe + tabs + deployment)
├── voice/
│   └── VoiceAgent.ts           # Gemini 2.5 Flash Native Audio client
├── components/
│   ├── VoiceMicButton.tsx      # Floating mic button with state animations
│   ├── ChatBox.tsx             # Collapsible chat panel
│   └── ErrorBoundary.tsx       # React error boundary
├── api.ts                      # Backend API client (SSE + REST)
└── index.css                   # Global styles + animations

public/
└── pcm-worklet.js              # AudioWorklet for 16kHz PCM capture
```

## Setup

```bash
npm install
npm run dev
# → http://localhost:5173
```

Requires the Flask backend running on port 5001 (`flask --app backend.web_app run --port 5001`).

## Environment Variables

Set in `../.env`:
```env
GEMINI_API_KEY=xxx     # Required for voice AI
GITLAB_TOKEN=xxx       # Required for pipeline analysis
GITLAB_PROJECT_ID=xxx  # Target project
```
