# DSCMS Backend — Version 1

Digital Student Counseling Management System — REST API.

## Tech Stack
- Node.js + Express.js
- MongoDB Atlas + Mongoose
- JWT Authentication (single access token, no refresh-token rotation in V1)
- bcryptjs for password hashing

## What's intentionally excluded from V1
- Audit logs
- Email service (temp passwords/notifications are communicated manually by the admin)
- Cron jobs (weekly reports are generated on-demand via an API call)
- Docker
- CSV bulk upload (students/mentors are created one at a time via API)
- Analytics/dashboards beyond basic list/filter endpoints
- Refresh tokens (a single JWT is issued per login, expires in `JWT_EXPIRES_IN`)

---

## 1. Prerequisites
- Node.js v18 or higher
- npm v9 or higher
- A MongoDB Atlas cluster (free tier is sufficient for development)

## 2. Installation

```bash
# 1. Clone the repository and move into the backend folder
git clone <your-repo-url>
cd dscms-backend

# 2. Install dependencies
npm install

# 3. Create your local environment file
cp .env.example .env
```

## 3. Configure Environment Variables

Open `.env` and fill in real values:

```
NODE_ENV=development
PORT=5000
CLIENT_ORIGIN=http://localhost:5173

MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/dscms?retryWrites=true&w=majority

JWT_SECRET=<generate a long random string>
JWT_EXPIRES_IN=8h

ALLOWED_EMAIL_DOMAIN=svecw.edu.in

SEED_ADMIN_NAME=System Administrator
SEED_ADMIN_EMAIL=admin@svecw.edu.in
SEED_ADMIN_PASSWORD=ChangeMe@123
```

> Generate a strong `JWT_SECRET` with: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

## 4. MongoDB Atlas Setup
1. Create a free cluster at https://www.mongodb.com/cloud/atlas
2. Create a database user (username/password)
3. Under Network Access, allow your current IP (or `0.0.0.0/0` for local dev only — never in production)
4. Copy the connection string into `MONGO_URI` in `.env`, replacing `<username>`, `<password>`, and the database name (`dscms`)

## 5. Seed the First Admin Account
Since self-registration is disabled and admins create every other account, you must bootstrap the very first admin manually:

```bash
npm run seed:admin
```

This reads `SEED_ADMIN_*` values from `.env` and creates the initial admin. **Change this password immediately after first login** — the API will require it via `mustResetPassword`.

## 6. Run the Server

```bash
# Development (auto-restart on file changes)
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:5000/api/v1`.
Health check: `GET http://localhost:5000/health`

## 7. Verify the Setup

```bash
# Login as the seeded admin
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@svecw.edu.in","password":"ChangeMe@123"}'
```

You should receive a `token` in the response. Use it as a Bearer token for all subsequent requests:

```bash
curl http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer <token>"
```

## 8. Typical First-Time Workflow
1. `npm run seed:admin` → creates the first admin
2. Admin logs in → forced to change password (`POST /auth/change-password`)
3. Admin creates mentor accounts (`POST /admin/mentors`) → note the returned `tempPassword` for each, communicate manually
4. Admin creates student accounts (`POST /admin/students`) → same pattern
5. Admin assigns students to mentors (`POST /admin/assignments`)
6. Mentors and students log in with their temp passwords and are forced to reset them
7. Mentors begin recording sessions, attendance, and messaging their assigned students

## Project Structure
See `docs/` or the project README section in the main SRS document for the full annotated folder structure.

## API Base Path
All endpoints are prefixed with `/api/v1`. See the SRS document for the complete endpoint reference.
