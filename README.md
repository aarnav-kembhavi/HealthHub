# HealthHub

Health data management and AI-assisted analysis platform. Combines personal health records with AI for analysis and medical information retrieval (RAG), real-time monitoring, and an AI health assistant.

## Repo structure

| Directory | Description |
|-----------|-------------|
| **health-monitor-next** | Next.js frontend (TypeScript) — UI, dashboard, chat, records, reports |
| **health-monitor-api** | FastAPI backend (Python) — RAG, embeddings, transcription, health reports |

## Features

- **AI health assistant** — Text, voice, and video (e.g. HeyGen) with RAG (Langchain) and medical search (Tavily)
- **Health dashboard** — Vitals, metrics, and analytics; optional Arduino/ESP8266 + Supabase integration
- **Medical records** — Upload, transcription, vectorization (e.g. Cohere), and semantic search
- **Monitoring & activities** — Real-time vitals and activity tracking
- **Nutrition & reports** — Nutrition tracking and generated health reports

## Tech stack

- **Frontend:** Next.js 14, TypeScript, Tailwind, Radix UI, Supabase
- **Backend:** FastAPI (Python), Langchain, OpenAI, Cohere, Tavily
- **Data:** Supabase (PostgreSQL + pgvector)

## Prerequisites

- Node.js (v14+)
- Python 3.8+
- Supabase project
- API keys (as used by frontend/backend): OpenAI, Gemini/Google, Cohere, Tavily, Resend, Nutritionix (see subproject READMEs)

## Quick start

1. **Clone the repo**
   ```bash
   git clone https://github.com/YOUR_USERNAME/healthub.git
   cd healthub
