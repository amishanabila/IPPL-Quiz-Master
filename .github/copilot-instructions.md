# IPPL Quiz Master - Copilot Instructions

## Architecture Overview

**IPPL Quiz Master** adalah platform quiz berbasis web dengan 3 peran utama:
- **Peserta**: Menjawab quiz menggunakan PIN (tanpa login)
- **Kreator**: Membuat dan mengelola soal/materi (login required, role='kreator')
- **Admin**: Mengelola sistem dan users (login required, role='admin')

### Stack
- **Backend**: Node.js + Express.js + MySQL (localhost) / PlanetScale (production)
- **Frontend**: React 19 + Vite + TailwindCSS + React Router v7
- **Deployment**: Vercel (frontend), Railway/Vercel (backend)

## Critical Developer Workflows

### Local Development Setup
1. **Backend**:
   ```bash
   cd backend
   npm install
   # Create .env.local with DB credentials (see .env.example)
   npm run setup-db  # Initialize database
   npm run dev       # Starts on http://localhost:5000
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   # Update .env with VITE_API_URL=http://localhost:5000/api
   npm run dev       # Starts on http://localhost:5173
   ```

### Critical Environment Variables

**Backend** (`.env.local` for development, `.env` for production):
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - MySQL connection
- `JWT_SECRET` - Token signing (min 32 chars) - **CRITICAL for production**
- `NODE_ENV` - "development" or "production"
- `FRONTEND_URL`, `CORS_ORIGIN` - CORS whitelist
- `EMAIL_USER`, `EMAIL_PASSWORD` - Gmail SMTP for password reset

**Frontend** (`.env` in frontend/):
- `VITE_API_URL` - Backend API base URL (e.g., `http://localhost:5000/api`)

### Testing Key Endpoints
```bash
# Health check (confirms DB connection)
curl http://localhost:5000/health

# Auth endpoints
POST /api/auth/register   # Create kreator/admin account
POST /api/auth/login      # Login & get JWT token
GET  /api/auth/verify-email/:token  # Email verification

# Quiz endpoints
GET  /api/quiz            # List quizzes
GET  /api/soal/:slug      # Get quiz questions (works for peserta via PIN or auth users)
```

## Project-Specific Patterns

