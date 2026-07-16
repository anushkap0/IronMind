# IronMind — AI Fitness Coach

A full-stack fitness web app:

- **Frontend:** React (Vite) + Tailwind CSS + Framer Motion, black/red "performance" theme
- **Backend:** FastAPI (Python 3.11), JWT auth (OAuth2 password flow), SQLAlchemy (SQLite by default)
- **AI:** A retrieval-augmented (RAG) chatbot — TF‑IDF retrieval over a fitness knowledge base, plus an LLM
  (any OpenAI-compatible API) for generation. Works out of the box in "demo mode" even without an API key.
- **Docker:** `docker-compose.yml` runs both services together.

## Features

- Register / login with JWT-secured API access, plus **Sign in with Google** (OAuth)
- BMI calculator with category, healthy weight range, and tailored advice (with history + trend chart)
- AI Coach: RAG chatbot using **real vector similarity search** (ChromaDB + local LSA embeddings — see notes below) for follow-up questions and recommendations, aware of your latest BMI/goal
- Auto-generated diet + workout routine based on goal, experience, and training days/week
- Guided workout timer with warm-up / work / rest / cooldown intervals and presets (Tabata, HIIT, etc.) — **syncs live across devices/tabs via Socket.IO**
- **Computer vision rep counter** ("Form Check"): webcam-based squat/push-up rep counting and form feedback using on-device pose estimation (MediaPipe) — nothing is uploaded anywhere
- **Streaks & badges**: daily activity streak tracking and unlockable achievement badges based on usage
- **Daily email reminders** (optional): a scheduled job emails each user once a day nudging them to log a BMI and get a workout in, sent via Gmail SMTP
- Real-time notifications (BMI logged, routine generated, workout completed) via Socket.IO, with a bell dropdown + toast popups
- Dark/light theme toggle, custom animated cursor, 3D tilt cards, animated page transitions, particle bursts and confetti on workout milestones
- **Rate limiting** on login and AI Coach endpoints to prevent abuse
- Backend test suite (pytest) covering auth, BMI logic, and progress/badges, wired into CI
- Professional dark/light UI with animated backgrounds and gauges

## Project structure

```
fitness-app/
├── backend/                 FastAPI app (Python 3.11)
│   ├── app/
│   │   ├── main.py          App entrypoint, CORS, router registration
│   │   ├── config.py        Settings (env vars)
│   │   ├── database.py      SQLAlchemy engine/session
│   │   ├── models.py        User, BMIRecord, ChatMessage
│   │   ├── schemas.py       Pydantic request/response models
│   │   ├── security.py      Password hashing + JWT
│   │   ├── deps.py          get_current_user dependency
│   │   ├── routers/         auth, bmi, chat, routines, workouts
│   │   └── rag/             knowledge_base.py + rag_engine.py (TF-IDF + LLM)
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
├── frontend/                 React + Tailwind (Vite)
│   ├── src/
│   │   ├── pages/            Login, Register, Dashboard, BMICalculator, Routines, WorkoutTimer, Chatbot
│   │   ├── components/       Navbar, BackgroundFX, ProtectedRoute
│   │   ├── context/           AuthContext (JWT storage)
│   │   └── api/axiosClient.js
│   ├── tailwind.config.js
│   ├── .env.example
│   └── Dockerfile
└── docker-compose.yml
```

## Running locally (without Docker)

### Backend

```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate            # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                # edit SECRET_KEY, optionally LLM_API_KEY
uvicorn app.main:app --reload --port 8000
```

Backend runs at `http://localhost:8000`. Interactive API docs at `http://localhost:8000/docs`.

> **Note on bcrypt:** `requirements.txt` pins `bcrypt==4.0.1` alongside `passlib`, because newer
> bcrypt releases (5.x) break passlib's backend detection. Keep this pin unless you upgrade passlib too.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env                # set VITE_API_URL if backend isn't on localhost:8000
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Running with Docker

```bash
cd backend && cp .env.example .env   # fill in SECRET_KEY (and LLM_API_KEY if you have one)
cd ..
docker compose up --build
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000` (docs at `/docs`)

The SQLite DB is stored in a named Docker volume (`backend_data`) so data survives restarts. To use
Postgres instead, set `DATABASE_URL` in `backend/.env` to a Postgres connection string and add a `db`
service to `docker-compose.yml`; SQLAlchemy needs no code changes.

## Enabling the full AI coach (RAG + Hugging Face)

The chatbot works immediately without any token — it runs in **demo mode**, returning the most
relevant knowledge-base snippets directly. To enable full LLM-generated answers via the
**Hugging Face Inference API** (hosted, no GPU needed):

1. Create a free account at https://huggingface.co and generate a token at
   https://huggingface.co/settings/tokens (read access is enough).
2. Pick a chat/instruct model that supports the hosted Inference API, e.g.
   `meta-llama/Llama-3.2-3B-Instruct` or `mistralai/Mistral-7B-Instruct-v0.3`. Some models
   (like Llama) are gated — visit the model page while logged in and accept its terms first,
   or your calls will fail and the app will silently fall back to demo mode.
3. In `backend/.env`, set:
   ```
   HF_API_TOKEN=hf_...
   HF_MODEL=meta-llama/Llama-3.2-3B-Instruct
   ```
4. Restart the backend.

