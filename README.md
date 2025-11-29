# 🛡️ Suraksha Setu - Disaster Management Platform

<p align="center">
  <img src="frontend/public/suraksha-setu-brand-logo.jpg" alt="Suraksha Setu Logo" width="200">
</p>

**Suraksha Setu** (सुरक्षा सेतु - "Bridge to Safety") is a comprehensive disaster management platform that connects citizens with emergency services and resources during natural disasters and emergencies.

---

## 🌟 Features

### For Citizens
- 🆘 **SOS Reporting** - Report emergencies with location, type, and severity
- 📍 **Resource Directory** - Find nearby hospitals, shelters, police stations
- 🔔 **Alert System** - Receive real-time emergency alerts and warnings
- 📊 **Dashboard** - Track your reports and their status

### For Administrators
- 📈 **Admin Dashboard** - Real-time KPIs and statistics
- 🚨 **SOS Management** - Review, acknowledge, and resolve reports
- 🏥 **Resource Management** - CRUD operations for emergency resources
- 📢 **Alert Broadcasting** - Send targeted alerts to citizens
- 📜 **Alert History** - View and manage past alerts

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│    Frontend     │────▶│    Backend      │────▶│    MongoDB      │
│  React + Vite   │     │  Express.js     │     │                 │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │     Redis       │
                        │  (Sessions)     │
                        └─────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| TypeScript | Type Safety |
| Vite | Build Tool |
| Redux Toolkit | State Management |
| RTK Query | API Data Fetching |
| Material UI v6 | Component Library |
| React Router v6 | Routing |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express.js | Web Framework |
| MongoDB | Database |
| Mongoose | ODM |
| Passport.js | Authentication |
| Redis | Session Store (Production) |
| Swagger | API Documentation |

---

## 📂 Project Structure

```
suraksha-setu/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── app/             # Redux store & API slices
│   │   ├── components/      # Reusable components
│   │   ├── features/        # Redux feature slices
│   │   ├── pages/           # Page components
│   │   └── types/           # TypeScript definitions
│   ├── DOCUMENTATION.md     # Frontend documentation
│   └── package.json
│
├── backend/                  # Express backend API
│   ├── config/              # Configuration files
│   ├── controllers/         # Route handlers
│   ├── middleware/          # Custom middleware
│   ├── models/              # Mongoose schemas
│   ├── routes/              # API routes
│   ├── swagger/             # OpenAPI documentation
│   ├── DOCUMENTATION.md     # Backend documentation
│   └── package.json
│
└── README.md                 # This file
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB
- Redis (optional, for production)

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/suraksha-setu.git
cd suraksha-setu
```

### 2. Setup Backend
```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env with your configuration

npm run dev
```

### 3. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Access the Application
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:6001
- **API Docs:** http://localhost:6001/api-docs

---

## 🔐 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=6001
MONGODB_URI=mongodb://localhost:27017/suraksha-setu
SESSION_SECRET=your-secret-key
REDIS_URL=redis://localhost:6379
```

### Frontend (.env)
```env
VITE_API_BASE_URL=/api
```

---

## 📡 API Overview

| Module | Base Path | Description |
|--------|-----------|-------------|
| Auth | `/api/auth` | User authentication |
| SOS | `/api/sos` | Emergency reports |
| Resources | `/api/resources` | Resource directory |
| Alerts | `/api/alerts` | Alert system |
| Dashboard | `/api/dashboard` | Statistics |

See full API documentation at `/api-docs` when running the backend.

---

## 👥 User Roles

| Role | Permissions |
|------|-------------|
| **Citizen** | Create SOS, view own reports, browse resources, receive alerts |
| **Admin** | All citizen permissions + manage SOS, resources, and alerts |

---

## 🎨 UI/UX Design

### Color Palette
| Color | Hex | Usage |
|-------|-----|-------|
| Dark Slate | `#1e293b` | Sidebar, primary dark |
| Orange | `#ea580c` | Actions, high severity |
| Blue | `#0284c7` | Info, in-progress |
| Green | `#16a34a` | Success, resolved |
| Amber | `#f97316` | Warnings, pending |

### Design Principles
- Professional and clean interface
- Muted colors for calmness during emergencies
- Orange accents for urgency without alarm
- Responsive design for all devices

---

## 📖 Documentation

- [Frontend Documentation](frontend/DOCUMENTATION.md)
- [Backend Documentation](backend/DOCUMENTATION.md)
- [API Specification](backend/swagger/openapi.json)

---

## 🧪 Testing

### Backend
```bash
cd backend
npm test
```

### Frontend
```bash
cd frontend
npm test
```

---

## 🚢 Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure Redis for sessions
- [ ] Enable HTTPS
- [ ] Set secure cookie options
- [ ] Configure proper CORS origins
- [ ] Set up MongoDB indexes
- [ ] Enable rate limiting

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Team

Built with ❤️ by the Suraksha Setu Team

---

## 📞 Support

For support, email support@suraksha-setu.com or open an issue on GitHub.


