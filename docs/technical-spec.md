# Technical Specification

## Project Structure

```
week5-Main/
├── backend/                # Node.js/Express Backend
│   ├── src/
│   │   ├── config/         # Environment & DB Config
│   │   ├── controllers/    # Request Handlers
│   │   ├── middleware/     # Auth & Error Middleware
│   │   ├── models/         # Database Models
│   │   ├── routes/         # API Routes
│   │   ├── services/       # Business Logic
│   │   ├── utils/          # Helper Functions
│   │   └── app.js          # App Entry Point
│   ├── migrations/         # SQL Migration Files
│   ├── seeds/              # SQL Seed Data
│   ├── .env.example        # Env Template
│   ├── Dockerfile          # Backend Docker Construction
│   └── package.json
│
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable UI Components
│   │   ├── pages/          # Full Page Components
│   │   ├── context/        # Global State (Auth)
│   │   ├── services/       # API Calls
│   │   ├── App.jsx         # Main App Component
│   │   └── main.jsx        # Entry Point
│   ├── public/
│   ├── .env                # Frontend Environment Config
│   ├── Dockerfile          # Frontend Docker Construction
│   └── package.json
│
├── database/               # (Optional) Standalone DB Scripts
├── docs/                   # Documentation
├── docker-compose.yml      # Orchestration
└── README.md
```

## Development Setup Guide

### Prerequisites
*   Node.js v18+
*   Docker & Docker Compose

### Installation Steps

1.  **Clone the Repository**
    ```bash
    git clone <repo-url>
    cd week5-Main
    ```

2.  **Environment Variables**
    *   Navigate to `backend/` and copy `.env.example` to `.env`.
    *   Set `JWT_SECRET` and `DB_PASSWORD`.

3.  **Run with Docker (Recommended)**
    ```bash
    docker-compose up -d --build
    ```
    *   Access Backend: `http://localhost:5000`
    *   Access Frontend: `http://localhost:3000`
    *   Database: `localhost:5432`

### Testing
*   The system includes health checks.
*   Run `curl http://localhost:5000/api/health` to verify backend status.
