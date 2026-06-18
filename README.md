# EventApp — CUZ Events

A full-stack React Native application for **Cavendish University Zambia** events management.  
Supports **mobile** (Expo), **web** (react-native-web), and **admin dashboard** (Expo).

## Live URLs

| App | URL |
|---|---|
| **User App (Frontend)** | https://cuz-events-stevensengimana777-6503s-projects.vercel.app |
| **Backend API** | https://eventapp-production-9af6.up.railway.app |
| **Admin Dashboard** | Runs locally via `cd admin-app && npx expo start` |

> No login required to browse events. Google OAuth + email/password sign-in for users.

---

## ✨ Features

### User App (`user-app/`)
- **Event Discovery** — Browse, search, and filter events by category (Social, Cultural, Sports, Academic, Entertainment, Partnership)
- **Event Details** — View event info, club, date/time, location, price, capacity, rating, and reviews
- **Registration & Ticketing** — Register for events, view tickets, payment verification flow
- **Clubs** — Browse clubs, view details, join/request membership
- **Saved Events** — Bookmark events for later
- **My Reviews** — View all reviews you've submitted
- **Notifications** — Bell dropdown on Events screen; real-time alerts via Socket.IO for new/published events; 30s polling for backend-published events; 24-hour auto-expiry of stored notifications; pressable notifications navigate to EventDetails
- **Feedback Module** — Past events (date passed) show a feedback section with 5-star rating picker + optional comment; submitted feedback updates the event's aggregate rating and review count immediately
- **User Profile** — Edit profile, change password, settings with theme toggle
- **Authentication** — Google OAuth (web + mobile) + email/password + JWT session
- **Recommendations** — Featured & highest-rated events

### Admin Dashboard (`admin-app/`)
- **Events Management** — Create, edit, publish/unpublish, delete events
  - Rich create form: date picker (year/month/day), time picker (HH:MM slots), location picker (preset venues + custom), category chip selector, club picker, image picker (gallery/camera/URL)
- **Clubs Management** — Approve, deactivate, delete clubs
- **Payments Console** — Verify or reject ticket payments
- **Reports Dashboard** — Platform-wide statistics (users, events, clubs, tickets)
- **Feedback Console** — Per-event feedback modal showing average rating, rating distribution bar chart (1-5★), and chronological comments with user names
- **Notifications** — Floating bell with dropdown; 30s polling for new published events; admin auto-logout on 24h session timeout / inactivity
- **Authentication** — Email/password login, session persistence, auto-logout on 401

### Backend (`backend/`)
- **REST API** — Express.js + TypeScript on PostgreSQL
- **Authentication** — JWT with httpOnly cookies; Firebase + Google OAuth verification
- **Socket.IO** — Real-time `event:status` events on publish/unpublish
- **Feedback** — `POST /api/reviews` auto-updates event `rating`/`reviews` aggregates; `GET /api/events/:id/reviews` returns reviews + stats (avg, total, distribution)
- **Push Tokens** — Expo push token registration for future push notifications
- **Seed Data** — Events, clubs, users with realistic Zambia-based data

---

## What's Missing / Next Steps

1. **🔴 Redeploy Backend on Railway** — The Socket.IO dependency was added to `package.json` but the Railway service hasn't been redeployed. Without this, real-time notifications and socket events won't work.
2. **🔴 Redeploy Frontend on Vercel** — Latest notification, feedback, and UI changes need a fresh `npx expo export --platform web` + deploy.
3. **Push Notifications** — Expo push tokens are registered but never triggered. Backend needs to call Expo Push API when events are published.
4. **Feedback Prompt** — The spec calls for an automatic notification after an event's scheduled end time. Currently feedback is shown manually on EventDetails for past events — no push/local notification yet.
5. **Registered-user-only review** — Currently any user can review any past event. The spec says only registered attendees should get a prompt. `user_reviews` table has no attendance check.
6. **Tests** — No unit/integration tests exist for backend or frontend.
7. **CI/CD** — No automated deployment pipeline. Manual build + deploy for Railway and Vercel.
8. **Error Boundaries** — No React error boundaries or global crash reporting.
9. **Web Socket Transport** — Socket.IO on web uses long-polling (WebSocket not available); verify stability.

---

## Project Structure

