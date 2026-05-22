# EventApp - CUZ Events

A React Native application for Cavendish University Zambia events management.  
Supports both **mobile** (Expo) and **web** (react-native-web) platforms.

## Live URLs

| App | URL |
|---|---|
| **User App (Frontend)** | https://cuz-events-stevensengimana777-6503s-projects.vercel.app |
| **Backend API** | https://eventapp-production-9af6.up.railway.app |

> No login required to access the frontend. Just open the link in any browser.

## Project Structure

```
EventApp/
├── assets/                # Images and static assets
├── backend/               # Express.js API server
│   ├── server.ts         # Server entry point
│   ├── database.ts       # PostgreSQL database operations
│   ├── db.ts             # Database connection config
│   ├── migrations/       # SQL migration files
│   └── data/             # Seed data in JSON
├── user-app/              # Student user application
│   ├── api.ts            # API service (connected to backend)
│   ├── components/       # Screen components
│   ├── context/          # Auth, Theme, Notification contexts
│   └── App.tsx           # Main app component
├── admin-app/            # Admin dashboard application
│   ├── api.ts            # API service
│   ├── components/       # Admin screen components
│   └── App.tsx           # Main admin component
└── shared/               # Shared types and utilities
```

## Deployment

### Backend (Railway)

The backend is deployed on **Railway** (free tier) with a PostgreSQL database.

**Deployment steps:**
1. Push code to GitHub
2. Go to https://railway.com → New Project → Deploy from GitHub
3. Select your repo, set **Root Directory** to `backend`
4. Set **Build Command**: `npm install`
5. Set **Start Command**: `npx ts-node server.ts`
6. Add a PostgreSQL database from Railway's dashboard
7. Copy the database connection URL and add it as a `DATABASE_URL` environment variable to the backend service
8. Railway auto-deploys on every push to the connected branch

### Frontend (Vercel)

The user-facing web app is deployed on **Vercel** (free tier).

**Deployment steps:**
1. Build the web export:
   ```bash
   cd user-app
   npm install
   npx expo export --platform web
   ```
   This creates a `dist/` folder with static files.
2. Deploy the `dist/` folder to Vercel:
   ```bash
   vercel deploy --prod ./dist
   ```
   Or via the Vercel dashboard by dragging the `dist/` folder.

## Branches

| Branch | Description |
|---|---|
| `master` | Main branch with all features merged |
| `Evant-app-mvp` | Original MVP snapshot (identical to pre-merge master) |
| `settings` | Added ThemeContext, NotificationContext, NotificationBanner |

## Running Locally

### Prerequisites
- Node.js >= 20
- PostgreSQL (for backend) or use the deployed Railway database

### User App
```bash
cd user-app
npm install
npx expo start        # Mobile
npx expo start --web  # Web browser
```

### Admin App
```bash
cd admin-app
npm install
npx expo start
```

### Backend
```bash
cd backend
npm install
# Set DATABASE_URL or DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
npm start
```

## Tech Stack

- **Frontend**: React Native (Expo), react-native-web, React Navigation
- **Backend**: Express.js, TypeScript, PostgreSQL
- **Hosting**: Railway (backend), Vercel (frontend)

## API Endpoints

Base URL: `https://eventapp-production-9af6.up.railway.app/api`

| Method | Endpoint | Description |
|---|---|---|
| GET | /users | List all users |
| POST | /users/register | Register a new user |
| POST | /users/login | Login |
| GET | /events | List events |
| POST | /events | Create an event |
| GET | /clubs | List clubs |
| POST | /clubs | Create a club |
| POST | /tickets | Purchase a ticket |
| GET | /tickets/:userId | Get user's tickets |
| GET | /stats | Get platform statistics |