# HireFlow - Job Portal Management System

HireFlow is a professional, full-stack Job Portal Management System built as a Backend Development internship project. It features JWT authentication, role-based authorization, request validations, parameterized SQL queries to prevent SQL injection, and a normalized MySQL database schema with complete sample records. It also provides a high-fidelity, responsive, glassmorphic dark-theme dashboard.

## Tech Stack
- **Backend:** Node.js + Express.js
- **Database:** MySQL
- **Frontend:** Single Page Application (HTML5, Vanilla CSS3, Vanilla JS)
- **Security:** JWT (JSON Web Tokens), `bcryptjs` password hashing, role-based endpoint protection

---

## Directory Structure

```text
hireflow/
├── backend/
│   ├── config/
│   │   └── db.js            # MySQL connection pool (mysql2/promise)
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── jobController.js
│   │   ├── appController.js # Job application submissions
│   │   ├── profileController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   ├── auth.js          # Authentication & authorization checks
│   │   ├── errorHandler.js  # Global exception handling
│   │   └── validator.js     # Body fields payload validation
│   ├── routes/
│   │   ├── auth.js
│   │   ├── jobs.js
│   │   ├── applications.js
│   │   ├── profile.js
│   │   └── admin.js
│   ├── utils/
│   │   └── asyncHandler.js  # Wrapper for async controllers
│   ├── app.js               # Express application configuration
│   └── server.js            # HTTP Server bootstrapper
├── database/
│   ├── schema.sql           # Database tables creation
│   └── seed.sql             # realistic accounts, jobs, and applications
├── frontend/
│   ├── css/
│   │   └── style.css        # Responsive dark UI dashboard style
│   ├── js/
│   │   └── app.js           # Client routers, AJAX API bindings, and forms
│   └── index.html           # SPA template layout
├── .env.example             # Template for configuration
├── package.json             # App scripts and dependencies
└── README.md                # Documentation guide
```

---

## Features Matrix

### 👥 User Roles
1. **Candidate**
   - Register and login securely.
   - Create/edit profile (Professional title, Skills, Experience, Biography, Resume link).
   - Browse jobs with real-time dynamic search and filter parameters (Location, Job Type, Category, Experience).
   - View details, save (bookmark) listings, and apply.
   - Prevent duplicate applications (handled via database unique key and validation checks).
   - View application statuses: `Applied`, `Under Review`, `Shortlisted`, `Interview`, `Hired`, `Rejected`.
   - Withdraw submissions.

2. **Recruiter**
   - Register and post job listings.
   - Edit, delete, or close posted jobs.
   - View recruiter statistics dashboard (active jobs, total applications, application status breakdowns).
   - List applicants for posted jobs with detailed professional profiles.
   - Update candidate application status (dropdown triggers status updates instantly).

3. **Administrator**
   - Overview system metrics: total active users, jobs, and submissions.
   - User Account management: list and remove any inappropriate accounts (automatic cascade of relative records).
   - Moderation controls: view details and moderate/remove listings.

---

## Setup Instructions

### 1. Database Setup
Ensure you have MySQL installed and running locally. Run the following commands inside your MySQL terminal or database client (e.g. MySQL Workbench):

```sql
-- 1. Create and select the database
CREATE DATABASE IF NOT EXISTS hireflow;
USE hireflow;

-- 2. Import schema.sql and seed.sql commands
-- (You can run the content of database/schema.sql followed by database/seed.sql)
```

Alternatively, from the command line, run:
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

### 2. Project Installation
Clone or navigate to the project directory and install the Node.js packages:

```bash
cd hireflow
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory and copy the template:

```bash
copy .env.example .env
```

Open `.env` and fill in your local database connection parameters:
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=hireflow
DB_PORT=3306
JWT_SECRET=supersecretjwtkeyforhireflowportal123!
```

---

## Running the Application

To boot up the application:

```bash
# Run server
npm start
```

For development mode (with hot reloading via nodemon):
```bash
npm run dev
```

Once started, open your web browser and navigate to: **`http://localhost:3000`**

---

## Test Login Credentials

All seeded accounts use **`password123`** as the login password.

| User Role | Email | Purpose |
|---|---|---|
| **Admin** | `admin@hireflow.com` | Moderation, system statistics, and user control. |
| **Recruiter** | `recruiter1@hireflow.com` | Job posting, recruiter stats, applicant status modifier. |
| **Recruiter** | `recruiter2@hireflow.com` | Alternative recruiter account. |
| **Candidate** | `candidate1@hireflow.com` | Browse jobs, save jobs, apply to listings. |
| **Candidate** | `candidate2@hireflow.com` | Alternative candidate account (UI/UX). |
