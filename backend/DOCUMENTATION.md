# Suraksha Setu - Backend Documentation

## Overview

The backend is a RESTful API server built with Node.js and Express.js, providing authentication, SOS reporting, resource management, and alert broadcasting services for the Suraksha Setu disaster management platform.

**Tech Stack:**
- Node.js + Express.js
- MongoDB (Mongoose ODM)
- Redis (optional, for sessions in production)
- Passport.js (session-based authentication)
- Swagger/OpenAPI (API documentation)

---

## Project Structure

```
backend/
├── config/
│   ├── passport.js           # Passport.js authentication config
│   └── swagger.js            # Swagger loader
├── controllers/
│   ├── authController.js     # Authentication logic
│   ├── sosController.js      # SOS report handlers
│   ├── resourceController.js # Resource CRUD handlers
│   ├── alertController.js    # Alert system handlers
│   ├── dashboardController.js # Dashboard statistics
│   └── errorController.js    # Global error handler
├── middleware/
│   └── auth.js               # Authentication middleware
├── models/
│   ├── User.js               # User schema
│   ├── SOS.js                # SOS report schema
│   ├── Resource.js           # Resource schema
│   └── Alert.js              # Alert schema
├── routes/
│   ├── auth.js               # Auth routes
│   ├── sos.js                # SOS routes
│   ├── resource.js           # Resource routes
│   ├── alert.js              # Alert routes
│   └── dashboard.js          # Dashboard routes
├── swagger/
│   ├── openapi.json          # Main OpenAPI spec
│   └── modules/              # Modular API definitions
│       ├── auth.json
│       ├── sos.json
│       ├── resources.json
│       ├── alerts.json
│       └── dashboard.json
├── utils/
│   └── appError.js           # Custom error class
├── postman/                  # Postman collections
├── server.js                 # Main server file
└── package.json
```

---

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | User login | No |
| POST | `/logout` | User logout | Yes |
| GET | `/me` | Get current user profile | Yes |

### SOS Reports (`/api/sos`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | List SOS reports | Yes |
| POST | `/` | Create SOS report | Yes (Citizen) |
| GET | `/:id` | Get SOS by ID | Yes |
| PATCH | `/:id/status` | Update SOS status | Yes (Admin) |
| GET | `/search` | Search SOS reports | Yes |

### Resources (`/api/resources`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | List resources | Yes |
| GET | `/:id` | Get resource by ID | Yes |
| POST | `/` | Create resource | Yes (Admin) |
| PUT | `/:id` | Update resource | Yes (Admin) |
| DELETE | `/:id` | Delete resource | Yes (Admin) |

### Alerts (`/api/alerts`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get active alerts for user | Yes |
| POST | `/` | Create/broadcast alert | Yes (Admin) |
| GET | `/history` | Get all alerts | Yes (Admin) |
| PATCH | `/:id/read` | Mark alert as read | Yes |
| DELETE | `/:id` | Deactivate alert | Yes (Admin) |

### Dashboard (`/api/dashboard`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/admin` | Admin dashboard stats | Yes (Admin) |
| GET | `/citizen` | Citizen dashboard stats | Yes (Citizen) |

---

## Data Models

