# 🫘 ScholarBean — Frontend ↔ Backend Alignment

## Overview

```
frontend/          backend/
(Next.js)    ←→   (NestJS)
port: 3000         port: 8000
```

All data flows through **REST JSON APIs**. Frontend reads `NEXT_PUBLIC_API_URL` from `.env.local`.

---

## 📄 Pages → API Map

| Page | Route | API Calls Needed |
|---|---|---|
| Home | `/` | `GET /api/meta`, `GET /api/scholarships/featured` |
| Listing | `/scholarships` | `GET /api/scholarships` (with filters) |
| Detail | `/scholarships/[id]` | `GET /api/scholarships/:id` |
| Submit | `/submit` | `POST /api/scholarships/submit` |
| Search | (component) | `GET /api/search/autocomplete?q=` |
| About | `/about` | *(static, no API)* |

---

## 🔌 Full API Contract

### 1. `GET /api/meta`
Used by: **Homepage** — stats bar + category cards + popular countries

**Request:** No params

**Response:**
```json
{
  "total_scholarships": 342,
  "total_countries": 45,
  "categories": [
    { "name": "Fully Funded", "count": 128, "icon": "🏆" },
    { "name": "ASEAN Eligible", "count": 210, "icon": "🌏" },
    { "name": "STEM", "count": 95, "icon": "🔬" },
    { "name": "Arts & Humanities", "count": 67, "icon": "🎨" },
    { "name": "Undergraduate", "count": 89, "icon": "📚" },
    { "name": "Masters", "count": 156, "icon": "🎓" },
    { "name": "PhD", "count": 97, "icon": "🔬" }
  ],
  "popular_countries": [
    { "name": "Japan", "flag": "🇯🇵", "count": 34 },
    { "name": "USA", "flag": "🇺🇸", "count": 28 },
    { "name": "UK", "flag": "🇬🇧", "count": 22 },
    { "name": "Germany", "flag": "🇩🇪", "count": 19 },
    { "name": "South Korea", "flag": "🇰🇷", "count": 17 },
    { "name": "Australia", "flag": "🇦🇺", "count": 15 }
  ]
}
```

---

### 2. `GET /api/scholarships/featured`
Used by: **Homepage** — featured scholarship cards (shows 6 cards)

> ⚠️ This route MUST come before `/api/scholarships/:id` in NestJS controller or it will conflict!

**Request:** No params

**Response:**
```json
{
  "data": [
    {
      "id": "chevening-2026",
      "name": "Chevening Scholarship 2026",
      "slug": "chevening-2026",
      "provider": "UK Government",
      "country": "United Kingdom",
      "flag": "🇬🇧",
      "level": ["masters"],
      "field": ["any"],
      "funding": "full",
      "amount": "Full tuition + £1,236/month",
      "deadline": "2026-11-05T23:59:00Z",
      "eligible_nationalities": ["all"],
      "thumbnail": "https://example.com/image.jpg",
      "short_description": "UK government scholarship for future global leaders.",
      "is_featured": true,
      "is_asean_friendly": true,
      "tags": ["UK", "Leadership", "Fully Funded"]
    }
  ]
}
```

---

### 3. `GET /api/scholarships`
Used by: **Listing page** — searchable, filterable, paginated list

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `page` | number | `1` | Current page |
| `limit` | number | `12` | Items per page |
| `q` | string | `""` | Search keyword |
| `country` | string | `""` | Host country (e.g. `Japan`) |
| `level` | string | `""` | `undergraduate` / `masters` / `phd` |
| `field` | string | `""` | Field of study |
| `eligible` | string | `""` | Eligible nationality (e.g. `Thailand`) |
| `funded` | string | `""` | `full` / `partial` |
| `asean` | boolean | `false` | `true` = ASEAN-friendly only |
| `sort` | string | `"newest"` | `deadline` / `newest` / `popular` |

**Frontend sends:** `GET /api/scholarships?page=1&limit=12&q=japan&level=masters&asean=true`

**Response:**
```json
{
  "data": [
    {
      "id": "mext-2026",
      "name": "MEXT Scholarship 2026",
      "slug": "mext-2026",
      "provider": "Japanese Government",
      "country": "Japan",
      "flag": "🇯🇵",
      "level": ["undergraduate", "masters", "phd"],
      "field": ["any"],
      "funding": "full",
      "amount": "Full tuition + ¥117,000/month stipend",
      "deadline": "2026-05-15T23:59:00Z",
      "eligible_nationalities": ["all"],
      "thumbnail": "https://example.com/mext.jpg",
      "short_description": "Japanese government scholarship for international students.",
      "is_featured": false,
      "is_asean_friendly": true,
      "tags": ["Japan", "Government", "Fully Funded", "ASEAN"]
    }
  ],
  "pagination": {
    "total": 342,
    "page": 1,
    "limit": 12,
    "total_pages": 29,
    "has_next": true,
    "has_prev": false
  }
}
```

---

### 4. `GET /api/scholarships/:id`
Used by: **Detail page** — full scholarship info