The RAG pipeline (`app/rag/rag_engine.py`) retrieves the top-3 most relevant chunks from
`app/rag/knowledge_base.py` using TF-IDF + cosine similarity, then passes them as context to the
Hugging Face model (via `huggingface_hub.InferenceClient.chat_completion`) along with the user's
current goal and latest BMI. If the Hugging Face call errors for any reason (cold start, rate limit,
gated model), the endpoint degrades gracefully to the same demo-mode reply instead of failing the
request. Add more entries to `KNOWLEDGE_BASE` to expand what the coach knows.

## Enabling Google Sign-In

1. Go to https://console.cloud.google.com → create/select a project
2. **APIs & Services → OAuth consent screen** → External → fill in app name + your email → save
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID** → Web application
4. Under **Authorized redirect URIs**, add exactly: `http://localhost:8000/api/auth/google/callback`
5. Copy the generated Client ID and Client Secret into `backend/.env`:
   ```
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```
6. Restart the backend

This is completely free — no charges for standard Google sign-in regardless of user count. While the consent screen is in "Testing" mode, only manually-added test users (up to 100) can sign in; click "Publish App" (still free) to open it to anyone.

## Real-time features (Socket.IO)

The backend and frontend communicate over both HTTP and a WebSocket connection (same port, `/socket.io` path). This powers:
- **Workout timer sync**: open the Workout Timer page on two devices/tabs while logged in as the same user — starting/pausing/resetting on one instantly reflects on the other
- **Notifications**: a bell icon in the navbar and toast popups fire when you log a BMI, generate a routine, or finish a workout session

No extra setup needed — it works automatically once both containers are running.

## How the vector-based RAG retrieval works

`app/rag/vector_store.py` uses ChromaDB as the vector index, but with a deliberately
**local** embedding function (`LocalLSAEmbeddingFunction`) instead of ChromaDB's default,
which downloads a ~90MB ONNX model from an external CDN at runtime. That default is a
fragile extra dependency for a project this size — ours computes embeddings entirely
locally using TF-IDF + Truncated SVD (a classic Latent Semantic Analysis technique),
so semantically related questions (e.g. "shed fat" vs "calorie deficit") still match
even without shared keywords, with zero external downloads and no risk of that model
failing to load. Add more entries to `app/rag/knowledge_base.py` to expand what the
coach knows — no code changes needed, it re-indexes automatically on startup.

## Computer vision rep counter ("Form Check")

`frontend/src/pages/WorkoutVision.jsx` uses Google's MediaPipe Pose model, loaded and
run entirely in your browser (no server involved, no video ever leaves your device).
It tracks 33 body landmarks in real time from your webcam, computes joint angles
(hip-knee-ankle for squats, shoulder-elbow-wrist for push-ups), and uses a simple
state machine to count reps and give basic depth feedback. Thresholds for each
exercise live in the `EXERCISES` object in that file if you want to tune sensitivity.

## Streaks & badges

Every BMI calculation or routine generation logs an activity entry (`app/progress.py`)
used to compute a daily streak and unlock badges (first BMI logged, 7/30-day streaks,
10 BMI records, 5 routines generated, 5 AI Coach questions asked). See the `BADGES`
list in `app/progress.py` to add more.

## Rate limiting

Login (`/api/auth/login`) is limited to 5 attempts/minute and the AI Coach
(`/api/chat/ask`) to 15 requests/minute per IP, via `slowapi`. Adjust the limits in
`app/routers/auth.py` and `app/routers/chat.py` if needed.

## Running the test suite

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v
```

Tests use an isolated in-memory-style SQLite database (`test_fitness.db`, auto-created
and torn down per run) — they never touch your real `fitness.db`. This is already wired
into `.github/workflows/ci.yml`, which runs on every push/PR to `main`.

## Daily email reminders (optional)

Disabled by default (`REMINDERS_ENABLED=false`). To turn it on:

1. Turn on **2-Step Verification** on your Google account (required for App Passwords)
2. Go to https://myaccount.google.com/apppasswords and generate a password for "Mail" — a 16-character code
3. In `backend/.env`:
   ```
   REMINDERS_ENABLED=true
   GMAIL_ADDRESS=youraddress@gmail.com
   GMAIL_APP_PASSWORD=your16charapppassword
   REMINDER_HOUR=8
   REMINDER_TIMEZONE=Asia/Kolkata
   ```
   (`REMINDER_TIMEZONE` uses [tz database names](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) — set it to your own timezone so the hour means what you expect.)
4. Restart the backend

Every user in the database gets a daily email at the configured time (BMI + workout nudge,
plus their current streak). To test it immediately without waiting for the scheduled hour,
log in to the app and send a request to `POST /api/reminders/test` with your auth token
(easiest via the `/docs` Swagger UI) — it emails your own account right away and reports
success or a clear error message (e.g. if the App Password is wrong).

## Security notes before deploying publicly

- Change `SECRET_KEY` to a long random value (`openssl rand -hex 32`) — never use the default.
- Set `DATABASE_URL` to a real database (Postgres) rather than SQLite in production.
- Restrict `FRONTEND_ORIGIN`/CORS to your real domain.
- Put the backend behind HTTPS (e.g. via a reverse proxy/load balancer) — JWTs sent over plain HTTP can
  be intercepted.
- Consider shorter `ACCESS_TOKEN_EXPIRE_MINUTES` plus a refresh-token flow for production use.
#   I r o n M i n d  
 