### User Schema
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (hashed),
  phone: String,
  role: String (enum: 'citizen', 'admin', default: 'citizen'),
  location: {
    lat: Number,
    lng: Number,
    address: String
  },
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### SOS Schema
```javascript
{
  userId: ObjectId (ref: User),
  type: String (enum: 'medical', 'fire', 'flood', 'earthquake', 'other'),
  severity: String (enum: 'low', 'medium', 'high', 'critical'),
  status: String (enum: 'pending', 'acknowledged', 'in-progress', 'resolved'),
  description: String,
  location: {
    lat: Number,
    lng: Number,
    address: String
  },
  mediaUrls: [String],
  adminNotes: String,
  assignedTo: ObjectId (ref: User),
  resolvedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Resource Schema
```javascript
{
  name: String (required),
  type: String (enum: 'hospital', 'shelter', 'police', 'fire-station', 
                      'pharmacy', 'blood-bank', 'ngo', 'other'),
  description: String,
  location: {
    lat: Number,
    lng: Number,
    address: String (required)
  },
  contact: {
    phone: String,
    email: String,
    website: String
  },
  capacity: Number,
  isAvailable: Boolean (default: true),
  operatingHours: String,
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

### Alert Schema
```javascript
{
  title: String (required),
  message: String (required),
  type: String (enum: 'weather', 'disaster', 'health', 'security', 'general'),
  severity: String (enum: 'info', 'warning', 'danger', 'critical'),
  targetAudience: String (enum: 'all', 'citizens', 'admins', 'area-specific'),
  targetArea: {
    lat: Number,
    lng: Number,
    radius: Number (km)
  },
  isActive: Boolean (default: true),
  expiresAt: Date,
  readBy: [ObjectId] (ref: User),
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

---

## Authentication

### Session-Based Auth with Passport.js

1. **Login Flow:**
   - User submits username (email) + password
   - Passport LocalStrategy validates credentials
   - Session created and stored (memory/Redis)
   - Session cookie sent to client

2. **Session Configuration:**
   ```javascript
   {
     secret: process.env.SESSION_SECRET,
     resave: false,
     saveUninitialized: false,
     cookie: {
       secure: process.env.NODE_ENV === 'production',
       httpOnly: true,
       maxAge: 24 * 60 * 60 * 1000  // 24 hours
     }
   }
   ```

3. **Protected Routes:**
   - `isAuthenticated` middleware checks session
   - `isAdmin` middleware checks user role

---

## Middleware

### Authentication Middleware (`middleware/auth.js`)

```javascript
// Check if user is logged in
isAuthenticated(req, res, next)

// Check if user is admin
isAdmin(req, res, next)

// Redirect if already logged in (for login/register pages)
redirectIfAuthenticated(req, res, next)
```

### Security Middleware (in server.js)

| Middleware | Purpose |
|------------|---------|
| helmet | Security headers |
| cors | Cross-origin resource sharing |
| express-rate-limit | Rate limiting (disabled in dev) |
| express-mongo-sanitize | Prevent NoSQL injection |
| xss-clean | Prevent XSS attacks |
| hpp | Prevent HTTP parameter pollution |

---

## Error Handling

### Custom Error Class (`utils/appError.js`)
```javascript
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
  }
}
```

### Global Error Handler (`controllers/errorController.js`)
- Handles operational vs programming errors
- Different responses for development vs production
- Mongoose validation/cast errors
- Duplicate key errors

---

## Environment Variables

Create `.env` file in backend root:

```env
# Server
NODE_ENV=development
PORT=6001

# MongoDB
MONGODB_URI=mongodb://localhost:27017/suraksha-setu

# Session
SESSION_SECRET=your-super-secret-key

# Redis (optional, for production)
REDIS_URL=redis://localhost:6379
USE_REDIS_IN_DEV=false

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
```

---

## Running the Server

### Development
```bash
cd backend
npm install
npm run dev
```

### Production
```bash
npm start
```

### API Documentation
Visit `/api-docs` for Swagger UI documentation.

---

## Rate Limiting

| Environment | Limit | Window |
|-------------|-------|--------|
| Production | 100 requests | 1 hour |
| Development | Disabled | - |

---

## CORS Configuration

Allowed origins (configurable via env):
- `http://localhost:5173`
- `http://localhost:5174`

Credentials are included (cookies).

---

## Database Indexes

### User Collection
- `email`: unique index

### SOS Collection
- `userId`: for user's reports
- `status`: for filtering
- `createdAt`: for sorting
- `location`: 2dsphere (geospatial)

### Resource Collection
- `type`: for filtering
- `location`: 2dsphere (geospatial)

### Alert Collection
- `isActive`: for active alerts
- `expiresAt`: for expiration check
- `targetAudience`: for filtering

---

## Key Dependencies

| Package | Purpose |
|---------|---------|
| express | Web framework |
| mongoose | MongoDB ODM |
| passport | Authentication |
| passport-local | Local strategy |
| express-session | Session management |
| connect-redis | Redis session store |
| bcryptjs | Password hashing |
| helmet | Security headers |
| cors | CORS handling |
| express-rate-limit | Rate limiting |
| swagger-ui-express | API docs |
| morgan | HTTP logging |

---

## Controller Patterns

### Standard Response Format
```javascript
// Success
res.status(200).json({
  status: 'success',
  data: { ... }
});

// Error
res.status(400).json({
  status: 'fail',
  message: 'Error message'
});
```

### Async Error Handling
```javascript
const catchAsync = fn => (req, res, next) => {
  fn(req, res, next).catch(next);
};

exports.getAll = catchAsync(async (req, res, next) => {
  const data = await Model.find();
  res.status(200).json({ status: 'success', data });
});
```

---

## Testing

### Postman Collections
Located in `postman/` directory:
- `SurakshaSetu.postman_collection.json` - Basic API tests
- `SurakshaSetuPhase4.postman_collection.json` - Extended tests

### Running Tests
```bash
npm test
```

---

## Deployment Checklist

1. Set `NODE_ENV=production`
2. Configure Redis for sessions
3. Set secure session cookie options
4. Enable rate limiting
5. Configure proper CORS origins
6. Set up MongoDB indexes
7. Enable HTTPS

---

## API Versioning

Current version: v1 (implicit in `/api` prefix)

Future versions can be added as `/api/v2/...`


