# Deploying the Backend (FastAPI)

The backend cannot run on Vercel (Python + pandas/numpy/scikit-learn exceed the 250 MB serverless limit). Deploy it on **Railway** or **Render** so your Vercel frontend can call it.

## Prerequisites

- GitHub repo with this project (backend at repo root: `app/`, `data/`, `requirements.txt`)
- CORS is already configured to allow `*.vercel.app` and localhost

---

## Option 1: Railway

1. Go to [railway.app](https://railway.app) and sign in (e.g. with GitHub).
2. **New Project** → **Deploy from GitHub repo** → select your repo.
3. **Root directory:** leave blank (repo root) so `app/`, `data/`, and `Dockerfile` are used.
4. Railway will **use the repo’s `Dockerfile`** to build the backend (recommended). This avoids the “Error creating build plan with Railpack” you can get with monorepos (Python at root + Node frontend in `coach-s-eye-main/`). No need to set a custom start command—the Dockerfile already runs `uvicorn`.
5. **Settings** → **Networking** → **Generate Domain**. Copy the URL (e.g. `https://your-app.up.railway.app`).
6. In **Vercel** (frontend): **Settings** → **Environment Variables** → add:
   - **Name:** `VITE_API_BASE_URL`  
   - **Value:** `https://your-app.up.railway.app` (no trailing slash)
7. Redeploy the Vercel frontend. The "Select player" dropdown and all API features will use the deployed backend.

---

## Option 2: Render

1. Go to [render.com](https://render.com) and sign in (e.g. with GitHub).
2. **New** → **Web Service** → connect your GitHub repo.
3. **Root Directory:** leave blank (repo root) so `app/`, `data/`, and `requirements.txt` are used.
4. **Environment:** Python 3.
5. **Build Command:** `pip install -r requirements.txt`
6. **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
7. **Plan:** Free (or paid). Create Web Service.
8. After deploy, copy the service URL (e.g. `https://stratiq-api.onrender.com`).
9. In **Vercel** (frontend): **Settings** → **Environment Variables** → add:
   - **Name:** `VITE_API_BASE_URL`  
   - **Value:** `https://stratiq-api.onrender.com` (no trailing slash)
10. Redeploy the Vercel frontend.

**Optional:** Use the repo’s `render.yaml` (Blueprint) so Render creates the service from the file: **New** → **Blueprint** → connect repo → select `render.yaml`.

---

## After Deployment

- Backend URL: use it as **VITE_API_BASE_URL** in Vercel.
- The backend serves: `/players`, `/analysis/{player_id}`, `/recommendations/{player_id}`, `/chat/query`, `/macro_review/{match_id}`, etc.
- CORS allows your Vercel domain (`*.vercel.app`) and localhost. For a custom frontend domain, set **ALLOWED_ORIGINS** on the backend (comma-separated list of origins).
