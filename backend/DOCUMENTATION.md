# Suraksha Setu Backend Documentation

## Overview

The backend is an Express + MongoDB API that powers authentication, manual SOS reporting, Snap SOS image-assisted reporting, resources, alerts, dashboards, reverse geocoding, and realtime alert delivery.

The current architecture is split into:
- `Node/Express` as the primary backend and source of truth
- `MongoDB` for persistent data
- `Redis` for optional session/rate-limit support
- `FastAPI + TensorFlow/Keras` as a separate inference service for Snap SOS image classification

## Current Architecture

### Core runtime
- `server.js` boots the HTTP server, sessions, Passport auth, security middleware, Swagger, static asset hosting, and Socket.IO.
- `src/app/http/registerModules.js` mounts modular routes under `/api/*`.
- `middleware/auth.js` enforces session-based auth and admin-only access.

### Major feature areas
- `src/modules/auth` for register/login/logout/profile/location update
- `src/modules/sos` for manual SOS listing, creation, viewing, and admin status updates
- `src/modules/snap-sos` for analyze-and-confirm image-assisted SOS flow
- `src/modules/resources` for resource CRUD/search
- `src/modules/alerts` for alert creation/history/read/deactivate
- `src/modules/dashboard` for citizen/admin metrics
- `src/modules/geocoding` for reverse geocoding support

### Shared integrations
- `src/shared/integrations/googleGeocoding.js` for reverse geocoding
- `src/shared/integrations/modelInference.js` for calling the FastAPI model service
- `src/shared/integrations/weather.js` for weather enrichment via Open-Meteo
- `src/shared/storage/objectStorage.js` for image persistence
- `src/shared/realtime/alerts.gateway.js` for Socket.IO alert broadcasting

## Project Structure

```text
backend/
├── config/
├── controllers/
├── middleware/
├── models/
│   ├── Alert.js
│   ├── IncidentCluster.js
│   ├── Resource.js
│   ├── SOS.js
│   ├── SnapSOSAnalysis.js
│   └── User.js
├── src/
│   ├── app/http/
│   ├── modules/
│   │   ├── alerts/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── geocoding/
│   │   ├── resources/
│   │   ├── snap-sos/
│   │   └── sos/
│   └── shared/
│       ├── events/
│       ├── http/
│       ├── integrations/
│       ├── realtime/
│       └── storage/
├── swagger/
├── postman/
├── public/
│   └── snap-sos/
├── server.js
└── package.json
```

## API Surface

### Authentication

Base path: `/api/auth`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/register` | Register a user | No |
| `POST` | `/login` | Log in and create session | No |
| `POST` | `/logout` | Destroy session | Yes |
| `GET` | `/me` | Get current user | Yes |
| `PATCH` or module-specific update route | location update flow | Save user location for alerting | Yes |

### Manual SOS

Base path: `/api/sos`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/` | Citizen sees own SOS, admin sees all | Yes |
| `POST` | `/` | Create manual SOS | Yes |
| `GET` | `/:id` | View SOS detail | Yes |
| `PUT` | `/:id` | Admin updates status/admin notes | Admin |

### Snap SOS

Base path: `/api/snap-sos`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/analyze` | Upload image + location, run inference, weather enrichment, confidence scoring, and cluster preview | Yes |
| `POST` | `/confirm` | Confirm analyzed Snap SOS and create final SOS record | Yes |

### Resources

Base path: `/api/resources`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/` | List resources | Yes |
| `GET` | `/:id` | View resource | Yes |
| `POST` | `/` | Create resource | Admin |
| `PUT` | `/:id` | Update resource | Admin |
| `DELETE` | `/:id` | Delete resource | Admin |

### Alerts

