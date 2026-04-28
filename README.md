# 🏥 Medical Report Simplifier

> **AI-powered web app that explains medical reports in plain language**

Upload a medical report (PDF or image), and AI explains it in plain English, flags abnormal values, and suggests questions to ask your doctor.

🎉 **Status: Complete** — All 3 phases shipped.

![Stack](https://img.shields.io/badge/Stack-React%20%2B%20FastAPI%20%2B%20Groq-0ea5e9)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

- 🔐 **User accounts** — register, login, JWT-secured
- 📄 **Upload PDFs or images** — drag-and-drop interface
- 👁️ **Smart extraction** — handles digital PDFs (pdfplumber) and scanned ones (Tesseract OCR)
- 🧠 **AI analysis** — Groq Llama 3.3 70B explains in plain language
- 🚨 **Flagged values** — abnormal results highlighted in amber
- ❓ **Doctor questions** — AI suggests questions to ask your physician
- 🌙 **Dark mode** — automatic system preference detection
- ⚡ **Async processing** — uploads return instantly, AI works in background
- 🔄 **Re-analyze** — retry failed analyses with one click
- 📱 **Responsive** — works on mobile, tablet, and desktop

---

## 🛠️ Tech Stack

### Backend
- **FastAPI** — modern async Python web framework
- **SQLAlchemy 2.0** — ORM
- **SQLite** — database (easily swappable for PostgreSQL)
- **JWT auth** — `python-jose` + `passlib` + `bcrypt`
- **pdfplumber** — text-based PDF extraction
- **pdf2image + pytesseract** — OCR for scanned documents
- **Groq SDK** — Llama 3.3 70B AI inference
- **BackgroundTasks** — async AI processing

### Frontend
- **React 18** + **Vite** — fast modern build tooling
- **React Router v6** — routing with protected routes
- **Tailwind CSS** — styling
- **Axios** — HTTP client with JWT interceptors
- **react-hook-form** — form validation
- **react-hot-toast** — notifications
- **lucide-react** — icons

---

## 📁 Project Structure

```
medical-report-simplifier/
├── backend/                              ← FastAPI server
│   ├── app/
│   │   ├── main.py                       # App entry + CORS + routers
│   │   ├── core/
│   │   │   ├── config.py                 # Settings from .env
│   │   │   ├── database.py               # SQLAlchemy setup
│   │   │   └── security.py               # JWT + bcrypt
│   │   ├── auth/
│   │   │   ├── router.py                 # /auth/register, /login, /me
│   │   │   └── dependencies.py           # get_current_user
│   │   ├── reports/
│   │   │   └── router.py                 # CRUD + reprocess + background AI
│   │   ├── ai/                           # ⭐ Phase 3
│   │   │   ├── extractor.py              # PDF/image → text
│   │   │   └── simplifier.py             # Groq prompt → JSON
│   │   ├── models/
│   │   │   └── models.py                 # User + Report tables
│   │   └── schemas/
│   │       └── schemas.py                # Pydantic request/response
│   ├── uploads/                          # User-uploaded files (gitignored)
│   ├── .env.example
│   └── requirements.txt
│
├── frontend/                             ← React app
│   ├── src/
│   │   ├── main.jsx                      # React entry
│   │   ├── App.jsx                       # Routes
│   │   ├── index.css                     # Tailwind + custom utilities
│   │   ├── api/                          # Axios calls
│   │   ├── context/AuthContext.jsx       # Global user state
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Upload.jsx
│   │   │   └── ReportDetail.jsx          # ⭐ With polling for AI results
│   │   └── lib/useTheme.js               # Dark mode hook
│   ├── public/favicon.svg
│   ├── index.html
│   ├── package.json
│   └── vite.config.js                    # /api proxy → backend
│
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** ([download](https://nodejs.org))
- **Tesseract OCR** (for scanned PDFs)
  - Mac: `brew install tesseract`
  - Linux: `sudo apt install tesseract-ocr poppler-utils`
  - Windows: [download installer](https://github.com/UB-Mannheim/tesseract/wiki)
- **Free Groq API key** — <https://console.groq.com/keys>

### 1. Backend setup

```bash
cd backend

python3 -m venv venv
source venv/bin/activate           # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env and set:
#   1. SECRET_KEY  — generate with:
#      python -c "import secrets; print(secrets.token_urlsafe(32))"
#   2. GROQ_API_KEY — paste your gsk_... key from console.groq.com

uvicorn app.main:app --reload
```

Backend runs at **<http://localhost:8000>** • API docs at **<http://localhost:8000/docs>**

### 2. Frontend setup (new terminal)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **<http://localhost:5173>**

### 3. Use the app

1. Open <http://localhost:5173>
2. Sign up with email + password
3. Upload a medical report (PDF or image)
4. Wait 5-15 seconds for AI to analyze
5. View plain-language summary, flagged values, and suggested questions

---

## 🧪 How the AI processing works

When you upload a report, here's what happens behind the scenes:

```
1. POST /reports/upload
   ↓
2. File saved to disk, DB record created with "Analyzing..." placeholder
   ↓
3. Response returns immediately (< 100ms)
   ↓
4. Background task starts:
   ├─ extractor.py reads the PDF
   │  ├─ Try pdfplumber first (fast, for digital PDFs)
   │  └─ If <50 chars extracted → fall back to OCR (Tesseract)
   ├─ simplifier.py sends text to Groq
   │  ├─ Llama 3.3 70B with carefully tuned medical prompt
   │  ├─ Returns JSON with summary, flagged values, questions
   │  └─ Robust JSON parser handles edge cases
   └─ Updates DB record with results
   ↓
5. Frontend polls GET /reports/{id} every 3 seconds
   └─ When "Analyzing..." disappears → polling stops, results render
```

### Why background processing?

OCR + AI inference can take 5-15 seconds. If we processed synchronously, the upload request would hang and likely timeout. Background tasks let us return instantly while keeping the UX smooth.

---

## 📡 API Reference

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/health` | GET | ❌ | Health check |
| `/auth/register` | POST | ❌ | Create user, returns JWT |
| `/auth/login` | POST | ❌ | Login, returns JWT |
| `/auth/me` | GET | ✅ | Current user profile |
| `/reports/upload` | POST | ✅ | Upload + start AI processing |
| `/reports` | GET | ✅ | List my reports |
| `/reports/{id}` | GET | ✅ | Get report (poll for AI status) |
| `/reports/{id}/reprocess` | POST | ✅ | Re-run AI analysis |
| `/reports/{id}` | DELETE | ✅ | Delete report |

Full interactive docs at <http://localhost:8000/docs>.

---

## 🔧 Customization

### Swap the LLM
Edit `backend/app/ai/simplifier.py` — replace the Groq client with OpenAI, Anthropic, or Ollama. The prompt and JSON schema stay the same.

### Use a different model
In `backend/.env`, change `GROQ_MODEL`:
- `llama-3.3-70b-versatile` — best quality (default)
- `llama-3.1-8b-instant` — fastest, lighter
- `gemma2-9b-it` — Google's Gemma

### Switch to PostgreSQL
Update `DATABASE_URL` in `backend/.env`:
```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```
Then `pip install psycopg2-binary` and restart.

### Adjust the medical prompt
Edit `SYSTEM_PROMPT` in `backend/app/ai/simplifier.py`. You can:
- Change the target reading level
- Add specific guidance for certain report types
- Localize for non-English speakers

---

## 🌐 Deployment

### Backend → Render

1. Push to GitHub
2. Go to <https://render.com> → New Web Service
3. Connect your repo, set root directory to `backend`
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables: `SECRET_KEY`, `GROQ_API_KEY`
7. ⚠️ Note: Render's free tier filesystem is ephemeral — uploads are lost on redeploy

### Frontend → Vercel

1. Push to GitHub (already done)
2. Go to <https://vercel.com> → Import Project
3. Set root directory to `frontend`
4. Framework: Vite (auto-detected)
5. Add environment variable: `VITE_API_URL=https://your-backend.onrender.com`
6. Deploy

### Update CORS for production
In `backend/app/core/config.py`, add your Vercel URL to `CORS_ORIGINS`:
```python
CORS_ORIGINS = [
    "http://localhost:5173",
    "https://your-app.vercel.app",
]
```

---

## ⚠️ Medical Disclaimer

This application is for **informational and educational purposes only**. It is **not** a medical device and does **not** provide medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for medical concerns. In an emergency, call your local emergency services.

---

## 📜 License

MIT — see LICENSE file.

---

## 🙏 Built With

- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Groq](https://groq.com/) (Llama 3.3 70B)
- [pdfplumber](https://github.com/jsvine/pdfplumber)
- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract)
