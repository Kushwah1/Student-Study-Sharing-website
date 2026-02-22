# Student Notes Sharing Website

Link: https://student-study-sharing-website.onrender.com/

A full-stack web application for students to share, search, and download academic notes.

## Features
- **User Authentication** – Signup & Login with JWT
- **Upload Notes** – PDF, images, and documents via Multer
- **Subject-wise Categories** – Organized by subject
- **Search Notes** – Full-text search by title, subject, or description
- **Download Notes** – Direct file downloads
- **User Dashboard** – View and manage uploaded notes
- **Admin Panel** – Manage all users and notes

## Tech Stack
| Layer     | Technology              |
|-----------|------------------------|
| Frontend  | HTML, CSS, JavaScript  |
| Backend   | Node.js, Express.js    |
| Database  | MongoDB (Mongoose)     |
| Auth      | JWT + bcryptjs         |
| Uploads   | Multer                 |

## Project Structure
```
├── server.js              # Entry point
├── config/
│   └── db.js              # MongoDB connection
├── middleware/
│   └── auth.js            # JWT auth middleware
├── models/
│   ├── User.js            # User schema
│   └── Note.js            # Note schema
├── routes/
│   ├── auth.js            # Auth routes
│   ├── notes.js           # Notes CRUD routes
│   └── admin.js           # Admin routes
├── uploads/               # Uploaded files storage
├── public/                # Frontend static files
│   ├── index.html
│   ├── login.html
│   ├── signup.html
│   ├── dashboard.html
│   ├── browse.html
│   ├── admin.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── auth.js
│       ├── dashboard.js
│       ├── browse.js
│       └── admin.js
├── .env                   # Environment variables
└── package.json
```

## Setup & Installation

1. **Clone / Download** the project
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Start MongoDB** (ensure it is running on `localhost:27017`)
4. **Configure `.env`** file with your settings
5. **Run the server:**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```
6. Open `http://localhost:5000` in your browser

## Default Admin Account
On first run, an admin account is auto-created:
- **Email:** admin@admin.com
- **Password:** admin123

## API Endpoints

### Auth
| Method | Endpoint          | Description      |
|--------|-------------------|------------------|
| POST   | /api/auth/signup  | Register user    |
| POST   | /api/auth/login   | Login user       |
| GET    | /api/auth/me      | Get current user |

### Notes
| Method | Endpoint             | Description         |
|--------|----------------------|---------------------|
| GET    | /api/notes           | Get all notes       |
| GET    | /api/notes/my        | Get user's notes    |
| GET    | /api/notes/search?q= | Search notes        |
| POST   | /api/notes/upload    | Upload a note       |
| GET    | /api/notes/download/:id | Download note    |
| DELETE | /api/notes/:id       | Delete a note       |

### Admin
| Method | Endpoint              | Description        |
|--------|-----------------------|--------------------|
| GET    | /api/admin/users      | Get all users      |
| GET    | /api/admin/notes      | Get all notes      |
| DELETE | /api/admin/users/:id  | Delete user        |
| DELETE | /api/admin/notes/:id  | Delete note        |
| GET    | /api/admin/stats      | Dashboard stats    |

## License
ISC
