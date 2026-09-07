# Brink

Working title for a DreamDEX Event Contracts market-discovery and execution layer.

The repository contains the Fastify API and the Vite landing-page frontend. Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) before changing product boundaries.

## Commands

```bash
npm install
npm test
npm run build:api
npm run dev:api
npm run dev:web
npm run build:web
```

The API currently exposes GET /health and GET /v1/markets. The frontend lives in apps/web and uses React, TypeScript, Tailwind CSS, and a shadcn-style component structure. Set VITE_API_BASE_URL when the API is not served from 127.0.0.1:8787.
