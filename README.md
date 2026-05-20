# Suraksha Setu - Disaster Management Platform

<p align="center">
  <img src="frontend/public/suraksha-setu-brand-logo.jpg" alt="Suraksha Setu Logo" width="200">
</p>

Suraksha Setu is a disaster management platform for citizens and administrators. It supports manual SOS reporting, Snap SOS image-assisted reporting, resource discovery, targeted alerts, and admin-side emergency triage.

## Features

### Citizen features
- Manual SOS reporting with location and description
- Snap SOS image-assisted reporting with model prediction, weather enrichment, confidence scoring, and review-before-submit flow
- Resource directory for emergency support locations
- Alert feed with realtime delivery
- Personal dashboard and report tracking

### Admin features
- Admin dashboard with SOS and alert visibility
- Manual and Snap SOS triage
- Resource management
- Alert broadcasting and alert history
- Snap SOS confidence visibility and cluster-aware review context

## Architecture

The platform is currently split into three runtime pieces:

```text
┌─────────────────┐     ┌─────────────────────┐     ┌─────────────────┐
│                 │     │                     │     │                 │
│    Frontend     │────▶│   Node / Express    │────▶│     MongoDB     │
│  React + Vite   │     │  Primary Backend    │     │                 │
│                 │     │                     │     │                 │
└─────────────────┘     └─────────────────────┘     └─────────────────┘
                                │
                                ├──────────────▶ Redis (optional)
                                │
                                ├──────────────▶ Open-Meteo (weather)
                                │
                                ├──────────────▶ Google Geocoding
                                │
                                ▼
                       ┌─────────────────────┐
                       │  FastAPI Inference  │
                       │ TensorFlow / Keras  │
                       └─────────────────────┘
```

### Responsibility split
- `Frontend`: citizen/admin UI and Snap SOS review flow
- `Node backend`: auth, persistence, weather enrichment, confidence scoring, clustering, and APIs
- `FastAPI inference service`: loads the `.h5` model and returns predictions

## Snap SOS Overview

Snap SOS is the image-assisted incident flow.

### Current model assumptions
- Model file: `model/disaster_cnn_model_v1.h5`
- Input size: `224x224`
- Preprocessing:
  - load image
  - convert to RGB
  - resize to `224x224`
  - convert to array
  - divide by `255.0`
  - add batch dimension
- Class order:
  - `earthquake`
  - `fire`
  - `flood`
  - `landslide`
  - `normal`
  - `smoke`

### Snap SOS flow
1. Citizen uploads an image and location.
2. Backend stores the image and calls the FastAPI model service.
3. Backend enriches the report with weather and computes confidence.
4. Citizen reviews the suggested incident type before final submission.
5. Confirmed Snap SOS records are stored as normal SOS entries with extra model metadata.
6. Nearby same-class reports contribute to area-level clustering and confidence.

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React | UI |
| TypeScript | Static typing |
| Vite | Development/build tooling |
| Redux Toolkit + RTK Query | State and API data |
| Material UI | Component library |
| React Router | Routing |

### Backend
| Technology | Purpose |
|---|---|
| Node.js | Runtime |
| Express | Main API server |
| MongoDB + Mongoose | Persistence |
| Passport.js | Session auth |
| Redis | Optional session/rate-limit support |
| Socket.IO | Realtime alert delivery |
| Multer | Snap SOS multipart upload parsing |

### Model service
| Technology | Purpose |
|---|---|
| FastAPI | Inference HTTP service |
| TensorFlow / Keras | `.h5` model runtime |
| Pillow | Image loading |

## Repository Structure

```text
suraksha-setu/
├── backend/
│   ├── models/
│   ├── src/modules/
│   ├── src/shared/
│   ├── swagger/
│   ├── DOCUMENTATION.md
│   └── package.json
├── frontend/
│   ├── src/
│   ├── DOCUMENTATION.md
│   └── package.json
├── model/
│   ├── disaster_cnn_model_v1.h5
│   ├── inference_service.py
│   ├── predict_image.py
│   ├── evaluate_model.py
│   ├── requirements.txt
│   └── README.md
└── README.md
```

## Local Setup

### Prerequisites
- Node.js 18+
- MongoDB
- Python 3.11 or 3.12 recommended for TensorFlow
- Redis optional

### 1. Clone

```bash
git clone https://github.com/your-org/suraksha-setu.git
cd suraksha-setu
```

### 2. Start the model service