**Request:** URL param `id` = scholarship slug (e.g. `chevening-2026`)

**Response:**
```json
{
  "id": "chevening-2026",
  "name": "Chevening Scholarship 2026",
  "slug": "chevening-2026",
  "provider": "UK Foreign, Commonwealth & Development Office",
  "country": "United Kingdom",
  "flag": "🇬🇧",
  "logo": "https://example.com/chevening-logo.png",
  "thumbnail": "https://example.com/chevening-banner.jpg",
  "level": ["masters"],
  "field": ["any"],
  "funding": "full",
  "amount": "Full tuition + £1,236/month living allowance + flights",
  "duration": "1 year (master's degree)",
  "deadline": "2026-11-05T23:59:00Z",
  "start_date": "September 2027",
  "eligible_nationalities": ["all"],
  "eligible_countries": ["all"],
  "is_asean_friendly": true,
  "tags": ["UK", "Leadership", "Fully Funded", "ASEAN Eligible"],
  "short_description": "UK government global scholarship for future leaders.",
  "description": "Full **markdown** text describing the scholarship in detail...",
  "benefits": [
    "Full university tuition fees",
    "Monthly living allowance (£1,236/month outside London)",
    "Return economy class flights",
    "Arrival allowance",
    "Homeward departure allowance"
  ],
  "requirements": [
    "Hold an undergraduate degree (2:1 or equivalent)",
    "Minimum 2 years of work experience",
    "Citizen of a Chevening-eligible country",
    "Return to home country for 2 years after study"
  ],
  "documents_required": [
    "Valid passport",
    "Undergraduate degree transcript",
    "English certificate (IELTS 6.5+ or equivalent)",
    "2 professional references",
    "4 personal statement essays"
  ],
  "how_to_apply": [
    {
      "step": 1,
      "title": "Check Eligibility",
      "description": "Verify you meet all nationality and academic requirements."
    },
    {
      "step": 2,
      "title": "Create Account on Chevening Portal",
      "description": "Register at chevening.org/apply and fill in your profile."
    },
    {
      "step": 3,
      "title": "Choose 3 UK Universities & Courses",
      "description": "Select courses you plan to apply to independently."
    },
    {
      "step": 4,
      "title": "Write Your 4 Essays",
      "description": "Leadership, networking, study plan, and career ambition."
    },
    {
      "step": 5,
      "title": "Submit Before Deadline",
      "description": "Submit by November 5, 2026. Interviews are held Feb-April."
    }
  ],
  "official_link": "https://www.chevening.org/apply/",
  "source_url": "https://www.chevening.org",
  "related_scholarships": [
    {
      "id": "fulbright-2026",
      "name": "Fulbright Scholarship 2026",
      "country": "USA",
      "flag": "🇺🇸",
      "funding": "full",
      "deadline": "2026-10-14T23:59:00Z"
    },
    {
      "id": "daad-2026",
      "name": "DAAD Scholarship 2026",
      "country": "Germany",
      "flag": "🇩🇪",
      "funding": "full",
      "deadline": "2026-10-31T23:59:00Z"
    }
  ],
  "view_count": 15420,
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-09-15T00:00:00Z"
}
```

---

### 5. `GET /api/search/autocomplete`
Used by: **Navbar search bar** — live dropdown as user types

| Param | Type | Description |
|---|---|---|
| `q` | string | Search term (min 2 chars) |

**Frontend sends:** `GET /api/search/autocomplete?q=mext`

**Response:**
```json
{
  "results": [
    {
      "id": "mext-2026",
      "name": "MEXT Scholarship 2026",
      "country": "Japan",
      "flag": "🇯🇵",
      "funding": "full"
    },
    {
      "id": "mext-research-2026",
      "name": "MEXT Research Student 2026",
      "country": "Japan",
      "flag": "🇯🇵",
      "funding": "full"
    }
  ]
}
```

---

### 6. `POST /api/scholarships/submit`
Used by: **Submit page** — community scholarship submission

**Request Body (JSON):**
```json
{
  "name": "Scholarship Name",
  "provider": "Organization Name",
  "country": "Japan",
  "level": ["masters", "phd"],
  "field": ["engineering"],
  "funding": "full",
  "deadline": "2026-12-01",
  "official_link": "https://official-website.com",
  "description": "Brief description of the scholarship",
  "submitter_email": "user@email.com"
}
```

**Validation Rules (must match on both sides):**
| Field | Required | Rules |
|---|---|---|
| `name` | ✅ | min 5 chars |
| `provider` | ✅ | min 3 chars |
| `country` | ✅ | valid country name |
| `level` | ✅ | array, min 1 item |
| `official_link` | ✅ | valid HTTPS URL |
| `submitter_email` | ✅ | valid email format |
| `deadline` | ✅ | future date |

**Success Response (201):**
```json
{
  "success": true,
  "message": "Thank you! Your submission will be reviewed within 48 hours."
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "official_link": "Must be a valid HTTPS URL",
    "deadline": "Deadline must be in the future"
  }
}
```

