# 🔄 SkillSwap — Peer-to-Peer Skill Exchange Platform

<div align="center">

**Exchange Skills, Grow Together**

A real-time peer-to-peer skill exchange platform where users teach and learn from each other without monetary transactions. AI-powered matching connects people with complementary skills.

[Features](#-features) • [Tech Stack](#-tech-stack) • [Setup](#-setup) • [API Docs](#-api-documentation) • [Architecture](#-architecture)

</div>

---

## ✨ Features

### 👤 User System
- JWT authentication + Google OAuth
- Rich profiles with skills, portfolio, and availability
- Rating & review system
- Block/report users

### 🤝 Smart Matching
- AI-powered matching algorithm scores users on:
  - **Skill compatibility** (50% weight) — mutual skill exchange potential
  - **Level matching** (25% weight) — compatible experience levels
  - **Availability overlap** (25% weight) — schedule alignment
- Trending skills and demand analytics

### 💬 Real-Time Communication
- 1:1 chat with Socket.io (typing indicators, read receipts)
- WebRTC video/audio calling
- Screen sharing for teaching sessions
- Real-time notifications and presence

### 📅 Session Management
- Schedule and manage skill exchange sessions
- Session lifecycle: Scheduled → Active → Completed
- Post-session reviews and ratings

### 🏆 Gamification
- XP points for sessions (+50), reviews (+20), badges (+10)
- Level progression (500 XP per level)
- Leaderboard ranking
- Achievement badges

### 🛡️ Admin Panel
- Platform statistics dashboard
- User management and moderation
- Role-based access control

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js (App Router), React, Tailwind CSS, Framer Motion, Three.js |
| **Backend** | Node.js, Express.js |
| **Database** | Supabase (PostgreSQL) |
| **Real-Time** | Socket.io, WebRTC |
| **Auth** | JWT, bcrypt, Passport.js (Google OAuth) |
| **Deployment** | Vercel (Frontend), Render (Backend), Supabase |

---

## 🚀 Setup

### Prerequisites
- Node.js 18+
- Supabase Project (URL and Service Role Key)

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-username/skillswap.git
cd skillswap

# 2. Backend setup
cd backend
cp .env.example .env    # Edit .env with your config
npm install
npm run dev             # Starts on http://localhost:5000

# 3. Frontend setup (new terminal)
cd frontend
npm install
npm run dev             # Starts on http://localhost:3000
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | `5000` |
| `SUPABASE_URL` | Supabase Project URL | Required |
| `SUPABASE_SERVICE_ROLE_KEY`| Supabase Service Role Key | Required |
| `JWT_SECRET` | Secret key for JWT tokens | Required |
| `JWT_EXPIRES_IN` | Token expiry duration | `7d` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Optional |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | Optional |

### Deployment
This project is configured for cloud deployment:
- **Frontend**: Deploy on [Vercel](https://vercel.com).
- **Backend**: Deploy on [Render](https://render.com) as a Web Service.
- **Database**: Managed by [Supabase](https://supabase.com).

---

## 📡 API Documentation

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login user |
| `GET` | `/api/auth/me` | Get current user |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users` | List users (with filters) |
| `GET` | `/api/users/:id` | Get user profile |
| `PUT` | `/api/users/profile` | Update own profile |
| `GET` | `/api/users/leaderboard` | Get XP leaderboard |
| `GET` | `/api/users/:id/reviews` | Get user reviews |
| `POST` | `/api/users/:id/block` | Block a user |

### Matches
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/matches` | Find skill matches |
| `GET` | `/api/matches/recommendations` | Trending skills |

### Sessions
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/sessions` | Create session |
| `GET` | `/api/sessions` | List sessions |
| `PATCH` | `/api/sessions/:id/status` | Update status |
| `POST` | `/api/sessions/:id/review` | Submit review |

### Conversations
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/conversations` | Get/create conversation |
| `GET` | `/api/conversations` | List conversations |
| `GET` | `/api/conversations/:id/messages` | Get messages |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/stats` | Platform statistics |
| `GET` | `/api/admin/users` | All users |
| `PATCH` | `/api/admin/users/:id/role` | Update user role |
| `DELETE` | `/api/admin/users/:id` | Delete user |

### Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `chat:join` | Client → Server | Join chat room |
| `chat:message` | Bidirectional | Send/receive message |
| `chat:typing` | Bidirectional | Typing indicator |
| `chat:read` | Client → Server | Mark messages read |
| `call:initiate` | Client → Server | Start a call |
| `call:accept` | Client → Server | Accept incoming call |
| `webrtc:offer` | Bidirectional | SDP offer exchange |
| `webrtc:answer` | Bidirectional | SDP answer exchange |
| `webrtc:ice-candidate` | Bidirectional | ICE candidate exchange |
| `user:online` | Server → Client | User came online |
| `user:offline` | Server → Client | User went offline |

---

## 🏗️ Architecture

```
skillswapproject/
├── frontend/                 # Next.js App (Port 3000)
│   ├── app/                  # App Router pages
│   │   ├── page.js           # Landing page (Three.js)
│   │   ├── login/            # Auth pages
│   │   ├── register/
│   │   └── dashboard/        # Protected dashboard
│   │       ├── matches/      # AI matching
│   │       ├── chat/[id]/    # Real-time chat
│   │       ├── sessions/     # Session management
│   │       ├── leaderboard/  # Gamification
│   │       └── profile/      # Skill management
│   ├── components/           # Reusable components
│   ├── context/              # React contexts
│   └── lib/                  # API client, socket, utils
│
├── backend/                  # Express API (Port 5000)
│   └── src/
│       ├── server.js         # Entry point
│       ├── config/           # Supabase, env config
│       ├── controllers/      # Business logic
│       ├── routes/           # REST endpoints
│       ├── middleware/       # Auth, admin, errors
│       └── socket/           # Chat & WebRTC signaling
│
└── .github/workflows/        # CI/CD pipeline
```

---

## 💰 Monetization Ideas (Future)
- **Premium Matching** — Priority in match results
- **Group Sessions** — Multi-user video learning (SFU needed)
- **Skill Certification** — Paid verification badges
- **Featured Profiles** — Promoted visibility
- **Corporate Plans** — Team skill exchange for companies

## 📈 Scaling to 1M+ Users
- **Database**: Supabase connection pooling and read replicas
- **Cache**: Redis Cluster for sessions, presence, and rate limiting
- **WebSocket**: Socket.io with Redis Adapter across multiple Node.js instances
- **Media**: Transition from P2P to SFU (LiveKit/Mediasoup) for video
- **CDN**: Cloudflare/CloudFront for static assets
- **Queue**: Bull/BullMQ for async tasks (emails, notifications)
- **Search**: Elasticsearch for skill search at scale
- **Monitoring**: Prometheus + Grafana, Sentry for errors

---

## 📄 License

MIT License — feel free to use this for your projects.
