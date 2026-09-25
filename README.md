# 🏏 Cricket Conquest — ZenTriX'26 IPL Auction System

A **full-stack, real-time IPL Auction platform** with **Role-Based Access Control (RBAC)**, built for college tech fest events. Features a live bidding engine, WebSocket broadcast, participant portal, and a complete organizer control center.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+
- **MySQL** 8.0+
- **npm** v9+

### 1. Database Setup

```bash
# Create the database and all tables
mysql -u root -p < database/FULL_SETUP.sql
```

### 2. Server Configuration

```bash
# Edit server environment
cp server/.env.example server/.env
```

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=cricket_conquest
PORT=5000
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=24h
MIN_SQUAD_SIZE=5
MAX_SQUAD_SIZE=15
MAX_TEAMS=16
DEFAULT_PURSE=100.00
```

### 3. Install & Run

```bash
# Install all dependencies (root + server)
npm install
npm install --prefix server

# Run both frontend and backend concurrently
npm run dev:all
```

| Service | URL |
|---------|-----|
| Frontend (Vite) | http://localhost:5173 |
| Backend API | http://localhost:5000 |

---

## 🔐 RBAC — Role-Based Access Control

### Organizer Roles

| Role | Badge | Capabilities |
|------|-------|-------------|
| **Admin** | 🔴 Red | Full system access — user management, team CRUD, player CRUD, auction control, publish results |
| **Auctioneer** | 🔵 Blue | Auction control, team check-in, player data edit, watchdog monitor, view all |
| **Volunteer** | 🟢 Green | **Read-only** — dashboard, teams, players, history, results |

### Default Demo Credentials

| Username | Password | Role |
|----------|----------|------|
| `admin` | `Admin@ZenTriX26` | Admin |
| `auctioneer` | `Auction@ZenTriX26` | Auctioneer |
| `volunteer` | `Volunteer@ZenTriX26` | Volunteer |

> ⚠️ These are auto-seeded at server startup. Change passwords before production.

### API Permission Matrix

| Endpoint | Admin | Auctioneer | Volunteer |
|----------|:-----:|:----------:|:---------:|
| `GET /api/teams` | ✅ | ✅ | ✅ |
| `GET /api/players` | ✅ | ✅ | ✅ |
| `GET /api/auction/state` | ✅ | ✅ | ✅ (public) |
| `PATCH /api/teams/:id/check-in` | ✅ | ✅ | ❌ |
| `POST /api/teams` | ✅ | ❌ | ❌ |
| `PUT /api/teams/:id` | ✅ | ❌ | ❌ |
| `DELETE /api/teams/:id` | ✅ | ❌ | ❌ |
| `POST /api/players/import` | ✅ | ✅ | ❌ |
| `PUT /api/players/:id` | ✅ | ✅ | ❌ |
| `DELETE /api/players/:id` | ✅ | ❌ | ❌ |
| `POST /api/auction/start` | ✅ | ✅ | ❌ |
| `POST /api/auction/bid` | ✅ | ✅ | ❌ |
| `POST /api/auction/sold` | ✅ | ✅ | ❌ |
| `POST /api/auction/publish-results` | ✅ | ❌ | ❌ |
| `GET /api/auth/users` | ✅ | ❌ | ❌ |
| `POST /api/auth/users` | ✅ | ❌ | ❌ |
| `DELETE /api/auth/users/:id` | ✅ | ❌ | ❌ |

---

## 🏗️ Architecture

```
ipl-auction/
├── src/                        # React + TypeScript frontend (Vite)
│   ├── App.tsx                 # Routes with RBAC ProtectedRoute guards
│   ├── contexts/AuthContext.tsx # JWT auth context + hasRole()
│   ├── components/
│   │   ├── ProtectedRoute.tsx  # Role-gated route component
│   │   └── Sidebar/Sidebar.tsx # Role-filtered navigation
│   ├── pages/
│   │   ├── organizer/
│   │   │   ├── Dashboard.tsx       # Team registration overview
│   │   │   ├── TeamsManagement.tsx # Full team CRUD
│   │   │   ├── PlayerDatabase.tsx  # Player import + management
│   │   │   ├── LiveAuction/        # Real-time auction stage
│   │   │   ├── AuctionHistory.tsx  # Event log
│   │   │   ├── Results.tsx         # Final standings
│   │   │   ├── WatchdogMonitor.tsx # Participant monitoring (Admin+)
│   │   │   └── UserManagement.tsx  # Organizer RBAC (Admin only) ← NEW
│   │   └── participant/
│   │       ├── ParticipantLoginPage.tsx
│   │       ├── ParticipantDashboard.tsx
│   │       └── ParticipantAuctionRoom.tsx
│   └── services/
│       ├── authService.ts          # JWT token management
│       ├── teamService.ts          # Teams API (with auth headers)
│       ├── playerService.ts        # Players API (with auth headers)
│       ├── auctionService.ts       # Auction API (with auth headers)
│       └── userManagementService.ts # Admin user CRUD ← NEW
│
├── server/                     # Express + TypeScript backend
│   └── src/
│       ├── middleware/
│       │   ├── auth.ts             # JWT verify + requireRole()
│       │   └── participantAuth.ts  # Participant session auth
│       ├── routes/
│       │   ├── authRoutes.ts       # Login + /me + user CRUD ← UPDATED
│       │   ├── teamRoutes.ts       # Teams (RBAC protected) ← UPDATED
│       │   ├── playerRoutes.ts     # Players (RBAC protected) ← UPDATED
│       │   ├── auctionRoutes.ts    # Live auction (RBAC protected)
│       │   └── participantRoutes.ts
│       ├── controllers/
│       │   ├── authController.ts
│       │   ├── userManagementController.ts ← NEW
│       │   ├── auctionController.ts
│       │   ├── teamController.ts
│       │   └── playerController.ts
│       └── services/
│           ├── authService.ts
│           ├── userManagementService.ts ← NEW
│           ├── auctionSessionService.ts
│           ├── biddingService.ts
│           ├── auctionTransactionService.ts
│           ├── auctionAnalyticsService.ts
│           ├── teamService.ts
│           └── playerService.ts
│
└── database/
    ├── FULL_SETUP.sql          # ← Run this for complete setup
    ├── schema.sql              # Players + teams schema
    ├── auction_schema.sql      # Auction engine tables
    └── teams_schema.sql        # Extended teams schema
