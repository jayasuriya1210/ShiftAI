## EchoLog

AI-powered, local-first shift handover platform for industrial teams.  
EchoLog converts voice logs to structured shift records, stores them in MongoDB, and provides live operational visibility through dashboards.

---

## Product Overview

EchoLog is built as a SaaS-style product architecture (modular frontend + API + ML service), but deploys fully on local infrastructure for data privacy.

### Core Outcomes
- Capture shift handovers by voice or uploaded audio
- Convert speech to text with an offline ASR pipeline
- Save searchable shift notes and summaries
- Track pending/resolved issues live on dashboard
- Share shift context across teams with notifications and handover views

---

## What Is In This Repo

| Module | Path | Default Port | Purpose |
|---|---|---:|---|
| Frontend App | `frontend/` | `8080` | Main operator UI (voice log, dashboard, notes) |
| Node API | `backend-node/` | `5000` | Auth, shift logs, notes, issues, summaries, notifications |
| STT Service | `stt-service-python/` | `8000` | Offline speech-to-text inference API |
| Notifications UI | `notifications-dashboard/` | `8090` | Dedicated notifications dashboard |

The frontend was previously outside git (`C:\EchoLog\shift-ai-main`).  
It is now included in this repository under `frontend/`.

---

## Architecture

1. User records/uploads audio in `frontend/`
2. Frontend calls Node API (`backend-node/`)
3. Node API sends audio to STT service (`stt-service-python/`)
4. Transcription + metadata are saved in MongoDB
5. Dashboard and notifications update from live API data

---

## Quick Start (Local Demo)

### Prerequisites
- Node.js 18+ (recommended 20+)
- Python 3.10+
- MongoDB running locally (`mongodb://localhost:27017`)

### 1) Backend API
```powershell
cd C:\EchoLog\Voice_2_text\backend-node
npm install
copy .env.example .env
run-backend.cmd
```

### 2) STT Service
```powershell
cd C:\EchoLog\Voice_2_text\stt-service-python
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app:app --host 127.0.0.1 --port 8000
```

### 3) Main Frontend
```powershell
cd C:\EchoLog\Voice_2_text\frontend
npm install
run-frontend.cmd
```

### 4) Notifications Dashboard (Optional)
```powershell
cd C:\EchoLog\Voice_2_text\notifications-dashboard
run-notifications.cmd
```

### App URLs
- Main UI: `http://localhost:8080`
- API health: `http://localhost:5000/`
- STT health: `http://localhost:8000/health`
- Notifications UI: `http://localhost:8090`

---

## Environment Configuration

### Backend (`backend-node/.env`)
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/shiftlog
JWT_SECRET=change_me
STT_URL=http://localhost:8000/transcribe
MAX_IDLE_MINUTES=30
ALLOW_ADMIN_REGISTER=false
ALLOW_PUBLIC_LOGS=true
ALLOW_PUBLIC_NOTIFICATIONS=true
SKIP_DB=false
ALLOW_DB_FAIL=false
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000
VITE_STT_URL=http://127.0.0.1:8000/transcribe
VITE_STT_ONLY=true
```

---

## API Surface (Key Routes)

Base URL: `http://localhost:5000`

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/shiftlogs` (save transcribed log)
- `POST /api/shiftlogs/transcribe` (transcribe only)
- `GET /api/shiftlogs` / `GET /api/shiftlogs/:id`
- `GET /api/notes` / `POST /api/notes`
- `GET /api/issues` / `PATCH /api/issues/:id/status`
- `GET /api/notifications`
- `POST /api/notifications/mark-all-read`
- `PATCH /api/notifications/:id/read`
- `POST /api/summary/generate`
- `GET /api/summary/preview`

---

## Data Model (MongoDB)

Primary collections:
- `shiftlogs` (`ShiftLog`)
- `shiftnotes` (`ShiftNote`)
- `shiftsummaries` (`ShiftSummary`)
- `notifications` (`Notification`)
- `users` (`User`)

Stored fields include transcript text, manual note title, employee details/roles, issue status, summary content, and timestamps.

---

## Demo Checklist (Presentation Friendly)

1. Start MongoDB, STT service, backend, and frontend
2. Open `http://localhost:8080`
3. Record or upload a short audio sample
4. Click **Transcribe** and then **Save Log**
5. Open dashboard and confirm:
   - Recent Shift Notes updated
   - Pending/Resolved issue counts updated
6. Open notifications dashboard (`http://localhost:8090`) for live alerts

---

## Notes

- This is a local-first deployment model (no cloud ASR dependency).
- For production hardening, add:
  - HTTPS + reverse proxy
  - role-based auth tightening
  - backup/restore strategy for MongoDB
  - CI for lint/test/build pipelines