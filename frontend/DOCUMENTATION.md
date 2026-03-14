# Suraksha Setu - Frontend Documentation

## Overview

Suraksha Setu is a disaster management platform that enables citizens to report emergencies and allows administrators to manage resources, broadcast alerts, and respond to SOS reports.

**Tech Stack:**
- React 18 + TypeScript
- Vite (build tool)
- Redux Toolkit + RTK Query (state management & API calls)
- Material UI v6 (component library)
- React Router v6 (routing)

---

## Project Structure

```
frontend/
├── public/
│   └── suraksha-setu-brand-logo.jpg    # Brand logo
├── src/
│   ├── app/
│   │   ├── api/                        # RTK Query API slices
│   │   │   ├── baseApi.ts              # Base API configuration
│   │   │   ├── authApi.ts              # Authentication endpoints
│   │   │   ├── sosApi.ts               # SOS report endpoints
│   │   │   ├── resourceApi.ts          # Resource directory endpoints
│   │   │   ├── alertApi.ts             # Alert system endpoints
│   │   │   ├── dashboardApi.ts         # Dashboard data endpoints
│   │   │   └── index.ts                # API exports
│   │   ├── store.ts                    # Redux store configuration
│   │   └── hooks.ts                    # Typed Redux hooks
│   ├── components/
│   │   ├── common/
│   │   │   ├── NotificationProvider.tsx # Toast notifications
│   │   │   └── ProtectedRoute.tsx       # Route protection HOC
│   │   └── layout/
│   │       ├── MainLayout.tsx          # Main app layout wrapper
│   │       ├── Sidebar.tsx             # Navigation sidebar
│   │       └── Header.tsx              # Top header bar
│   ├── features/
│   │   ├── auth/
│   │   │   └── authSlice.ts            # Authentication state
│   │   └── notification/
│   │       └── notificationSlice.ts    # Notification state
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.tsx               # Login page
│   │   │   └── Register.tsx            # Registration page
│   │   ├── citizen/
│   │   │   ├── Dashboard.tsx           # Citizen dashboard
│   │   │   ├── CreateSOS.tsx           # Create SOS report
│   │   │   ├── MySOSList.tsx           # User's SOS reports
│   │   │   ├── SOSDetail.tsx           # SOS report detail view
│   │   │   ├── ResourceDirectory.tsx   # Browse resources
│   │   │   └── Alerts.tsx              # View active alerts
│   │   └── admin/
│   │       ├── Dashboard.tsx           # Admin dashboard with KPIs
│   │       ├── AllSOS.tsx              # Manage all SOS reports
│   │       ├── SOSDetail.tsx           # Admin SOS detail view
│   │       ├── ManageResources.tsx     # CRUD resources
│   │       ├── BroadcastAlert.tsx      # Create new alerts
│   │       └── AlertHistory.tsx        # View alert history
│   ├── types/
│   │   └── index.ts                    # TypeScript interfaces
│   ├── App.tsx                         # Main app component
│   ├── main.tsx                        # App entry point
│   ├── theme.ts                        # MUI theme configuration
│   └── index.css                       # Global styles
├── vite.config.ts                      # Vite configuration
├── tsconfig.json                       # TypeScript configuration
└── package.json                        # Dependencies
```

---

## Authentication Flow

### Session-Based Auth
- Uses HTTP-only cookies for session management
- Passport.js on backend handles authentication
- Frontend stores user info in Redux after login

### Auth State (`authSlice.ts`)
```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
}
```

### Protected Routes
- `ProtectedRoute` component checks authentication
- Redirects unauthenticated users to `/login`
- Role-based access: `citizen` vs `admin`

---

## API Integration (RTK Query)

### Base Configuration (`baseApi.ts`)
- Base URL: `/api` (proxied to backend in development)
- Credentials: `include` (sends cookies with requests)
- Tag types: `SOS`, `Resource`, `Alert`, `User`, `Dashboard`

### API Slices

#### Auth API (`authApi.ts`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | User registration |
| `/auth/login` | POST | User login |
| `/auth/logout` | POST | User logout |
| `/auth/me` | GET | Get current user profile |