```

---

## 🎯 Feature Highlights

### Live Auction Engine
- **Real-time WebSocket** broadcast to all connected clients
- **ACID transactions** for bid/sell/unsold/undo operations
- **Auction stages**: INITIAL → PLAYER_READY → BIDDING → GOING_ONCE → GOING_TWICE → SOLD/UNSOLD
- **Purse feasibility checks** — prevents teams from overbidding relative to minimum squad requirements
- **Undo last sale** — fully reverses player + team purse state

### Participant Portal
- Teams log in with access codes
- Real-time auction room with bid feed
- Heartbeat/ping system for presence tracking
- Support request mechanism

### Admin User Management (NEW)
- Create, edit, deactivate, delete organizer accounts
- Role assignment with inline select
- Password reset for any account
- Visual RBAC permission cheatsheet

---

## 📱 Portal URLs

| Portal | URL | Access |
|--------|-----|--------|
| Public Landing | http://localhost:5173/ | Everyone |
| Team Registration | http://localhost:5173/register | Public |
| Organizer Login | http://localhost:5173/organizer/login | Organizers |
| Organizer Dashboard | http://localhost:5173/organizer | Admin/Auctioneer/Volunteer |
| User Management | http://localhost:5173/organizer/users | **Admin only** |
| Participant Login | http://localhost:5173/participant/login | Teams |
| Participant Auction | http://localhost:5173/participant/auction | Teams |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite 8 |
| Styling | Vanilla CSS, glassmorphism design |
| Icons | Lucide React |
| Backend | Express 4, TypeScript, tsx |
| Database | MySQL 8 + mysql2 |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Real-time | WebSocket (ws) |
| Excel Import | XLSX |
