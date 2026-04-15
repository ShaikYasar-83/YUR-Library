# 📚 YUR LIBRARY

A clean and structured **REST API backend** built with **Node.js**, **Express.js**, and **MongoDB (Mongoose)**.

---

## 📁 Folder Structure

```
Notes/
├── src/
│   ├── config/
│   │   └── db.js              ← MongoDB connection setup
│   ├── controllers/
│   │   └── noteController.js  ← Business logic for notes
│   ├── middlewares/
│   │   └── errorHandler.js    ← Global error handler
│   ├── models/
│   │   └── Note.js            ← Mongoose schema/model
│   ├── routes/
│   │   └── noteRoutes.js      ← API route definitions
│   └── app.js                 ← Express app setup (middlewares + routes)
├── .env                       ← Secret config (not committed to git)
├── .env.example               ← Template for other developers
├── .gitignore                 ← Files to exclude from git
├── package.json               ← Project metadata & scripts
└── server.js                  ← Entry point (starts the server)
```

---

## 📦 Installed Packages

| Package     | Purpose                                          |
|-------------|--------------------------------------------------|
| `express`   | Web framework — handles routes and HTTP requests |
| `mongoose`  | ODM to interact with MongoDB using schemas       |
| `dotenv`    | Loads `.env` variables into `process.env`        |
| `cors`      | Allows frontend apps to call this API            |
| `morgan`    | Logs HTTP requests in the terminal               |
| `nodemon`   | (Dev) Auto-restarts server on file changes       |
| `bcryptjs`  | Hashes passwords securely                        |
| `jsonwebtoken` | Creates and verifies JWT tokens                |
| `nodemailer`| Sends verification emails                        |

---

## ⚙️ Environment Variables (`.env`)

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/student_notes_db
APP_NAME=YUR LIBRARY
```

> Copy `.env.example` to `.env` and fill in your values.

---

## 🚀 Commands to Run the Project

```bash
# 1. Install all dependencies
npm install

# 2. Run in DEVELOPMENT mode (auto-restarts on save)
npm run dev

# 3. Run in PRODUCTION mode
npm start
```

---

## 🔗 API Endpoints

Base URL: `http://localhost:5000`

| Method   | Endpoint          | Description              |
|----------|-------------------|--------------------------|
| `GET`    | `/`               | Health check             |
| `GET`    | `/api/notes`      | Get all notes            |
| `GET`    | `/api/notes/:id`  | Get a single note by ID  |
| `POST`   | `/api/notes`      | Create a new note        |
| `PUT`    | `/api/notes/:id`  | Update a note by ID      |
| `DELETE` | `/api/notes/:id`  | Delete a note by ID      |

---

## � Email Verification

This API includes email verification for user accounts. Here's how it works:

### Registration Flow
1. User registers with email, password, and other details
2. Account is created with `isVerified: false`
3. Verification email is automatically sent
4. User clicks verification link in email
5. Account becomes verified (`isVerified: true`)
6. User can now log in

### Email Verification Endpoints

| Method   | Endpoint                    | Description                    |
|----------|-----------------------------|--------------------------------|
| `POST`   | `/api/auth/verify-email`    | Verify email with token        |
| `POST`   | `/api/auth/resend-verification` | Resend verification email  |

### Sample Email Verification Request

```json
// POST /api/auth/verify-email
{
  "token": "verification_token_from_email_link"
}
```

### Setting up Email (Gmail)
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password: https://support.google.com/accounts/answer/185833
3. Use your Gmail address as `EMAIL_USER`
4. Use the App Password as `EMAIL_PASS`

---

## �📝 Sample POST Body (`/api/notes`)

```json
{
  "title": "Chapter 3 - Algebra Notes",
  "description": "Key formulas and solved examples",
  "subject": "Mathematics",
  "uploadedBy": "Yasar",
  "tags": ["math", "algebra", "chapter-3"]
}
```

---

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose)
- **Dev Tool**: Nodemon