```bash
cd model
python3.11 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m uvicorn inference_service:app --host 0.0.0.0 --port 8001 --reload
```

Health check:

```bash
curl http://127.0.0.1:8001/health
```

### 3. Start the backend

```bash
cd backend
npm install
npm start
```

Recommended backend env additions:

```env
SNAP_SOS_MODEL_SERVICE_URL=http://127.0.0.1:8001/predict
PUBLIC_BASE_URL=http://localhost:6001
```

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

### 5. Access the app
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:6001`
- Swagger docs: `http://localhost:6001/api-docs`

## Environment Variables

### Backend

Example values:

```env
PORT=6001
NODE_ENV=development
DATABASE=...
DATABASE_PASSWORD=...
SESSION_SECRET=...
REDIS_URL=redis://127.0.0.1:6379
USE_REDIS_IN_DEV=true
GOOGLE_MAPS_API_KEY=...
SNAP_SOS_MODEL_SERVICE_URL=http://127.0.0.1:8001/predict
PUBLIC_BASE_URL=http://localhost:6001
```

Notes:
- Open-Meteo weather integration does not require an API key.
- `GOOGLE_MAPS_API_KEY` is used for reverse geocoding.
- `PUBLIC_BASE_URL` controls the public image URL returned for Snap SOS uploads.

### Frontend

```env
VITE_API_BASE_URL=/api
```

## API Overview

| Module | Base Path | Purpose |
|---|---|---|
| Auth | `/api/auth` | Login, register, session profile |
| SOS | `/api/sos` | Manual SOS list/create/detail/update |
| Snap SOS | `/api/snap-sos` | Analyze and confirm image-assisted SOS |
| Resources | `/api/resources` | Resource directory and admin CRUD |
| Alerts | `/api/alerts` | Alert feed, broadcast, history |
| Dashboard | module routes | Citizen/admin summary data |
| Geocoding | `/api/geocoding` | Reverse geocoding |

## Testing the Current Implementation

### FastAPI smoke test

```bash
cd model
source .venv/bin/activate
python predict_image.py \
  --image ./your_test_image.jpg \
  --class-names earthquake,fire,flood,landslide,normal,smoke
```

### Snap SOS UI flow
1. Log in as a citizen.
2. Open `/snap-sos`.
3. Upload an incident image.
4. Let location resolve.
5. Click `Analyze Image`.
6. Review prediction, confidence, and weather context.
7. Click `Confirm Snap SOS`.
8. Verify the report in `/my-sos`.
9. Verify admin visibility in `/admin/sos`.

### Direct backend API test

Analyze:

```bash
curl -X POST http://localhost:6001/api/snap-sos/analyze \
  -b cookies.txt -c cookies.txt \
  -F 'image=@/absolute/path/to/test.jpg' \
  -F 'location={"type":"Point","coordinates":[72.8777,19.0760]}'
```

Confirm:

```bash
curl -X POST http://localhost:6001/api/snap-sos/confirm \
  -H 'Content-Type: application/json' \
  -b cookies.txt -c cookies.txt \
  -d '{
    "analysisId": "PUT_ANALYSIS_ID_HERE",
    "type": "fire",
    "description": "Visible fire and smoke in dry vegetation."
  }'
```

## Documentation

- [Backend Documentation](backend/DOCUMENTATION.md)
- [Frontend Documentation](frontend/DOCUMENTATION.md)
- [Model Service Notes](model/README.md)
- [OpenAPI Spec](backend/swagger/openapi.json)

## Operational Notes

- Manual SOS still works independently of Snap SOS.
- Snap SOS is review-first and does not auto-submit in v1.
- `normal` is a valid model class but should be treated as low-confidence and human-reviewed.
- Current image storage is local filesystem-backed for development convenience.
- Current confidence thresholds are heuristic until the model is calibrated on a proper evaluation dataset.

## Known Development Notes

- Use `python -m uvicorn ...` from the model venv, not a global `uvicorn`, otherwise you may accidentally run against Python 3.14 and break TensorFlow imports.
- The backend test suite may fail in sandboxed environments because the legacy integration test harness attempts to bind to `0.0.0.0`.
- Frontend production build currently succeeds, but the bundle is large enough to trigger Vite’s chunk size warning.

## Contributing

1. Create a branch.
2. Make changes.
3. Verify the model service, backend, and frontend locally.
4. Update docs if behavior or contracts change.
5. Open a pull request.

## License

This project is licensed under the MIT License.