```
EventApp/
├── backend/                    # Express.js + TypeScript API server
│   ├── server.ts              # Routes, Socket.IO, middleware
│   ├── database.ts            # PostgreSQL queries (events, clubs, users, reviews, tickets, push_tokens)
│   ├── db.ts                  # Database connection pool
│   ├── auth.ts                # JWT token generation, cookie helpers, auth middleware
│   ├── firebase.ts            # Firebase Admin SDK (optional)
│   ├── migrations/            # SQL migration files
│   ├── data/                  # JSON seed data (clubs.json)
│   ├── types.ts               # TypeScript interfaces
│   └── package.json           # Backend dependencies (express, socket.io, pg, jwt)
├── user-app/                   # Student-facing React Native (Expo) app
│   ├── App.tsx                # Root: AuthProvider, socket listeners, polling, global routing
│   ├── api.ts                 # API client with JWT auth headers
│   ├── types.ts               # Shared frontend types
│   ├── services/
│   │   └── socket.ts          # Socket.IO client singleton
│   ├── utils/
│   │   ├── notificationStore.ts  # AsyncStorage-backed notification store (24h expiry)
│   │   └── notifications.ts     # Expo push notification helpers
│   ├── components/
│   │   ├── screens/           # EventListScreen, EventDetailsScreen, LoginScreen, ProfileScreen,
│   │   │                      # ClubsScreen, ClubDetailsScreen, RecommendationsScreen, SettingsScreen,
│   │   │                      # MyReviewsScreen, MyTicketsScreen, SavedEventsScreen, HelpSupportScreen, etc.
│   │   ├── ui/                # Badge, Button, RegistrationModal
│   │   └── NotificationDropdown.tsx  # In-app notification bell + dropdown (on Events screen)
│   └── context/
│       └── AuthContext.tsx     # Auth state, Google sign-in, socket connection
├── admin-app/                  # Admin dashboard (Expo web-friendly)
│   ├── App.tsx                # Root: tabs, create/edit modals, session timeout, polling
│   ├── api.ts                 # Admin API client with JWT auth
│   ├── types.ts               # Admin types
│   ├── services/
│   │   └── socket.ts          # Socket.IO client (connected but minimal listeners)
│   ├── components/
│   │   └── NotificationDropdown.tsx  # Floating notification bell (always visible)
│   └── utils/
│       └── notificationStore.ts  # Admin notification store (separate key from user)
├── assets/                     # Static assets (logo, icons)
├── event-ticketing/            # SQL seed queries for categories, venues, time slots
└── .specstory/                 # Dev session history
```

---

## How to Redeploy

### Backend (Railway)
```bash
# Ensure backend/package.json has all deps, then push to GitHub:
git push
# Railway auto-deploys. Check logs for socket.io loading.
```

### Frontend (Vercel)
```bash
cd user-app
npx expo export --platform web
# Drag dist/ folder to https://vercel.com
```

---

## Running Locally

### Prerequisites
- Node.js >= 20
- PostgreSQL (or use the deployed Railway DB by setting `DATABASE_URL`)

```bash
# Backend
cd backend && npm install && npm start

# User app
cd user-app && npm install && npx expo start --web

# Admin app
cd admin-app && npm install && npx expo start
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Mobile/Web Frontend** | React Native (Expo), react-native-web |
| **Admin Dashboard** | React Native (Expo) |
| **Navigation** | React Navigation (stack + bottom tabs) |
| **Backend** | Express.js, TypeScript |
| **Database** | PostgreSQL (Neon/ Railway) |
| **Real-time** | Socket.IO (polling + WebSocket transport) |
| **Auth** | JWT, Google OAuth 2.0, Firebase Auth |
| **Storage** | AsyncStorage (notifications), PostgreSQL (all data) |
| **Hosting** | Railway (backend), Vercel (frontend) |

---

## API Endpoints

Base URL: `https://eventapp-production-9af6.up.railway.app/api`

### Auth & Users
| Method | Endpoint | Description |
|---|---|---|
| POST | `/users/register` | Register new user |
| POST | `/users/login` | Login (email/password) |
| GET | `/users` | List all users (admin) |
| PUT | `/users/:id` | Update user profile |

### Events
| Method | Endpoint | Description |
|---|---|---|
| GET | `/events` | List events (query: `?status=Published&category=Sports`) |
| GET | `/events/recent` | Recent events since timestamp (`?after=ISO`) |
| GET | `/events/:id` | Get single event |
| POST | `/events` | Create event (admin) |
| PUT | `/events/:id` | Update event (admin) |
| DELETE | `/events/:id` | Delete event (admin) |

### Reviews / Feedback
| Method | Endpoint | Description |
|---|---|---|
| GET | `/events/:id/reviews` | Event feedback (reviews + stats: avg rating, distribution, comments) |
| POST | `/reviews` | Submit review (auto-updates event `rating` and `reviews` fields) |
| GET | `/reviews/me` | Current user's reviews |

### Clubs
| Method | Endpoint | Description |
|---|---|---|
| GET | `/clubs` | List clubs |
| POST | `/clubs` | Create club (admin) |
| PUT | `/clubs/:id` | Update club (admin) |
| POST | `/clubs/:id/join` | Join club |
| PUT | `/clubs/:id/members/:userId/approve` | Approve membership |
| DELETE | `/clubs/:id/members/:userId/reject` | Reject membership |

### Tickets & Payments
| Method | Endpoint | Description |
|---|---|---|
| POST | `/tickets` | Purchase ticket |
| GET | `/tickets/:userId` | User's tickets |
| PUT | `/tickets/:id/verify` | Verify payment (admin) |
| PUT | `/tickets/:id/reject` | Reject payment (admin) |

### Saved Events
| Method | Endpoint | Description |
|---|---|---|
| GET | `/saved-events/:userId` | Saved events |
| POST | `/saved-events` | Save event |
| DELETE | `/saved-events` | Unsave event |

### Notifications
| Method | Endpoint | Description |
|---|---|---|
| POST | `/push-tokens/register` | Register Expo push token |

### Stats
| Method | Endpoint | Description |
|---|---|---|
| GET | `/stats` | Platform statistics (events, users, clubs, tickets) |

### WebSocket
| Event | Direction | Description |
|---|---|---|
| `event:status` | Server → Client | Fired on event publish/unpublish. Payload: `{ eventId, title, status, timestamp }` |
| `register` | Client → Server | Client sends `userId` to join user-scoped room |