Base path: `/api/alerts`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/` | List active alerts for current user | Yes |
| `POST` | `/` | Create/broadcast alert | Admin |
| `GET` | `/history` | Alert history | Admin |
| `PATCH` | `/:id/read` | Mark alert as read | Yes |
| `DELETE` or module-specific deactivate route | deactivate flow | Deactivate alert | Admin |

### Dashboard

Mounted under the dashboard/admin module routes used by the frontend:
- citizen stats endpoint for recent SOS and counts
- admin dashboard endpoint for SOS aggregates and pending triage

### Geocoding

Base path: `/api/geocoding`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | reverse geocoding route | Convert coordinates to readable address | Yes |

## Data Models

### User

Key fields:
- `name`
- `email`
- `password`
- `phone`
- `role: 'citizen' | 'admin'`
- `location` / `locationGeo` depending on the model implementation in use
- `isActive`

### SOS

`models/SOS.js` is the primary incident record for both manual and Snap SOS.

```javascript
{
  userId: ObjectId,
  type: 'earthquake' | 'fire' | 'flood' | 'landslide' | 'normal' | 'smoke',
  severity: 'low' | 'medium' | 'high' | 'critical',
  status: 'pending' | 'acknowledged' | 'in-progress' | 'resolved',
  description: String,
  source: 'manual' | 'snap',
  location: {
    type: 'Point',
    coordinates: [lng, lat],
    address: String,
    city: String,
    state: String,
    pincode: String
  },
  contactNumber: String,
  imageUrl: String,
  modelPrediction: String,
  modelProbabilities: Map<String, Number>,
  modelTopScore: Number,
  modelVersion: String,
  userConfirmedType: String,
  weatherContext: {
    provider: String,
    summary: String,
    temperatureC: Number,
    windSpeedKph: Number,
    precipitationMm: Number,
    weatherCode: Number,
    fetchedAt: Date
  },
  confidenceScore: Number,
  confidenceBreakdown: {
    model: Number,
    weather: Number,
    crowd: Number,
    quality: Number
  },
  clusterId: ObjectId,
  reviewStatus: 'manual-created' | 'snap-analyzed' | 'snap-confirmed' | 'normal-review',
  adminNotes: String,
  resolvedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

Notes:
- `location` is GeoJSON and indexed with `2dsphere`.
- Manual SOS uses `source: 'manual'`.
- Snap SOS uses `source: 'snap'` and carries model/weather/confidence metadata.
- `normal` is a valid model-aligned type but should be treated as review-first, not as an automatically trusted emergency signal.

### SnapSOSAnalysis

Temporary server-side analysis state created during `POST /api/snap-sos/analyze`.

Purpose:
- persist the inference result before final confirmation
- avoid trusting model/confidence fields passed back from the browser
- expire stale analysis records automatically

Key fields:
- `userId`
- `imageUrl`
- `location`
- `predictedClass`
- `classProbabilities`
- `topClassProbability`
- `modelVersion`
- `weatherContext`
- `confidenceScore`
- `confidenceBreakdown`
- `qualityScore`
- `suggestedType`
- `clusterPreview`
- `expiresAt`

`expiresAt` is indexed with TTL so abandoned analysis records are cleaned up automatically.

### IncidentCluster

Area-level aggregation for same-class reports in the recent time window.

Key fields:
- `canonicalClass`
- `location` as GeoJSON centroid
- `windowStart`
- `windowEnd`
- `reportCount`
- `uniqueReporterCount`
- `aggregateConfidence`
- `linkedSOSIds`
- `uniqueReporterIds`
- `lastReportAt`

Purpose:
- basic v1 crowd signal
- same-class nearby recent reports increase confidence
- prevent repeated uploads from one user from linearly inflating trust

### Resource

Resource records remain the same high-level concept:
- name, type, location, contact, services, capacity, operating hours, availability flags, ownership metadata

### Alert

Alert records remain the same high-level concept:
- title, message, severity, type, target audience, optional location/radius, expiry, creator, read tracking, active state

## Snap SOS Backend Flow

### 1. Analyze

Endpoint: `POST /api/snap-sos/analyze`

Expected request:
- authenticated user
- multipart form-data
- `image` file
- `location` as GeoJSON object or JSON string

Runtime flow:
1. Parse and validate the uploaded image and location.
2. Enrich location using reverse geocoding if readable address fields are missing.
3. Persist the image through `src/shared/storage/objectStorage.js`.
4. Call the FastAPI model service via `src/shared/integrations/modelInference.js`.
5. Fetch current weather context from Open-Meteo via `src/shared/integrations/weather.js`.
6. Find a nearby recent same-class `IncidentCluster`, if one exists.
7. Compute:
   - `model` score
   - `weather` score
   - `crowd` score
   - `quality` score
   - final `confidenceScore`
8. Persist a `SnapSOSAnalysis` document.
9. Return the review payload to the frontend.

Returned payload includes:
- `analysisId`
- `imageUrl`
- `predictedClass`
- `classProbabilities`
- `topClassProbability`
- `modelVersion`
- `weatherContext`
- `confidenceScore`
- `confidenceBreakdown`
- `suggestedType`
- `reviewStatus`
- `clusterPreview`
- `location`

### 2. Confirm

Endpoint: `POST /api/snap-sos/confirm`

Expected JSON body:

```json
{
  "analysisId": "analysis document id",
  "type": "fire",
  "description": "Visible fire and smoke near dry vegetation",
  "contactNumber": "9999999999"
}
```

Runtime flow:
1. Load the `SnapSOSAnalysis` by `analysisId`.
2. Verify the analysis belongs to the authenticated user.
3. Reject expired analysis records.
4. Create the final `SOS` record with `source: 'snap'`.
5. Create or update the matching `IncidentCluster`.
6. Attach `clusterId` to the new SOS.
7. Delete the temporary `SnapSOSAnalysis`.
8. Return the created SOS plus cluster summary.

## Confidence Scoring

Confidence is computed in Node, not by the model service.

Current formula:

```text
overall =
  0.55 * model +
  0.15 * weather +
  0.20 * crowd +
  0.10 * quality
```

### Model score
- uses `topClassProbability` from the FastAPI response
- if the predicted class is `normal`, the model contribution is capped to avoid over-trusting “no incident”

### Weather score
- derived from current weather at the uploaded location
- `flood` and `landslide` are uplifted by precipitation
- `fire` and `smoke` are uplifted by temperature and wind
- `earthquake` is neutral
- `normal` gets a low weather score

### Crowd score
- derived from same-class reports within:
  - `2 km`
  - trailing `90 minutes`
- weighted by unique users more than raw report count
- duplicate uploads from the same reporter contribute weakly

### Quality score
Current v1 heuristics:
- image buffer exists
- valid image mime type
- minimum file size threshold
- valid location coordinates

### Confidence interpretation
- `< 0.45`: low confidence
- `0.45 - 0.70`: moderate confidence
- `> 0.70`: high confidence

`normal` predictions remain review-first even if the raw model score is high.

## Model Inference Service Contract

The Node backend expects a separate Python service.

Default URL:

```env
SNAP_SOS_MODEL_SERVICE_URL=http://127.0.0.1:8001/predict
```

Expected response:

```json
{
  "predictedClass": "fire",
  "classProbabilities": {
    "earthquake": 0.01,
    "fire": 0.92,
    "flood": 0.02,
    "landslide": 0.01,
    "normal": 0.01,
    "smoke": 0.03
  },
  "topClassProbability": 0.92,
  "modelVersion": "disaster_cnn_model_v1",
  "inferenceLatencyMs": 14.8
}
```

Hard-coded model assumptions:
- model file: `disaster_cnn_model_v1.h5`
- input size: `224x224`
- preprocessing:
  - load image
  - convert to RGB
  - resize to `224x224`
  - convert to array
  - divide by `255.0`
  - add batch dimension
- class order:
  - `earthquake`
  - `fire`
  - `flood`
  - `landslide`
  - `normal`
  - `smoke`

## Image Storage

Current implementation uses `src/shared/storage/objectStorage.js`.

Behavior:
- stores uploaded images under `backend/public/snap-sos/`
- returns a public URL built from:
  - `PUBLIC_BASE_URL`, if set
  - otherwise the current request host/protocol

This is a local filesystem-backed implementation behind a storage abstraction.

Production note:
- the code is intentionally structured so this adapter can later be replaced with S3, Cloudinary, or another object store without changing the Snap SOS service contract

## Weather Integration

Weather enrichment uses Open-Meteo and currently does not require an API key.

Current fields requested:
- `temperature_2m`
- `precipitation`
- `wind_speed_10m`
- `weather_code`

If the weather request fails:
- the backend does not fail the Snap SOS flow
- a neutral fallback weather context is used

## Authentication and Sessions

Authentication remains session-based via Passport.

Key points:
- browser clients authenticate once and then send cookies
- protected routes use `isAuthenticated`
- admin-only routes use `isAdmin`
- sessions can be backed by Redis when enabled

## Middleware and Security

Important middleware in `server.js`:
- `helmet`
- CSP via `helmet.contentSecurityPolicy`
- `compression`
- `cookie-parser`
- `express.json`
- `express.urlencoded`
- `express-mongo-sanitize`
- `xss-clean` safe usage
- `hpp`
- `express-session`
- Passport session middleware
- optional Redis-backed rate limiting

Snap SOS-specific middleware:
- `multer` with `memoryStorage()`
- max file size `8 MB`
- image mime type validation

## Environment Variables

Current backend `.env` may include:

```env
PORT=6001
NODE_ENV=development
DATABASE=...
DATABASE_PASSWORD=...
REDIS_URL=redis://127.0.0.1:6379
USE_REDIS_IN_DEV=true
SESSION_SECRET=...
GOOGLE_MAPS_API_KEY=...

# Snap SOS
SNAP_SOS_MODEL_SERVICE_URL=http://127.0.0.1:8001/predict
PUBLIC_BASE_URL=http://localhost:6001
```

Notes:
- `GOOGLE_MAPS_API_KEY` is used for reverse geocoding.
- `SNAP_SOS_MODEL_SERVICE_URL` points to the FastAPI inference service.
- `PUBLIC_BASE_URL` ensures uploaded Snap SOS images resolve correctly from the frontend.

## Running Locally

### Backend

```bash
cd backend
npm install
npm start
```

### FastAPI model service

From the `model/` directory:

```bash
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn inference_service:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend compatibility

The frontend calls:
- manual SOS via `/api/sos`
- Snap SOS via `/api/snap-sos`

## Realtime and Dashboards

Current realtime delivery is focused on alerts through Socket.IO.

Snap SOS does not currently add a separate websocket channel; confirmed Snap SOS records appear through the existing admin/citizen list and dashboard refresh flows.

## Error Handling

The backend uses:
- `utils/appError.js` for operational errors
- `controllers/errorController.js` for centralized error formatting

Common Snap SOS failure cases:
- missing/invalid image upload
- missing/invalid GeoJSON location
- model service unavailable or malformed response
- expired `SnapSOSAnalysis`
- unauthorized confirm attempts against another user’s analysis

## Database Indexes

### SOS
- `location`: `2dsphere`

### IncidentCluster
- `location`: `2dsphere`
- `{ canonicalClass: 1, lastReportAt: -1 }`

### SnapSOSAnalysis
- TTL index on `expiresAt`

### Other models
- existing user/resource/alert indexes remain in place for their respective features

## Testing and Verification

What has been verified in the current implementation:
- Python files compile:
  - `model/inference_service.py`
  - `model/predict_image.py`
  - `model/evaluate_model.py`
- backend Snap SOS modules load successfully
- frontend production build passes

Known limitation during local automated testing:
- the existing backend integration test harness attempts to bind to `0.0.0.0` and may fail under sandboxed or restricted environments

## Operational Notes

- Manual SOS flow remains intact and unchanged in purpose.
- Snap SOS is a review-first flow: analyze first, confirm second.
- `normal` is stored as a model-aligned type but should be treated operationally as low-confidence and human-reviewed.
- Current storage is local-disk-backed for development convenience; swap the adapter before multi-instance production deployment.
- Confidence thresholds are heuristics until the model is calibrated against a proper validation dataset.
