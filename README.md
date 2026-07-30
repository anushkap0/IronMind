# 🏋️ IronMind – AI Fitness Coach

IronMind is a full-stack AI-powered fitness platform designed to help users track their health, generate personalized workout and diet plans, analyze exercise form, and interact with an intelligent AI fitness coach.

The application combines modern web technologies, artificial intelligence, machine learning, computer vision, and real-time communication into a single fitness ecosystem.

---

## 🚀 Features

- 🔐 **JWT Authentication & Google Sign-In**
- 📊 **BMI Calculator** with History & Trend Charts
- 🤖 **AI Fitness Coach** using Retrieval-Augmented Generation (RAG)
- 🥗 **Personalized Diet & Workout Plan Generator**
- ⏱️ **Workout Timer** with HIIT, Tabata & Custom Modes
- 📹 **AI Exercise Form Checker** using MediaPipe Pose
- 🔢 **Real-Time Exercise Rep Counting**
- 📐 **Joint Angle Detection & Form Analysis**
- 🔔 **Real-Time Notifications** using Socket.IO
- 🏆 **Daily Streaks & Achievement Badges**
- 📧 **Daily Email Workout Reminders**
- 🌙 **Dark/Light Theme**
- 🎨 **Modern Animated UI** using Framer Motion
- 🛡️ **Rate Limiting & Secure Authentication**
- 🧪 **Backend Unit Testing** with Pytest
- 🐳 **Docker & Docker Compose Support**

---

## 🛠️ Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS
- Framer Motion
- Axios
- Socket.IO Client

### Backend

- FastAPI
- SQLAlchemy
- PostgreSQL
- JWT Authentication
- OAuth2
- Google OAuth
- Bcrypt Password Hashing
- SlowAPI Rate Limiting

### AI & Machine Learning

- Retrieval-Augmented Generation (RAG)
- ChromaDB
- TF-IDF Retrieval
- Latent Semantic Analysis (LSA)
- Hugging Face Inference API
- Cosine Similarity Search

### Computer Vision

- MediaPipe Pose Estimation
- Webcam-Based Exercise Analysis
- Real-Time Rep Counting
- Joint Angle Detection
- Exercise Form Feedback
- On-Device Processing

### DevOps & Deployment

- Docker
- Docker Compose
- GitHub Actions
- Pytest
- GitHub
- Render
- Vercel
- Supabase PostgreSQL

---

## 🏗️ System Architecture

```text
                         ┌──────────────────────┐
                         │    React + Vite       │
                         │      Frontend        │
                         └──────────┬───────────┘
                                    │
                                    ▼
                              Vercel Hosting
                                    │
                                    │ API Requests
                                    ▼
                         ┌──────────────────────┐
                         │       FastAPI        │
                         │       Backend        │
                         └──────────┬───────────┘
                                    │
                  ┌─────────────────┼─────────────────┐
                  │                 │                 │
                  ▼                 ▼                 ▼
             PostgreSQL           RAG            MediaPipe
             (Supabase)         AI Coach         Form Checker
                  │
                  ▼
             User Data
```

---

## 📂 Project Structure

```text
fitness-app/
│
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   ├── rag/
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── security.py
│   │   ├── database.py
│   │   └── main.py
│   │
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── context/
│   │   └── api/
│   │
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
```

---

# ⚡ Installation

## 1. Clone the Repository

```bash
git clone https://github.com/anushkap0/IronMind.git
cd IronMind
```

---

## 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create a virtual environment:

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### Linux / macOS

```bash
python -m venv venv
source venv/bin/activate
```

Install the required dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI backend:

```bash
uvicorn app.main:app --reload
```

Backend runs at:

```text
http://localhost:8000
```

Swagger API Documentation:

```text
http://localhost:8000/docs
```

---

## 3. Frontend Setup

Open a new terminal and navigate to the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

---

# 🔐 Environment Variables

Create a `.env` file for the backend and configure the required environment variables.

Example:

```env
DATABASE_URL=your_postgresql_database_url

SECRET_KEY=your_secret_key
SESSION_SECRET_KEY=your_session_secret_key

FRONTEND_ORIGIN=http://localhost:5173

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback

HF_API_TOKEN=your_huggingface_api_token
```

> ⚠️ **Important:** Never commit your `.env` file or real passwords, API keys, tokens, or secret keys to GitHub.

Use `.env.example` with placeholder values when sharing the project.

For production deployment, configure environment variables through your hosting provider.

---

# 🐳 Docker

IronMind supports Docker and Docker Compose for containerized development and deployment.

Build and start the application:

```bash
docker compose up --build
```

Stop the containers:

```bash
docker compose down
```

PostgreSQL data is persisted using a Docker volume.

---

# 🤖 AI Fitness Coach

The AI Fitness Coach uses a Retrieval-Augmented Generation (RAG) pipeline to provide intelligent fitness-related responses.

### RAG Pipeline

```text
User Question
      ↓
TF-IDF Retrieval
      ↓
LSA Embeddings
      ↓
Cosine Similarity Search
      ↓
Relevant Fitness Context
      ↓
Hugging Face LLM
      ↓
AI-Generated Response
```

The system retrieves relevant information from a fitness knowledge base before generating a response.

If an AI API token is not available, the application can switch to **Demo Mode**.

---

# 📹 AI Exercise Form Checker

IronMind uses **MediaPipe Pose Estimation** for real-time exercise analysis.

### Supported Exercises

- Squats
- Push-ups

### Features

- Real-time exercise rep counting
- Joint angle detection
- Exercise form analysis
- Real-time form feedback
- Webcam-based exercise tracking
- On-device pose processing

---

# 📊 Progress Tracking

Users can:

- Calculate BMI
- Store BMI history
- View BMI progress charts
- Track daily fitness streaks
- Unlock achievement badges
- Monitor workout progress

---

# 🔔 Real-Time Features

Socket.IO is used to provide real-time application functionality.

Features include:

- Workout timer synchronization
- Live notifications
- Achievement updates
- Real-time application events

---

# 🔐 Authentication & Security

IronMind provides secure authentication and application protection through:

- JWT Authentication
- OAuth2 Password Flow
- Google OAuth Login
- Bcrypt Password Hashing
- Rate Limiting using SlowAPI
- Environment-based secret management
- Secure API authentication

---

# 🧪 Testing

Backend tests are implemented using Pytest.

Run the test suite:

```bash
cd backend
pytest tests/ -v
```

---

# ☁️ Deployment

IronMind can be deployed using the following architecture:

```text
                 ┌─────────────────┐
                 │ React + Vite     │
                 │ Frontend         │
                 └────────┬────────┘
                          │
                          ▼
                     Vercel
                          │
                          ▼
                 ┌─────────────────┐
                 │ FastAPI         │
                 │ Backend         │
                 └────────┬────────┘
                          │
                          ▼
                      Render
                          │
                          ▼
                 ┌─────────────────┐
                 │ PostgreSQL      │
                 │ Database        │
                 └────────┬────────┘
                          │
                          ▼
                      Supabase
```

### Deployment Stack

| Component | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | Supabase PostgreSQL |
| Source Code | GitHub |

For production deployment, configure all required environment variables in the hosting platform instead of committing secrets to the repository.

---

# 🌟 Future Improvements

- 🥗 Nutrition Tracking
- ⌚ Wearable Device Integration
- 🧠 Intelligent Exercise Recommendation System
- 🎙️ Voice-Based AI Fitness Coach
- 📱 Mobile Application
- 🏆 Social Fitness Challenges
- 📈 Advanced Workout Analytics Dashboard

---

# 👩‍💻 Author

**Anushka Pokhriyal**

GitHub: [Anushka-Pokhriyal](https://github.com/Anushka-Pokhriyal)

---

# ⭐ Support

If you found this project helpful, consider giving the repository a ⭐ on GitHub!
