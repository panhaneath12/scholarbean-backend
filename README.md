# 🫘 ScholarBean — Backend

> NestJS REST API for ScholarBean — a global scholarship discovery platform with ASEAN focus.

## 🔗 Related Repo
Frontend: [scholarbean-frontend](https://github.com/YOUR_USERNAME/scholarbean-frontend)

## Tech Stack
- **Framework**: NestJS
- **Database**: PostgreSQL (via Supabase / Neon)
- **Deployment**: Railway / Render

## Quick Start

```bash
npm install
cp .env.example .env
# Edit .env → set DATABASE_URL and FRONTEND_URL
npm run start:dev
```

API runs at [http://localhost:8000/api](http://localhost:8000/api)

## Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/scholarbean
PORT=8000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
GEMINI_API_KEY=your_key_here
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/meta` | Stats + categories + countries |
| GET | `/api/scholarships/featured` | 6 featured scholarships |
| GET | `/api/scholarships` | Paginated + filtered list |
| GET | `/api/scholarships/:id` | Full scholarship detail |
| GET | `/api/search/autocomplete?q=` | Search suggestions |
| POST | `/api/scholarships/submit` | Submit a new scholarship |

## Deploy
Deploy to [Railway](https://railway.app) or [Render](https://render.com).
