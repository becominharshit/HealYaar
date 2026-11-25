# HealYaar (हीलयार) — Accessible Dual-Layer RAG AI Health Companion

> **Plain-language clarity for lab reports, prescriptions, nutrition, and clinician briefs — built India-first for seniors, families, and healthcare professionals.**

**Live Demo:** [https://healyaar.vercel.app](https://healyaar.vercel.app)  
*Click **"Try Live Demo (No Sign-In)"** on the landing page or `/login` to explore sample medical reports, prescriptions, and a verifiable Clinician SOAP Note preview with zero account setup.*

---

## Problem Statement

Across India, millions of patients, older adults, and family caregivers receive dense laboratory panels, handwritten Indian clinical shorthand (`OD`, `BD`, `PC`, `HS`), and fragmented medication schedules with little plain-language explanation between clinic visits. Meanwhile, generic consumer AI tools risk hallucinations, cross-user privacy leaks, lack of Indian dietary/clinical context (ICMR-NIN, 108/112/14416 helplines), and zero verifiable source citations for physicians.

**HealYaar** bridges this gap with a **privacy-isolated Dual-Layer RAG architecture**, **multimodal lab & prescription vision analysis**, **multilingual voice accessibility (English / हिन्दी / मराठी)**, and **deterministic India-first emergency guardrails**.

---

## Core Features

- **Gemini 4 Hydrogen Multimodal Reasoning & Vision (`gemini-4-hydrogen`)**:
  - Parses uploaded blood panels, diagnostic PDFs/images, handwritten prescriptions, and Indian meal photos via an authenticated server-side `/api/ai` proxy (with client-side Canvas image resizing and strict payload bounds).
  - Never fabricates clinical biomarker values when extraction fails.
- **Gemini Embedding 2 Dual-Layer RAG (`gemini-embedding-2`)**:
  - **Layer A (Private User Vault):** Per-user IndexedDB vector store paired with Supabase PostgreSQL Row-Level Security (`auth.uid() = user_id`), indexing each RAG chunk individually for exact semantic retrieval.
  - **Layer B (Clinical Reference Corpus):** Curated ICMR-NIN, WHO, and public health reference guidance with expandable RAG source provenance badges.
- **Clinician Copilot SOAP Notes**:
  - Generates structured **Subjective / Objective / Assessment / Plan (SOAP)** drafts with top-3 differential considerations, drug-nutrient interaction warnings, explicit uncertainty markers, and a human-in-the-loop clinician sign-off toggle.
- **India-First SOS 108 / 112 / 14416 Safety Guardrails**:
  - Deterministic red-flag detection for chest pain, stroke signs, severe dyspnea, and mental health crisis with immediate one-tap **108 (Ambulance)**, **112 (National Emergency)**, and **14416 (Tele-MANAS)** escalation.
- **Multilingual Voice & Accessibility**:
  - Supports **English, हिन्दी (Hindi), and मराठी (Marathi)** with Devanagari-safe typography, hands-free Spacebar voice navigation, speech readout, adjustable `A / A+ / A++` text scaling, High Contrast, and Dark Mode.
- **Interactive Nearby Care Map & One-Click Demo Mode**:
  - Free Leaflet + OpenStreetMap Overpass facility lookup (hospitals, clinics, doctors, pharmacies) with GPS / PIN code search and private bookmarks.
  - Read-only **Live Demo Mode** pre-populated with realistic sample reports, prescriptions, reminders, and a SOAP preview for instant evaluation.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite 8, Tailwind CSS 3, Lucide Icons |
| **AI Models** | Google `@google/genai` SDK — `gemini-4-hydrogen` (reasoning & vision), `gemini-embedding-2` (semantic embeddings) |
| **Backend / Serverless** | Vercel Serverless Functions (`/api/ai`, `/api/health`), Express 5 local dev bridge (`server.ts`) |
| **Auth & Database** | Supabase Auth (Email + Google OAuth PKCE), Supabase PostgreSQL with Row-Level Security (RLS) & Private Storage |
| **Rate Limiting** | Upstash Redis REST (persistent serverless sliding window with env-gated fallback) |
| **Maps & Geolocation** | Leaflet (`react-leaflet`) + OpenStreetMap Overpass & Nominatim |
| **Testing & Linting** | Node Test Runner (`tsx --test`), TypeScript (`tsc -b`), Oxlint |

---

## Local Setup

### Prerequisites
- Node.js 20+
- A Google Gemini API key (`GEMINI_API_KEY`)
- A Supabase project (optional for read-only Live Demo exploration; required for full auth & cloud storage)

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd healyaar
npm install
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
```
Populate `.env` using the table below.

### 3. Run Locally
```bash
npm run dev
```
The Express + Vite full-stack dev server starts on **`http://localhost:3000`** with `/api/ai` and `/api/health` mounted locally.

### 4. Build, Lint & Test
```bash
npm test
npm run lint
npm run build
```

---

## Environment Variables

| Variable | Scope | Required | Description |
| :--- | :--- | :---: | :--- |
| `GEMINI_API_KEY` | Server | **Yes** | Google AI Studio / Gemini API key used strictly server-side by `/api/ai` (`gemini-4-hydrogen` & `gemini-embedding-2`). |
| `VITE_SUPABASE_URL` | Client | **Yes** | Supabase project URL for browser authentication and RLS-protected queries. |
| `VITE_SUPABASE_ANON_KEY` | Client | **Yes** | Supabase public anon key for browser client initialization. |
| `SUPABASE_URL` | Server | **Yes** | Supabase project URL used server-side by `/api/ai` to verify incoming Supabase JWTs. |
| `SUPABASE_ANON_KEY` | Server | **Yes** | Supabase anon key used server-side by `/api/ai` for `authenticateSupabaseJwt`. |
| `UPSTASH_REDIS_REST_URL` | Server | Optional | Upstash Redis REST URL for persistent distributed rate limiting across serverless invocations. |
| `UPSTASH_REDIS_REST_TOKEN` | Server | Optional | Upstash Redis REST bearer token (falls back to in-memory rate limiting only if unset). |

---

## Vercel Deployment Steps

1. **Import the Repository** in the [Vercel Dashboard](https://vercel.com/new) (Framework Preset: **Vite**).
2. **Configure Build Settings** (auto-detected from `package.json` and `vercel.json`):
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. **Add Environment Variables** in *Project Settings → Environment Variables*:
   - `GEMINI_API_KEY`
   - `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_URL` and `SUPABASE_ANON_KEY`
   - `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (recommended for production rate limiting)
4. **Configure Supabase Auth Redirects**:
   - In Supabase *Authentication → URL Configuration*, add `https://healyaar.vercel.app` as Site URL and `https://healyaar.vercel.app/auth-callback.html` to Redirect URLs.
5. **Deploy & Verify**:
   - Verify serverless health at `GET https://healyaar.vercel.app/api/health` (`200 OK`).
   - Open `https://healyaar.vercel.app` and test **Try Live Demo (No Sign-In)**, `/terms`, `/privacy`, Dark Mode, and the **SOS 108 / 112** modal.

---

## Medical Disclaimer

HealYaar is an educational health literacy and clinician documentation assistant. It is **not** a licensed medical doctor, diagnostic device, or emergency responder. For urgent medical emergencies in India, call **108** (Ambulance), **112** (National Emergency), or **14416** (Tele-MANAS 24/7).