---

## 🔐 NestJS CORS Setup

```typescript
// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://scholarbean.vercel.app',
      process.env.FRONTEND_URL,
    ],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Accept'],
  });

  app.setGlobalPrefix('api'); // all routes become /api/...

  await app.listen(process.env.PORT ?? 8000);
}
bootstrap();
```

> ⚠️ In your `ScholarshipsController`, declare `featured` and `submit` routes **before** `:id` to avoid route conflicts.

---

## 📦 Shared TypeScript Types

Copy these into both `frontend/src/types/` and `backend/src/types/`:

```typescript
export type FundingType = 'full' | 'partial';
export type LevelType = 'undergraduate' | 'masters' | 'phd';

export interface ScholarshipCard {
  id: string;
  name: string;
  slug: string;
  provider: string;
  country: string;
  flag: string;
  level: LevelType[];
  field: string[];
  funding: FundingType;
  amount: string;
  deadline: string;           // ISO 8601
  eligible_nationalities: string[];
  thumbnail: string;
  short_description: string;
  is_featured: boolean;
  is_asean_friendly: boolean;
  tags: string[];
}

export interface HowToApplyStep {
  step: number;
  title: string;
  description: string;
}

export interface RelatedScholarship {
  id: string;
  name: string;
  country: string;
  flag: string;
  funding: FundingType;
  deadline: string;
}

export interface ScholarshipDetail extends ScholarshipCard {
  logo: string;
  duration: string;
  start_date: string;
  eligible_countries: string[];
  description: string;        // Markdown
  benefits: string[];
  requirements: string[];
  documents_required: string[];
  how_to_apply: HowToApplyStep[];
  official_link: string;
  source_url: string;
  related_scholarships: RelatedScholarship[];
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ScholarshipListResponse {
  data: ScholarshipCard[];
  pagination: PaginationMeta;
}

export interface MetaResponse {
  total_scholarships: number;
  total_countries: number;
  categories: { name: string; count: number; icon: string }[];
  popular_countries: { name: string; flag: string; count: number }[];
}
```

---

## 🐙 GitHub Monorepo Setup

### Repo Structure
```
github.com/YOU/scholarbean
├── frontend/          ← Next.js
├── backend/           ← NestJS
├── .gitignore
└── README.md
```

### Step 1 — Create GitHub Repo
1. Go to **github.com/new**
2. Name: `scholarbean`
3. ❌ Do NOT initialize with README
4. Click **Create repository**

### Step 2 — Push from Mac (First Time)
```bash
cd /Users/neath/.gemini/antigravity/scratch/scholarbean

git init
git add .
git commit -m "🎉 Initial commit — ScholarBean monorepo"

# Replace YOUR_USERNAME below
git remote add origin https://github.com/YOUR_USERNAME/scholarbean.git
git branch -M main
git push -u origin main
```

### Step 3 — Clone on Windows or Ubuntu
```bash
git clone https://github.com/YOUR_USERNAME/scholarbean.git
cd scholarbean

# Frontend
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local → set NEXT_PUBLIC_API_URL=http://localhost:8000/api
npm run dev

# Backend (new terminal)
cd ../backend
npm install
cp .env.example .env
# Edit .env → set DATABASE_URL etc.
npm run start:dev
```

### Step 4 — Daily Git Workflow
```bash
# Start of day — get latest changes
git pull origin main

# After working
git add .
git commit -m "feat: add filter sidebar"
git push origin main
```

### Recommended Branches
```
main        ← stable, production-ready
dev         ← active development
feat/xxx    ← new features
fix/xxx     ← bug fixes
```

---

## ⚙️ Running Both Locally

Open **2 terminals**:

```
Terminal 1                 Terminal 2
─────────────────────      ─────────────────────
cd frontend                cd backend
npm run dev                npm run start:dev
→ localhost:3000           → localhost:8000
```

Or run both at once from root:
```bash
npx concurrently \
  "cd frontend && npm run dev" \
  "cd backend && npm run start:dev"
```

---

## ✅ Integration Checklist

Verify everything works before going live:

| # | What to Test | Frontend Does | Backend Must Return |
|---|---|---|---|
| 1 | Homepage stats load | `GET /api/meta` | `MetaResponse` object |
| 2 | Featured cards appear | `GET /api/scholarships/featured` | Array of 6 cards |
| 3 | Listing page shows data | `GET /api/scholarships` | Paginated list |
| 4 | Filters update results | Sends query params | Filters DB query |
| 5 | Search dropdown works | `GET /api/search/autocomplete` | Max 5 results |
| 6 | Detail page loads | `GET /api/scholarships/:id` | Full detail object |
| 7 | Related scholarships show | In detail response | Joined query |
| 8 | Countdown timer correct | Uses `deadline` field | ISO datetime string |
| 9 | Submit form sends | `POST /api/scholarships/submit` | `{ success: true }` |
| 10 | CORS not blocked | `.env.local` URL correct | `enableCors()` in main.ts |
