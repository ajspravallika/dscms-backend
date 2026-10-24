# DSCMS — Digital Student Counseling Management System

> A web application built for **Shri Vishnu Engineering College for Women (Autonomous), Bhimavaram** to digitize and streamline the student counseling process.

🌐 **Live:** [dscms-frontend.onrender.com](https://dscms-frontend.onrender.com)

---

## What is this?

Every student at SVECW is assigned a faculty mentor who conducts periodic counseling sessions — checking on their academics, personal wellbeing, and career goals. Before DSCMS, all of this was tracked with paper registers and Excel sheets.

**DSCMS replaces that with a clean, role-based web app** where:
- The **admin** manages all accounts, assigns students to mentors, and views session records
- **Mentors** record counseling sessions, message students, and generate weekly reports
- **Students** view their own counseling history, message their mentor, and raise concerns

---

## Features

### Admin
- Create mentor and student accounts individually or via **Excel bulk upload**
- **Auto-assign** students to mentors by department, year, and section — with configurable split size (e.g. first 5 students to mentor 1, next 5 to mentor 2)
- View all mentees of any mentor grouped by year
- Manage departments with custom sections (A, B, C...)
- **Promote year groups** at end of academic year — Year 1→2, 2→3, 3→4, Year 4 graduates to passout batch
- View all submitted counseling sessions across all mentors
- Configure default passwords from the Settings page

### Mentor
- Record counseling sessions for a year group
- Mark each student present or absent
- Add individual remarks, purpose, outcome, and action items per student
- **Edit draft sessions** before submitting — useful when students arrive at different times
- Submit sessions to admin when done
- Message individual students or **broadcast to an entire year group**
- Respond to student concerns and track status (Open → In Progress → Resolved)
- Generate weekly attendance and counseling reports

### Student
- View own counseling history — only their records, not others
- Message assigned mentor directly
- Submit concerns (Academic, Personal, Health, Financial, Other)
- Receive notifications — auto-marked as read on page open
- View assigned mentor's contact details

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6, Axios |
| Backend | Node.js, Express.js, JWT Authentication, bcryptjs |
| Database | MongoDB Atlas (cloud) |
| File Uploads | Multer + XLSX (Excel parsing) |
| Deployment | Render (Frontend + Backend), MongoDB Atlas |

---

## How It Works

### Three roles, one login page
Users log in with their college email (`@svecw.edu.in`). The system detects their role (Admin / Mentor / Student) and shows them their own dashboard. No role selection needed.

### Sessions
A counseling session is recorded per year group. One mentor, one date, all assigned students — each with individual attendance and remarks. Students can only see their own record, never others.

### Messages
Mentor and student share a private conversation thread. Both sides can initiate. The `conversationId` is built from both their IDs so both always find the same thread.

### Notifications
When a mentor sends a message or responds to a concern, the student gets an in-app notification. Notifications auto-mark as read when the student opens the page.

### Bulk Upload
Admin uploads an Excel file with student or mentor details. The system creates all accounts with the default password (`Student@dscms` or `Mentor@dscms`). Admin tells everyone the default password — they log in and can change it.

---

## Getting Started (Local Setup)

### Prerequisites
- Node.js >= 18
- MongoDB Atlas account (free tier works)
- Git

### 1. Clone both repos

```bash
git clone https://github.com/ajspravallika/dscms-backend.git
git clone https://github.com/ajspravallika/dscms-frontend.git
```

### 2. Backend setup

```bash
cd dscms-backend
npm install
cp .env.example .env
```

Fill in `.env`:
```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=any_strong_random_string
CLIENT_ORIGIN=http://localhost:5173
ALLOWED_EMAIL_DOMAIN=svecw.edu.in
SEED_ADMIN_EMAIL=admin@svecw.edu.in
SEED_ADMIN_PASSWORD=YourPassword@123
SEED_ADMIN_NAME=System Administrator
```

```bash
npm run seed:admin   # creates the admin account
npm run dev          # starts backend on port 5000
```

### 3. Frontend setup

```bash
cd dscms-frontend
npm install
cp .env.example .env
```

Fill in `.env`:
```
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

```bash
npm run dev   # starts frontend on http://localhost:5173
```

---

## Default Passwords

| Role | Default Password |
|---|---|
| Mentor | `Mentor@dscms` |
| Student | `Student@dscms` |

Admin can view and change these defaults from **Admin → Settings**.

---

## Excel Bulk Upload Format

### Mentors
```
Name | Email | Department | Designation | EmployeeId | Phone
```

### Students
```
Name | Email | RollNumber | Department | Year | Section | Phone | ParentContact
```

All accounts are created with the default password. Add an `InitialPassword` column to override per row.

---

## Project Structure

```
dscms-backend/
├── src/
│   ├── config/         # DB connection, constants
│   ├── models/         # Mongoose models (User, Mentor, Student, Session, etc.)
│   ├── services/       # Business logic layer
│   ├── controllers/    # Route handlers
│   ├── middlewares/    # Auth, RBAC, validation, error handling
│   ├── routes/         # API routes
│   └── utils/          # Helpers, seed script

dscms-frontend/
├── src/
│   ├── api/            # Axios calls to backend
│   ├── components/     # Reusable UI components
│   ├── context/        # Auth context
│   ├── hooks/          # useAuth, useFetch
│   ├── pages/          # Admin, Mentor, Student pages
│   ├── routes/         # Protected and role-based routing
│   └── utils/          # Nav config, dept sections helper
```

---

## Security

- Passwords hashed with **bcrypt** (12 salt rounds)
- **JWT tokens** expire in 8 hours
- **Rate limiting** on login — 20 requests per 15 minutes
- Only **@svecw.edu.in** emails are accepted
- Role-based middleware blocks wrong roles at the API level
- **Double confirmation** required before permanent deletion
- **Force password reset** on first login if admin didn't set an initial password

---

## Built By

**Jahnavi Aratikatla**
B.Tech — Artificial Intelligence & Machine Learning, Year 3
Shri Vishnu Engineering College for Women (Autonomous), Bhimavaram
GitHub: [@ajspravallika](https://github.com/ajspravallika)

---

> Built to solve a real problem at SVECW — replacing paper-based student counseling records with a structured, accessible digital system.
