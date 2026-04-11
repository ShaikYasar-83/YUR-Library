# 📚 Student Notes Sharing Platform

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

---

## ⚙️ Environment Variables (`.env`)

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/student_notes_db
APP_NAME=Student Notes Sharing Platform
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

## 📝 Sample POST Body (`/api/notes`)

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
