# 🏡 Arvia — AI-Powered Real Estate Platform

**Arvia** is a high-performance, privacy-focused real estate platform that combines the power of Local LLMs (**Ollama**) with the flexibility of **n8n** and a modern **Next.js 14** frontend.

Designed to handle lead generation, property search, and automated customer assistance, Arvia provides a seamless experience for both agents and clients.

---

## 🚀 Key Features

- **🤖 Local AI Intelligence**: Powered by Ollama (`llama3`), Arvia processes natural language queries locally, ensuring data privacy and low latency.
- **📱 Multi-Channel Bot**: Fully deterministic Telegram Wizard for property search and lead capture (Commune -> Bedrooms -> Bathrooms).
- **🌐 Modern SaaS UI**: Premium Next.js 14 dashboard with glassmorphism, framer-motion animations, and dark mode support.
- **🔍 Smart Search**: AI-assisted filtering that understands natural language like *"I'm looking for a 3-bedroom house in Viña del Mar under 200M"*.
- **📊 Lead Management**: Automated capture of names, phones, and interests directly into a PostgreSQL database.
- **⚡ One-Click Infrastructure**: Fully dockerized environment (n8n + Postgres) with automated startup scripts.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, shadcn/ui, Framer Motion.
- **Orchestration**: n8n (Advanced Workflows).
- **Intelligence**: Ollama (Llama 3).
- **Database**: PostgreSQL 15.
- **Tunneling**: ngrok (for Webhooks).
- **Infrastructure**: Docker & Docker Compose.

---

## 📦 Installation & Setup

### 1. Prerequisites
- Docker & Docker Desktop
- Node.js 18+
- Ollama (installed locally)

### 2. Startup
Run the automated script to launch the full stack:
```bash
./start-n8n.bat
```

### 3. Environment Configuration
Copy `.env.example` to `.env` and fill in your credentials:
- `POSTGRES_PASSWORD`
- `N8N_BASIC_AUTH_PASSWORD`
- `WEBHOOK_URL` (Your ngrok URL)

---

## 🔒 Security & Best Practices

- **Zero Hardcoded Secrets**: All credentials are managed via environment variables.
- **Input Sanitization**: SQL injection protection in all n8n database nodes.
- **Idempotency**: Message hashing ensures no double-processing of events.
- **Privacy First**: Local LLM processing means your business data never leaves your server.

---

## 📄 License

Internal Project - All Rights Reserved.
Designed and Developed by **InitCore Team**.
