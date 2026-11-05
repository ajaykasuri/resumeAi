# 🚀 ResumeAI — Full-Stack AI Resume Builder

A production-ready, full-stack AI-powered resume builder with ATS optimization, multiple professional templates, real-time preview, and PDF/DOCX export.

![ResumeAI Banner](https://via.placeholder.com/1200x400/0a0a12/6c63ff?text=ResumeAI+%E2%80%94+AI-Powered+Resume+Builder)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **AI Resume Generator** | Full resume generation via Gemini / OpenAI API |
| 🗂 **8+ Templates** | Professional, Modern, Minimal, Creative, Executive |
| 👁 **Live Preview** | Real-time resume preview while editing |
| 🎯 **ATS Optimizer** | Score, keyword analysis, and improvement tips |
| 📄 **PDF & DOCX Export** | High-quality, ATS-friendly downloads |
| 🔐 **JWT Auth** | Register, Login, Guest access |
| 💾 **AI Caching** | MySQL-backed cache with similarity matching |
| 🖱 **Drag & Drop** | Reorder resume sections intuitively |
| 🎨 **Design Customization** | Colors, fonts, spacing, themes |
| 🔗 **Public Share Links** | Share resumes via unique URLs |
| 📊 **Analytics Dashboard** | View counts, download stats, ATS scores |

---

## 🛠 Tech Stack

```
Frontend:   React 18 + React Router 6 + Framer Motion + @dnd-kit
Backend:    Node.js + Express.js + JWT + mysql2
Database:   MySQL 8.x
AI:         Google Gemini 1.5 Flash / OpenAI GPT-3.5
PDF:        PDFKit (server-side generation)
```

---

## 📁 Project Structure

```
ai-resume-builder/
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.jsx          # Responsive navbar
│   │   │   │   └── Navbar.css
│   │   │   └── resume/
│   │   │       ├── ResumePreview.jsx   # Live preview renderer
│   │   │       ├── SectionEditors.jsx  # All section form editors
│   │   │       ├── CustomizationPanel.jsx  # Design controls
│   │   │       └── ATSScoreWidget.jsx  # ATS score checker
│   │   ├── context/
│   │   │   ├── AuthContext.jsx         # Authentication state
│   │   │   └── ResumeContext.jsx       # Resume editor state
│   │   ├── pages/
│   │   │   ├── Landing.jsx             # Marketing landing page
│   │   │   ├── Auth.jsx                # Login + Register
│   │   │   ├── Dashboard.jsx           # User dashboard
│   │   │   ├── ResumeBuilder.jsx       # Main builder editor
│   │   │   ├── AIGenerator.jsx         # AI generation flow
│   │   │   ├── Templates.jsx           # Template gallery
│   │   │   └── SharedResume.jsx        # Public resume view
│   │   ├── services/
│   │   │   └── api.js                  # Axios API service layer
│   │   ├── hooks/
│   │   │   └── index.js                # Custom React hooks
│   │   ├── utils/
│   │   │   └── helpers.js              # Utility functions
│   │   ├── styles/
│   │   │   └── global.css              # Design system + global styles
│   │   ├── App.jsx
│   │   └── index.js
│   ├── .env.example
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js             # MySQL connection pool
│   │   ├── controllers/
│   │   │   ├── auth.controller.js      # Register, Login, Guest
│   │   │   ├── resume.controller.js    # Full CRUD for resumes
│   │   │   ├── ai.controller.js        # AI generation + caching
│   │   │   ├── template.controller.js  # Template listing
│   │   │   └── download.controller.js  # PDF + DOCX export
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js      # JWT verification
│   │   │   ├── error.middleware.js     # Global error handler
│   │   │   └── validate.middleware.js  # Input validation
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── resume.routes.js
│   │   │   ├── template.routes.js
│   │   │   ├── ai.routes.js
│   │   │   ├── download.routes.js
│   │   │   └── analytics.routes.js
│   │   ├── utils/
│   │   │   └── migrate.js              # DB migration script
│   │   └── app.js                      # Express app config
│   ├── server.js
│   ├── .env.example
│   └── package.json
│
├── database/
│   └── schema.sql                      # Full MySQL schema
│
└── README.md
```

---

## ⚡ Quick Setup

### Prerequisites
- **Node.js** v18+
- **MySQL** 8.x running locally or remote
- **Gemini API Key** — [Get one free](https://aistudio.google.com/app/apikey)

---

### Step 1 — Clone & Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### Step 2 — Configure Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ai_resume_builder

# JWT (use a strong secret — min 32 chars)
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
JWT_EXPIRES_IN=7d

# AI Provider (gemini recommended — it's free!)
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: OpenAI as alternative
# AI_PROVIDER=openai
# OPENAI_API_KEY=your_openai_key_here

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

---

### Step 3 — Configure Frontend Environment

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_NAME=ResumeAI
```

---

### Step 4 — Setup MySQL Database

Make sure MySQL is running, then:

```bash
cd backend
npm run db:migrate
```

This creates the `ai_resume_builder` database with all 10 tables and seeds 8 default templates.

**OR** run manually:
```bash
mysql -u root -p < database/schema.sql
```

---

### Step 5 — Start the Application

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Server running on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm start
# App running on http://localhost:3000
```

---

## 🌐 API Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/guest` | Start guest session |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/change-password` | Change password |

### Resumes
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/resumes` | List all resumes |
| GET | `/api/resumes/:id` | Get resume by UUID |
| POST | `/api/resumes` | Create new resume |
| PUT | `/api/resumes/:id` | Update resume metadata |
| DELETE | `/api/resumes/:id` | Delete resume |
| POST | `/api/resumes/:id/duplicate` | Duplicate resume |
| PUT | `/api/resumes/:id/sections` | Save all sections |
| GET | `/api/resumes/shared/:token` | View public resume |

### AI
| Method | Endpoint | Description | Rate Limit |
|---|---|---|---|
| POST | `/api/ai/generate` | Full AI resume generation | 10/hour |
| POST | `/api/ai/improve-section` | Improve a specific section | 10/hour |
| POST | `/api/ai/ats-score` | Get ATS analysis | 10/hour |
| POST | `/api/ai/generate-summary` | Generate professional summary | 10/hour |

### Templates
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/templates` | List all templates |
| GET | `/api/templates/:slug` | Get template by slug |

### Downloads
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/downloads/pdf/:id` | Download resume as PDF |
| GET | `/api/downloads/docx/:id` | Download resume as DOCX |

---

## 🎨 Included Templates

| Template | Category | Description |
|---|---|---|
| Executive Pro | Professional | Clean executive style, dark header |
| Modern Slate | Modern | Two-column with sidebar |
| Minimal Edge | Minimal | Ultra-clean, lots of whitespace |
| Creative Canvas | Creative | Bold with accent blocks |
| Corporate Blue | Professional | Traditional corporate |
| Tech Resume | Modern | Developer-focused |
| Elegant Serif | Executive | Premium serif typography |
| Fresh Graduate | Minimal | Entry-level friendly |

---

## 🔒 Security

- **Password Hashing** — bcryptjs with salt rounds 12
- **JWT Authentication** — RS256 signed tokens, 7d expiry
- **Rate Limiting** — 100 req/15min general, 10/hour for AI endpoints
- **Input Validation** — express-validator on all endpoints
- **SQL Injection Prevention** — Parameterized queries via mysql2
- **Helmet.js** — HTTP security headers
- **CORS** — Restricted to configured frontend URL
- **Guest Sessions** — 24-hour auto-expiry

---

## 🚀 Production Deployment

### Environment Changes for Production

**Backend `.env`:**
```env
NODE_ENV=production
JWT_SECRET=<use-a-cryptographically-random-256-bit-key>
FRONTEND_URL=https://yourdomain.com
```

**Frontend `.env`:**
```env
REACT_APP_API_URL=https://api.yourdomain.com/api
```

### Build Frontend
```bash
cd frontend
npm run build
# Outputs to frontend/build/
```

### Recommended Stack
- **Backend** — PM2 + Nginx reverse proxy
- **Frontend** — Nginx serving static build / Vercel / Netlify
- **Database** — PlanetScale / AWS RDS / Railway MySQL
- **AI** — Gemini 1.5 Flash (free tier: 15 req/min, 1M tokens/day)

---

## 🤖 AI Configuration

### Using Gemini (Recommended — Free)
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a free API key
3. Set in `.env`: `GEMINI_API_KEY=your_key` and `AI_PROVIDER=gemini`

**Free Tier:** 15 requests/minute, 1 million tokens/day

### Using OpenAI (Alternative)
1. Get key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Set in `.env`: `OPENAI_API_KEY=your_key` and `AI_PROVIDER=openai`

---

## 📊 Database Schema Overview

```
users               → User accounts and profiles
guest_sessions      → Temporary guest access tokens
templates           → Resume template definitions
resumes             → Resume metadata and settings
resume_sections     → Individual resume section content (JSON)
ai_resume_cache     → Cached AI-generated content for reuse
ai_generation_history → Log of all AI generation requests
downloads           → PDF/DOCX download tracking
resume_analytics    → View/share/download events
password_reset_tokens → Secure password reset flow
```

---

## 🧪 Testing the App

1. **Register** a new account at `http://localhost:3000/register`
2. **Create Resume** from dashboard → choose Manual or AI
3. **AI Generator** — Enter job role + skills → generate
4. **Builder** — Edit sections in the left panel, see live preview
5. **Design** — Switch templates, colors, fonts in the Design tab
6. **Download** — Export as PDF or DOCX
7. **Share** — Enable public link in resume settings

---

## 🐛 Troubleshooting

**Database connection failed:**
```bash
# Check MySQL is running
sudo service mysql start
# Verify credentials in .env match your MySQL setup
mysql -u root -p -e "SHOW DATABASES;"
```

**AI generation returns error:**
```bash
# Check API key is valid
curl -H "Authorization: Bearer $GEMINI_API_KEY" https://generativelanguage.googleapis.com/v1beta/models
# Ensure AI_PROVIDER=gemini in .env
```

**PDF download fails:**
```bash
# PDFKit should work without extra installation
# If issues occur, reinstall:
npm install pdfkit --save
```

**CORS errors:**
```bash
# Ensure FRONTEND_URL in backend .env matches your React dev URL exactly
FRONTEND_URL=http://localhost:3000
```

---

## 📄 License

MIT License — Free to use, modify and distribute.

---

## 🙏 Built With

- [React](https://react.dev) — Frontend framework
- [Express.js](https://expressjs.com) — Backend framework
- [Framer Motion](https://www.framer.com/motion/) — Animations
- [@dnd-kit](https://dndkit.com) — Drag and drop
- [PDFKit](https://pdfkit.org) — PDF generation
- [Google Gemini](https://ai.google.dev) — AI generation
- [MySQL2](https://github.com/sidorares/node-mysql2) — Database driver

---

*Made with ❤️ for job seekers everywhere. Good luck on your job hunt! 🎯*