#### SOS API (`sosApi.ts`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/sos` | GET | List SOS reports (with filters) |
| `/sos` | POST | Create new SOS report |
| `/sos/:id` | GET | Get SOS detail |
| `/sos/:id/status` | PATCH | Update SOS status (admin) |

#### Resource API (`resourceApi.ts`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/resources` | GET | List resources (with filters) |
| `/resources/:id` | GET | Get resource detail |
| `/resources` | POST | Create resource (admin) |
| `/resources/:id` | PUT | Update resource (admin) |
| `/resources/:id` | DELETE | Delete resource (admin) |

#### Alert API (`alertApi.ts`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/alerts` | GET | Get active alerts for user |
| `/alerts` | POST | Create alert (admin) |
| `/alerts/history` | GET | Get all alerts (admin) |
| `/alerts/:id/read` | PATCH | Mark alert as read |
| `/alerts/:id` | DELETE | Deactivate alert (admin) |

#### Dashboard API (`dashboardApi.ts`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/dashboard/admin` | GET | Admin dashboard stats |
| `/dashboard/citizen` | GET | Citizen dashboard stats |

---

## User Roles & Permissions

### Citizen
- Create SOS reports
- View own SOS reports
- Browse resource directory
- Receive and view alerts

### Admin
- View all SOS reports
- Update SOS status
- Manage resources (CRUD)
- Broadcast alerts
- View dashboard analytics

---

## Key Features

### 1. SOS Reporting
- Emergency types: Medical, Fire, Flood, Earthquake, Other
- Severity levels: Low, Medium, High, Critical
- Location capture (address + coordinates)
- Status tracking: Pending → Acknowledged → In Progress → Resolved

### 2. Resource Directory
- Types: Hospital, Shelter, Police, Fire Station, etc.
- Search by type, location, keyword
- Contact information display

### 3. Alert System
- Admin broadcasts alerts to users
- Alert types: Weather, Disaster, Health, Security, General
- Severity levels with color coding
- Auto-expiration support

### 4. Admin Dashboard
- KPI cards: Total SOS, Pending, In Progress, Resolved
- Pending SOS reports table
- Recent alerts list
- SOS statistics by severity/status

---

## Theming & Colors

### Color Palette (theme.ts)
| Purpose | Color | Hex |
|---------|-------|-----|
| Primary (Sidebar) | Dark Slate | `#1e293b` |
| Secondary (Actions) | Orange | `#ea580c` |
| Error/High Severity | Orange | `#ea580c` |
| Warning | Amber | `#f97316` |
| Info/In Progress | Blue | `#0284c7` |
| Success/Resolved | Green | `#16a34a` |

### Design Principles
- Clean, professional appearance
- Muted colors for calmness
- Orange accents for urgency
- Dark sidebar for contrast

---

## Running the Application

### Development
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables
Create `.env` file:
```env
VITE_API_BASE_URL=/api  # Uses Vite proxy in dev
```

### Build for Production
```bash
npm run build
```

---

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^18.x | UI framework |
| @reduxjs/toolkit | ^2.x | State management |
| @mui/material | ^6.x | UI components |
| react-router-dom | ^6.x | Routing |
| vite | ^6.x | Build tool |

---

## File Naming Conventions

- **Components**: PascalCase (`MainLayout.tsx`)
- **Slices**: camelCase with Slice suffix (`authSlice.ts`)
- **API files**: camelCase with Api suffix (`sosApi.ts`)
- **Types**: PascalCase interfaces (`User`, `SOS`, `Alert`)

---

## Common Patterns

### Using API Hooks
```typescript
// Query (GET)
const { data, isLoading, error } = useGetSOSListQuery({ status: 'pending' });

// Mutation (POST/PUT/DELETE)
const [createSOS, { isLoading }] = useCreateSOSMutation();
await createSOS(sosData).unwrap();
```

### Dispatching Notifications
```typescript
import { showSuccess, showError } from '../features/notification/notificationSlice';

dispatch(showSuccess('Operation completed!'));
dispatch(showError('Something went wrong'));
```

### Type-safe Selectors
```typescript
import { useAppSelector } from '../app/hooks';
import { selectCurrentUser, selectIsAdmin } from '../features/auth/authSlice';

const user = useAppSelector(selectCurrentUser);
const isAdmin = useAppSelector(selectIsAdmin);
```