### Authentication & Authorization
- **JWT Bearer Token**: All protected endpoints require `Authorization: Bearer <token>` header
- **Middleware**: `authenticateToken` (verify JWT), `isAdmin`, `isKreator` in [src/middleware/auth.js](src/middleware/auth.js#L1)
- **Token Claims**: `{ userId, email, role }` - Support both `userId` and `id` fields for compatibility
- **Default Role**: Users registered via `/auth/register` get `role='kreator'` (verified in DB schema)

### Frontend Routing
- **ProtectedRoute**: Requires authentication + optional role check → redirects to `/login` or role-specific home
- **FlexibleRoute**: Allows peserta (PIN-based) OR authenticated users → used for quiz/results pages
- **No Auth Routes**: `/`, `/login`, `/register`, `/halaman-awal-peserta`, `/admin` (separate login)

File: [frontend/src/components/ProtectedRoute.jsx](frontend/src/components/ProtectedRoute.jsx#L1)

### API Service Pattern
All API calls through `apiService` singleton with centralized error handling:
```javascript
// frontend/src/services/api.js
const BASE_URL = import.meta.env.VITE_API_URL || 'https://ippl-quiz-master-production.up.railway.app/api';
```
- Uses `fetch()` with automatic token injection from localStorage
- All responses expected as JSON with `{ status, message, data }`

### Database Connection
- **Connection Pool**: 10 connections, promise-based (`mysql2/promise`)
- **Config File**: [backend/src/config/db.js](backend/src/config/db.js#L1) - Loads .env.local first, then .env
- **Auto-initialization**: `setup-db.js` creates schema on first run (idempotent via checking existing tables)

### Controller Pattern
All controllers follow structure:
```javascript
// backend/src/controllers/soalController.js example
const controllerName = {
  async methodName(req, res) {
    try {
      // Query DB
      const [rows] = await db.query('SELECT * FROM table WHERE id = ?', [req.params.id]);
      res.status(200).json({ status: 'success', data: rows });
    } catch (error) {
      console.error('Controller error:', error);
      res.status(500).json({ status: 'error', message: 'Error message' });
    }
  }
};
module.exports = controllerName;
```

### Email Service
- Uses Nodemailer with Gmail SMTP
- File: [backend/src/utils/emailService.js](backend/src/utils/emailService.js#L1)
- Used for password reset flows

## Integration Points & Data Flows

### Quiz Flow (User Experience)
1. **Peserta**: Navigate to `/halaman-awal-peserta` → Enter PIN + Name → Access `/soal/:slug`
2. **Kreator**: Login → `/halaman-awal-kreator` → Create/edit soal at `/buat-soal` → View kumpulan materi
3. **Admin**: Login as admin → `/admin/dashboard` → Manage users, quizzes, sessions

### Database Relationships
Key tables in [backend/database/quiz_master.sql](backend/database/quiz_master.sql#L1):
- `users` ← many-to-many quiz via `quiz_session`
- `kumpulan_soal` (quiz sets) → `soal` (questions) → `user_answers` (responses)
- `quiz` (active quiz instances) ← `quiz_session` (participant sessions)
- `materi` (teaching materials) for each `kategori` (subject)

## Important Files & Directories

### Backend
- **Routes**: `src/routes/` - All endpoint definitions ([authRoutes.js](src/routes/authRoutes.js#L1), [quizRoutes.js](src/routes/quizRoutes.js#L1), etc.)
- **Controllers**: `src/controllers/` - Business logic for each feature
- **Config**: `src/config/db.js` - Database connection pool (read .env.local first)
- **Middleware**: `src/middleware/auth.js` - JWT verification & role checks
- **Database Scripts**: `database/*.sql` - Schema definitions & procedures

### Frontend
- **Routes**: `src/main.jsx` - React Router configuration with role-based protection
- **Services**: `src/services/api.js` - Centralized API client
- **Auth Service**: `src/services/authService.js` - Token storage & user session management
- **Components**: 
  - `src/components/ProtectedRoute.jsx` - Auth guard for protected pages
  - `src/components/FlexibleRoute.jsx` - Hybrid auth for peserta/user pages
  - `src/popup/` - Modal components for confirmations & success messages
- **Pages by Role**:
  - Peserta: `halaman-awal-peserta.jsx`, `soal/`, `hasil akhir/`, `leaderboard/`
  - Kreator: `HalamanAwalKreator.jsx`, `buatsoal/`, `materi/`
  - Admin: `admin/`

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Backend won't start (localhost) | Missing `.env.local` or DB not running | Create `.env.local` with DB credentials, ensure MySQL is running |
| "Cannot find module 'mysql2'" | Dependencies not installed | `cd backend && npm install` |
| CORS errors in frontend | Frontend URL not whitelisted in backend | Add frontend URL to `CORS_ORIGIN` in `.env.local` |
| JWT token invalid | Secret doesn't match or token expired | Verify `JWT_SECRET` is same on backend, check token expiry (24h default) |
| Quiz not appearing | Role/permissions issue or inactive quiz | Check `is_active` flag in `quiz` table, verify user has quiz_session |
| **HTTP 500 on Login** | Network error, backend not running, or JSON parsing fail | Check browser console for detailed error, ensure backend at `http://localhost:5000` is running |
| **"Failed to fetch" error** | Backend not accessible or CORS blocked | Verify backend running: `npm run dev` in backend folder, check `VITE_API_URL` points to correct backend |
| **"Email atau password salah"** | User not registered with that email | Create test account: `POST /api/auth/register` with valid credentials |

### Debug Login Issues

**If login shows error 500 or "Failed to fetch":**

1. Check backend is running:
   ```bash
   curl http://localhost:5000/health
   # Should return: { "status": "ok", "database": "connected", ... }
   ```

2. Check browser console for detailed error:
   - Open DevTools → Console
   - Look for "❌ AuthService" or "❌ Error saat login" logs
   - These show exact error message

3. Verify `.env.local` in frontend points to correct backend:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. If response shows `200 OK` but error occurs, it's likely:
   - User doesn't exist → Register first via `/api/auth/register`
   - Response parsing error → Check backend response format is valid JSON

## Deployment Notes

### For Railway/Vercel Backend Deployment
1. Set `NODE_ENV=production` in environment variables
2. Use actual database credentials (PlanetScale for cloud)
3. Ensure `JWT_SECRET` is a strong random value (min 32 chars)
4. Health endpoint must return `status: 'ok'` for deployment verification
5. Database must be accessible before first request

### Frontend Vercel Deployment
- Update `VITE_API_URL` to point to deployed backend URL
- Ensure backend is deployed and health endpoint is working first
