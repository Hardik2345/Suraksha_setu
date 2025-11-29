# Suraksha Setu Frontend

React + TypeScript + Vite frontend for the Suraksha Setu disaster management platform.

## Tech Stack

- **React 18** with TypeScript
- **Vite** for blazing fast development
- **Redux Toolkit** + **RTK Query** for state management and API calls
- **Material UI** for the component library
- **React Router** for navigation

## Features

### Citizen Portal
- 📊 Dashboard with SOS statistics and recent reports
- 🚨 Create emergency SOS reports with location
- 📋 View and track your SOS reports
- 🏥 Find nearby emergency resources (hospitals, shelters, etc.)
- 🔔 Receive and view emergency alerts

### Admin Portal
- 📈 Admin dashboard with global statistics
- 📝 Manage all SOS reports
- 🏗️ CRUD operations for emergency resources
- 📢 Broadcast emergency alerts to citizens
- 📜 View alert history

## Project Structure

```
src/
├── app/
│   ├── api/           # RTK Query API slices
│   │   ├── authApi.ts
│   │   ├── sosApi.ts
│   │   ├── resourceApi.ts
│   │   ├── alertApi.ts
│   │   └── dashboardApi.ts
│   ├── store.ts       # Redux store configuration
│   └── hooks.ts       # Typed Redux hooks
├── features/
│   ├── auth/          # Auth slice
│   └── notification/  # Notification slice
├── components/
│   ├── common/        # Shared components
│   └── layout/        # Layout components
├── pages/
│   ├── auth/          # Login, Register
│   ├── citizen/       # Citizen pages
│   └── admin/         # Admin pages
├── types/             # TypeScript types
├── theme.ts           # MUI theme
└── App.tsx            # Main app with routing
```

## Getting Started

### Prerequisites

- Node.js 18+
- Backend running at `http://localhost:6001`

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## API Integration

The frontend connects to the backend API at `http://localhost:6001/api`. The base URL can be configured via:

1. Environment variable: Create a `.env` file with:
   ```
   VITE_API_BASE_URL=http://localhost:6001/api
   ```

2. Vite config proxy is also configured for `/api` routes.

### Authentication

The application uses session-based authentication with cookies. RTK Query is configured with `credentials: 'include'` to send cookies with all requests.

## API Endpoints Used

### Authentication (`/api/auth`)
- `POST /login` - Login with email/password
- `POST /register` - Register new user
- `GET /logout` - Logout
- `GET /profile` - Get current user profile

### SOS Reports (`/api/sos`)
- `GET /` - List SOS reports (own for citizen, all for admin)
- `POST /` - Create SOS report
- `GET /:id` - Get SOS detail
- `PUT /:id` - Update SOS status (admin)

### Resources (`/api/resources`)
- `GET /` - List resources (supports geospatial search)
- `POST /` - Create resource (admin)
- `GET /:id` - Get resource
- `PUT /:id` - Update resource (admin)
- `DELETE /:id` - Delete resource (admin)

### Alerts (`/api/alerts`)
- `GET /` - Get alerts for user
- `POST /` - Broadcast alert (admin)
- `GET /history` - Alert history (admin)
- `PUT /:id/read` - Mark alert as read
- `DELETE /:id` - Deactivate alert (admin)

### Dashboard
- `GET /dashboard/stats` - Citizen dashboard
- `GET /admin/dashboard` - Admin dashboard

## Styling

The application uses a custom MUI theme with:
- Primary color: Dark blue (`#1a1a2e`)
- Secondary/accent: Red (`#e94560`)
- Modern card-based UI
- Responsive design
- Custom font (Inter, Poppins)
